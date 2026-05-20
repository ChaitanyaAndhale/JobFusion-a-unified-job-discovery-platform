/**
 * Shared utilities for all scrapers — Production-Grade Anti-Bot Infrastructure
 * Features:
 *   - Dynamic rotating User-Agents via user-agents library
 *   - Rotating referrers (Google, Bing, DuckDuckGo, Yahoo, etc.)
 *   - requestWithRetry: exponential backoff + jitter on 403/406/429/timeout
 *   - Comprehensive 250+ technical skill taxonomy
 *   - Company & title normalization utilities
 */

import axios from 'axios'
import UserAgent from 'user-agents'

// ─── Dynamic User-Agent Generator ─────────────────────────────────
const uaGenerator = new UserAgent({ deviceCategory: 'desktop' })

// Fallback static UAs in case the library fails
const STATIC_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
]

export function randomUA() {
  try {
    return uaGenerator.random().toString()
  } catch {
    return STATIC_USER_AGENTS[Math.floor(Math.random() * STATIC_USER_AGENTS.length)]
  }
}

// ─── Rotating Referrers ───────────────────────────────────────────
const REFERRERS = [
  'https://www.google.com/',
  'https://www.google.co.in/',
  'https://www.bing.com/',
  'https://duckduckgo.com/',
  'https://search.yahoo.com/',
  'https://www.ecosia.org/',
  'https://www.google.com/search?q=jobs',
  'https://www.google.co.in/search?q=developer+jobs+india',
]

export function randomReferer() {
  return REFERRERS[Math.floor(Math.random() * REFERRERS.length)]
}

// ─── Accept-Language Rotation ─────────────────────────────────────
const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-IN,en;q=0.9,hi;q=0.8',
  'en-GB,en;q=0.9',
  'en-US,en;q=0.9,en-IN;q=0.8',
  'en;q=0.9',
]

// ─── sec-ch-ua Rotation (Chromium browser hints) ──────────────────
const SEC_CH_UA_LIST = [
  '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
  '"Chromium";v="125", "Google Chrome";v="125", "Not-A.Brand";v="24"',
  '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="8"',
  '"Not/A)Brand";v="8", "Chromium";v="126"',
]

// ─── Header Generation ───────────────────────────────────────────
export function getHeaders(overrides = {}) {
  const isChrome = Math.random() > 0.3 // 70% Chrome-like
  const headers = {
    'User-Agent': randomUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)],
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': randomReferer(),
    'Upgrade-Insecure-Requests': '1',
    ...overrides,
  }

  // Add Chromium-specific headers for Chrome-like UAs
  if (isChrome) {
    headers['sec-ch-ua'] = SEC_CH_UA_LIST[Math.floor(Math.random() * SEC_CH_UA_LIST.length)]
    headers['sec-ch-ua-mobile'] = '?0'
    headers['sec-ch-ua-platform'] = Math.random() > 0.5 ? '"Windows"' : '"macOS"'
    headers['Sec-Fetch-Dest'] = 'document'
    headers['Sec-Fetch-Mode'] = 'navigate'
    headers['Sec-Fetch-Site'] = 'cross-site'
    headers['Sec-Fetch-User'] = '?1'
  }

  return headers
}

export function getApiHeaders(overrides = {}) {
  return {
    'User-Agent': randomUA(),
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)],
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': randomReferer(),
    ...overrides,
  }
}

// ─── Request With Retry (Exponential Backoff + Jitter) ────────────
const RETRYABLE_STATUS = new Set([403, 406, 429, 500, 502, 503, 504])

/**
 * Make an HTTP request with automatic retry on transient failures.
 * Uses randomized exponential backoff with jitter.
 *
 * @param {string} url - The URL to request
 * @param {object} options - Axios config options
 * @param {object} retryOpts - Retry configuration
 * @param {number} retryOpts.maxRetries - Max number of retries (default: 3)
 * @param {number} retryOpts.baseDelay - Base delay in ms (default: 1500)
 * @param {string} retryOpts.label - Label for logging
 * @returns {Promise<any>} - Response data
 */
