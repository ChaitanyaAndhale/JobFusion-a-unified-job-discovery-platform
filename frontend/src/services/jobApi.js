// Job API Service - Connects to the JobFusion backend
// Smart search with multi-keyword, partial matching, relevancy ranking

const API_BASE = import.meta.env.PROD ? '' : ''

/**
 * Fetch real-time dashboard stats (replaces all mock dashboard data)
 */
export async function fetchDashboardStats(token) {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Fetch detailed resume insights & match report
 */
export async function fetchResumeInsights(token) {
  try {
    const res = await fetch(`${API_BASE}/api/resume/insights`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Track a job application
 */
export async function applyToJob(token, jobData) {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    })
    return await res.json()
  } catch {
    return { success: false, error: 'Failed to track application' }
  }
}

// ─── Synonym / Alias Map (client-side) ─────────────────────
const SKILL_ALIASES = {
  'js': ['javascript'], 'ts': ['typescript'], 'py': ['python'],
  'react': ['reactjs', 'react.js'], 'node': ['nodejs', 'node.js'],
  'vue': ['vuejs', 'vue.js'], 'angular': ['angularjs'],
  'ml': ['machine learning'], 'ai': ['artificial intelligence'],
  'devops': ['dev ops'], 'k8s': ['kubernetes'],
  'aws': ['amazon web services'], 'gcp': ['google cloud'],
  'frontend': ['front end', 'front-end'], 'backend': ['back end', 'back-end'],
  'fullstack': ['full stack', 'full-stack'],
}

function expandTerm(term) {
  const t = term.toLowerCase().trim()
  const expanded = [t]
  for (const [alias, targets] of Object.entries(SKILL_ALIASES)) {
    if (t === alias) expanded.push(...targets)
    if (targets.includes(t)) expanded.push(alias)
  }
  return expanded
}

/**
 * Fetch all jobs from backend (which aggregates all scrapers)
 */
export async function fetchAllJobs(filters = {}) {
  try {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.source) params.set('source', filters.source)
    if (filters.mode) params.set('mode', filters.mode)
    if (filters.type) params.set('type', filters.type)
    if (filters.experience) params.set('experience', filters.experience)
    params.set('limit', '500') // Get all, paginate on frontend

    const res = await fetch(`${API_BASE}/api/jobs?${params}`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const json = await res.json()

    if (json.success) {
      return json.data.map(normalizeJob)
    }
    throw new Error(json.error || 'Unknown error')
  } catch (err) {
    console.warn('Backend API failed, falling back to direct APIs:', err.message)
    return fetchDirectFromAPIs()
  }
}

/**
 * Get dynamic platform stats from backend (real data)
 */
export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/stats`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return await res.json()
  } catch {
    return {
      totalJobs: 0, totalCompanies: 0, activePlatforms: 0,
      platforms: {}, trendingSkills: [], topLocations: [],
      topCompanies: [], lastUpdated: null,
    }
  }
}

/**
 * Get autocomplete suggestions from backend
 */
export async function fetchSuggestions(query) {
  if (!query || query.length < 2) return []
  try {
    const res = await fetch(`${API_BASE}/api/jobs/suggestions?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const json = await res.json()
    return json.suggestions || []
  } catch {
    return []
  }
}

/**
 * Trigger manual refresh on backend
 */
export async function refreshJobs() {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/refresh`, { method: 'POST' })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('Refresh failed:', err.message)
    return null
  }
}

/**
 * Get available sources from backend
 */
export async function fetchSources() {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/sources`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const json = await res.json()
    return json.sources || []
  } catch {
    return []
  }
}

// ─── Fallback: Direct API calls (if backend is down) ───────────

async function fetchDirectFromAPIs() {
  const results = await Promise.allSettled([
    fetchRemotiveDirect(),
    fetchArbeitnowDirect(),
  ])

  const allJobs = []
  results.forEach(r => {
    if (r.status === 'fulfilled') allJobs.push(...r.value)
  })

  allJobs.sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0))
  return allJobs
}

