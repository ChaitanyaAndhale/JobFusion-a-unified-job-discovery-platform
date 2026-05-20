/**
 * Shared utilities for all scrapers
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

export function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

export function getHeaders() {
  return {
    'User-Agent': randomUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  }
}

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

export function detectExperience(text) {
  if (!text) return 'Mid (3-5 yrs)'
  const l = text.toLowerCase()
  if (l.includes('senior') || l.includes('lead') || l.includes('principal') || l.includes('staff') || l.includes('sr.') || l.includes('sr ')) return 'Senior (5-8 yrs)'
  if (l.includes('junior') || l.includes('entry') || l.includes('associate') || l.includes('jr.') || l.includes('jr ')) return 'Junior (1-3 yrs)'
  if (l.includes('intern') || l.includes('fresher') || l.includes('trainee') || l.includes('graduate')) return 'Fresher'
  if (l.includes('manager') || l.includes('director') || l.includes('head') || l.includes('vp') || l.includes('architect')) return 'Lead (8+ yrs)'
  return 'Mid (3-5 yrs)'
}

export function detectWorkMode(text) {
  if (!text) return 'Remote'
  const l = text.toLowerCase()
  if (l.includes('remote') || l.includes('anywhere') || l.includes('worldwide') || l.includes('work from home') || l.includes('wfh')) return 'Remote'
  if (l.includes('hybrid') || l.includes('flexible')) return 'Hybrid'
  if (l.includes('on-site') || l.includes('onsite') || l.includes('office') || l.includes('in-person')) return 'On-site'
  return 'On-site'
}

export function extractSkills(text) {
  if (!text) return []
  const cleanText = text.replace(/<[^>]+>/g, ' ').toLowerCase()
  const knownSkills = [
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
  ]
  const found = knownSkills.filter(skill => {
    const lower = skill.toLowerCase()
    return cleanText.includes(lower) || cleanText.includes(lower.replace(/[.\s]/g, ''))
  })
  return [...new Set(found)].slice(0, 6)
}

export function getCompanyLogo(companyName) {
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
  }

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

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
