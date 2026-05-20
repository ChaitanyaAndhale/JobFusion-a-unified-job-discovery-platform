/**
 * Naukri Job Scraper — Production-Grade
 * Multi-strategy: Internal API → Public search page HTML fallback
 * With requestWithRetry, rotating headers, and graceful degradation
 */
import * as cheerio from 'cheerio'
import { getHeaders, getApiHeaders, requestWithRetry, sleep, timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo, normalizeTitle, normalizeCompanyName } from './helpers.js'

const NAUKRI_SEARCH_KEYWORDS = [
  'software developer',
  'react developer',
  'java developer',
  'python developer',
  'data scientist',
  'devops engineer',
  'full stack developer',
  'frontend developer',
  'backend developer',
  'machine learning engineer',
  'cloud engineer',
  'android developer',
]

/**
 * Strategy 1: Naukri's internal JSON API
 */
async function fetchViaAPI(keyword) {
  const urlKeyword = keyword.replace(/\s+/g, '-')
  const url = `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=${encodeURIComponent(keyword)}&sort=date&pageNo=1`

  const response = await requestWithRetry(url, {
    headers: getApiHeaders({
      'Referer': `https://www.naukri.com/${urlKeyword}-jobs`,
      'Accept': 'application/json',
      'appid': '109',
      'systemid': 'Starter',
    }),
    timeout: 15000,
  }, {
    maxRetries: 2,
    baseDelay: 2000,
    label: `Naukri API "${keyword}"`,
  })

  const data = response.data
  const jobData = data?.jobDetails || []
  const jobs = []

  for (const job of jobData) {
    try {
      const rawTitle = job.title || ''
      const rawCompany = job.companyName || ''
      const location = job.placeholders?.find(p => p.type === 'location')?.label || 'India'
      const experience = job.placeholders?.find(p => p.type === 'experience')?.label || ''
      const salary = job.placeholders?.find(p => p.type === 'salary')?.label || ''
      const skills = job.tagsAndSkills?.split(',').map(s => s.trim()).filter(Boolean) || []

      const title = normalizeTitle(rawTitle)
      const company = normalizeCompanyName(rawCompany)

      if (title && company) {
        jobs.push({
          id: `naukri-${job.jobId || Math.random().toString(36).slice(2)}`,
          title,
          company,
          companyLogo: getCompanyLogo(company),
          location,
          salary: salary || null,
          salaryText: salary || 'Not Disclosed',
          experience: experience || detectExperience(rawTitle),
          type: job.jobType || 'Full-time',
          mode: detectWorkMode(`${rawTitle} ${location} ${job.mode || ''}`),
          skills: skills.slice(0, 8),
          source: 'Naukri',
          sourceUrl: job.jdURL ? `https://www.naukri.com${job.jdURL}` : `https://www.naukri.com/${urlKeyword}-jobs`,
          postedDate: job.createdDate ? new Date(job.createdDate * 1000).toISOString() : null,
          postedAgo: job.ambiguityHitLabel || job.footerPlaceholderLabel || 'Recently',
          description: job.jobDescription?.replace(/<[^>]+>/g, ' ').substring(0, 500) || `${title} at ${company}`,
          category: 'Technology',
          applyUrl: job.jdURL ? `https://www.naukri.com${job.jdURL}` : null,
        })
      }
    } catch {}
  }

  return jobs
}

/**
 * Strategy 2: Scrape Naukri's public search HTML page
 */
