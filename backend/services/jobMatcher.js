/**
 * JobFusion — AI-Powered Resume-to-Job Matching Engine v2.0
 * Multi-factor intelligent matching with detailed skill analysis
 */

// ─── Skill Normalization ────────────────────────────────────
const SKILL_ALIASES = {
  'js': 'javascript', 'ts': 'typescript', 'py': 'python',
  'react.js': 'react', 'reactjs': 'react', 'react native': 'react-native',
  'node': 'node.js', 'nodejs': 'node.js', 'vue': 'vue.js', 'vuejs': 'vue.js',
  'angular.js': 'angular', 'angularjs': 'angular',
  'next': 'next.js', 'nextjs': 'next.js', 'nuxt': 'nuxt.js',
  'mongo': 'mongodb', 'pg': 'postgresql', 'postgres': 'postgresql',
  'k8s': 'kubernetes', 'k8': 'kubernetes',
  'gcp': 'google cloud', 'ml': 'machine learning', 'ai': 'artificial intelligence',
  'dl': 'deep learning', 'tf': 'tensorflow', 'cv': 'computer vision',
  'c#': 'csharp', '.net': 'dotnet', 'asp.net': 'aspnet',
  'spring': 'spring boot', 'sb': 'spring boot',
  'rn': 'react-native', 'expo': 'react-native',
  'svelte': 'sveltejs', 'sveltekit': 'sveltejs',
  'deno': 'deno.js', 'bun': 'bun.js',
  'langchain': 'langchain', 'openai': 'openai api',
  'git': 'git', 'github': 'git', 'gitlab': 'git',
  'ci/cd': 'cicd', 'devops': 'devops',
  'tableau': 'tableau', 'powerbi': 'power bi',
  'cpp': 'c++', 'cplusplus': 'c++',
  'solidity': 'solidity', 'web3': 'web3', 'ethereum': 'blockchain',
}

// ─── Comprehensive Skill List ────────────────────────────────
const KNOWN_SKILLS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust',
  'Swift', 'Kotlin', 'PHP', 'Ruby', 'Scala', 'Dart', 'R', 'MATLAB', 'Perl',
  'Shell', 'Bash', 'PowerShell', 'Elixir', 'Haskell', 'Lua', 'Julia', 'Groovy',
  // Frontend
  'React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js', 'Svelte', 'SvelteKit',
  'Remix', 'Gatsby', 'Redux', 'Zustand', 'MobX', 'Recoil', 'GraphQL',
  'Apollo', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'LESS',
  'Material UI', 'Ant Design', 'Chakra UI', 'Styled Components',
  'Framer Motion', 'Three.js', 'D3.js', 'Webpack', 'Vite', 'Babel',
  // Backend
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Spring Boot', 'Spring', 'Rails', 'Laravel', 'ASP.NET', '.NET Core',
  'Fiber', 'Echo', 'Gin', 'gRPC', 'REST API', 'GraphQL API', 'Microservices',
  'Serverless', 'WebSockets', 'Socket.io',
  // Databases
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra',
  'DynamoDB', 'Firebase', 'Supabase', 'SQLite', 'Oracle', 'MS SQL',
  'CockroachDB', 'TimescaleDB', 'InfluxDB', 'Neo4j', 'Prisma', 'TypeORM',
  'Sequelize', 'Mongoose', 'Drizzle',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
  'Jenkins', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'ArgoCD',
  'Helm', 'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'New Relic',
  'Linux', 'Nginx', 'Apache', 'Cloudflare', 'Vercel', 'Netlify', 'Heroku',
  // Mobile
  'React Native', 'Flutter', 'iOS', 'Android', 'SwiftUI', 'Jetpack Compose',
  'Expo', 'Ionic', 'Xamarin', 'Unity',
  // AI / ML / Data
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'NLP', 'Computer Vision',
  'LangChain', 'OpenAI API', 'Hugging Face', 'BERT', 'GPT', 'LLM',
  'Data Science', 'Data Engineering', 'Apache Spark', 'Hadoop', 'Kafka',
  'Airflow', 'dbt', 'Power BI', 'Tableau', 'Looker', 'Matplotlib', 'Seaborn',
  // Testing
  'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'PyTest',
  'Testing Library', 'Vitest', 'Postman',
  // Tools & Practices
  'Git', 'Agile', 'Scrum', 'Jira', 'Figma', 'Photoshop', 'UI/UX',
  'System Design', 'Data Structures', 'Algorithms', 'OOP', 'SOLID',
  'Design Patterns', 'Clean Code', 'TDD', 'BDD', 'DDD',
  // Blockchain
  'Blockchain', 'Solidity', 'Web3', 'Ethereum', 'Smart Contracts',
  // Security
  'Cybersecurity', 'Penetration Testing', 'OAuth', 'JWT', 'SSL/TLS',
  // Specializations
  'SQL', 'NoSQL', 'Microservices Architecture', 'Event-Driven Architecture',
  'API Design', 'Performance Optimization', 'SEO', 'PWA',
]

