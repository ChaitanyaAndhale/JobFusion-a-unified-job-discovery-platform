/**
 * @deprecated This file is kept as a fallback reference only.
 * All dashboard stats, job matches, and analytics now come from real API endpoints:
 * - /api/dashboard/stats — real-time dashboard analytics
 * - /api/resume/insights — AI resume match report
 * - /api/matches — AI-matched jobs
 * - /api/jobs/apply — application tracking
 */
// Realistic mock data for JobFusion (FALLBACK ONLY)

const companyLogos = {
  Google: '🔵',
  Microsoft: '🟦',
  Amazon: '🟠',
  Apple: '⚫',
  Meta: '🔷',
  Netflix: '🔴',
  Spotify: '🟢',
  Uber: '⬛',
  Airbnb: '🩷',
  Stripe: '🟣',
  Slack: '🟡',
  Shopify: '🟩',
  Atlassian: '🔵',
  Razorpay: '💙',
  Flipkart: '💛',
  Swiggy: '🧡',
  Zomato: '❤️',
  Infosys: '🔷',
  TCS: '💜',
  Wipro: '🌸',
  Paytm: '💠',
  PhonePe: '💜',
  Freshworks: '💚',
  Zoho: '🔴',
}

const locations = [
  'Bangalore, India', 'Mumbai, India', 'Hyderabad, India', 'Pune, India',
  'Delhi NCR, India', 'Chennai, India', 'Remote', 'Gurgaon, India',
  'San Francisco, USA', 'New York, USA', 'London, UK', 'Berlin, Germany',
  'Singapore', 'Toronto, Canada', 'Sydney, Australia',
]

const skills = [
  ['React', 'Node.js', 'TypeScript', 'MongoDB'],
  ['Python', 'Django', 'PostgreSQL', 'Redis'],
  ['Java', 'Spring Boot', 'MySQL', 'AWS'],
  ['React', 'Next.js', 'GraphQL', 'Prisma'],
  ['Python', 'Machine Learning', 'TensorFlow', 'NumPy'],
  ['Go', 'Kubernetes', 'Docker', 'gRPC'],
  ['Flutter', 'Dart', 'Firebase', 'REST API'],
  ['React Native', 'TypeScript', 'Redux', 'GraphQL'],
  ['Angular', 'TypeScript', 'RxJS', 'NgRx'],
  ['Vue.js', 'Nuxt.js', 'Vuex', 'Tailwind CSS'],
  ['Rust', 'WebAssembly', 'System Design', 'C++'],
  ['Swift', 'iOS', 'UIKit', 'SwiftUI'],
  ['Kotlin', 'Android', 'Jetpack Compose', 'Firebase'],
  ['DevOps', 'CI/CD', 'Jenkins', 'Terraform'],
  ['Data Science', 'SQL', 'Tableau', 'Apache Spark'],
]

const jobTitles = [
  'Senior Frontend Developer',
  'Full Stack Engineer',
  'Backend Developer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'React Developer',
  'Python Developer',
  'Java Developer',
  'iOS Developer',
  'Android Developer',
  'Cloud Architect',
  'Data Scientist',
  'Product Manager',
  'UI/UX Designer',
  'Software Engineer',
  'SDE-II',
  'SDE-III',
  'Technical Lead',
  'Engineering Manager',
  'Staff Engineer',
  'Mobile Developer',
  'Site Reliability Engineer',
  'Security Engineer',
  'Blockchain Developer',
  'AI Research Engineer',
  'QA Automation Engineer',
  'Platform Engineer',
  'Solutions Architect',
  'Frontend Engineer',
  'Backend Engineer',
]

const companies = Object.keys(companyLogos)
const sources = ['LinkedIn', 'Naukri', 'Indeed', 'Internshala', 'Glassdoor', 'AngelList']
const types = ['Full-time', 'Part-time', 'Contract', 'Internship']
const modes = ['Remote', 'On-site', 'Hybrid']
const experiences = ['Fresher', '1-3 years', '3-5 years', '5-8 years', '8+ years']

