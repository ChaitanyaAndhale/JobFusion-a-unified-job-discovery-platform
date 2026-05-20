/**
 * JobFusion Scraping Backend
 * Aggregates jobs from Remotive, Arbeitnow, Indeed, LinkedIn, Naukri, Glassdoor
 * Caches results and serves via REST API
 * Includes: Auth, Resume Upload, Job Matching, Email/SMS Notifications
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import cron from 'node-cron'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { scrapeAll, getCache, getCacheStats } from './scrapers/index.js'
import { findMatchingJobs, extractSkillsFromText, analyzeResume, generateDashboardData, getResumeMatchReport, editDistance } from './services/jobMatcher.js'
import { initEmailTransport, sendJobMatchEmail, sendWelcomeEmail, sendSMSNotification } from './services/notifier.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'jobfusion-secret-key-change-in-production'

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

// Multer setup for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `resume-${Date.now()}-${file.originalname}`),
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF, DOCX, and TXT files are allowed'))
  },
})

// ─── User Store (JSON file-based for portability) ───────────
const USERS_FILE = path.join(__dirname, 'data', 'users.json')
const NOTIF_LOG_FILE = path.join(__dirname, 'data', 'notifications.json')

// Ensure data directory
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true })
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
  } catch { }
  return []
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

function loadNotifLog() {
  try {
    if (fs.existsSync(NOTIF_LOG_FILE)) return JSON.parse(fs.readFileSync(NOTIF_LOG_FILE, 'utf-8'))
  } catch { }
  return []
}

function saveNotifLog(log) {
  fs.writeFileSync(NOTIF_LOG_FILE, JSON.stringify(log, null, 2))
}

// ─── Auth Middleware ─────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

// Middleware
app.use(cors())
app.use(express.json())

// Initialize email transport
initEmailTransport()

// ═══════════════════════════════════════════════════════════
// AUTH API ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/auth/signup — Create a new account
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' })
    }

    const users = loadUsers()
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      title: 'Job Seeker',
      location: '',
      skills: [],
      resumeText: '',
      resumeFileName: '',
      resumeUploaded: false,
      experienceLevel: '',
      preferredLocation: '',
      github: '',
      linkedin: '',
      portfolio: '',
      notificationPrefs: {
        email: true,
        sms: false,
        frequency: 'daily', // 'realtime' | 'daily' | 'weekly'
        minMatchScore: 50,
      },
      savedJobsList: [],
      savedJobsCount: 0,
      appliedJobsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      profileCompletion: 25,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    saveUsers(users)

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' })

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch(() => {})

    const { password: _, ...userSafe } = newUser
    res.json({ success: true, token, user: userSafe })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /api/auth/login — Sign in
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }

    const users = loadUsers()
    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    const { password: _, ...userSafe } = user
    res.json({ success: true, token, user: userSafe })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /api/auth/google — Google OAuth sign in/up
 */