// ─── Role → Skills mapping for better title matching ────────
const ROLE_SKILL_MAP = {
  'frontend developer': ['react', 'angular', 'vue.js', 'javascript', 'typescript', 'html', 'css', 'next.js'],
  'backend developer': ['node.js', 'python', 'java', 'spring boot', 'express', 'rest api', 'sql', 'mongodb'],
  'full stack developer': ['react', 'node.js', 'javascript', 'mongodb', 'sql', 'html', 'css'],
  'react developer': ['react', 'javascript', 'typescript', 'redux', 'next.js', 'html', 'css'],
  'java developer': ['java', 'spring boot', 'sql', 'rest api', 'microservices'],
  'python developer': ['python', 'django', 'flask', 'fastapi', 'sql', 'pandas'],
  'devops engineer': ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'linux'],
  'data scientist': ['python', 'machine learning', 'pandas', 'numpy', 'tensorflow', 'sql'],
  'data engineer': ['python', 'sql', 'apache spark', 'kafka', 'airflow', 'aws'],
  'mobile developer': ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
  'cloud engineer': ['aws', 'azure', 'gcp', 'terraform', 'kubernetes', 'docker'],
  'ml engineer': ['machine learning', 'python', 'tensorflow', 'pytorch', 'deep learning'],
  'blockchain developer': ['solidity', 'web3', 'ethereum', 'javascript', 'smart contracts'],
  'sde': ['data structures', 'algorithms', 'system design', 'oop', 'sql'],
  'software engineer': ['data structures', 'algorithms', 'system design', 'oop', 'sql'],
}

// ─── Experience Keywords ────────────────────────────────────
const EXP_KEYWORDS = {
  fresher: ['fresher', 'graduate', 'graduated', 'b.tech', 'b.e.', 'btech', 'passing out', '0 year', '0-1 year', 'no experience', 'entry level'],
  junior: ['1 year', '2 year', '1-2 year', '2-3 year', 'junior', 'associate', '1+ year'],
  mid: ['3 year', '4 year', '5 year', '3-5 year', 'mid level', 'mid-level', 'intermediate'],
  senior: ['6 year', '7 year', '8 year', '5+ year', '5-8 year', 'senior', 'sr.', 'expert'],
  lead: ['lead', 'principal', 'architect', 'tech lead', 'manager', '10+ year', '8+ year', 'director'],
}

// ─── Common Indian/Global Education Keywords ────────────────
const EDU_KEYWORDS = ['b.tech', 'btech', 'b.e', 'be ', 'm.tech', 'mtech', 'mca', 'bca', 'bsc', 'msc',
  'computer science', 'information technology', 'it ', 'software engineering',
  'electronics', 'electrical', 'mechanical', 'civil', 'iit', 'nit', 'bits',
  'bachelor', 'master', 'phd', 'degree', 'diploma', 'pgdca', 'mba']

function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim()
  return SKILL_ALIASES[lower] || lower
}

/**
 * Advanced AI-like resume text analysis
 * Extracts skills, experience level, roles, education, location
 */
