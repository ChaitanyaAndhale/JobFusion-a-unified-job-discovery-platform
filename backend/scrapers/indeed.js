/**
 * Indeed Job Scraper — Production-Grade
 * Multi-strategy: RSS feed → JSON-LD structured data → HTML scraping
 * With requestWithRetry for anti-bot resilience
 */
import * as cheerio from 'cheerio'
import RSSParser from 'rss-parser'
import { getHeaders, getApiHeaders, requestWithRetry, sleep, timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo, normalizeTitle, normalizeCompanyName } from './helpers.js'

const parser = new RSSParser()

const INDEED_RSS_SEARCHES = [
  { q: 'software+developer', l: 'India' },
  { q: 'react+developer', l: 'India' },
  { q: 'python+developer', l: 'India' },
  { q: 'java+developer', l: 'India' },
  { q: 'data+scientist', l: 'India' },
  { q: 'devops+engineer', l: 'India' },
  { q: 'frontend+developer', l: 'India' },
  { q: 'full+stack+developer', l: 'India' },
  { q: 'machine+learning', l: 'India' },
]

/**
 * Strategy 1: RSS Feed parsing
 */
async function fetchViaRSS(search) {
  const rssUrl = `https://www.indeed.com/rss?q=${search.q}&l=${search.l}&sort=date&limit=25`
  const feed = await parser.parseURL(rssUrl)
  const jobs = []

  for (const item of (feed.items || [])) {
    const rawTitle = item.title || ''
    const rawCompany = item.source || extractCompanyFromTitle(rawTitle)
    const location = item.contentSnippet?.match(/in\s+(.+?)$/)?.[1] || search.l

    const title = normalizeTitle(cleanTitle(rawTitle))
    const company = normalizeCompanyName(rawCompany || 'Company')

    if (title) {
      jobs.push({
        id: `indeed-${Buffer.from(item.link || item.guid || rawTitle).toString('base64').slice(0, 16)}`,
        title,
        company,
        companyLogo: getCompanyLogo(company),
        location,
        salary: null,
        salaryText: 'Not Disclosed',
        experience: detectExperience(rawTitle),
        type: 'Full-time',
        mode: detectWorkMode(`${rawTitle} ${location}`),
        skills: extractSkills(`${rawTitle} ${item.contentSnippet || ''}`),
        source: 'Indeed',
        sourceUrl: item.link || `https://www.indeed.com/jobs?q=${search.q}`,
        postedDate: item.isoDate || item.pubDate || null,
        postedAgo: timeAgo(item.isoDate || item.pubDate),
        description: item.contentSnippet?.substring(0, 500) || `${title} position`,
        category: 'Technology',
        applyUrl: item.link || null,
      })
    }
  }

  return jobs
}

/**
 * Strategy 2: HTML page with JSON-LD structured data extraction
 */
