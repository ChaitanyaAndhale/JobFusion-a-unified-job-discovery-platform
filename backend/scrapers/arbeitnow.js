/**
 * Arbeitnow Scraper - Free API, no key needed
 * Source: https://www.arbeitnow.com/api/job-board-api
 */
import axios from 'axios'
import { timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo } from './helpers.js'

export async function scrapeArbeitnow() {
  console.log('  📡 Arbeitnow: Fetching...')
  try {
    const allJobs = []

    // Fetch first 2 pages
    for (let page = 1; page <= 2; page++) {
      const { data } = await axios.get(`https://www.arbeitnow.com/api/job-board-api?page=${page}`, {
        timeout: 15000,
      })

      const jobs = (data.data || []).map(job => ({
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        companyLogo: getCompanyLogo(job.company_name),
        location: job.location || 'Remote',
        salary: null,
        salaryText: 'Not Disclosed',
        experience: detectExperience(job.title),
        type: 'Full-time',
        mode: job.remote ? 'Remote' : detectWorkMode(job.location || ''),
        skills: job.tags?.length > 0 ? job.tags.slice(0, 6) : extractSkills(job.description),
        source: 'Arbeitnow',
        sourceUrl: job.url,
        postedDate: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
        postedAgo: job.created_at ? timeAgo(new Date(job.created_at * 1000).toISOString()) : 'Recently',
        description: job.description?.replace(/<[^>]+>/g, ' ').substring(0, 500),
        category: job.tags?.[0] || 'General',
        applyUrl: job.url,
      }))

      allJobs.push(...jobs)
    }

    console.log(`  ✅ Arbeitnow: ${allJobs.length} jobs`)
    return allJobs
  } catch (err) {
    console.log(`  ❌ Arbeitnow: ${err.message}`)
    return []
  }
}
