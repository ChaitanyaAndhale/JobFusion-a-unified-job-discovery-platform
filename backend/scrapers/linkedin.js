/**
 * LinkedIn Job Scraper - India Focused
 * Scrapes LinkedIn's public guest API for Indian job listings
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { getHeaders, sleep, timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo } from './helpers.js'

const LINKEDIN_SEARCHES = [
  // India-specific tech searches
  { keywords: 'software engineer', location: 'India', geoId: '102713980' },
  { keywords: 'react developer', location: 'India', geoId: '102713980' },
  { keywords: 'python developer', location: 'India', geoId: '102713980' },
  { keywords: 'java developer', location: 'India', geoId: '102713980' },
  { keywords: 'full stack developer', location: 'India', geoId: '102713980' },
  { keywords: 'data scientist', location: 'India', geoId: '102713980' },
  { keywords: 'devops engineer', location: 'India', geoId: '102713980' },
  { keywords: 'frontend developer', location: 'India', geoId: '102713980' },
  { keywords: 'backend developer', location: 'India', geoId: '102713980' },
  { keywords: 'machine learning engineer', location: 'India', geoId: '102713980' },
  { keywords: 'android developer', location: 'India', geoId: '102713980' },
  { keywords: 'cloud engineer', location: 'India', geoId: '102713980' },
  // City-specific searches
  { keywords: 'software developer', location: 'Bangalore', geoId: '105214831' },
  { keywords: 'software developer', location: 'Pune', geoId: '114806696' },
  { keywords: 'software developer', location: 'Hyderabad', geoId: '105556991' },
  { keywords: 'software developer', location: 'Mumbai', geoId: '115884' },
  { keywords: 'software developer', location: 'Chennai', geoId: '106340116' },
  { keywords: 'software developer', location: 'Delhi NCR', geoId: '102713980' },
  { keywords: 'fresher software developer', location: 'India', geoId: '102713980' },
  { keywords: 'intern developer', location: 'India', geoId: '102713980' },
]

function parseLinkedInCards(html) {
  const $ = cheerio.load(html)
  const jobs = []

  $('li').each((_, el) => {
    try {
      const card = $(el)
      const title = card.find('.base-search-card__title').text().trim()
      const company = card.find('.base-search-card__subtitle a').text().trim() ||
                      card.find('.base-search-card__subtitle').text().trim()
      const location = card.find('.job-search-card__location').text().trim()
      const link = card.find('.base-card__full-link').attr('href') ||
                   card.find('a.base-card').attr('href')
      const dateEl = card.find('time')
      const postedDate = dateEl.attr('datetime') || null
      const listingId = card.find('.base-card').attr('data-entity-urn')?.split(':').pop()

      if (title && company) {
        jobs.push({
          id: `linkedin-${listingId || Math.random().toString(36).slice(2)}`,
          title,
          company,
          companyLogo: getCompanyLogo(company),
          location: location || 'India',
          salary: null,
          salaryText: 'Not Disclosed',
          experience: detectExperience(title),
          type: 'Full-time',
          mode: detectWorkMode(`${title} ${location}`),
          skills: extractSkills(title),
          source: 'LinkedIn',
          sourceUrl: link?.split('?')[0] || `https://www.linkedin.com/jobs/search/?keywords=developer&location=India`,
          postedDate,
          postedAgo: timeAgo(postedDate),
          description: `${title} position at ${company} in ${location}`,
          category: 'Technology',
          applyUrl: link?.split('?')[0] || null,
        })
      }
    } catch {}
  })

  return jobs
}

export async function scrapeLinkedIn() {
  console.log('  📡 LinkedIn: Scraping India job listings...')
  const allJobs = []

  for (const search of LINKEDIN_SEARCHES) {
    try {
      const params = new URLSearchParams({
        keywords: search.keywords,
        location: search.location,
        geoId: search.geoId || '',
        f_TPR: 'r604800', // past week
        position: '1',
        pageNum: '0',
        start: '0',
      })

      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`

      const { data } = await axios.get(url, {
        headers: getHeaders(),
        timeout: 12000,
      })

      const jobs = parseLinkedInCards(data)
      allJobs.push(...jobs)

      // Also fetch page 2
      if (jobs.length >= 20) {
        try {
          params.set('start', '25')
          const { data: data2 } = await axios.get(
            `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`,
            { headers: getHeaders(), timeout: 12000 }
          )
          allJobs.push(...parseLinkedInCards(data2))
        } catch {}
      }

      await sleep(1200 + Math.random() * 800)
    } catch (err) {
      console.log(`    ⚠️ LinkedIn "${search.keywords} - ${search.location}": ${err.message}`)
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

  console.log(`  ✅ LinkedIn: ${unique.length} jobs (India-focused)`)
  return unique
}
