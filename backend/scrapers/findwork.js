/**
 * FindWork.dev Scraper - Free API for developer jobs
 * Source: https://findwork.dev/api/jobs/
 */
import axios from 'axios'
import { randomUA, timeAgo, detectExperience, detectWorkMode, extractSkills, getCompanyLogo } from './helpers.js'

export async function scrapeFindWork() {
  console.log('  📡 FindWork: Fetching...')
  try {
    const allJobs = []

    // Search for India-relevant keywords
    const searches = ['', 'india', 'remote']
    
    for (const search of searches) {
      try {
        const params = search ? `?search=${search}&sort_by=date` : '?sort_by=date'
        const { data } = await axios.get(`https://findwork.dev/api/jobs/${params}`, {
          headers: {
            'User-Agent': randomUA(),
            'Accept': 'application/json',
          },
          timeout: 12000,
        })

        const jobs = (data.results || []).map(job => ({
          id: `findwork-${job.id}`,
          title: job.role || '',
          company: job.company_name || 'Unknown',
          companyLogo: job.logo || getCompanyLogo(job.company_name),
          location: job.location || 'Remote',
          salary: null,
          salaryText: job.salary_range || 'Not Disclosed',
          experience: detectExperience(job.role || ''),
          type: job.employment_type || 'Full-time',
          mode: job.remote ? 'Remote' : detectWorkMode(job.location || ''),
          skills: job.keywords?.slice(0, 6) || extractSkills(job.text || job.role || ''),
          source: 'FindWork',
          sourceUrl: job.url || `https://findwork.dev/`,
          postedDate: job.date_posted || null,
          postedAgo: timeAgo(job.date_posted),
          description: job.text?.replace(/<[^>]+>/g, ' ').substring(0, 500) || '',
          category: job.keywords?.[0] || 'Technology',
          applyUrl: job.url || null,
        })).filter(j => j.title)

        allJobs.push(...jobs)
      } catch {}
    }

    // Dedupe
    const seen = new Set()
    const unique = allJobs.filter(j => {
      const key = `${j.title}-${j.company}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    console.log(`  ✅ FindWork: ${unique.length} jobs`)
    return unique
  } catch (err) {
    console.log(`  ❌ FindWork: ${err.message}`)
    return []
  }
}
