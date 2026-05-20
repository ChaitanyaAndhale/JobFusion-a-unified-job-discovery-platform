import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, MapPin, Clock, Bookmark, BookmarkCheck, ExternalLink, ChevronLeft, ChevronRight, Loader2, RefreshCw, X, Sparkles } from 'lucide-react'
import { fetchAllJobs, searchJobs, paginateResults, fetchSuggestions } from '../services/jobApi'
import CompanyLogo from '../components/common/CompanyLogo'
import { JOB_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

function SourceBadge({ source }) {
  const colors = {
    'Remotive': { bg: '#e0f2fe', text: '#0369a1' },
    'Arbeitnow': { bg: '#f0fdf4', text: '#15803d' },
    'LinkedIn': { bg: '#dbeafe', text: '#1d4ed8' },
    'Indeed': { bg: '#ede9fe', text: '#6d28d9' },
    'Naukri': { bg: '#fef3c7', text: '#b45309' },
    'RemoteOK': { bg: '#fce7f3', text: '#be185d' },
    'The Muse': { bg: '#ecfdf5', text: '#059669' },
    'Himalayas': { bg: '#eff6ff', text: '#2563eb' },
    'FindWork': { bg: '#fef9c3', text: '#a16207' },
    'Glassdoor': { bg: '#f0fdf4', text: '#16a34a' },
  }
  const c = colors[source] || { bg: '#f3f4f6', text: '#4b5563' }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: c.bg, color: c.text }}>
      {source}
    </span>
  )
}

function JobCard({ job, onToggleSave }) {
  return (
    <motion.div variants={fadeUp} className="card card-hover group" id={`job-card-${job.id}`}>
      <div className="flex items-start gap-3 mb-4">
        <CompanyLogo
          name={job.company?.name}
          logo={job.company?.logo}
          logoUrl={job.company?.logoUrl}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm mb-0.5 truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</h3>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{job.company?.name}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleSave(job.id) }}
          className="p-2 rounded-lg transition-all hover:scale-110"
          style={{ color: job.isSaved ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
          {job.isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="badge badge-primary">{job.mode}</span>
        <span className="badge badge-success">{job.type}</span>
        <span className="badge" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{job.experience}</span>
      </div>

      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 4).map(skill => (
            <span key={skill} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>+{job.skills.length - 4}</span>}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location?.substring(0, 30)}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {job.postedAgo}</span>
      </div>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
          {job.salaryText || 'Not Disclosed'}
        </span>
        <div className="flex items-center gap-2">
          <SourceBadge source={job.source} />
          {job.applyUrl && (
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="btn btn-primary btn-sm text-xs px-3 py-1.5 flex items-center gap-1">
              Apply <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 shimmer" />
              <div className="h-3 w-1/2 shimmer" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 shimmer rounded-full" />
            <div className="h-6 w-20 shimmer rounded-full" />
          </div>
          <div className="h-3 w-full shimmer" />
          <div className="h-3 w-2/3 shimmer" />
        </div>
      ))}
    </div>
  )
}

