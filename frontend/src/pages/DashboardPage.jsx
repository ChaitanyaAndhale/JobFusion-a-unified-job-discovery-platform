import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts'
import { Briefcase, BookmarkCheck, TrendingUp, ExternalLink, Sparkles, Bell, Zap, Target, Brain, ArrowUpRight, CheckCircle2, Clock, XCircle, Eye, Award } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardStats } from '../services/jobApi'
import { APPLICATION_STATUSES } from '../utils/constants'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6']

function StatCard({ icon, label, value, subtitle, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card card-hover p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06]" style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-center justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
        {subtitle && <span className="badge badge-success text-xs">{subtitle}</span>}
      </div>
      <div className="text-2xl font-extrabold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
      <div className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
    </motion.div>
  )
}

function StatusBadge({ status }) {
  const config = APPLICATION_STATUSES.find(s => s.value === status) || APPLICATION_STATUSES[0]
  return <span className={`badge badge-${config.color}`}>{config.label}</span>
}

function MatchScoreBadge({ score }) {
  const color = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-primary)' : 'var(--color-warning)'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm relative overflow-hidden"
        style={{ background: `${color}15`, color }}>
        <svg className="absolute inset-0" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}20`} strokeWidth="3" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score * 1.13} 113`} strokeLinecap="round"
            transform="rotate(-90 22 22)" />
        </svg>
        {score}%
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl shimmer" />
        <div className="flex-1 space-y-2"><div className="h-4 w-20 shimmer" /><div className="h-3 w-16 shimmer" /></div>
      </div>
      <div className="h-6 w-12 shimmer" />
      <div className="h-3 w-24 shimmer" />
    </div>
  )
}