function generateSalary(exp) {
  const ranges = {
    'Fresher': [300000, 600000],
    '1-3 years': [500000, 1200000],
    '3-5 years': [1000000, 2000000],
    '5-8 years': [1800000, 3500000],
    '8+ years': [3000000, 6000000],
  }
  const [min, max] = ranges[exp] || [500000, 1500000]
  const salary = Math.floor(Math.random() * (max - min) + min)
  return {
    min: Math.floor(salary / 100000) * 100000,
    max: Math.floor((salary + 500000) / 100000) * 100000,
    currency: '₹',
  }
}

function formatSalary(salary) {
  if (!salary) return 'Not Disclosed'
  const minLPA = (salary.min / 100000).toFixed(1)
  const maxLPA = (salary.max / 100000).toFixed(1)
  return `${salary.currency}${minLPA}L - ${salary.currency}${maxLPA}L / yr`
}

function randomDate(daysBack = 30) {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
  return date.toISOString()
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Generate 100 mock jobs
export const mockJobs = Array.from({ length: 100 }, (_, i) => {
  const experience = randomItem(experiences)
  const company = randomItem(companies)
  const salary = generateSalary(experience)
  const postedDate = randomDate()
  const daysAgo = Math.floor((Date.now() - new Date(postedDate)) / (1000 * 60 * 60 * 24))

  return {
    id: `job-${i + 1}`,
    title: randomItem(jobTitles),
    company: {
      name: company,
      logo: companyLogos[company],
      type: randomItem(['Startup', 'MNC', 'Product-based', 'Service-based']),
    },
    location: randomItem(locations),
    salary,
    salaryText: formatSalary(salary),
    experience,
    type: randomItem(types),
    mode: randomItem(modes),
    skills: randomItem(skills),
    source: randomItem(sources),
    postedDate,
    postedAgo: daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`,
    description: `We are looking for a talented professional to join our team at ${company}. This role involves working on cutting-edge technology and collaborating with world-class engineers. You'll be building and scaling products used by millions of users worldwide.`,
    requirements: [
      `${experience === 'Fresher' ? '0' : experience.split(' ')[0]}+ years of relevant experience`,
      'Strong problem-solving and communication skills',
      'Experience with modern development tools and practices',
      'BS/MS in Computer Science or equivalent practical experience',
    ],
    isRemote: randomItem(modes) === 'Remote',
    isSaved: Math.random() > 0.85,
    isApplied: Math.random() > 0.9,
    applicants: Math.floor(Math.random() * 500) + 10,
    views: Math.floor(Math.random() * 5000) + 100,
  }
})

// Featured companies data
export const featuredCompanies = [
  { name: 'Google', logo: '🔵', openings: 245, rating: 4.5, industry: 'Technology' },
  { name: 'Microsoft', logo: '🟦', openings: 312, rating: 4.3, industry: 'Technology' },
  { name: 'Amazon', logo: '🟠', openings: 189, rating: 4.0, industry: 'E-commerce' },
  { name: 'Meta', logo: '🔷', openings: 156, rating: 4.2, industry: 'Social Media' },
  { name: 'Apple', logo: '⚫', openings: 98, rating: 4.6, industry: 'Technology' },
  { name: 'Netflix', logo: '🔴', openings: 67, rating: 4.4, industry: 'Entertainment' },
  { name: 'Stripe', logo: '🟣', openings: 82, rating: 4.7, industry: 'Fintech' },
  { name: 'Razorpay', logo: '💙', openings: 44, rating: 4.3, industry: 'Fintech' },
  { name: 'Flipkart', logo: '💛', openings: 121, rating: 4.1, industry: 'E-commerce' },
  { name: 'Freshworks', logo: '💚', openings: 55, rating: 4.2, industry: 'SaaS' },
  { name: 'Swiggy', logo: '🧡', openings: 78, rating: 3.9, industry: 'Food-tech' },
  { name: 'Spotify', logo: '🟢', openings: 34, rating: 4.5, industry: 'Entertainment' },
]

// Trending technologies
export const trendingTech = [
  { name: 'React', jobs: 2340, growth: '+12%', icon: '⚛️', color: '#61DAFB' },
  { name: 'Python', jobs: 3120, growth: '+18%', icon: '🐍', color: '#3776AB' },
  { name: 'AI/ML', jobs: 1850, growth: '+32%', icon: '🤖', color: '#FF6F61' },
  { name: 'Cloud', jobs: 2100, growth: '+22%', icon: '☁️', color: '#FF9900' },
  { name: 'Node.js', jobs: 1920, growth: '+10%', icon: '💚', color: '#339933' },
  { name: 'DevOps', jobs: 1650, growth: '+15%', icon: '🔧', color: '#326CE5' },
  { name: 'TypeScript', jobs: 1780, growth: '+25%', icon: '📘', color: '#3178C6' },
  { name: 'Go', jobs: 980, growth: '+28%', icon: '🐹', color: '#00ADD8' },
  { name: 'Rust', jobs: 520, growth: '+45%', icon: '🦀', color: '#CE422B' },
  { name: 'Kubernetes', jobs: 1200, growth: '+20%', icon: '⚓', color: '#326CE5' },
]

// Dashboard mock data
export const dashboardStats = {
  totalApplications: 24,
  savedJobs: 12,
  profileViews: 156,
  matchScore: 87,
}

export const applicationHistory = [
  { id: 1, company: 'Google', role: 'Senior Frontend Developer', status: 'interview', date: '2024-12-15', logo: '🔵' },
  { id: 2, company: 'Stripe', role: 'Full Stack Engineer', status: 'shortlisted', date: '2024-12-12', logo: '🟣' },
  { id: 3, company: 'Netflix', role: 'React Developer', status: 'applied', date: '2024-12-10', logo: '🔴' },
  { id: 4, company: 'Meta', role: 'Software Engineer', status: 'viewed', date: '2024-12-08', logo: '🔷' },
  { id: 5, company: 'Amazon', role: 'Backend Developer', status: 'rejected', date: '2024-12-05', logo: '🟠' },
  { id: 6, company: 'Razorpay', role: 'SDE-II', status: 'offered', date: '2024-12-01', logo: '💙' },
  { id: 7, company: 'Flipkart', role: 'Platform Engineer', status: 'applied', date: '2024-11-28', logo: '💛' },
  { id: 8, company: 'Freshworks', role: 'DevOps Engineer', status: 'interview', date: '2024-11-25', logo: '💚' },
]

export const chartData = {
  applicationsOverTime: [
    { month: 'Jul', count: 2 },
    { month: 'Aug', count: 5 },
    { month: 'Sep', count: 3 },
    { month: 'Oct', count: 7 },
    { month: 'Nov', count: 4 },
    { month: 'Dec', count: 8 },
  ],
  jobsByType: [
    { name: 'Full-time', value: 15 },
    { name: 'Part-time', value: 3 },
    { name: 'Contract', value: 4 },
    { name: 'Internship', value: 2 },
  ],
  skillDemand: [
    { skill: 'React', demand: 95 },
    { skill: 'Node.js', demand: 82 },
    { skill: 'Python', demand: 88 },
    { skill: 'TypeScript', demand: 78 },
    { skill: 'AWS', demand: 72 },
  ],
}

// Helper to filter jobs
export function filterJobs(jobs, filters) {
  return jobs.filter(job => {
    if (filters.search) {
      const query = filters.search.toLowerCase()
      const match = job.title.toLowerCase().includes(query) ||
        job.company.name.toLowerCase().includes(query) ||
        job.skills.some(s => s.toLowerCase().includes(query)) ||
        job.location.toLowerCase().includes(query)
      if (!match) return false
    }
    if (filters.mode && filters.mode !== 'All') {
      if (job.mode !== filters.mode) return false
    }
    if (filters.type && filters.type !== 'All') {
      if (job.type !== filters.type) return false
    }
    if (filters.experience && filters.experience !== 'All') {
      if (job.experience !== filters.experience) return false
    }
    if (filters.skills && filters.skills.length > 0) {
      const hasSkill = filters.skills.some(s => job.skills.includes(s))
      if (!hasSkill) return false
    }
    if (filters.salaryMin != null && job.salary) {
      if (job.salary.max < filters.salaryMin) return false
    }
    return true
  })
}

// Helper to paginate
export function paginateJobs(jobs, page = 1, perPage = 12) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return {
    data: jobs.slice(start, end),
    total: jobs.length,
    page,
    perPage,
    totalPages: Math.ceil(jobs.length / perPage),
  }
}