export function analyzeResume(text) {
  if (!text) return { skills: [], experienceLevel: 'Mid (3-5 yrs)', roles: [], education: [], location: null, yearsOfExperience: null }

  const lower = text.toLowerCase()

  // ── Extract Skills ─────────────────────────────────────
  const foundSkills = KNOWN_SKILLS.filter(skill => {
    const pattern = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${pattern}\\b`, 'i').test(lower)
  })

  // ── Detect Experience Level ────────────────────────────
  let experienceLevel = 'Mid (3-5 yrs)'
  let yearsOfExperience = null

  // Try to find explicit year mentions
  const yearMatches = lower.match(/(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp)/g) || []
  if (yearMatches.length > 0) {
    const nums = yearMatches.map(m => parseFloat(m.match(/[\d.]+/)?.[0] || 0))
    yearsOfExperience = Math.max(...nums)
    if (yearsOfExperience === 0 || lower.includes('fresher') || lower.includes('0 year')) experienceLevel = 'Fresher'
    else if (yearsOfExperience <= 2) experienceLevel = 'Junior (1-3 yrs)'
    else if (yearsOfExperience <= 5) experienceLevel = 'Mid (3-5 yrs)'
    else if (yearsOfExperience <= 8) experienceLevel = 'Senior (5-8 yrs)'
    else experienceLevel = 'Lead (8+ yrs)'
  } else {
    // Fallback: keyword scan
    if (EXP_KEYWORDS.lead.some(k => lower.includes(k))) experienceLevel = 'Lead (8+ yrs)'
    else if (EXP_KEYWORDS.senior.some(k => lower.includes(k))) experienceLevel = 'Senior (5-8 yrs)'
    else if (EXP_KEYWORDS.mid.some(k => lower.includes(k))) experienceLevel = 'Mid (3-5 yrs)'
    else if (EXP_KEYWORDS.junior.some(k => lower.includes(k))) experienceLevel = 'Junior (1-3 yrs)'
    else if (EXP_KEYWORDS.fresher.some(k => lower.includes(k))) experienceLevel = 'Fresher'
  }

  // ── Infer Likely Roles ─────────────────────────────────
  const skillSet = new Set(foundSkills.map(s => s.toLowerCase()))
  const roleScores = {}
  for (const [role, roleSkills] of Object.entries(ROLE_SKILL_MAP)) {
    const matched = roleSkills.filter(s => skillSet.has(s))
    if (matched.length > 0) roleScores[role] = matched.length / roleSkills.length
  }
  const roles = Object.entries(roleScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([role]) => role)

  // ── Extract Education ──────────────────────────────────
  const education = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (EDU_KEYWORDS.some(k => line.toLowerCase().includes(k)) && line.trim().length > 10) {
      education.push(line.trim().substring(0, 120))
      if (education.length >= 3) break
    }
  }

  // ── Extract Location ───────────────────────────────────
  const indianCities = ['bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai',
    'kolkata', 'noida', 'gurgaon', 'gurugram', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
    'kochi', 'coimbatore', 'nagpur', 'indore', 'bhopal', 'surat', 'vadodara', 'bhubaneswar',
    'thiruvananthapuram', 'vizag', 'visakhapatnam', 'remote']
  let location = null
  for (const city of indianCities) {
    if (lower.includes(city)) {
      location = city.charAt(0).toUpperCase() + city.slice(1)
      if (city === 'bengaluru') location = 'Bangalore'
      if (city === 'gurugram') location = 'Gurgaon'
      break
    }
  }

  return { skills: foundSkills, experienceLevel, yearsOfExperience, roles, education, location }
}

/**
 * Extract skills from resume text (backward compat)
 */
export function extractSkillsFromText(text) {
  return analyzeResume(text).skills
}

/**
 * AI-powered multi-factor job scoring
 * Returns 0–100 with breakdown
 */
export function scoreJobMatch(job, userProfile) {
  const userSkillsRaw = userProfile.skills || []
  const userSkillsNorm = userSkillsRaw.map(normalizeSkill)
  const jobSkillsNorm = (job.skills || []).map(normalizeSkill)

  let totalScore = 0
  const breakdown = {}

  // ── 1. Skill Match (50 pts) ─────────────────────────────
  let skillScore = 0
  if (userSkillsNorm.length > 0 && jobSkillsNorm.length > 0) {
    const exactMatches = userSkillsNorm.filter(us =>
      jobSkillsNorm.some(js => js === us || js.includes(us) || us.includes(js))
    )
    // Bonus for each extra skill match beyond first
    const ratio = exactMatches.length / Math.max(jobSkillsNorm.length, 1)
    skillScore = Math.min(50, Math.round(ratio * 50))

    // Partial fuzzy bonus
    if (exactMatches.length === 0) {
      const fuzzy = userSkillsNorm.filter(us =>
        jobSkillsNorm.some(js => editDistance(us, js) <= 2 && us.length > 3)
      )
      skillScore = Math.min(15, fuzzy.length * 5)
    }
  }
  totalScore += skillScore
  breakdown.skillMatch = skillScore

  // ── 2. Title / Role Relevance (25 pts) ──────────────────
  let titleScore = 0
  if (job.title) {
    const jobTitle = job.title.toLowerCase()

    // Check user's title
    if (userProfile.title) {
      const titleWords = userProfile.title.toLowerCase().split(/[\s,\-\/]+/).filter(w => w.length > 2)
      const hits = titleWords.filter(w => jobTitle.includes(w))
      titleScore += Math.min(15, hits.length * 5)
    }

    // Check role inference from skills
    if (userProfile.roles?.length > 0) {
      const roleHits = (userProfile.roles || []).filter(role =>
        role.split(' ').some(w => w.length > 3 && jobTitle.includes(w))
      )
      titleScore += Math.min(10, roleHits.length * 5)
    }

    // Check description for user skills
    if (job.description && userSkillsRaw.length > 0) {
      const descLower = job.description.toLowerCase()
      const descHits = userSkillsRaw.filter(s => descLower.includes(s.toLowerCase()))
      titleScore += Math.min(5, descHits.length * 2)
    }
  }
  titleScore = Math.min(25, titleScore)
  totalScore += titleScore
  breakdown.titleMatch = titleScore

  // ── 3. Experience Level (15 pts) ────────────────────────
  let expScore = 0
  if (userProfile.experienceLevel && job.experience) {
    const userExp = userProfile.experienceLevel.toLowerCase()
    const jobExp = job.experience.toLowerCase()

    if (jobExp.includes('fresher') && userExp.includes('fresher')) expScore = 15
    else if (jobExp === userExp) expScore = 15
    else {
      const EXP_LADDER = ['fresher', 'junior', 'mid', 'senior', 'lead']
      const uIdx = EXP_LADDER.findIndex(l => userExp.includes(l))
      const jIdx = EXP_LADDER.findIndex(l => jobExp.includes(l))
      if (uIdx >= 0 && jIdx >= 0) {
        const diff = Math.abs(uIdx - jIdx)
        expScore = diff === 0 ? 15 : diff === 1 ? 10 : diff === 2 ? 5 : 0
      }
    }
  } else {
    expScore = 5 // neutral
  }
  totalScore += expScore
  breakdown.experienceMatch = expScore

  // ── 4. Location Match (10 pts) ──────────────────────────
  let locScore = 0
  const jobLoc = (job.location || '').toLowerCase()
  const jobMode = (job.mode || '').toLowerCase()

  if (jobMode === 'remote') {
    locScore = 8 // remote is good for anyone
  } else if (userProfile.location) {
    const userLoc = userProfile.location.toLowerCase()
    if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc.split(',')[0])) {
      locScore = 10
    } else if (jobLoc.includes('india') && !jobLoc.includes('outside')) {
      locScore = 5
    }
  }
  totalScore += locScore
  breakdown.locationMatch = locScore

  // ── Final normalized score ───────────────────────────────
  const finalScore = Math.round(Math.min(100, totalScore))
  return { score: finalScore, breakdown }
}

/**
 * Find all jobs matching a user profile, with detailed scores
 */
export function findMatchingJobs(allJobs, userProfile, threshold = 30) {
  if (!userProfile.skills || userProfile.skills.length === 0) return []

  return allJobs
    .map(job => {
      const result = scoreJobMatch(job, userProfile)
      return { ...job, matchScore: result.score, matchBreakdown: result.breakdown }
    })
    .filter(job => job.matchScore >= threshold)
    .sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Generate skill gap analysis for a user vs. a specific job
 */
export function analyzeSkillGap(job, userProfile) {
  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase())
  const jobSkills = job.skills || []

  const matching = jobSkills.filter(s => userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)))
  const missing = jobSkills.filter(s => !userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)))

  const strengths = (userProfile.skills || []).filter(s =>
    jobSkills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
  )

  return {
    matchingSkills: matching,
    missingSkills: missing.slice(0, 8),
    strengths: strengths.slice(0, 6),
    coveragePercent: Math.round((matching.length / Math.max(jobSkills.length, 1)) * 100),
  }
}

/**
 * Generate resume insights for dashboard
 */
export function generateResumeInsights(userProfile, allJobs) {
  const skills = userProfile.skills || []
  if (skills.length === 0) return null

  const matches = findMatchingJobs(allJobs, userProfile, 20)
  const avgScore = matches.length > 0
    ? Math.round(matches.reduce((sum, j) => sum + j.matchScore, 0) / matches.length)
    : 0

  // Find most demanded skills from top matches
  const skillDemand = {}
  matches.slice(0, 50).forEach(job => {
    ;(job.skills || []).forEach(s => { skillDemand[s] = (skillDemand[s] || 0) + 1 })
  })

  const topDemandedSkills = Object.entries(skillDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count, hasIt: skills.some(s => s.toLowerCase() === skill.toLowerCase()) }))

  const missingHighDemand = topDemandedSkills.filter(s => !s.hasIt).slice(0, 5)

  // Category breakdown
  const categoryCount = {}
  matches.forEach(j => { const cat = j.category || 'Other'; categoryCount[cat] = (categoryCount[cat] || 0) + 1 })
  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Strongest skills: user skills that appear most in matched jobs
  const strongSkills = skills.filter(s =>
    matches.some(j => (j.skills || []).some(js => js.toLowerCase() === s.toLowerCase()))
  ).slice(0, 6)

  return {
    totalMatches: matches.length,
    avgMatchScore: avgScore,
    topMatches: matches.slice(0, 5),
    missingHighDemandSkills: missingHighDemand,
    topDemandedSkills,
    strongSkills,
    topCategories,
    profileStrength: Math.min(100, skills.length * 8 + (userProfile.title ? 10 : 0) + (userProfile.location ? 5 : 0) + (userProfile.resumeUploaded ? 15 : 0)),
  }
}

/**
 * Generate full dashboard data from real jobs + user profile
 */
export function generateDashboardData(userProfile, allJobs) {
  const skills = userProfile.skills || []
  const matches = findMatchingJobs(allJobs, userProfile, 20)
  const appliedJobs = userProfile.appliedJobs || []
  const savedJobs = userProfile.savedJobsList || []

  // Average match score
  const avgScore = matches.length > 0
    ? Math.round(matches.reduce((s, j) => s + j.matchScore, 0) / matches.length)
    : 0

  // Skill demand chart: top skills from matched jobs, annotated with user coverage
  const skillDemand = {}
  matches.slice(0, 100).forEach(job => {
    ;(job.skills || []).forEach(s => {
      const norm = s.trim()
      if (norm && norm.length > 1) skillDemand[norm] = (skillDemand[norm] || 0) + 1
    })
  })
  const skillDemandChart = Object.entries(skillDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({
      skill,
      demand: count,
      hasSkill: skills.some(s => s.toLowerCase() === skill.toLowerCase()),
    }))

  // Job type distribution from matches
  const typeDist = {}
  matches.forEach(j => { const t = j.type || 'Unknown'; typeDist[t] = (typeDist[t] || 0) + 1 })
  const jobTypeChart = Object.entries(typeDist)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Mode distribution
  const modeDist = {}
  matches.forEach(j => { const m = j.mode || 'Unknown'; modeDist[m] = (modeDist[m] || 0) + 1 })
  const jobModeChart = Object.entries(modeDist)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Application timeline (group applied jobs by month)
  const monthCounts = {}
  appliedJobs.forEach(app => {
    const d = new Date(app.appliedAt || app.date || Date.now())
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    monthCounts[key] = (monthCounts[key] || 0) + 1
  })
  // If no applications, show empty but with current month
  if (Object.keys(monthCounts).length === 0) {
    const now = new Date()
    monthCounts[now.toLocaleString('default', { month: 'short', year: '2-digit' })] = 0
  }
  const applicationTimeline = Object.entries(monthCounts).map(([month, count]) => ({ month, count }))

  // Match score distribution
  const scoreBuckets = { '90-100': 0, '70-89': 0, '50-69': 0, '30-49': 0 }
  matches.forEach(j => {
    if (j.matchScore >= 90) scoreBuckets['90-100']++
    else if (j.matchScore >= 70) scoreBuckets['70-89']++
    else if (j.matchScore >= 50) scoreBuckets['50-69']++
    else scoreBuckets['30-49']++
  })
  const scoreDistribution = Object.entries(scoreBuckets).map(([range, count]) => ({ range, count }))

  // Profile strength
  let profileStrength = 0
  if (userProfile.name) profileStrength += 15
  if (userProfile.title && userProfile.title !== 'Job Seeker') profileStrength += 10
  if (userProfile.location) profileStrength += 10
  if (skills.length > 0) profileStrength += 20
  if (userProfile.github || userProfile.linkedin || userProfile.portfolio) profileStrength += 10
  if (userProfile.resumeUploaded) profileStrength += 20
  if (userProfile.phone) profileStrength += 10
  if (userProfile.experienceLevel) profileStrength += 5
  profileStrength = Math.min(100, profileStrength)

  return {
    stats: {
      totalApplications: appliedJobs.length,
      savedJobs: savedJobs.length,
      resumeMatches: matches.length,
      avgMatchScore: avgScore,
      profileStrength,
    },
    skillDemandChart,
    jobTypeChart,
    jobModeChart,
    applicationTimeline,
    scoreDistribution,
    topMatches: matches.slice(0, 8),
    appliedJobs: appliedJobs.slice(0, 15),
  }
}

/**
 * Generate detailed resume match report
 */
export function getResumeMatchReport(userProfile, allJobs) {
  const analysis = analyzeResume(userProfile.resumeText || '')
  const matches = findMatchingJobs(allJobs, userProfile, 20)
  const insights = generateResumeInsights(userProfile, allJobs)

  // Best matching categories
  const catScores = {}
  matches.forEach(j => {
    const cat = j.category || 'General'
    if (!catScores[cat]) catScores[cat] = { total: 0, count: 0 }
    catScores[cat].total += j.matchScore
    catScores[cat].count++
  })
  const bestCategories = Object.entries(catScores)
    .map(([cat, data]) => ({ category: cat, avgScore: Math.round(data.total / data.count), jobCount: data.count }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)

  // Improvement suggestions
  const suggestions = []
  if (!userProfile.resumeUploaded) suggestions.push('Upload your resume for AI-powered job matching')
  if ((userProfile.skills || []).length < 5) suggestions.push('Add more skills to improve match accuracy')
  if (!userProfile.location) suggestions.push('Set your preferred location for location-based matching')
  if (!userProfile.experienceLevel || userProfile.experienceLevel === '') suggestions.push('Set your experience level for better job recommendations')
  if (!userProfile.title || userProfile.title === 'Job Seeker') suggestions.push('Add your professional title (e.g., "Full Stack Developer")')
  if (!userProfile.github && !userProfile.linkedin) suggestions.push('Add GitHub/LinkedIn links to boost your profile')
  if (insights?.missingHighDemandSkills?.length > 0) {
    const missing = insights.missingHighDemandSkills.map(s => s.skill).slice(0, 3).join(', ')
    suggestions.push(`Learn in-demand skills: ${missing}`)
  }

  return {
    analysis: {
      skills: analysis.skills,
      experienceLevel: analysis.experienceLevel,
      yearsOfExperience: analysis.yearsOfExperience,
      roles: analysis.roles,
      education: analysis.education,
      location: analysis.location,
    },
    matchSummary: {
      totalMatches: matches.length,
      avgMatchScore: insights?.avgMatchScore || 0,
      profileStrength: insights?.profileStrength || 0,
    },
    strongSkills: insights?.strongSkills || [],
    missingSkills: (insights?.missingHighDemandSkills || []).map(s => s.skill),
    bestCategories,
    suggestions,
    topMatches: matches.slice(0, 5).map(j => ({
      id: j.id, title: j.title, company: j.company, location: j.location,
      matchScore: j.matchScore, matchBreakdown: j.matchBreakdown, skills: j.skills,
    })),
  }
}

// ─── Levenshtein Distance (for fuzzy matching) ───────────────
export function editDistance(a, b) {
  if (a === b) return 0
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i])
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : 1 + Math.min(matrix[i - 1][j - 1], matrix[i - 1][j], matrix[i][j - 1])
    }
  }
  return matrix[b.length][a.length]
}
