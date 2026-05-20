// Constants used throughout the application

export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']

export const EXPERIENCE_LEVELS = ['Fresher', 'Junior (1-3 yrs)', 'Mid (3-5 yrs)', 'Senior (5-8 yrs)', 'Lead (8+ yrs)']

export const WORK_MODES = ['Remote', 'On-site', 'Hybrid']

export const SALARY_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '₹0-3 LPA', min: 0, max: 300000 },
  { label: '₹3-6 LPA', min: 300000, max: 600000 },
  { label: '₹6-10 LPA', min: 600000, max: 1000000 },
  { label: '₹10-15 LPA', min: 1000000, max: 1500000 },
  { label: '₹15-25 LPA', min: 1500000, max: 2500000 },
  { label: '₹25+ LPA', min: 2500000, max: Infinity },
]

export const TECH_SKILLS = [
  'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java', 'Spring Boot',
  'TypeScript', 'JavaScript', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
  'Kubernetes', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native',
  'Machine Learning', 'AI', 'DevOps', 'Data Science', 'Blockchain',
  'Cybersecurity', 'Cloud Computing', 'Next.js', 'GraphQL', 'Redis',
]

export const COMPANY_TYPES = ['Startup', 'MNC', 'Product-based', 'Service-based', 'Government']

export const APPLICATION_STATUSES = [
  { value: 'applied', label: 'Applied', color: 'primary' },
  { value: 'viewed', label: 'Viewed', color: 'secondary' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'success' },
  { value: 'interview', label: 'Interview', color: 'warning' },
  { value: 'offered', label: 'Offered', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'danger' },
]

export const SOURCE_PLATFORMS = [
  { name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  { name: 'Naukri', color: '#4A90D9', icon: '🔍' },
  { name: 'Indeed', color: '#2164F3', icon: '📋' },
  { name: 'Internshala', color: '#00A5EC', icon: '🎓' },
  { name: 'Glassdoor', color: '#0CAA41', icon: '🏢' },
  { name: 'AngelList', color: '#000000', icon: '🚀' },
]

export const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/jobs', label: 'Find Jobs' },
  { path: '/dashboard', label: 'Dashboard' },
]
