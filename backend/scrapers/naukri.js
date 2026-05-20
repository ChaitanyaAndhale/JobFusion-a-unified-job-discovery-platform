/**
 * Naukri Job Scraper
 * Uses Naukri's internal API endpoint for job search results
 */
import axios from 'axios'
import { getHeaders, sleep, timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo } from './helpers.js'

const NAUKRI_SEARCH_KEYWORDS = [
  'software developer',
  'react developer',
  'java developer',
  'python developer',
  'data scientist',
  'devops engineer',
  'full stack developer',
  'frontend developer',
]

export async function scrapeNaukri() {
  console.log('  📡 Naukri: Fetching listings...')
  const allJobs = []

  for (const keyword of NAUKRI_SEARCH_KEYWORDS) {
    try {
      // Naukri's internal job search API
      const urlKeyword = keyword.replace(/\s+/g, '-')
      const url = `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=${encodeURIComponent(keyword)}&sort=date&pageNo=1`

      const { data } = await axios.get(url, {
        headers: {
          ...getHeaders(),
          'Referer': `https://www.naukri.com/${urlKeyword}-jobs`,
          'Accept': 'application/json',
          'appid': '109',
          'systemid': 'Starter',
        },
        timeout: 12000,
      })

      const jobData = data?.jobDetails || []

      for (const job of jobData) {
        try {
          const title = job.title || ''
          const company = job.companyName || ''
          const location = job.placeholders?.find(p => p.type === 'location')?.label || 'India'
          const experience = job.placeholders?.find(p => p.type === 'experience')?.label || ''
          const salary = job.placeholders?.find(p => p.type === 'salary')?.label || ''
          const skills = job.tagsAndSkills?.split(',').map(s => s.trim()).filter(Boolean) || []

          if (title && company) {
            allJobs.push({
              id: `naukri-${job.jobId || Math.random().toString(36).slice(2)}`,
              title,
              company,
              companyLogo: getCompanyLogo(company),
              location,
              salary: salary || null,
              salaryText: salary || 'Not Disclosed',
              experience: experience || detectExperience(title),
              type: job.jobType || 'Full-time',
              mode: detectWorkMode(`${title} ${location} ${job.mode || ''}`),
              skills: skills.slice(0, 6),
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

      await sleep(1200 + Math.random() * 800)
    } catch (err) {
      console.log(`    ⚠️ Naukri "${keyword}": ${err.message}`)
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

  console.log(`  ✅ Naukri: ${unique.length} jobs`)
  return unique
}