async function fetchRemotiveDirect() {
  try {
    const res = await fetch('/api/remotive/remote-jobs?limit=50')
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || []).map(job => normalizeJob({
      id: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      companyLogo: job.company_logo_url || getCompanyLogo(job.company_name),
      location: job.candidate_required_location || 'Worldwide',
      salaryText: job.salary || 'Not Disclosed',
      experience: detectExperience(job.title),
      type: job.job_type === 'full_time' ? 'Full-time' : 'Contract',
      mode: 'Remote',
      skills: job.tags?.slice(0, 5) || [],
      source: 'Remotive',
      sourceUrl: job.url,
      postedDate: job.publication_date,
      postedAgo: timeAgo(job.publication_date),
      category: job.category,
      applyUrl: job.url,
    }))
  } catch { return [] }
}

async function fetchArbeitnowDirect() {
  try {
    const res = await fetch('/api/arbeitnow/job-board-api?page=1')
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map(job => normalizeJob({
      id: `arbeitnow-${job.slug}`,
      title: job.title,
      company: job.company_name,
      companyLogo: getCompanyLogo(job.company_name),
      location: job.location || 'Remote',
      salaryText: 'Not Disclosed',
      experience: detectExperience(job.title),
      type: 'Full-time',
      mode: job.remote ? 'Remote' : 'On-site',
      skills: job.tags?.slice(0, 5) || [],
      source: 'Arbeitnow',
      sourceUrl: job.url,
      postedDate: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
      postedAgo: job.created_at ? timeAgo(new Date(job.created_at * 1000).toISOString()) : 'Recently',
      applyUrl: job.url,
    }))
  } catch { return [] }
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Normalize backend job into frontend format
 */
function normalizeJob(job) {
  return {
    id: job.id,
    title: job.title,
    company: {
      name: job.company,
      logo: job.companyLogo || getCompanyLogo(job.company),
      logoUrl: job.companyLogo || null,
    },
    location: job.location || 'Remote',
    salary: job.salary || null,
    salaryText: job.salaryText || job.salary || 'Not Disclosed',
    experience: job.experience || 'Mid (3-5 yrs)',
    type: job.type || 'Full-time',
    mode: job.mode || 'Remote',
    skills: job.skills || [],
    source: job.source || 'Unknown',
    sourceUrl: job.sourceUrl || null,
    postedDate: job.postedDate,
    postedAgo: job.postedAgo || timeAgo(job.postedDate),
    description: job.description || '',
    category: job.category || 'Technology',
    isRemote: job.mode === 'Remote',
    isSaved: false,
    isApplied: false,
    applyUrl: job.applyUrl || job.sourceUrl,
  }
}

// ─── Shared utilities ─────────────────────────────────────

const COMPANY_DOMAINS = {
  'google': 'google.com', 'microsoft': 'microsoft.com', 'amazon': 'amazon.com',
  'apple': 'apple.com', 'meta': 'meta.com', 'netflix': 'netflix.com',
  'spotify': 'spotify.com', 'uber': 'uber.com', 'airbnb': 'airbnb.com',
  'stripe': 'stripe.com', 'shopify': 'shopify.com', 'atlassian': 'atlassian.com',
  'adobe': 'adobe.com', 'salesforce': 'salesforce.com', 'oracle': 'oracle.com',
  'ibm': 'ibm.com', 'nvidia': 'nvidia.com', 'tesla': 'tesla.com',
  'github': 'github.com', 'gitlab': 'gitlab.com', 'cloudflare': 'cloudflare.com',
  'mongodb': 'mongodb.com', 'vercel': 'vercel.com', 'figma': 'figma.com',
  'discord': 'discord.com', 'zoom': 'zoom.us', 'slack': 'slack.com',
  'infosys': 'infosys.com', 'tcs': 'tcs.com', 'wipro': 'wipro.com',
  'razorpay': 'razorpay.com', 'flipkart': 'flipkart.com', 'freshworks': 'freshworks.com',
  'swiggy': 'swiggy.com', 'zoho': 'zoho.com', 'phonepe': 'phonepe.com', 'paytm': 'paytm.com',
  'zomato': 'zomato.com', 'ola': 'ola.com', 'meesho': 'meesho.com',
}

export function getCompanyLogo(companyName) {
  if (!companyName) return null
  const lower = companyName.toLowerCase().trim()
  for (const [key, domain] of Object.entries(COMPANY_DOMAINS)) {
    if (lower.includes(key)) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
  }
  const guess = lower.replace(/[^a-z0-9]/g, '')
  if (guess.length > 2) {
    return `https://www.google.com/s2/favicons?domain=${guess}.com&sz=128`
  }
  return null
}

export function getCompanyInitials(companyName) {
  if (!companyName) return '?'
  const words = companyName.trim().split(/\s+/)
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : companyName.substring(0, 2).toUpperCase()
}

function detectExperience(text) {
  if (!text) return 'Mid (3-5 yrs)'
  const l = text.toLowerCase()
  if (l.includes('senior') || l.includes('lead') || l.includes('principal')) return 'Senior (5-8 yrs)'
  if (l.includes('junior') || l.includes('entry')) return 'Junior (1-3 yrs)'
  if (l.includes('intern') || l.includes('fresher')) return 'Fresher'
  if (l.includes('manager') || l.includes('director')) return 'Lead (8+ yrs)'
  return 'Mid (3-5 yrs)'
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently'
  const diffDays = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  if (isNaN(diffDays) || diffDays < 0) return 'Recently'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

/**
 * Smart client-side search with multi-keyword, partial, and alias matching + relevancy scoring
 */
export function searchJobs(jobs, filters) {
  let result = jobs

  if (filters.search && filters.search.trim()) {
    const keywords = filters.search.toLowerCase().split(/[,;\s]+/).filter(Boolean)

    result = result.map(job => {
      let score = 0
      const title = (job.title || '').toLowerCase()
      const company = (job.company?.name || '').toLowerCase()
      const location = (job.location || '').toLowerCase()
      const description = (job.description || '').toLowerCase()
      const skills = (job.skills || []).map(s => s.toLowerCase())
      const allSkillsText = skills.join(' ')

      for (const kw of keywords) {
        const expanded = expandTerm(kw)
        let kwScore = 0
        for (const term of expanded) {
          if (title.includes(term)) kwScore = Math.max(kwScore, 50)
          if (skills.some(s => s === term)) kwScore = Math.max(kwScore, 45)
          if (company.includes(term)) kwScore = Math.max(kwScore, 40)
          if (allSkillsText.includes(term)) kwScore = Math.max(kwScore, 35)
          if (location.includes(term)) kwScore = Math.max(kwScore, 30)
          if (description.includes(term)) kwScore = Math.max(kwScore, 10)
        }
        score += kwScore
      }
      return { ...job, _relevancy: score }
    }).filter(j => j._relevancy > 0)
      .sort((a, b) => b._relevancy - a._relevancy)
  }

  // Mode filter
  if (filters.mode && filters.mode !== 'All') {
    result = result.filter(j => j.mode === filters.mode)
  }
  // Type filter
  if (filters.type && filters.type !== 'All') {
    result = result.filter(j => j.type === filters.type)
  }
  // Experience filter
  if (filters.experience && filters.experience !== 'All') {
    result = result.filter(j => j.experience === filters.experience)
  }
  // Source filter
  if (filters.source && filters.source !== 'All') {
    result = result.filter(j => j.source === filters.source)
  }

  return result
}

/**
 * Paginate results
 */
export function paginateResults(jobs, page = 1, perPage = 12) {
  const start = (page - 1) * perPage
  return {
    data: jobs.slice(start, start + perPage),
    total: jobs.length,
    page,
    perPage,
    totalPages: Math.ceil(jobs.length / perPage),
  }
}
