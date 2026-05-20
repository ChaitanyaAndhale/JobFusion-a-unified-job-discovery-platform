/**
 * RemoteOK Scraper - Free JSON API, no key needed
 * Source: https://remoteok.com/api
 * Great for remote jobs open to India
 */
import axios from 'axios'
import { randomUA, timeAgo, detectExperience, extractSkills, getCompanyLogo } from './helpers.js'

export async function scrapeRemoteOK() {
  console.log('  📡 RemoteOK: Fetching...')
  try {
    const { data } = await axios.get('https://remoteok.com/api', {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'application/json',
      },
      timeout: 15000,
    })

    // First item is metadata, skip it
    const jobs = (Array.isArray(data) ? data.slice(1) : []).map(job => ({
      id: `remoteok-${job.id}`,
      title: job.position || job.title || '',
      company: job.company || 'Unknown',
      companyLogo: job.company_logo ? `https://remoteok.com${job.company_logo}` : getCompanyLogo(job.company),
      location: job.location || 'Remote (Worldwide)',
      salary: null,
      salaryText: job.salary_min && job.salary_max ? `$${(job.salary_min/1000).toFixed(0)}k - $${(job.salary_max/1000).toFixed(0)}k` : 'Not Disclosed',
      experience: detectExperience(job.position || job.title || ''),
      type: 'Full-time',
      mode: 'Remote',
      skills: job.tags?.slice(0, 6) || extractSkills(job.description || ''),
      source: 'RemoteOK',
      sourceUrl: job.url ? `https://remoteok.com${job.url}` : 'https://remoteok.com',
      postedDate: job.date || null,
      postedAgo: timeAgo(job.date),
      description: job.description?.replace(/<[^>]+>/g, ' ').substring(0, 500) || '',
      category: job.tags?.[0] || 'Technology',
      applyUrl: job.apply_url || (job.url ? `https://remoteok.com${job.url}` : null),
    })).filter(j => j.title)

    console.log(`  ✅ RemoteOK: ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.log(`  ❌ RemoteOK: ${err.message}`)
    return []
  }
}