app.post('/api/auth/google', async (req, res) => {
  try {
    const { name, email, picture } = req.body
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' })
    }

    const users = loadUsers()
    let user = users.find(u => u.email === email)

    if (!user) {
      // Auto-create account for Google users
      user = {
        id: `user-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        password: '', // No password for OAuth users
        phone: '',
        title: 'Job Seeker',
        location: '',
        skills: [],
        resumeText: '',
        resumeFileName: '',
        resumeUploaded: false,
        experienceLevel: '',
        preferredLocation: '',
        avatar: picture || null,
        github: '',
        linkedin: '',
        portfolio: '',
        notificationPrefs: {
          email: true,
          sms: false,
          frequency: 'daily',
          minMatchScore: 50,
        },
        savedJobsList: [],
        savedJobsCount: 0,
        appliedJobsCount: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        profileCompletion: 25,
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      saveUsers(users)
      sendWelcomeEmail(email, user.name).catch(() => {})
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    const { password: _, ...userSafe } = user
    res.json({ success: true, token, user: userSafe })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/auth/me — Get current user profile
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const users = loadUsers()
  const user = users.find(u => u.id === req.userId)
  if (!user) return res.status(404).json({ success: false, error: 'User not found' })

  const { password: _, ...userSafe } = user
  res.json({ success: true, user: userSafe })
})

/**
 * PUT /api/profile — Update user profile
 */
app.put('/api/profile', authMiddleware, (req, res) => {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === req.userId)
  if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' })

  const updates = req.body
  // Don't allow overwriting critical fields
  delete updates.id
  delete updates.password
  delete updates.email
  delete updates.createdAt

  users[idx] = { ...users[idx], ...updates }
  saveUsers(users)

  const { password: _, ...userSafe } = users[idx]
  res.json({ success: true, user: userSafe })
})

// ═══════════════════════════════════════════════════════════
// RESUME UPLOAD & PARSING (AI-Enhanced)
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/profile/resume — Upload & parse resume with full AI analysis
 */
app.post('/api/profile/resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    let resumeText = ''
    const filePath = req.file.path

    // Parse PDF
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default
        const dataBuffer = fs.readFileSync(filePath)
        const pdfData = await pdfParse(dataBuffer)
        resumeText = pdfData.text
      } catch (err) {
        console.error('PDF parse error:', err.message)
        resumeText = ''
      }
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Parse DOCX via mammoth
      try {
        const mammoth = (await import('mammoth')).default
        const result = await mammoth.extractRawText({ path: filePath })
        resumeText = result.value
      } catch (err) {
        console.error('DOCX parse error:', err.message)
        resumeText = ''
      }
    } else if (req.file.mimetype === 'text/plain') {
      resumeText = fs.readFileSync(filePath, 'utf-8')
    }

    // Full AI resume analysis
    const analysis = analyzeResume(resumeText)

    // Update user profile with analysis results
    const users = loadUsers()
    const idx = users.findIndex(u => u.id === req.userId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' })

    users[idx].resumeText = resumeText.substring(0, 8000)
    users[idx].resumeFileName = req.file.originalname
    users[idx].resumeUploaded = true
    users[idx].skills = [...new Set([...users[idx].skills, ...analysis.skills])]
    // Auto-set fields from resume analysis if not already set
    if (analysis.experienceLevel && (!users[idx].experienceLevel || users[idx].experienceLevel === '')) {
      users[idx].experienceLevel = analysis.experienceLevel
    }
    if (analysis.location && !users[idx].location) {
      users[idx].location = analysis.location
    }
    if (analysis.roles && analysis.roles.length > 0 && (!users[idx].title || users[idx].title === 'Job Seeker')) {
      // Capitalize role name
      const topRole = analysis.roles[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      users[idx].title = topRole
    }
    // Store analysis for later use
    users[idx].resumeAnalysis = {
      skills: analysis.skills,
      experienceLevel: analysis.experienceLevel,
      yearsOfExperience: analysis.yearsOfExperience,
      roles: analysis.roles,
      education: analysis.education,
      location: analysis.location,
      analyzedAt: new Date().toISOString(),
    }
    saveUsers(users)

    // Clean up uploaded file after parsing
    try { fs.unlinkSync(filePath) } catch { }

    const { password: _, ...userSafe } = users[idx]
    res.json({
      success: true,
      user: userSafe,
      extractedSkills: analysis.skills,
      analysis: users[idx].resumeAnalysis,
      message: `Resume analyzed! Found ${analysis.skills.length} skills, detected ${analysis.experienceLevel} level${analysis.roles.length > 0 ? `, best role: ${analysis.roles[0]}` : ''}.`,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════
// JOB MATCHING, DASHBOARD & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/matches — Get matched jobs for current user
 */
app.get('/api/matches', authMiddleware, (req, res) => {
  try {
    const users = loadUsers()
    const user = users.find(u => u.id === req.userId)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const allJobs = getCache()
    const threshold = parseInt(req.query.threshold || '30')
    const matches = findMatchingJobs(allJobs, user, threshold)

    res.json({
      success: true,
      matches: matches.slice(0, 50),
      total: matches.length,
      userSkills: user.skills,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/dashboard/stats — Real-time dashboard analytics
 */
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  try {
    const users = loadUsers()
    const user = users.find(u => u.id === req.userId)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const allJobs = getCache()
    const dashboard = generateDashboardData(user, allJobs)

    res.json({ success: true, ...dashboard })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/resume/insights — Detailed resume match report
 */
app.get('/api/resume/insights', authMiddleware, (req, res) => {
  try {
    const users = loadUsers()
    const user = users.find(u => u.id === req.userId)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const allJobs = getCache()
    const report = getResumeMatchReport(user, allJobs)

    res.json({ success: true, ...report })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /api/jobs/apply — Track a job application
 */
app.post('/api/jobs/apply', authMiddleware, (req, res) => {
  try {
    const { jobId, title, company, location, source, applyUrl } = req.body
    if (!jobId || !title) return res.status(400).json({ success: false, error: 'Job ID and title are required' })

    const users = loadUsers()
    const idx = users.findIndex(u => u.id === req.userId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' })

    // Initialize appliedJobs array if not exists
    if (!users[idx].appliedJobs) users[idx].appliedJobs = []

    // Check if already applied
    if (users[idx].appliedJobs.some(j => j.jobId === jobId)) {
      return res.status(409).json({ success: false, error: 'Already applied to this job' })
    }

    const application = {
      jobId,
      title,
      company: company || 'Unknown',
      location: location || '',
      source: source || 'Unknown',
      applyUrl: applyUrl || '',
      status: 'applied',
      appliedAt: new Date().toISOString(),
    }

    users[idx].appliedJobs.push(application)
    users[idx].appliedJobsCount = users[idx].appliedJobs.length
    saveUsers(users)

    const { password: _, ...userSafe } = users[idx]
    res.json({ success: true, application, user: userSafe, message: 'Application tracked!' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /api/notifications/test — Send a test notification
 */
app.post('/api/notifications/test', authMiddleware, async (req, res) => {
  try {
    const users = loadUsers()
    const user = users.find(u => u.id === req.userId)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const allJobs = getCache()
    const matches = findMatchingJobs(allJobs, user, user.notificationPrefs?.minMatchScore || 50)

    const results = { email: false, sms: false }

    if (user.notificationPrefs?.email !== false) {
      results.email = await sendJobMatchEmail(user.email, user.name, matches.slice(0, 5))
    }

    if (user.notificationPrefs?.sms && user.phone) {
      const msg = `JobFusion: ${matches.length} new jobs match your profile! Top: ${matches[0]?.title} at ${matches[0]?.company}. Check your dashboard.`
      results.sms = await sendSMSNotification(user.phone, msg)
    }

    res.json({
      success: true,
      matchCount: matches.length,
      notifications: results,
      message: results.email || results.sms
        ? `Notification sent! (${matches.length} matches found)`
        : 'No notification channel configured. Add SMTP credentials to .env',
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * Automated: Check all users for matches after each scrape
 */
async function checkAllUserMatches() {
  const users = loadUsers()
  const allJobs = getCache()
  const notifLog = loadNotifLog()

  for (const user of users) {
    if (!user.skills || user.skills.length === 0) continue
    if (!user.notificationPrefs || user.notificationPrefs.email === false) continue

    const minScore = user.notificationPrefs.minMatchScore || 50
    const matches = findMatchingJobs(allJobs, user, minScore)
    if (matches.length === 0) continue

    // Check if we already notified for these jobs recently (last 24h)
    const recentNotifs = notifLog.filter(
      n => n.userId === user.id && (Date.now() - new Date(n.sentAt).getTime()) < 24 * 60 * 60 * 1000
    )

    const notifiedJobIds = new Set(recentNotifs.flatMap(n => n.jobIds || []))
    const newMatches = matches.filter(j => !notifiedJobIds.has(j.id))

    if (newMatches.length === 0) continue

    // Send email notification
    if (user.notificationPrefs.email !== false) {
      const sent = await sendJobMatchEmail(user.email, user.name, newMatches.slice(0, 5))
      if (sent) {
        notifLog.push({
          userId: user.id,
          type: 'email',
          jobIds: newMatches.slice(0, 5).map(j => j.id),
          matchCount: newMatches.length,
          sentAt: new Date().toISOString(),
        })
      }
    }

    // Send SMS if enabled
    if (user.notificationPrefs.sms && user.phone) {
      const msg = `🚀 JobFusion: ${newMatches.length} new jobs match your skills! Top: ${newMatches[0]?.title} at ${newMatches[0]?.company}. Check your dashboard!`
      const sent = await sendSMSNotification(user.phone, msg)
      if (sent) {
        notifLog.push({
          userId: user.id,
          type: 'sms',
          matchCount: newMatches.length,
          sentAt: new Date().toISOString(),
        })
      }
    }
  }

  saveNotifLog(notifLog)
}

// ═══════════════════════════════════════════════════════════
// SMART SEARCH ENGINE
// ═══════════════════════════════════════════════════════════

// Synonym / alias map for smarter matching
const SKILL_ALIASES = {
  'js': ['javascript'], 'ts': ['typescript'], 'py': ['python'],
  'react': ['reactjs', 'react.js'], 'node': ['nodejs', 'node.js'],
  'vue': ['vuejs', 'vue.js'], 'angular': ['angularjs'],
  'ml': ['machine learning'], 'ai': ['artificial intelligence'],
  'devops': ['dev ops', 'dev-ops'], 'k8s': ['kubernetes'],
  'aws': ['amazon web services'], 'gcp': ['google cloud'],
  'frontend': ['front end', 'front-end'], 'backend': ['back end', 'back-end'],
  'fullstack': ['full stack', 'full-stack'], 'sde': ['software development engineer'],
  'swe': ['software engineer'], 'ui': ['user interface'], 'ux': ['user experience'],
  'qa': ['quality assurance', 'testing'], 'db': ['database'],
  'postgres': ['postgresql'], 'mongo': ['mongodb'],
}

function expandQuery(term) {
  const t = term.toLowerCase().trim()
  const expanded = [t]
  for (const [alias, targets] of Object.entries(SKILL_ALIASES)) {
    if (t === alias) expanded.push(...targets)
    if (targets.includes(t)) expanded.push(alias)
  }
  return expanded
}

function scoreJob(job, keywords) {
  if (!keywords || keywords.length === 0) return 1
  let score = 0
  const title = (job.title || '').toLowerCase()
  const company = (job.company || '').toLowerCase()
  const location = (job.location || '').toLowerCase()
  const description = (job.description || '').toLowerCase()
  const category = (job.category || '').toLowerCase()
  const skills = (job.skills || []).map(s => s.toLowerCase())
  const allSkillsText = skills.join(' ')

  for (const kw of keywords) {
    const expanded = expandQuery(kw)
    let kwScore = 0
    for (const term of expanded) {
      // Exact title match (highest)
      if (title.includes(term)) kwScore = Math.max(kwScore, 50)
      // Title word boundary match
      if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(title)) kwScore = Math.max(kwScore, 55)
      // Skill exact match
      if (skills.some(s => s === term)) kwScore = Math.max(kwScore, 45)
      // Skill partial match
      if (allSkillsText.includes(term)) kwScore = Math.max(kwScore, 35)
      // Company match
      if (company.includes(term)) kwScore = Math.max(kwScore, 40)
      // Location match
      if (location.includes(term)) kwScore = Math.max(kwScore, 30)
      // Category match
      if (category.includes(term)) kwScore = Math.max(kwScore, 25)
      // Description match (lowest)
      if (description.includes(term)) kwScore = Math.max(kwScore, 10)
    }
    // Fuzzy / typo-tolerant matching (if no exact match found)
    if (kwScore === 0 && kw.length > 3) {
      // Check title words for fuzzy match
      const titleWords = title.split(/[\s,\-\/]+/).filter(w => w.length > 2)
      for (const tw of titleWords) {
        if (editDistance(kw, tw) <= 2) { kwScore = Math.max(kwScore, 30); break }
      }
      // Check skills for fuzzy match
      if (kwScore === 0) {
        for (const sk of skills) {
          if (editDistance(kw, sk) <= 2) { kwScore = Math.max(kwScore, 25); break }
        }
      }
      // Check company for fuzzy match
      if (kwScore === 0 && editDistance(kw, company) <= 2) kwScore = 20
    }
    score += kwScore
  }
  return score
}

// ═══════════════════════════════════════════════════════════
// JOB API ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/jobs — Smart search with multi-keyword relevancy scoring
 */
app.get('/api/jobs', (req, res) => {
  try {
    let jobs = getCache()
    const { q, source, mode, type, experience, page = 1, limit = 20 } = req.query

    // Smart multi-keyword search with relevancy scoring
    if (q && q.trim()) {
      const keywords = q.toLowerCase().split(/[,;\s]+/).filter(Boolean)
      const scored = jobs.map(job => ({ ...job, _score: scoreJob(job, keywords) }))
      jobs = scored.filter(j => j._score > 0).sort((a, b) => b._score - a._score)
    }

    // Source filter
    if (source && source !== 'All') {
      jobs = jobs.filter(j => j.source === source)
    }
    // Mode filter
    if (mode && mode !== 'All') {
      jobs = jobs.filter(j => j.mode === mode)
    }
    // Type filter
    if (type && type !== 'All') {
      jobs = jobs.filter(j => j.type === type)
    }
    // Experience filter
    if (experience && experience !== 'All') {
      jobs = jobs.filter(j => j.experience === experience)
    }

    // Pagination
    const p = parseInt(page)
    const l = parseInt(limit)
    const start = (p - 1) * l
    const paginated = jobs.slice(start, start + l)

    res.json({
      success: true,
      data: paginated,
      meta: {
        total: jobs.length,
        page: p,
        limit: l,
        totalPages: Math.ceil(jobs.length / l),
        sources: getCacheStats(),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/jobs/suggestions — Autocomplete suggestions from real data
 */
app.get('/api/jobs/suggestions', (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 2) return res.json({ success: true, suggestions: [] })
    const query = q.toLowerCase().trim()
    const jobs = getCache()
    const seen = new Set()
    const suggestions = []

    // Title suggestions
    for (const job of jobs) {
      if (suggestions.length >= 10) break
      const t = job.title || ''
      if (t.toLowerCase().includes(query) && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase())
        suggestions.push({ text: t, type: 'title' })
      }
    }
    // Skill suggestions
    const skillSet = new Set()
    jobs.forEach(j => (j.skills || []).forEach(s => skillSet.add(s)))
    for (const s of skillSet) {
      if (suggestions.length >= 15) break
      if (s.toLowerCase().includes(query) && !seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase())
        suggestions.push({ text: s, type: 'skill' })
      }
    }
    // Company suggestions
    const compSet = new Set()
    jobs.forEach(j => { if (j.company) compSet.add(j.company) })
    for (const c of compSet) {
      if (suggestions.length >= 18) break
      if (c.toLowerCase().includes(query) && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase())
        suggestions.push({ text: c, type: 'company' })
      }
    }
    // Location suggestions
    const locSet = new Set()
    jobs.forEach(j => { if (j.location) locSet.add(j.location) })
    for (const l of locSet) {
      if (suggestions.length >= 20) break
      if (l.toLowerCase().includes(query) && !seen.has(l.toLowerCase())) {
        seen.add(l.toLowerCase())
        suggestions.push({ text: l, type: 'location' })
      }
    }

    res.json({ success: true, suggestions })
  } catch (err) {
    res.status(500).json({ success: false, suggestions: [] })
  }
})

/**
 * GET /api/jobs/stats — Dynamic platform statistics computed from real data
 */
app.get('/api/jobs/stats', (req, res) => {
  const stats = getCacheStats()
  const jobs = getCache()

  // Count unique companies
  const companies = new Set()
  jobs.forEach(j => { if (j.company) companies.add(j.company.toLowerCase().trim()) })

  // Count active platforms
  const activePlatforms = Object.values(stats).filter(c => c > 0).length

  // Skill frequency for trending (filter out generic/non-technical words)
  const genericWords = new Set(['support', 'technical', 'growth', 'manager', 'training', 'remote', 'senior', 'junior', 'lead', 'staff', 'intern', 'name', 'marketing and communication', 'other', 'software', 'design', 'saas', 'it', 'system', 'data', 'engineering', 'development', 'analytics', 'sales', 'operations', 'product', 'consulting', 'finance', 'full-time', 'part-time', 'contract', 'hybrid', 'onsite', 'on-site'])
  const skillCount = {}
  jobs.forEach(j => (j.skills || []).forEach(s => {
    const norm = s.trim()
    if (norm && norm.length > 1 && !genericWords.has(norm.toLowerCase())) skillCount[norm] = (skillCount[norm] || 0) + 1
  }))
  const trendingSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // Location frequency
  const locCount = {}
  jobs.forEach(j => {
    const loc = (j.location || 'Unknown').split(',')[0].trim()
    if (loc && loc.length > 1) locCount[loc] = (locCount[loc] || 0) + 1
  })
  const topLocations = Object.entries(locCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // Company job counts (filter out garbage names < 3 chars or "name")
  const companyJobCount = {}
  jobs.forEach(j => {
    const c = (j.company || '').trim()
    if (c && c.length > 2 && c.toLowerCase() !== 'name') companyJobCount[c] = (companyJobCount[c] || 0) + 1
  })
  const topCompanies = Object.entries(companyJobCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, openings: count }))

  // Mode distribution
  const modeDist = {}
  jobs.forEach(j => { const m = j.mode || 'Unknown'; modeDist[m] = (modeDist[m] || 0) + 1 })

  // Type distribution
  const typeDist = {}
  jobs.forEach(j => { const t = j.type || 'Unknown'; typeDist[t] = (typeDist[t] || 0) + 1 })

  res.json({
    success: true,
    totalJobs: jobs.length,
    totalCompanies: companies.size,
    activePlatforms,
    platforms: stats,
    trendingSkills,
    topLocations,
    topCompanies,
    modeDistribution: modeDist,
    typeDistribution: typeDist,
    lastUpdated: global.__lastScrapeTime || new Date().toISOString(),
  })
})

/**
 * POST /api/jobs/refresh - Trigger manual re-scrape
 */
app.post('/api/jobs/refresh', async (req, res) => {
  try {
    console.log('🔄 Manual refresh triggered...')
    await scrapeAll()
    res.json({
      success: true,
      message: 'Scrape completed',
      stats: getCacheStats(),
      totalJobs: getCache().length,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/jobs/sources - List all available sources
 */
app.get('/api/jobs/sources', (req, res) => {
  const stats = getCacheStats()
  res.json({
    success: true,
    sources: Object.entries(stats).map(([name, count]) => ({
      name,
      count,
      status: count > 0 ? 'live' : 'error',
    })),
  })
})

// ─── Serve frontend in production ──────────────────────────

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(frontendDist))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'))
  }
})

// ─── Scheduler ──────────────────────────────────────────

// Scrape every 15 minutes to catch new jobs quickly
cron.schedule('*/15 * * * *', async () => {
  console.log('⏰ Scheduled scrape running...')
  await scrapeAll()
  // Check for job matches after each scrape
  console.log('🔔 Checking user job matches...')
  await checkAllUserMatches()
})

// ─── Start ──────────────────────────────────────────────

async function boot() {
  console.log('🚀 JobFusion Backend starting...')
  console.log('📡 Running initial scrape from all platforms...')
  await scrapeAll()

  // Check matches after initial scrape
  setTimeout(() => checkAllUserMatches(), 5000)

  app.listen(PORT, () => {
    console.log(`\n✅ JobFusion API running at http://localhost:${PORT}`)
    console.log(`📊 ${getCache().length} jobs loaded from ${Object.keys(getCacheStats()).length} platforms`)
    console.log(`🔄 Auto-refresh every 15 minutes`)
    console.log(`🔔 Job match notifications enabled\n`)
  })
}

boot().catch(err => {
  console.error('❌ Failed to start:', err)
  process.exit(1)
})
