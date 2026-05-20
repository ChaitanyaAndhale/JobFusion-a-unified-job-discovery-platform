/**
 * Indeed Job Scraper - Uses Indeed's RSS feed + alternative endpoints
 * Falls back to structured data if main scraping is blocked
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import RSSParser from 'rss-parser'
import { getHeaders, sleep, timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo } from './helpers.js'

const parser = new RSSParser()

const INDEED_RSS_SEARCHES = [
  { q: 'software+developer', l: 'India' },
  { q: 'react+developer', l: 'India' },
  { q: 'python+developer', l: 'India' },
  { q: 'java+developer', l: 'India' },
  { q: 'data+scientist', l: 'India' },
  { q: 'devops+engineer', l: 'India' },
  { q: 'frontend+developer', l: 'India' },
]

export async function scrapeIndeed() {
  console.log('  📡 Indeed: Fetching via RSS feeds...')
  const allJobs = []

  for (const search of INDEED_RSS_SEARCHES) {
    try {
      // Indeed RSS feed endpoint
      const rssUrl = `https://www.indeed.com/rss?q=${search.q}&l=${search.l}&sort=date&limit=25`

      const feed = await parser.parseURL(rssUrl)

      for (const item of (feed.items || [])) {
        const title = item.title || ''
        const company = item.source || extractCompanyFromTitle(title)
        const location = item.contentSnippet?.match(/in\s+(.+?)$/)?.[1] || search.l

        allJobs.push({
          id: `indeed-${Buffer.from(item.link || item.guid || title).toString('base64').slice(0, 16)}`,
          title: cleanTitle(title),
          company: company || 'Company',
          companyLogo: getCompanyLogo(company),
          location: location,
          salary: null,
          salaryText: 'Not Disclosed',
          experience: detectExperience(title),
          type: 'Full-time',
          mode: detectWorkMode(`${title} ${location}`),
          skills: extractSkills(`${title} ${item.contentSnippet || ''}`),
          source: 'Indeed',
          sourceUrl: item.link || `https://www.indeed.com/jobs?q=${search.q}`,
          postedDate: item.isoDate || item.pubDate || null,
          postedAgo: timeAgo(item.isoDate || item.pubDate),
          description: item.contentSnippet?.substring(0, 500) || `${title} position`,
          category: 'Technology',
          applyUrl: item.link || null,
        })
      }

      await sleep(800 + Math.random() * 500)
    } catch (err) {
      // RSS also blocked, try alternative search page
      try {
        const { data } = await axios.get(`https://in.indeed.com/jobs?q=${search.q}&sort=date&fromage=7`, {
          headers: {
            ...getHeaders(),
            'Referer': 'https://www.google.com/',
          },
          timeout: 12000,
        })

        const $ = cheerio.load(data)

        // Try to extract from script tags (JSON-LD structured data)
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const json = JSON.parse($(el).html())
            if (json['@type'] === 'JobPosting') {
              allJobs.push({
                id: `indeed-${Math.random().toString(36).slice(2, 10)}`,
                title: json.title,
                company: json.hiringOrganization?.name || 'Company',
                companyLogo: getCompanyLogo(json.hiringOrganization?.name),
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

        await sleep(1500)
      } catch {}
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

  console.log(`  ✅ Indeed: ${unique.length} jobs`)
  return unique
}

function cleanTitle(title) {
  return title.replace(/\s*-\s*[^-]+$/, '').trim()
}

function extractCompanyFromTitle(title) {
  const match = title.match(/\s*-\s*([^-]+)$/)
  return match ? match[1].trim() : null
}