export default function JobSearchPage() {
  const { user, toggleSavedJob } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [mode, setMode] = useState(searchParams.get('mode') || 'All')
  const [type, setType] = useState('All')
  const [experience, setExperience] = useState(searchParams.get('experience') || 'All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestRef = useRef(null)
  const debounceRef = useRef(null)

  // Fetch real jobs on mount
  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
    const m = searchParams.get('mode')
    if (m) setMode(m)
    const exp = searchParams.get('experience')
    if (exp) setExperience(exp)
  }, [searchParams])

  async function loadJobs() {
    setLoading(true)
    setError(null)
    try {
      const jobs = await fetchAllJobs()
      const savedIds = user?.savedJobsList?.map(j => j.id) || [];
      const jobsWithSaveStatus = jobs.map(j => ({ ...j, isSaved: savedIds.includes(j.id) }));
      setAllJobs(jobsWithSaveStatus)
    } catch (err) {
      setError('Failed to load jobs. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadJobs()
    setRefreshing(false)
  }

  // Autocomplete handler
  const handleSearchInput = useCallback((e) => {
    const val = e.target.value
    setSearch(val)
    setPage(1)
    clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(val)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 200)
  }, [])

  const selectSuggestion = (text) => {
    setSearch(text)
    setPage(1)
    setShowSuggestions(false)
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredJobs = useMemo(() => searchJobs(allJobs, { search, mode, type, experience, source: sourceFilter }), [allJobs, search, mode, type, experience, sourceFilter])
  const paginated = useMemo(() => paginateResults(filteredJobs, page, 12), [filteredJobs, page])

  const toggleSave = (id) => {
    const job = allJobs.find(j => j.id === id);
    if (!job) return;
    const isNowSaved = toggleSavedJob(job);
    if (isNowSaved !== undefined) {
      setAllJobs(prev => prev.map(j => j.id === id ? { ...j, isSaved: isNowSaved } : j))
    }
  }

  const clearFilters = () => { setSearch(''); setMode('All'); setType('All'); setExperience('All'); setSourceFilter('All'); setPage(1) }

  // Get unique sources for filter
  const availableSources = [...new Set(allJobs.map(j => j.source))].filter(Boolean)
  const activeFilterCount = [mode, type, experience, sourceFilter].filter(f => f !== 'All').length

  const typeIcons = { title: '💼', skill: '⚡', company: '🏢', location: '📍' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Search Header */}
      <div className="py-8" style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative" ref={suggestRef}>
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--color-text-tertiary)' }} />
              <input type="text" value={search} onChange={handleSearchInput}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search by skill, company, location, or job title..."
                className="input pl-11 pr-10 rounded-xl" id="jobs-search-input" autoComplete="off" />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); setSuggestions([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-bg-tertiary)]"
                  style={{ color: 'var(--color-text-tertiary)' }}>
                  <X size={16} />
                </button>
              )}

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)' }}>
                  {suggestions.slice(0, 8).map((s, i) => (
                    <button key={i} type="button" onClick={() => selectSuggestion(s.text)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                      style={{ borderBottom: i < Math.min(suggestions.length, 8) - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <span className="text-base">{typeIcons[s.type] || '🔍'}</span>
                      <span className="flex-1 font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{s.text}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize shrink-0"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{s.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="btn btn-secondary flex items-center gap-2 rounded-xl" title="Refresh from APIs">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center gap-2 rounded-xl" id="jobs-filter-toggle">
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white" style={{ background: 'var(--color-primary)' }}>{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {(search || activeFilterCount > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {search && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  <Sparkles size={12} /> "{search}"
                  <button onClick={() => { setSearch(''); setPage(1) }} className="ml-1 hover:opacity-70"><X size={12} /></button>
                </span>
              )}
              {mode !== 'All' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  {mode}
                  <button onClick={() => { setMode('All'); setPage(1) }}><X size={12} /></button>
                </span>
              )}
              {type !== 'All' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  {type}
                  <button onClick={() => { setType('All'); setPage(1) }}><X size={12} /></button>
                </span>
              )}
              {experience !== 'All' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  {experience}
                  <button onClick={() => { setExperience('All'); setPage(1) }}><X size={12} /></button>
                </span>
              )}
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[var(--color-bg-tertiary)]"
                  style={{ color: 'var(--color-primary)' }}>Clear All</button>
              )}
            </div>
          )}

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Work Mode</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', ...WORK_MODES].map(m => (
                        <button key={m} onClick={() => { setMode(m); setPage(1) }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: mode === m ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', color: mode === m ? 'white' : 'var(--color-text-secondary)' }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Job Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', ...JOB_TYPES].map(t => (
                        <button key={t} onClick={() => { setType(t); setPage(1) }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: type === t ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', color: type === t ? 'white' : 'var(--color-text-secondary)' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Experience</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', ...EXPERIENCE_LEVELS].map(e => (
                        <button key={e} onClick={() => { setExperience(e); setPage(1) }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: experience === e ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', color: experience === e ? 'white' : 'var(--color-text-secondary)' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Source Platform</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', ...availableSources].map(s => (
                        <button key={s} onClick={() => { setSourceFilter(s); setPage(1) }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: sourceFilter === s ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', color: sourceFilter === s ? 'white' : 'var(--color-text-secondary)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={clearFilters} className="btn btn-ghost btn-sm text-xs">Clear All Filters</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-6 max-w-7xl py-8">
        {loading ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Loading real jobs from multiple platforms...
              </p>
            </div>
            <LoadingSkeleton />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{error}</h3>
            <button onClick={loadJobs} className="btn btn-primary mt-4">Retry</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{filteredJobs.length}</span> real jobs from{' '}
                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{availableSources.length} platforms</span>
                {search && <> matching <span className="font-bold" style={{ color: 'var(--color-primary)' }}>"{search}"</span></>}
              </p>
              <div className="flex gap-2 flex-wrap">
                {availableSources.map(src => (
                  <button key={src} onClick={() => { setSourceFilter(src === sourceFilter ? 'All' : src); setPage(1) }}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all cursor-pointer"
                    style={{
                      background: sourceFilter === src ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                      color: sourceFilter === src ? 'white' : 'var(--color-text-secondary)'
                    }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: sourceFilter === src ? 'white' : 'var(--color-success)' }} />
                    {src}: {allJobs.filter(j => j.source === src).length}
                  </button>
                ))}
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>No jobs found</h3>
                <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Try different keywords, remove filters, or search by skill/location
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {['React', 'Python', 'Remote', 'Bangalore', 'DevOps'].map(tag => (
                    <button key={tag} onClick={() => { setSearch(tag); setPage(1) }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      Try "{tag}"
                    </button>
                  ))}
                </div>
                <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginated.data.map(job => (
                    <JobCard key={job.id} job={job} onToggleSave={toggleSave} />
                  ))}
                </motion.div>

                {paginated.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0) }} disabled={page === 1}
                      className="btn btn-secondary btn-sm" style={{ opacity: page === 1 ? 0.5 : 1 }}>
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(7, paginated.totalPages) }, (_, i) => {
                      let pageNum
                      if (paginated.totalPages <= 7) {
                        pageNum = i + 1
                      } else if (page <= 4) {
                        pageNum = i + 1
                      } else if (page >= paginated.totalPages - 3) {
                        pageNum = paginated.totalPages - 6 + i
                      } else {
                        pageNum = page - 3 + i
                      }
                      if (pageNum < 1 || pageNum > paginated.totalPages) return null
                      return (
                        <button key={pageNum} onClick={() => { setPage(pageNum); window.scrollTo(0, 0) }}
                          className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                          style={{ background: page === pageNum ? 'var(--color-primary)' : 'transparent', color: page === pageNum ? 'white' : 'var(--color-text-secondary)' }}>
                          {pageNum}
                        </button>
                      )
                    })}
                    <button onClick={() => { setPage(p => Math.min(paginated.totalPages, p + 1)); window.scrollTo(0, 0) }} disabled={page === paginated.totalPages}
                      className="btn btn-secondary btn-sm" style={{ opacity: page === paginated.totalPages ? 0.5 : 1 }}>
                      <ChevronRight size={16} />
                    </button>
                    <span className="text-xs ml-3 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                      Page {page} of {paginated.totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