async function fetchViaHTML(keyword) {
  const urlKeyword = keyword.replace(/\s+/g, '-')
  const url = `https://www.naukri.com/${urlKeyword}-jobs?k=${encodeURIComponent(keyword)}&nignbevent_src=JobSearchPage`

  const response = await requestWithRetry(url, {
    headers: getHeaders({ 'Referer': 'https://www.google.co.in/' }),
    timeout: 15000,
  }, {
    maxRetries: 2,
    baseDelay: 2500,
    label: `Naukri HTML "${keyword}"`,
  })

  const $ = cheerio.load(response.data)
  const jobs = []

  // Try to extract from embedded JSON data in script tags
  $('script').each((_, el) => {
    try {
      const text = $(el).html() || ''
      // Naukri sometimes embeds job data in window.__STATE__ or similar
      const stateMatch = text.match(/window\.__STATE__\s*=\s*({.+?});?\s*(?:<\/script>|$)/s)
      if (stateMatch) {
        const state = JSON.parse(stateMatch[1])
        const jobList = state?.jobSearchData?.jobData || []
        for (const item of jobList) {
          const rawTitle = item.title || ''
          const rawCompany = item.companyName || ''
          const title = normalizeTitle(rawTitle)
          const company = normalizeCompanyName(rawCompany)

          if (title && company) {
            jobs.push({
              id: `naukri-${item.jobId || Math.random().toString(36).slice(2)}`,
              title,
              company,
              companyLogo: getCompanyLogo(company),
              location: item.location || 'India',
              salary: item.salary || null,
              salaryText: item.salary || 'Not Disclosed',
              experience: item.experience || detectExperience(rawTitle),
              type: 'Full-time',
              mode: detectWorkMode(`${rawTitle} ${item.location || ''}`),
              skills: (item.skills || []).slice(0, 8),
              source: 'Naukri',
              sourceUrl: item.url || `https://www.naukri.com/${urlKeyword}-jobs`,
              postedDate: null,
              postedAgo: 'Recently',
              description: `${title} at ${company}`,
              category: 'Technology',
              applyUrl: item.url || null,
            })
          }
        }
      }
    } catch {}
  })

  // Also try HTML card selectors
  $('.srp-jobtuple-wrapper, .jobTuple, article.jobTuple').each((_, el) => {
    try {
      const card = $(el)
      const rawTitle = card.find('.title, .desig, a.title').text().trim()
      const rawCompany = card.find('.comp-name, .subTitle a, .companyInfo a').text().trim()
      const location = card.find('.loc, .locWdth, .location span').text().trim()
      const experience = card.find('.exp, .expwdth, .experience span').text().trim()
      const salary = card.find('.sal, .salary span, .ni-salary').text().trim()
      const link = card.find('a.title, a[href*="naukri.com/job-listings"]').attr('href')

      const title = normalizeTitle(rawTitle)
      const company = normalizeCompanyName(rawCompany)

      if (title && company) {
        jobs.push({
          id: `naukri-html-${Math.random().toString(36).slice(2)}`,
          title,
          company,
          companyLogo: getCompanyLogo(company),
          location: location || 'India',
          salary: salary || null,
          salaryText: salary || 'Not Disclosed',
          experience: experience || detectExperience(rawTitle),
          type: 'Full-time',
          mode: detectWorkMode(`${rawTitle} ${location}`),
          skills: extractSkills(rawTitle),
          source: 'Naukri',
          sourceUrl: link || `https://www.naukri.com/${urlKeyword}-jobs`,
          postedDate: null,
          postedAgo: 'Recently',
          description: `${title} at ${company} — ${location}`,
          category: 'Technology',
          applyUrl: link || null,
        })
      }
    } catch {}
  })

  return jobs
}

export async function scrapeNaukri() {
  console.log('  📡 Naukri: Fetching listings (API + HTML fallback)...')
  const allJobs = []
  let apiSuccess = 0
  let htmlSuccess = 0

  for (const keyword of NAUKRI_SEARCH_KEYWORDS) {
    // Strategy 1: Try internal API first
    try {
      const apiJobs = await fetchViaAPI(keyword)
      if (apiJobs.length > 0) {
        allJobs.push(...apiJobs)
        apiSuccess++
        await sleep(1200 + Math.random() * 800)
        continue
      }
    } catch {}

    // Strategy 2: HTML fallback
    try {
      const htmlJobs = await fetchViaHTML(keyword)
      allJobs.push(...htmlJobs)
      if (htmlJobs.length > 0) htmlSuccess++
      await sleep(2000 + Math.random() * 1500)
    } catch (err) {
      console.log(`    ⚠️ Naukri "${keyword}": all strategies failed — ${err.response?.status || err.message}`)
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

  console.log(`  ✅ Naukri: ${unique.length} jobs (API: ${apiSuccess}, HTML: ${htmlSuccess} successful searches)`)
  return unique
}
