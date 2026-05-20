import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, ArrowRight, MapPin, Briefcase, Users, TrendingUp, Zap, Globe, Star, ChevronRight, ExternalLink, Building2, Sparkles, BarChart3 } from 'lucide-react'
import { fetchAllJobs, fetchStats, fetchSuggestions, getCompanyLogo } from '../services/jobApi'
import CompanyLogo from '../components/common/CompanyLogo'

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

// Skill icons mapping for trending
const SKILL_ICONS = {
  'React': '⚛️', 'Python': '🐍', 'JavaScript': '🟨', 'TypeScript': '📘',
  'Node.js': '💚', 'Java': '☕', 'Go': '🐹', 'Rust': '🦀', 'Ruby': '💎',
  'AWS': '☁️', 'Docker': '🐳', 'Kubernetes': '⚓', 'SQL': '🗄️',
  'MongoDB': '🍃', 'PostgreSQL': '🐘', 'Redis': '🔴', 'GraphQL': '◈',
  'DevOps': '🔧', 'CI/CD': '🔄', 'Machine Learning': '🤖', 'AI': '🧠',
  'Data Science': '📊', 'Terraform': '🏗️', 'Linux': '🐧', 'Git': '📦',
  'CSS': '🎨', 'HTML': '🌐', 'Vue.js': '💚', 'Angular': '🅰️',
  'Next.js': '▲', 'Django': '🎸', 'Flask': '🧪', 'Spring': '🌱',
  'C++': '⚡', 'C#': '🟣', 'Swift': '🍎', 'Kotlin': '🟠',
  'Flutter': '🦋', 'REST API': '🔌', 'Agile': '🏃', 'Scrum': '📋',
}

// All 10 platforms we scrape
const PLATFORMS = [
  { name: 'LinkedIn', domain: 'linkedin.com' },
  { name: 'Remotive', domain: 'remotive.com' },
  { name: 'Arbeitnow', domain: 'arbeitnow.com' },
  { name: 'The Muse', domain: 'themuse.com' },
  { name: 'RemoteOK', domain: 'remoteok.com' },
  { name: 'Himalayas', domain: 'himalayas.app' },
  { name: 'FindWork', domain: 'findwork.dev' },
  { name: 'Indeed', domain: 'indeed.com' },
  { name: 'Naukri', domain: 'naukri.com' },
  { name: 'Glassdoor', domain: 'glassdoor.com' },
]

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value
    if (isNaN(num)) { setDisplay(value); return }
    let frame = 0
    const totalFrames = 40
    const timer = setInterval(() => {
      frame++
      setDisplay(Math.floor(num * (frame / totalFrames)))
      if (frame >= totalFrames) { clearInterval(timer); setDisplay(num) }
    }, 25)
    return () => clearInterval(timer)
  }, [value])
  return <>{typeof display === 'number' ? display.toLocaleString() : display}{suffix}</>
}

