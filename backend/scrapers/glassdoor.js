/**
 * Glassdoor Job Scraper
 * Scrapes Glassdoor public job listings
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { getHeaders, sleep, detectExperience, detectWorkMode, extractSkills, getCompanyLogo } from './helpers.js'

const GLASSDOOR_SEARCHES = [
  { keyword: 'software engineer', locationId: '115884', locationName: 'India' },
  { keyword: 'react developer', locationId: '115884', locationName: 'India' },
  { keyword: 'data scientist', locationId: '115884', locationName: 'India' },
]

export async function scrapeGlassdoor() {
  console.log('  📡 Glassdoor: Scraping public listings...')
  const allJobs = []

  for (const search of GLASSDOOR_SEARCHES) {
    try {
      const url = `https://www.glassdoor.co.in/Job/india-${search.keyword.replace(/\s+/g, '-')}-jobs-SRCH_IL.0,5_IN115_KO6,${6 + search.keyword.length}.htm?sortBy=date_desc`

      const { data } = await axios.get(url, {
        headers: {
          ...getHeaders(),
          'Referer': 'https://www.glassdoor.co.in/',
        },
        timeout: 15000,
      })

      const $ = cheerio.load(data)

      // Parse Glassdoor job cards
      $('li.JobsList_jobListItem__wjTHv, li[data-test="jobListing"]').each((_, el) => {
        try {
          const card = $(el)
          const title = card.find('a[data-test="job-title"], .JobCard_jobTitle__GLyJ1').text().trim()
          const company = card.find('.EmployerProfile_companyName__9fLkA, [data-test="emp-name"]').text().trim()
          const location = card.find('.JobCard_location__rCz3x, [data-test="emp-location"]').text().trim()
          const salary = card.find('.JobCard_salaryEstimate__arV5J, [data-test="detailSalary"]').text().trim()
          const link = card.find('a[data-test="job-title"]').attr('href')
          const jobId = card.attr('data-id') || card.attr('data-jobid')

          if (title && company) {
            allJobs.push({
              id: `glassdoor-${jobId || Math.random().toString(36).slice(2)}`,
              title,
              company,
              companyLogo: getCompanyLogo(company),
              location: location || search.locationName,
              salary: salary || null,
              salaryText: salary || 'Not Disclosed',
              experience: detectExperience(title),
              type: 'Full-time',
              mode: detectWorkMode(`${title} ${location}`),
              skills: extractSkills(`${title} ${search.keyword}`),
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

      await sleep(2500 + Math.random() * 1500)
    } catch (err) {
      console.log(`    ⚠️ Glassdoor "${search.keyword}": ${err.message}`)
    }
  }

  const seen = new Set()
  const unique = allJobs.filter(j => {
    const key = `${j.title}-${j.company}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`  ✅ Glassdoor: ${unique.length} jobs`)
  return unique
}