export default function DashboardPage() {
  const { user, fetchMatches, trackApplication } = useAuth()
  const savedJobs = user?.savedJobsList || []
  const [dashData, setDashData] = useState(null)
  const [matchedJobs, setMatchedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [matchTotal, setMatchTotal] = useState(0)

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      const token = localStorage.getItem('jf-token')

      // Fetch real dashboard stats
      const [dashResult, matchResult] = await Promise.allSettled([
        fetchDashboardStats(token),
        fetchMatches(20),
      ])

      if (dashResult.status === 'fulfilled' && dashResult.value?.success) {
        setDashData(dashResult.value)
      }
      if (matchResult.status === 'fulfilled') {
        setMatchedJobs(matchResult.value?.matches || [])
        setMatchTotal(matchResult.value?.total || 0)
      }
      setLoading(false)
    }

    if (user) loadDashboard()
  }, [user?.skills?.length, user?.appliedJobsCount])

  const stats = dashData?.stats || {
    totalApplications: user?.appliedJobsCount || 0,
    savedJobs: savedJobs.length,
    resumeMatches: matchTotal,
    avgMatchScore: 0,
    profileStrength: 0,
  }

  const skillDemandChart = dashData?.skillDemandChart || []
  const jobTypeChart = dashData?.jobTypeChart || []
  const applicationTimeline = dashData?.applicationTimeline || []
  const appliedJobs = dashData?.appliedJobs || user?.appliedJobs || []
  const topMatches = dashData?.topMatches || matchedJobs.slice(0, 8)

  const handleTrackApply = async (job) => {
    await trackApplication(job)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="container mx-auto px-6 max-w-7xl py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {user?.resumeUploaded
              ? `Your AI-powered job search overview • ${user?.skills?.length || 0} skills detected`
              : 'Upload your resume to unlock AI-powered job matching'}
          </p>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Briefcase size={20} />} label="Applications" value={stats.totalApplications} subtitle={stats.totalApplications > 0 ? 'Active' : null} color="#6366f1" delay={0} />
            <StatCard icon={<BookmarkCheck size={20} />} label="Saved Jobs" value={stats.savedJobs} color="#06b6d4" delay={0.05} />
            <StatCard icon={<Sparkles size={20} />} label="Resume Matches" value={stats.resumeMatches} subtitle={stats.resumeMatches > 0 ? 'Live' : null} color="#f59e0b" delay={0.1} />
            <StatCard icon={<TrendingUp size={20} />} label="Avg Match Score" value={stats.avgMatchScore > 0 ? `${stats.avgMatchScore}%` : '—'} subtitle={stats.avgMatchScore >= 70 ? 'Strong' : null} color="#10b981" delay={0.15} />
          </div>
        )}

        {/* Profile Strength Bar */}
        {stats.profileStrength > 0 && stats.profileStrength < 100 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5 mb-8">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Award size={16} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Profile Strength</span>
              </div>
              <span className="text-sm font-extrabold" style={{ color: 'var(--color-primary)' }}>{stats.profileStrength}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats.profileStrength}%` }}
                transition={{ duration: 1, ease: "easeOut" }} className="h-full gradient-primary rounded-full" />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              {stats.profileStrength < 50 ? 'Add skills, upload resume, and complete your profile for better matches' :
                stats.profileStrength < 80 ? 'Almost there! Add a professional title and social links' :
                  'Great profile! You\'re getting the best job matches'}
            </p>
          </motion.div>
        )}

        {/* Resume Match Jobs */}
        {(user?.skills?.length > 0 || topMatches.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><Zap size={20} className="text-white" /></div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>AI-Matched Jobs for You</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {matchTotal > 0 ? `${matchTotal} jobs match your ${user?.skills?.length || 0} skills` : 'Upload your resume to see matches'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bell size={16} style={{ color: 'var(--color-primary)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                  {user?.notificationPrefs?.email ? 'Alerts ON' : 'Alerts OFF'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              </div>
            ) : topMatches.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-2">🎯</p>
                <p className="font-bold" style={{ color: 'var(--color-text-secondary)' }}>No matches yet</p>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Upload your resume in Profile to start matching</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topMatches.slice(0, 6).map(job => (
                  <div key={job.id} className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-[var(--color-bg-tertiary)] group" style={{ border: '1px solid var(--color-border)' }}>
                    <MatchScoreBadge score={job.matchScore} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{job.company} • {job.location}</p>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {(job.skills || []).slice(0, 3).map(s => (
                          <span key={s} className="badge badge-primary text-xs py-0.5 px-2">{s}</span>
                        ))}
                        {job.matchBreakdown && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                            Skills:{job.matchBreakdown.skillMatch} Title:{job.matchBreakdown.titleMatch} Loc:{job.matchBreakdown.locationMatch}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>{job.salaryText || ''}</p>
                      <div className="flex gap-2">
                        {job.applyUrl && (
                          <a href={job.applyUrl || job.sourceUrl || '#'} target="_blank" rel="noopener noreferrer"
                            onClick={() => handleTrackApply(job)}
                            className="btn btn-primary btn-sm px-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Apply <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {matchTotal > 6 && (
                  <p className="text-center text-xs font-bold pt-2" style={{ color: 'var(--color-primary)' }}>
                    + {matchTotal - 6} more matches
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Skill Demand Chart - Real Data */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card lg:col-span-2 p-6">
            <h3 className="font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              <Brain size={16} className="inline mr-2" style={{ color: 'var(--color-primary)' }} />
              Skill Demand in Your Matches
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              {skillDemandChart.length > 0 ? 'Green = you have it • Amber = opportunity to learn' : 'Skills from matched jobs will appear here'}
            </p>
            {skillDemandChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skillDemandChart} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} />
                  <YAxis type="category" dataKey="skill" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }}
                    formatter={(value, name, props) => [value, props.payload.hasSkill ? '✅ You have this' : '💡 Opportunity']}
                  />
                  <Bar dataKey="demand" radius={[0, 6, 6, 0]}>
                    {skillDemandChart.map((entry, i) => (
                      <Cell key={i} fill={entry.hasSkill ? '#10b981' : '#f59e0b'} opacity={entry.hasSkill ? 1 : 0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Add skills to see demand analysis</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Job Type Distribution - Real Data */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              <Target size={16} className="inline mr-2" style={{ color: 'var(--color-primary)' }} />
              Matching Jobs by Type
            </h3>
            {jobTypeChart.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={jobTypeChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                      {jobTypeChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {jobTypeChart.map((item, i) => (
                    <span key={item.name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{item.name} ({item.value})
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <p className="text-3xl mb-2">🎯</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Match data appears here</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Application History - Real Data */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <CheckCircle2 size={16} className="inline mr-2" style={{ color: 'var(--color-success)' }} />
              Application Tracker
            </h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              {appliedJobs.length} tracked
            </span>
          </div>
          {appliedJobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">📋</p>
              <p className="font-bold" style={{ color: 'var(--color-text-secondary)' }}>No applications tracked yet</p>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Click "Apply" on matched jobs to track them here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Job Title', 'Company', 'Source', 'Status', 'Applied'].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {appliedJobs.slice(0, 10).map((app, i) => (
                    <tr key={app.jobId || i} className="transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="py-3 px-4">
                        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{app.title}</span>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--color-text-secondary)' }}>{app.company}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{app.source}</span>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={app.status || 'applied'} /></td>
                      <td className="py-3 px-4" style={{ color: 'var(--color-text-tertiary)' }}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Saved Jobs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            <BookmarkCheck size={16} className="inline mr-2" style={{ color: 'var(--color-secondary)' }} />
            Saved Jobs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {savedJobs.length === 0 ? (
              <div className="card col-span-full text-center py-12">
                <p className="text-4xl mb-2">📌</p>
                <p style={{ color: 'var(--color-text-secondary)' }}>No saved jobs yet</p>
              </div>
            ) : savedJobs.map(job => (
              <div key={job.id} className="card card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{job.company?.logo}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{job.company?.name}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 mb-2">
                  <span className="badge badge-primary text-xs">{job.mode}</span>
                  <span className="badge badge-success text-xs">{job.experience}</span>
                </div>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{job.salaryText}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