function HeroSection({ stats, platformStats }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e?.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      navigate(`/jobs?q=${encodeURIComponent(query)}`)
    }
  }

  const handleInput = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(val)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 250)
  }, [])

  const selectSuggestion = (text) => {
    setQuery(text)
    setShowSuggestions(false)
    navigate(`/jobs?q=${encodeURIComponent(text)}`)
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const typeIcons = { title: '💼', skill: '⚡', company: '🏢', location: '📍' }

  // Determine live/soon status from actual platform stats
  const getPlatformStatus = (name) => {
    const key = Object.keys(platformStats || {}).find(k => k.toLowerCase() === name.toLowerCase())
    return key && platformStats[key] > 0 ? 'Live' : 'Soon'
  }

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: 'var(--color-primary)' }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: 'var(--color-secondary)' }} />

      <div className="container mx-auto px-6 max-w-7xl relative z-10 py-20">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Zap size={14} /> 🇮🇳 Aggregating real jobs from {stats.activePlatforms || '6'}+ platforms
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6" style={{ color: 'var(--color-text-primary)' }}>
            Find Your Dream Job{' '}
            <span className="gradient-text">in India & Remote</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Live jobs from LinkedIn, Remotive, RemoteOK & {Math.max(0, (stats.activePlatforms || 6) - 3)} more portals. Bangalore, Pune, Mumbai, Hyderabad & Remote — all in one place.
          </motion.p>

          {/* Search with autocomplete */}
          <motion.form variants={fadeUp} onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8 relative" ref={suggestRef}>
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
              <input ref={inputRef} type="text" value={query} onChange={handleInput}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search by skill, company, location, or job title..."
                className="input pl-12 py-4 text-base rounded-2xl"
                style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}
                id="hero-search-input" autoComplete="off" />

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)' }}>
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => selectSuggestion(s.text)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                      style={{ borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <span className="text-lg">{typeIcons[s.type] || '🔍'}</span>
                      <span className="flex-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.text}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{s.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-lg rounded-2xl px-8 whitespace-nowrap" id="hero-search-btn">
              Search Jobs <ArrowRight size={18} />
            </button>
          </motion.form>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
            {['React Developer', 'Python', 'Java', 'Remote', 'Bangalore', 'DevOps', 'Fresher', 'Full Stack'].map(tag => (
              <button key={tag} onClick={() => navigate(`/jobs?q=${encodeURIComponent(tag)}`)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                {tag}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Platform logos strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 max-w-3xl mx-auto">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>Aggregating from:</span>
          {PLATFORMS.map(p => {
            const status = getPlatformStatus(p.name)
            return (
              <div key={p.name} className="flex items-center gap-2 group">
                <img src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=32`} alt={p.name}
                  className="w-5 h-5 rounded" loading="lazy" />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${status === 'Live' ? '' : 'opacity-60'}`}
                  style={{ background: status === 'Live' ? 'var(--color-success-light)' : 'var(--color-bg-tertiary)',
                    color: status === 'Live' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                  {status === 'Live' ? '● Live' : 'Soon'}
                </span>
                {status === 'Live' && platformStats?.[Object.keys(platformStats).find(k => k.toLowerCase() === p.name.toLowerCase())] > 0 && (
                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-tertiary)' }}>
                    ({platformStats[Object.keys(platformStats).find(k => k.toLowerCase() === p.name.toLowerCase())]})
                  </span>
                )}
              </div>
            )
          })}
        </motion.div>

        {/* Dynamic Stats */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { icon: <Briefcase size={20} />, value: stats.totalJobs || 0, suffix: '+', label: 'Active Jobs' },
            { icon: <Building2 size={20} />, value: stats.totalCompanies || 0, suffix: '+', label: 'Companies' },
            { icon: <Globe size={20} />, value: stats.activePlatforms || 0, suffix: '+', label: 'Platforms' },
            { icon: <TrendingUp size={20} />, value: 95, suffix: '%', label: 'Match Rate' },
          ].map((stat, i) => (
            <div key={i} className="glass text-center p-4 rounded-2xl card-hover cursor-default">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                {stat.icon}
              </div>
              <div className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function TrendingSection({ trendingSkills }) {
  const navigate = useNavigate()
  if (!trendingSkills || trendingSkills.length === 0) return null

  return (
    <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="section-title">🔥 Trending Technologies</h2>
              <p className="section-subtitle">Skills that are in highest demand right now — based on real scraped data</p>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {trendingSkills.slice(0, 10).map((tech, i) => (
              <motion.div key={tech.name} variants={fadeUp}
                onClick={() => navigate(`/jobs?q=${encodeURIComponent(tech.name)}`)}
                className="card card-hover cursor-pointer text-center group">
                <div className="text-3xl mb-3">{SKILL_ICONS[tech.name] || '💻'}</div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{tech.name}</h3>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tech.count.toLocaleString()} jobs
                </p>
                <span className="badge badge-success text-xs">Live</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FeaturedCompaniesSection({ topCompanies }) {
  const navigate = useNavigate()
  if (!topCompanies || topCompanies.length === 0) return null

  return (
    <section className="section">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="section-title">🏢 Top Hiring Companies</h2>
            <p className="section-subtitle mx-auto">Companies with the most active job listings — real-time data</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {topCompanies.map((company) => {
              const logoUrl = getCompanyLogo(company.name)
              return (
                <motion.div key={company.name} variants={fadeUp}
                  onClick={() => navigate(`/jobs?q=${encodeURIComponent(company.name)}`)}
                  className="card card-hover cursor-pointer flex flex-col items-center text-center p-6 group">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${company.name} logo`}
                      className="w-12 h-12 rounded-xl mb-3 object-contain"
                      style={{ background: 'var(--color-bg-tertiary)', padding: '6px' }}
                      loading="lazy" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center font-bold text-sm"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-bold text-sm mb-1 truncate w-full" style={{ color: 'var(--color-text-primary)' }}>{company.name}</h3>
                  <span className="badge badge-primary text-xs mt-1">{company.openings} openings</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function LiveJobsSection() {
  const navigate = useNavigate()
  const [liveJobs, setLiveJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllJobs().then(jobs => {
      setLiveJobs(jobs.slice(0, 6))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="section-title">🌍 Live Remote Jobs</h2>
              <p className="section-subtitle">Real-time listings aggregated from multiple platforms</p>
            </div>
            <button onClick={() => navigate('/jobs?mode=Remote')} className="btn btn-outline btn-sm">
              View All <ChevronRight size={16} />
            </button>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="card p-6 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-xl shimmer" />
                    <div className="flex-1 space-y-2"><div className="h-4 w-3/4 shimmer" /><div className="h-3 w-1/2 shimmer" /></div>
                  </div>
                  <div className="h-3 shimmer" /><div className="h-3 w-2/3 shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveJobs.map((job) => (
                <motion.div key={job.id} variants={fadeUp}
                  className="card card-hover cursor-pointer group">
                  <div className="flex items-start gap-3 mb-3">
                    <CompanyLogo name={job.company?.name} logo={job.company?.logo} logoUrl={job.company?.logoUrl} size={44} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{job.company?.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="badge badge-primary">{job.mode}</span>
                    <span className="badge badge-success">{job.type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#e0f2fe', color: '#0369a1' }}>{job.source}</span>
                  </div>
                  {job.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.skills.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                      <MapPin size={10} className="inline mr-1" />{job.location?.substring(0, 25)}
                    </span>
                    {job.applyUrl && (
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-semibold flex items-center gap-1"
                        style={{ color: 'var(--color-primary)' }}>
                        Apply <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

function TopLocationsSection({ topLocations }) {
  const navigate = useNavigate()
  if (!topLocations || topLocations.length === 0) return null

  const locationEmojis = {
    'Remote': '🌐', 'Worldwide': '🌍', 'India': '🇮🇳', 'Bangalore': '🏙️',
    'Mumbai': '🏙️', 'Delhi': '🏛️', 'Hyderabad': '💎', 'Pune': '🏙️',
    'Chennai': '🎵', 'USA': '🇺🇸', 'UK': '🇬🇧', 'Berlin': '🇩🇪',
    'Singapore': '🇸🇬', 'Toronto': '🇨🇦', 'Sydney': '🇦🇺', 'Europe': '🇪🇺',
  }

  return (
    <section className="section">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="section-title">📍 Top Job Locations</h2>
            <p className="section-subtitle mx-auto">Where the opportunities are — based on live job data</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {topLocations.slice(0, 10).map(loc => {
              const emoji = Object.entries(locationEmojis).find(([k]) => loc.name.toLowerCase().includes(k.toLowerCase()))?.[1] || '📍'
              return (
                <motion.div key={loc.name} variants={fadeUp}
                  onClick={() => navigate(`/jobs?q=${encodeURIComponent(loc.name)}`)}
                  className="card card-hover cursor-pointer text-center group">
                  <div className="text-2xl mb-2">{emoji}</div>
                  <h3 className="font-bold text-sm mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{loc.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{loc.count} jobs</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function CTASection() {
  const navigate = useNavigate()
  return (
    <section className="section relative overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-90" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center py-8">
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Ready to Find Your Next Role?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join thousands of professionals who found their dream job through JobFusion.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="btn btn-lg px-10 rounded-2xl font-bold" style={{ background: 'white', color: 'var(--color-primary)' }}>
              Get Started Free
            </button>
            <button onClick={() => navigate('/jobs')} className="btn btn-lg px-10 rounded-2xl font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}>
              Browse Real Jobs
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const navigate = useNavigate()
  const steps = [
    { icon: '📄', title: 'Upload Your Resume', desc: 'Upload your PDF/DOCX resume and our AI extracts skills, experience, education, and role preferences automatically.', color: '#6366f1' },
    { icon: '🧠', title: 'AI Analyzes & Matches', desc: 'Our matching engine scores every live job against your profile — skills, title, location, and experience level.', color: '#06b6d4' },
    { icon: '🎯', title: 'Get Matched Jobs', desc: 'See personalized recommendations ranked by match score. Track applications and discover skill gaps.', color: '#10b981' },
  ]

  return (
    <section className="section">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.div variants={fadeUp}>
            <h2 className="section-title">⚡ How It Works</h2>
            <p className="section-subtitle mx-auto">Three simple steps to your dream job — powered by AI matching</p>
          </motion.div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="card card-hover text-center relative overflow-hidden group cursor-default">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: step.color, transform: 'translate(30%, -30%)' }} />
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: step.color }}>
                {i + 1}
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: 'var(--color-text-primary)' }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-10">
          <button onClick={() => navigate('/profile')} className="btn btn-primary btn-lg rounded-2xl px-10">
            Upload Resume & Get Matched <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState({})
  const [platformStats, setPlatformStats] = useState({})

  useEffect(() => {
    fetchStats().then(data => {
      setStats(data)
      setPlatformStats(data.platforms || {})
    })
  }, [])

  return (
    <div>
      <HeroSection stats={stats} platformStats={platformStats} />
      <TrendingSection trendingSkills={stats.trendingSkills} />
      <FeaturedCompaniesSection topCompanies={stats.topCompanies} />
      <LiveJobsSection />
      <TopLocationsSection topLocations={stats.topLocations} />
      <HowItWorksSection />
      <CTASection />
    </div>
  )
}