export async function requestWithRetry(url, options = {}, retryOpts = {}) {
  const { maxRetries = 3, baseDelay = 1500, label = 'Request' } = retryOpts
  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Rotate headers on each attempt to avoid fingerprinting
      const headers = options.headers || getHeaders()
      if (attempt > 0) {
        // On retries, generate completely fresh headers
        const freshHeaders = getHeaders()
        Object.assign(headers, freshHeaders)
      }

      const response = await axios({
        url,
        method: options.method || 'GET',
        headers,
        timeout: options.timeout || 15000,
        ...options,
        // Override headers with the rotated ones
        headers,
      })

      return response
    } catch (err) {
      lastError = err
      const status = err.response?.status
      const isRetryable = RETRYABLE_STATUS.has(status) ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND' ||
        err.message?.includes('timeout')

      if (!isRetryable || attempt >= maxRetries) {
        break
      }

      // Exponential backoff with jitter: baseDelay * 2^attempt + random(0..baseDelay)
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * baseDelay
      console.log(`    ⏳ ${label}: ${status || err.code || 'timeout'} — retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`)
      await sleep(delay)
    }
  }

  throw lastError
}

// ─── Time Helpers ─────────────────────────────────────────────────

export function timeAgo(dateStr) {
  if (!dateStr) return 'Recently'
  const posted = new Date(dateStr)
  const now = new Date()
  const diffMs = now - posted
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (isNaN(diffDays) || diffDays < 0) return 'Recently'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Experience Detection ─────────────────────────────────────────

export function detectExperience(text) {
  if (!text) return 'Mid (3-5 yrs)'
  const l = text.toLowerCase()
  if (l.includes('senior') || l.includes('lead') || l.includes('principal') || l.includes('staff') || l.includes('sr.') || l.includes('sr ')) return 'Senior (5-8 yrs)'
  if (l.includes('junior') || l.includes('entry') || l.includes('associate') || l.includes('jr.') || l.includes('jr ')) return 'Junior (1-3 yrs)'
  if (l.includes('intern') || l.includes('fresher') || l.includes('trainee') || l.includes('graduate')) return 'Fresher'
  if (l.includes('manager') || l.includes('director') || l.includes('head') || l.includes('vp') || l.includes('architect')) return 'Lead (8+ yrs)'
  return 'Mid (3-5 yrs)'
}

// ─── Work Mode Detection ─────────────────────────────────────────

export function detectWorkMode(text) {
  if (!text) return 'Remote'
  const l = text.toLowerCase()
  if (l.includes('remote') || l.includes('anywhere') || l.includes('worldwide') || l.includes('work from home') || l.includes('wfh')) return 'Remote'
  if (l.includes('hybrid') || l.includes('flexible')) return 'Hybrid'
  if (l.includes('on-site') || l.includes('onsite') || l.includes('office') || l.includes('in-person')) return 'On-site'
  return 'On-site'
}

// ─── Comprehensive 250+ Technical Skill Taxonomy ──────────────────

const KNOWN_SKILLS = [
  // Languages
  'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java', 'Spring Boot',
  'TypeScript', 'JavaScript', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
  'Kubernetes', 'Go', 'Golang', 'Rust', 'Swift', 'Kotlin', 'Flutter',
  'React Native', 'Machine Learning', 'TensorFlow', 'PyTorch', 'DevOps',
  'GraphQL', 'Redis', 'Next.js', 'Django', 'FastAPI', 'Ruby', 'Rails',
  'PHP', 'Laravel', 'C++', 'C#', '.NET', 'Scala', 'Terraform',
  'SQL', 'NoSQL', 'Microservices', 'CI/CD', 'Figma', 'Tailwind',
  'Firebase', 'Supabase', 'Azure', 'GCP', 'Linux', 'Git',
  'REST API', 'gRPC', 'Kafka', 'RabbitMQ', 'Elasticsearch', 'Power BI',
  'Tableau', 'Spark', 'Hadoop', 'Airflow', 'dbt', 'Snowflake',
  // Extended taxonomy
  'Express', 'Fastify', 'NestJS', 'Flask', 'ASP.NET', '.NET Core',
  'Gin', 'Fiber', 'Echo', 'Serverless', 'WebSockets', 'Socket.io',
  'MySQL', 'Cassandra', 'DynamoDB', 'SQLite', 'Oracle', 'CockroachDB',
  'Neo4j', 'InfluxDB', 'TimescaleDB', 'Prisma', 'TypeORM', 'Sequelize',
  'Mongoose', 'Drizzle',
  'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'ArgoCD',
  'Helm', 'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'ELK Stack',
  'Nginx', 'Apache', 'Cloudflare', 'Vercel', 'Netlify', 'Heroku',
  'Redux', 'Zustand', 'MobX', 'Recoil',
  'Material UI', 'Ant Design', 'Chakra UI', 'Styled Components',
  'Framer Motion', 'Three.js', 'D3.js', 'Webpack', 'Vite', 'Babel',
  'Svelte', 'SvelteKit', 'Remix', 'Gatsby', 'Apollo',
  'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap',
  'iOS', 'Android', 'SwiftUI', 'Jetpack Compose', 'Expo', 'Ionic', 'Xamarin', 'Unity',
  'Deep Learning', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV',
  'NLP', 'Computer Vision', 'LangChain', 'OpenAI API', 'Hugging Face',
  'BERT', 'GPT', 'LLM', 'Data Science', 'Data Engineering',
  'Matplotlib', 'Seaborn', 'Looker',
  'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'PyTest',
  'Testing Library', 'Vitest', 'Postman',
  'Agile', 'Scrum', 'Jira', 'Photoshop', 'UI/UX',
  'System Design', 'Data Structures', 'Algorithms', 'OOP', 'SOLID',
  'Design Patterns', 'Clean Code', 'TDD', 'BDD', 'DDD',
  'Blockchain', 'Solidity', 'Web3', 'Ethereum', 'Smart Contracts',
  'Cybersecurity', 'Penetration Testing', 'OAuth', 'JWT', 'SSL/TLS',
  'API Design', 'Performance Optimization', 'SEO', 'PWA',
  'Dart', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash', 'PowerShell',
  'Elixir', 'Haskell', 'Lua', 'Julia', 'Groovy', 'Clojure',
  'C', 'Objective-C', 'COBOL', 'Fortran',
  'Nuxt.js', 'Qwik', 'Astro', 'SolidJS', 'Alpine.js', 'HTMX',
  'Storybook', 'Turborepo', 'Nx', 'Lerna',
  'Supabase', 'Appwrite', 'PocketBase', 'Strapi', 'Sanity',
  'Pulumi', 'CDK', 'Vagrant', 'Packer',
  'OpenTelemetry', 'Jaeger', 'Zipkin', 'Sentry',
  'RxJS', 'Lodash', 'Moment.js', 'Day.js',
  'Puppeteer', 'Cheerio', 'Scrapy', 'Beautiful Soup',
  'Celery', 'Sidekiq', 'BullMQ', 'Temporal',
  'MinIO', 'S3', 'CloudFront', 'Lambda', 'ECS', 'EKS', 'Fargate',
  'BigQuery', 'Redshift', 'Databricks', 'Fivetran', 'Airbyte',
  'Twilio', 'SendGrid', 'Stripe API', 'Razorpay',
  'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Zeplin',
]

export function extractSkills(text) {
  if (!text) return []
  const cleanText = text.replace(/<[^>]+>/g, ' ').toLowerCase()
  const found = KNOWN_SKILLS.filter(skill => {
    const lower = skill.toLowerCase()
    // Use word boundary matching for short skills to avoid false positives
    if (lower.length <= 3) {
      return new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(cleanText)
    }
    return cleanText.includes(lower) || cleanText.includes(lower.replace(/[.\s]/g, ''))
  })
  return [...new Set(found)].slice(0, 8)
}

// ─── Company Name Normalization ───────────────────────────────────

const COMPANY_SUFFIXES = /\s*(\(.*?\)|\b(?:inc\.?|llc\.?|ltd\.?|corp\.?|co\.?|private\s+limited|pvt\.?\s*ltd\.?|limited|gmbh|s\.?a\.?|plc|group|technologies|technology|solutions|services|consulting|software|systems|labs?|digital|enterprises?|india|global|international)\b[.,]?\s*)+$/gi

export function normalizeCompanyName(name) {
  if (!name) return ''
  let clean = name.trim()
  // Remove corporate suffixes
  clean = clean.replace(COMPANY_SUFFIXES, '').trim()
  // Remove trailing punctuation
  clean = clean.replace(/[.,;:]+$/, '').trim()
  // Normalize whitespace
  clean = clean.replace(/\s+/g, ' ')
  // Title case
  if (clean === clean.toUpperCase() || clean === clean.toLowerCase()) {
    clean = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  return clean || name.trim()
}

// ─── Title Normalization ──────────────────────────────────────────

const TITLE_NOISE = /\s*[\(\[]\s*(remote|hybrid|on-?site|wfh|work from home|hiring|urgent|immediate\s*joiner|fte|contract|india|usa|uk|worldwide|global)\s*[\)\]]/gi
const TITLE_SUFFIX_NOISE = /\s*[-–—]\s*(remote|hybrid|india|usa|hiring now|urgent|immediate|apply now|multiple positions?)$/gi

export function normalizeTitle(title) {
  if (!title) return ''
  let clean = title.trim()
  // Strip bracketed noise tags
  clean = clean.replace(TITLE_NOISE, '')
  // Strip trailing noise after dashes
  clean = clean.replace(TITLE_SUFFIX_NOISE, '')
  // Normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim()
  return clean || title.trim()
}

// ─── Company Logo Helper ──────────────────────────────────────────

const COMPANY_DOMAINS = {
  'google': 'google.com', 'microsoft': 'microsoft.com', 'amazon': 'amazon.com',
  'apple': 'apple.com', 'meta': 'meta.com', 'netflix': 'netflix.com',
  'spotify': 'spotify.com', 'uber': 'uber.com', 'airbnb': 'airbnb.com',
  'stripe': 'stripe.com', 'shopify': 'shopify.com', 'atlassian': 'atlassian.com',
  'adobe': 'adobe.com', 'salesforce': 'salesforce.com', 'oracle': 'oracle.com',
  'ibm': 'ibm.com', 'intel': 'intel.com', 'nvidia': 'nvidia.com',
  'tesla': 'tesla.com', 'github': 'github.com', 'gitlab': 'gitlab.com',
  'twilio': 'twilio.com', 'cloudflare': 'cloudflare.com', 'mongodb': 'mongodb.com',
  'vercel': 'vercel.com', 'figma': 'figma.com', 'notion': 'notion.so',
  'canva': 'canva.com', 'hubspot': 'hubspot.com', 'dropbox': 'dropbox.com',
  'coinbase': 'coinbase.com', 'discord': 'discord.com', 'zoom': 'zoom.us',
  'slack': 'slack.com', 'infosys': 'infosys.com', 'tcs': 'tcs.com',
  'wipro': 'wipro.com', 'razorpay': 'razorpay.com', 'flipkart': 'flipkart.com',
  'swiggy': 'swiggy.com', 'zomato': 'zomato.com', 'paytm': 'paytm.com',
  'phonepe': 'phonepe.com', 'freshworks': 'freshworks.com', 'zoho': 'zoho.com',
  'toptal': 'toptal.com', 'turing': 'turing.com', 'deel': 'deel.com',
  'zapier': 'zapier.com', 'automattic': 'automattic.com', 'buffer': 'buffer.com',
  'meesho': 'meesho.com', 'ola': 'olacabs.com', 'cred': 'cred.club',
  'unacademy': 'unacademy.com', 'groww': 'groww.in', 'nykaa': 'nykaa.com',
  'dream11': 'dream11.com', 'lenskart': 'lenskart.com', 'zerodha': 'zerodha.com',
  'byju': 'byjus.com', 'bharatpe': 'bharatpe.com', 'myntra': 'myntra.com',
  'accenture': 'accenture.com', 'cognizant': 'cognizant.com', 'capgemini': 'capgemini.com',
  'hcl': 'hcltech.com', 'tech mahindra': 'techmahindra.com', 'deloitte': 'deloitte.com',
  'kpmg': 'kpmg.com', 'ey ': 'ey.com', 'pwc': 'pwc.com',
}

export function getCompanyLogo(companyName) {
  if (!companyName) return null
  const lower = companyName.toLowerCase().trim()

  for (const [key, domain] of Object.entries(COMPANY_DOMAINS)) {
    if (lower.includes(key)) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
  }

  // Guess domain from name
  const guess = lower.replace(/[^a-z0-9]/g, '')
  if (guess.length > 2) {
    return `https://www.google.com/s2/favicons?domain=${guess}.com&sz=128`
  }

  return null
}

// ─── Dedup Key Generator ──────────────────────────────────────────

/**
 * Create a normalized dedup key from title + company.
 * Strips noise, lowercases, removes extra whitespace.
 */
export function dedupKey(title, company) {
  const normTitle = normalizeTitle(title).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  const normCompany = normalizeCompanyName(company).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  return `${normTitle}@${normCompany}`
}