async function fetchViaHTML(search) {
  const response = await requestWithRetry(
    `https://in.indeed.com/jobs?q=${search.q}&sort=date&fromage=7`,
    {
      headers: getHeaders({ 'Referer': 'https://www.google.co.in/' }),
      timeout: 15000,
    },
    { maxRetries: 2, baseDelay: 2000, label: `Indeed HTML "${search.q}"` }
  )

  const $ = cheerio.load(response.data)
  const jobs = []

  // Extract from JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html())
      if (json['@type'] === 'JobPosting') {
        const title = normalizeTitle(json.title)
        const company = normalizeCompanyName(json.hiringOrganization?.name || 'Company')

        jobs.push({
          id: `indeed-${Math.random().toString(36).slice(2, 10)}`,
          title,
          company,
          companyLogo: getCompanyLogo(company),
          location: json.jobLocation?.address?.addressLocality || search.l,
          salary: json.baseSalary?.value?.value ? `₹${json.baseSalary.value.value}` : null,
          salaryText: json.baseSalary?.value?.value ? `₹${json.baseSalary.value.value}` : 'Not Disclosed',
          experience: detectExperience(json.title),
          type: json.employmentType || 'Full-time',
          mode: detectWorkMode(json.jobLocationType || json.title),
          skills: extractSkills(json.description || json.title),
          source: 'Indeed',
          sourceUrl: json.url || `https://in.indeed.com/jobs?q=${search.q}`,
          postedDate: json.datePosted,
          postedAgo: timeAgo(json.datePosted),
          description: json.description?.replace(/<[^>]+>/g, ' ').substring(0, 500),
          category: 'Technology',
          applyUrl: json.url || null,
        })
      }
    } catch {}
  })

  // Also try to extract from job cards in the HTML
  $('.job_seen_beacon, .jobsearch-ResultsList .result, [data-jk]').each((_, el) => {
    try {
      const card = $(el)
      const rawTitle = card.find('.jobTitle span, h2.jobTitle').text().trim()
      const rawCompany = card.find('.companyName, [data-testid="company-name"]').text().trim()
      const location = card.find('.companyLocation, [data-testid="text-location"]').text().trim()
      const link = card.find('a.jcs-JobTitle, a[data-jk]').attr('href')
      const jobKey = card.attr('data-jk')

      const title = normalizeTitle(rawTitle)
      const company = normalizeCompanyName(rawCompany)

      if (title && company) {
        jobs.push({
          id: `indeed-${jobKey || Math.random().toString(36).slice(2, 10)}`,
          title,
          company,
          companyLogo: getCompanyLogo(company),
          location: location || search.l,
          salary: null,
          salaryText: 'Not Disclosed',
          experience: detectExperience(rawTitle),
          type: 'Full-time',
          mode: detectWorkMode(`${rawTitle} ${location}`),
          skills: extractSkills(rawTitle),
          source: 'Indeed',
          sourceUrl: link ? `https://in.indeed.com${link}` : `https://in.indeed.com/jobs?q=${search.q}`,
          postedDate: null,
          postedAgo: 'Recently',
          description: `${title} at ${company} — ${location}`,
          category: 'Technology',
          applyUrl: link ? `https://in.indeed.com${link}` : null,
        })
      }
    } catch {}
  })

  return jobs
}

export async function scrapeIndeed() {
  console.log('  📡 Indeed: Fetching via multi-strategy approach...')
  const allJobs = []
  let rssSuccess = 0
  let htmlSuccess = 0

  for (const search of INDEED_RSS_SEARCHES) {
    // Strategy 1: Try RSS first (fastest, least likely to be blocked)
    try {
      const rssJobs = await fetchViaRSS(search)
      if (rssJobs.length > 0) {
        allJobs.push(...rssJobs)
        rssSuccess++
        await sleep(800 + Math.random() * 500)
        continue // RSS worked, skip HTML fallback
      }
    } catch {
      // RSS failed, try HTML fallback
    }

    // Strategy 2: HTML page with JSON-LD and card parsing
    try {
      const htmlJobs = await fetchViaHTML(search)
      allJobs.push(...htmlJobs)
      if (htmlJobs.length > 0) htmlSuccess++
      await sleep(1500 + Math.random() * 1000)
    } catch (err) {
      console.log(`    ⚠️ Indeed "${search.q}": all strategies failed — ${err.response?.status || err.message}`)
    }
  }

  // Dedupe
  const seen = new Set()
  const unique = allJobs.filter(j => {
    const key = `${j.title}-${j.company}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`  ✅ Indeed: ${unique.length} jobs (RSS: ${rssSuccess}, HTML: ${htmlSuccess} successful searches)`)
  return unique
}

function cleanTitle(title) {
  return title.replace(/\s*-\s*[^-]+$/, '').trim()
}

function extractCompanyFromTitle(title) {
  const match = title.match(/\s*-\s*([^-]+)$/)
  return match ? match[1].trim() : null
}
