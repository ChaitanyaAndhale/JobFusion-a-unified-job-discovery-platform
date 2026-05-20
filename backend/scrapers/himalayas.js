/**
 * Himalayas.app Scraper - Free API for remote jobs
 * Source: https://himalayas.app/jobs/api
 */
import axios from 'axios'
import { timeAgo, detectExperience, extractSkills, getCompanyLogo } from './helpers.js'

export async function scrapeHimalayas() {
  console.log('  📡 Himalayas: Fetching...')
  try {
    const { data } = await axios.get('https://himalayas.app/jobs/api?limit=100', {
      timeout: 15000,
    })

    const jobs = (data.jobs || []).map(job => ({
      id: `himalayas-${job.id}`,
      title: job.title || '',
      company: job.companyName || 'Unknown',
      companyLogo: job.companyLogo || getCompanyLogo(job.companyName),
      location: job.locationRestrictions?.join(', ') || 'Remote (Worldwide)',
      salary: null,
      salaryText: job.minSalary && job.maxSalary
        ? `$${(job.minSalary/1000).toFixed(0)}k - $${(job.maxSalary/1000).toFixed(0)}k`
        : 'Not Disclosed',
      experience: job.seniority || detectExperience(job.title),
      type: 'Full-time',
      mode: 'Remote',
      skills: job.categories?.slice(0, 6) || extractSkills(job.description || job.title),
      source: 'Himalayas',
      sourceUrl: job.applicationLink || `https://himalayas.app/jobs/${job.id}`,
      postedDate: job.pubDate || null,
      postedAgo: timeAgo(job.pubDate),
      description: job.excerpt?.substring(0, 500) || job.description?.replace(/<[^>]+>/g, ' ').substring(0, 500) || '',
      category: job.categories?.[0] || 'Technology',
      applyUrl: job.applicationLink || `https://himalayas.app/jobs/${job.id}`,
    })).filter(j => j.title)

    console.log(`  ✅ Himalayas: ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.log(`  ❌ Himalayas: ${err.message}`)
    return []
  }
}
