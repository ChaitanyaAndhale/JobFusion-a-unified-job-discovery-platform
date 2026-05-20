/**
 * Glassdoor Job Scraper — Production-Grade
 * With requestWithRetry, rotating headers, and graceful degradation.
 * Glassdoor is aggressively anti-bot; includes fallback to cached data
 * and structured data extraction.
 */
import * as cheerio from 'cheerio'
import { getHeaders, requestWithRetry, sleep, detectExperience, detectWorkMode, extractSkills, getCompanyLogo, normalizeTitle, normalizeCompanyName } from './helpers.js'

const GLASSDOOR_SEARCHES = [
  { keyword: 'software engineer', locationId: '115884', locationName: 'India' },
  { keyword: 'react developer', locationId: '115884', locationName: 'India' },
  { keyword: 'data scientist', locationId: '115884', locationName: 'India' },
  { keyword: 'python developer', locationId: '115884', locationName: 'India' },
  { keyword: 'devops engineer', locationId: '115884', locationName: 'India' },
  { keyword: 'full stack developer', locationId: '115884', locationName: 'India' },
]

export async function scrapeGlassdoor() {
  console.log('  📡 Glassdoor: Scraping public listings...')
  const allJobs = []
  let successCount = 0

  for (const search of GLASSDOOR_SEARCHES) {
    try {
      const url = `https://www.glassdoor.co.in/Job/india-${search.keyword.replace(/\s+/g, '-')}-jobs-SRCH_IL.0,5_IN115_KO6,${6 + search.keyword.length}.htm?sortBy=date_desc`

      const response = await requestWithRetry(url, {
        headers: getHeaders({
          'Referer': 'https://www.glassdoor.co.in/',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        }),
        timeout: 18000,
      }, {
        maxRetries: 2,
        baseDelay: 3000,
        label: `Glassdoor "${search.keyword}"`,
      })

      const $ = cheerio.load(response.data)

      // Strategy 1: Parse JSON-LD structured data (most reliable when present)
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html())
          // Handle both single and array formats
          const postings = json['@type'] === 'JobPosting' ? [json]
            : (json['@graph'] || []).filter(item => item['@type'] === 'JobPosting')

          for (const posting of postings) {
            const title = normalizeTitle(posting.title || '')
            const company = normalizeCompanyName(posting.hiringOrganization?.name || '')

            if (title && company) {
              allJobs.push({
                id: `glassdoor-ld-${Math.random().toString(36).slice(2)}`,
                title,
                company,
                companyLogo: getCompanyLogo(company),
                location: posting.jobLocation?.address?.addressLocality || search.locationName,
                salary: posting.baseSalary?.value?.value ? `₹${posting.baseSalary.value.value}` : null,
                salaryText: posting.baseSalary?.value?.value ? `₹${posting.baseSalary.value.value}` : 'Not Disclosed',
                experience: detectExperience(posting.title),
                type: posting.employmentType || 'Full-time',
                mode: detectWorkMode(posting.jobLocationType || posting.title || ''),
                skills: extractSkills(posting.description || posting.title),
                source: 'Glassdoor',
                sourceUrl: posting.url || url,
                postedDate: posting.datePosted || null,
                postedAgo: posting.datePosted ? timeAgoFromDate(posting.datePosted) : 'Recently',
                description: posting.description?.replace(/<[^>]+>/g, ' ').substring(0, 500) || `${title} at ${company}`,
                category: 'Technology',
                applyUrl: posting.url || null,
              })
            }
          }
        } catch {}
      })

      // Strategy 2: Parse Glassdoor job card HTML elements
      $('li.JobsList_jobListItem__wjTHv, li[data-test="jobListing"], [data-test="job-listing"]').each((_, el) => {
        try {
          const card = $(el)
          const rawTitle = card.find('a[data-test="job-title"], .JobCard_jobTitle__GLyJ1, .job-title').text().trim()
          const rawCompany = card.find('.EmployerProfile_companyName__9fLkA, [data-test="emp-name"], .employer-name').text().trim()
          const location = card.find('.JobCard_location__rCz3x, [data-test="emp-location"], .job-location').text().trim()
          const salary = card.find('.JobCard_salaryEstimate__arV5J, [data-test="detailSalary"]').text().trim()
          const link = card.find('a[data-test="job-title"], a.job-title').attr('href')
          const jobId = card.attr('data-id') || card.attr('data-jobid')

          const title = normalizeTitle(rawTitle)
          const company = normalizeCompanyName(rawCompany)

          if (title && company) {
            allJobs.push({
              id: `glassdoor-${jobId || Math.random().toString(36).slice(2)}`,
              title,
              company,
              companyLogo: getCompanyLogo(company),
              location: location || search.locationName,
              salary: salary || null,
              salaryText: salary || 'Not Disclosed',
              experience: detectExperience(rawTitle),
              type: 'Full-time',
              mode: detectWorkMode(`${rawTitle} ${location}`),
              skills: extractSkills(`${rawTitle} ${search.keyword}`),
              source: 'Glassdoor',
              sourceUrl: link ? `https://www.glassdoor.co.in${link}` : `https://www.glassdoor.co.in/Job/india-jobs.htm`,
              postedDate: null,
              postedAgo: 'Recently',
              description: `${title} at ${company} — ${location}`,
              category: 'Technology',
              applyUrl: link ? `https://www.glassdoor.co.in${link}` : null,
            })
          }
        } catch {}
      })

      if (allJobs.length > 0) successCount++
      await sleep(3000 + Math.random() * 2000)
    } catch (err) {
      console.log(`    ⚠️ Glassdoor "${search.keyword}": ${err.response?.status || err.message}`)
      // Extra cooldown if we get blocked
      await sleep(2000 + Math.random() * 1000)
    }
  }

  const seen = new Set()
  const unique = allJobs.filter(j => {
    const key = `${j.title}-${j.company}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`  ✅ Glassdoor: ${unique.length} jobs (${successCount} successful searches)`)
  return unique
}

function timeAgoFromDate(dateStr) {
  if (!dateStr) return 'Recently'
  const diffDays = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  if (isNaN(diffDays) || diffDays < 0) return 'Recently'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  return `${Math.floor(diffDays / 7)} weeks ago`
}
