/**
 * Remotive Scraper - Free API, no key needed
 * Source: https://remotive.com/api/remote-jobs
 */
import axios from 'axios'
import { timeAgo, detectExperience, extractSkills, getCompanyLogo } from './helpers.js'

export async function scrapeRemotive() {
  console.log('  📡 Remotive: Fetching...')
  try {
    const { data } = await axios.get('https://remotive.com/api/remote-jobs?limit=100', {
      timeout: 15000,
    })

    const jobs = (data.jobs || []).map(job => ({
      id: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      companyLogo: job.company_logo_url || getCompanyLogo(job.company_name),
      location: job.candidate_required_location || 'Worldwide',
      salary: job.salary || null,
      salaryText: job.salary || 'Not Disclosed',
      experience: detectExperience(job.title),
      type: job.job_type === 'full_time' ? 'Full-time' : job.job_type === 'contract' ? 'Contract' : job.job_type === 'part_time' ? 'Part-time' : 'Full-time',
      mode: 'Remote',
      skills: job.tags?.length > 0 ? job.tags.slice(0, 6) : extractSkills(job.description),
      source: 'Remotive',
      sourceUrl: job.url,
      postedDate: job.publication_date,
      postedAgo: timeAgo(job.publication_date),
      description: job.description?.replace(/<[^>]+>/g, ' ').substring(0, 500),
      category: job.category,
      applyUrl: job.url,
    }))

    console.log(`  ✅ Remotive: ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.log(`  ❌ Remotive: ${err.message}`)
    return []
  }
}
