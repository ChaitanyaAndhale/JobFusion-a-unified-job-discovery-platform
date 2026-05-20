/**
 * Job Scraper Aggregator — India Focused
 * Runs all scrapers, caches results, provides unified API
 * Auto-refreshes every 15 minutes to catch new jobs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabase, isSupabaseConnected } from '../lib/supabase.js'

import { scrapeRemotive } from './remotive.js'
import { scrapeArbeitnow } from './arbeitnow.js'
import { scrapeLinkedIn } from './linkedin.js'
import { scrapeIndeed } from './indeed.js'
import { scrapeNaukri } from './naukri.js'
import { scrapeGlassdoor } from './glassdoor.js'
import { scrapeTheMuse } from './themuse.js'
import { scrapeRemoteOK } from './remoteok.js'
import { scrapeHimalayas } from './himalayas.js'
import { scrapeFindWork } from './findwork.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.join(__dirname, '..', 'cache', 'jobs.json')
const CACHE_DIR = path.join(__dirname, '..', 'cache')

// In-memory job cache
let jobCache = []
let cacheStats = {}

/**
 * Run all scrapers and merge results
 */
export async function scrapeAll() {
  const startTime = Date.now()
  console.log('\n🔍 ═══════════════════════════════════════════════')
  console.log('   JobFusion Scraper — India Edition — Starting...')
  console.log('═══════════════════════════════════════════════════')

  // Phase 1: Run all API-based scrapers in parallel (fast, reliable)
  const apiResults = await Promise.allSettled([
    scrapeRemotive(),
    scrapeArbeitnow(),
    scrapeTheMuse(),
    scrapeRemoteOK(),
    scrapeHimalayas(),
    scrapeFindWork(),
  ])

  const apiNames = ['Remotive', 'Arbeitnow', 'The Muse', 'RemoteOK', 'Himalayas', 'FindWork']
  const apiJobs = []
  const newStats = {}

  apiResults.forEach((result, i) => {
    const name = apiNames[i]
    if (result.status === 'fulfilled' && result.value.length > 0) {
      apiJobs.push(...result.value)
      newStats[name] = result.value.length
    } else {
      newStats[name] = 0
    }
  })

  // Phase 2: Run HTML scrapers sequentially (need rate limiting)
  let linkedInJobs = []
  let indeedJobs = []
  let naukriJobs = []
  let glassdoorJobs = []

  try { linkedInJobs = await scrapeLinkedIn() } catch (e) { console.log(`  ❌ LinkedIn: ${e.message}`) }
  try { indeedJobs = await scrapeIndeed() } catch (e) { console.log(`  ❌ Indeed: ${e.message}`) }
  try { naukriJobs = await scrapeNaukri() } catch (e) { console.log(`  ❌ Naukri: ${e.message}`) }
  try { glassdoorJobs = await scrapeGlassdoor() } catch (e) { console.log(`  ❌ Glassdoor: ${e.message}`) }

  newStats['LinkedIn'] = linkedInJobs.length
  newStats['Indeed'] = indeedJobs.length
  newStats['Naukri'] = naukriJobs.length
  newStats['Glassdoor'] = glassdoorJobs.length

  // Merge all jobs
  const allJobs = [
    ...apiJobs,
    ...linkedInJobs,
    ...indeedJobs,
    ...naukriJobs,
    ...glassdoorJobs,
  ]

  // Global dedupe by title+company
  const seen = new Set()
  const uniqueJobs = allJobs.filter(j => {
    const key = `${j.title}-${j.company}`.toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort: newest first, India jobs prioritized
  uniqueJobs.sort((a, b) => {
    // Prioritize India-located jobs
    const aIndia = isIndiaJob(a) ? 1 : 0
    const bIndia = isIndiaJob(b) ? 1 : 0
    if (aIndia !== bIndia) return bIndia - aIndia

    // Then by date
    const dateA = a.postedDate ? new Date(a.postedDate) : new Date(0)
    const dateB = b.postedDate ? new Date(b.postedDate) : new Date(0)
    return dateB - dateA
  })

  // Update stats
  cacheStats = newStats
  jobCache = uniqueJobs
  global.__lastScrapeTime = new Date().toISOString()

  // Save to disk
  saveCache(uniqueJobs, newStats)

  // Save to Supabase (if connected)
  if (isSupabaseConnected()) {
    try {
      console.log('  ☁️ Syncing jobs to Supabase database...')
      
      // Strict dedupe by job_id to prevent "cannot affect row a second time" error in Supabase
      const seenIds = new Set()
      const dbJobs = uniqueJobs.map(job => ({
        job_id: job.id,
        title: job.title,
        company: job.company,
        company_logo: job.companyLogo,
        location: job.location,
        salary_text: job.salaryText,
        experience: job.experience,
        type: job.type,
        mode: job.mode,
        source: job.source,
        skills: job.skills || [],
        description: job.description,
        source_url: job.sourceUrl,
        apply_url: job.applyUrl,
        category: job.category,
        posted_date: job.postedDate ? new Date(job.postedDate) : new Date(),
      })).filter(j => {
        if (seenIds.has(j.job_id)) return false
        seenIds.add(j.job_id)
        return true
      })

      // Upsert in batches of 100 to avoid request limits
      let successCount = 0
      for (let i = 0; i < dbJobs.length; i += 100) {
        const batch = dbJobs.slice(i, i + 100)
        const { error } = await supabase
          .from('jobs')
          .upsert(batch, { onConflict: 'job_id', ignoreDuplicates: false })
        if (error) throw error
        successCount += batch.length
      }
      console.log(`  ✅ Successfully synced ${successCount} jobs to Supabase`)
    } catch (err) {
      console.log(`  ❌ Failed to sync to Supabase: ${err.message}`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const liveCount = Object.values(newStats).filter(v => v > 0).length

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`   ✅ Scrape complete in ${elapsed}s`)
  console.log(`   📊 Total: ${uniqueJobs.length} unique jobs from ${liveCount}/${Object.keys(newStats).length} platforms`)
  console.log(`   🇮🇳 India jobs: ${uniqueJobs.filter(isIndiaJob).length}`)
  Object.entries(newStats).forEach(([src, count]) => {
    const icon = count > 0 ? '✅' : '⚠️'
    console.log(`      ${icon} ${src}: ${count}`)
  })
  console.log('═══════════════════════════════════════════════════\n')

  return uniqueJobs
}

function isIndiaJob(job) {
  const loc = (job.location || '').toLowerCase()
  const indianCities = ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'kolkata', 'noida', 'gurgaon', 'gurugram', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'kochi', 'coimbatore', 'nagpur', 'indore', 'thiruvananthapuram', 'visakhapatnam']
  return indianCities.some(city => loc.includes(city))
}

/**
 * Get cached jobs
 */
export function getCache() {
  if (jobCache.length === 0) {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
        jobCache = saved.jobs || []
        cacheStats = saved.stats || {}
      }
    } catch {}
  }
  return jobCache
}

/**
 * Get platform stats
 */
export function getCacheStats() {
  return cacheStats
}

/**
 * Save cache to disk
 */
function saveCache(jobs, stats) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      jobs,
      stats,
      lastUpdated: new Date().toISOString(),
    }, null, 0))
  } catch (err) {
    console.log(`  ⚠️ Cache save failed: ${err.message}`)
  }
}
