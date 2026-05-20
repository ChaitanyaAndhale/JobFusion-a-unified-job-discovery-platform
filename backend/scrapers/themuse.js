/**
 * The Muse API Scraper - Free API, no key needed
 * Source: https://www.themuse.com/api/public/jobs
 * Reliable, well-structured API with good data
 */
import axios from 'axios'
import { timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo } from './helpers.js'

export async function scrapeTheMuse() {
  console.log('  📡 The Muse: Fetching...')
  const allJobs = []

  try {
    // Fetch 2 pages of tech jobs
    for (let page = 0; page < 2; page++) {
      const params = new URLSearchParams({
        category: 'Software Engineering',
        page: page.toString(),
      })

      const { data } = await axios.get(`https://www.themuse.com/api/public/jobs?${params}`, {
        timeout: 15000,
      })

      const jobs = (data.results || []).map(job => {
        const locs = job.locations?.map(l => l.name).join(', ') || 'Remote'
        return {
          id: `themuse-${job.id}`,
          title: job.name,
          company: job.company?.name || 'Unknown',
          companyLogo: getCompanyLogo(job.company?.name),
          location: locs,
          salary: null,
          salaryText: 'Not Disclosed',
          experience: job.levels?.map(l => l.name).join(', ') || detectExperience(job.name),
          type: 'Full-time',
          mode: detectWorkMode(locs),
          skills: extractSkills(job.contents || job.name),
          source: 'The Muse',
          sourceUrl: `https://www.themuse.com/jobs/${job.id}`,
          postedDate: job.publication_date,
          postedAgo: timeAgo(job.publication_date),
          description: job.contents?.replace(/<[^>]+>/g, ' ').substring(0, 500),
          category: job.categories?.[0]?.name || 'Technology',
          applyUrl: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.id}`,
        }
      })

      allJobs.push(...jobs)
    }

    console.log(`  ✅ The Muse: ${allJobs.length} jobs`)
    return allJobs
  } catch (err) {
    console.log(`  ❌ The Muse: ${err.message}`)
    return []
  }
}
