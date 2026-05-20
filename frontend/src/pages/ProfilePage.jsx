import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, MapPin, Briefcase, Upload, Plus, X, Code2, Users, Globe, GraduationCap, Building2, Edit2, Check, Camera, Bell, Phone, Send, FileText, Sparkles, Target, TrendingUp, Brain, Award, Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateProfile, uploadResume, sendTestNotification, getResumeInsights } = useAuth()
  const fileRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)
  const [sendingNotif, setSendingNotif] = useState(false)
  const [resumeInsights, setResumeInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '', title: '', location: '', github: '', linkedin: '', portfolio: '', phone: '',
  })

  useEffect(() => {
    if (user) setFormData({
      name: user.name || '', title: user.title || '', location: user.location || '',
      github: user.github || '', linkedin: user.linkedin || '', portfolio: user.portfolio || '',
      phone: user.phone || '',
    })
  }, [user])

  const [newSkill, setNewSkill] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Load resume insights when user has skills
  useEffect(() => {
    if (user?.skills?.length > 0 && user?.resumeUploaded) {
      setInsightsLoading(true)
      getResumeInsights().then(data => {
        if (data?.success) setResumeInsights(data)
      }).finally(() => setInsightsLoading(false))
    }
  }, [user?.skills?.length, user?.resumeUploaded])

  const addSkill = () => {
    if (newSkill.trim() && !(user?.skills || []).includes(newSkill.trim())) {
      updateProfile({ skills: [...(user?.skills || []), newSkill.trim()] })
      setNewSkill('')
      toast.success('Skill added')
    }
  }

  const removeSkill = (s) => {
    updateProfile({ skills: (user?.skills || []).filter(sk => sk !== s) })
    toast.success('Skill removed')
  }

  const handleResumeUpload = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB')
    const toastId = toast.loading('Parsing resume...')
    try {
      const result = await uploadResume(file)
      toast.dismiss(toastId)
      toast.success(result.message || `Found ${result.extractedSkills?.length || 0} skills!`)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err.message || 'Upload failed')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleResumeUpload(file)
  }

  const handleSaveProfile = () => {
    updateProfile(formData)
    setIsEditing(false)
    toast.success('Profile updated!')
  }

  const handleLinkChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (!isEditing) updateProfile({ [field]: value })
  }

  const handleTestNotification = async () => {
    setSendingNotif(true)
    try {
      const result = await sendTestNotification()
      if (result.success) {
        toast.success(result.message || `Sent! ${result.matchCount} matches found`)
      } else {
        toast.error(result.error || 'Configure SMTP in backend .env for email notifications')
      }
    } catch { toast.error('Failed to send test notification') }
    finally { setSendingNotif(false) }
  }

  const handleNotifPrefChange = (key, value) => {
    const prefs = { ...(user?.notificationPrefs || {}), [key]: value }
    updateProfile({ notificationPrefs: prefs })
  }

  const calculateCompletion = () => {
    let score = 0
    if (user?.name) score += 15
    if (user?.title && user.title !== 'Job Seeker') score += 10
    if (user?.location && user.location !== 'Not Specified') score += 10
    if (user?.skills?.length > 0) score += 20
    if (user?.github || user?.linkedin || user?.portfolio) score += 10
    if (user?.resumeUploaded) score += 20
    if (user?.phone) score += 10
    if (user?.notificationPrefs?.email || user?.notificationPrefs?.sms) score += 5
    return Math.min(score, 100)
  }

  const notifPrefs = user?.notificationPrefs || { email: true, sms: false, frequency: 'daily', minMatchScore: 50 }

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-8 mb-6 relative overflow-visible mt-16 lg:mt-24 border-0 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-32 gradient-primary rounded-t-2xl" />
          <div className="relative z-10 pt-4 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative group cursor-pointer shrink-0 -mt-24 md:-mt-20">
              <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-5xl font-black text-white bg-slate-800 shadow-2xl border-4" style={{ borderColor: 'var(--color-surface)' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="absolute inset-0 border-4 border-transparent bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <div className="flex-1 w-full pb-2">
              {isEditing ? (
                <div className="space-y-3 mb-2 max-w-sm mx-auto md:mx-0">
                  <input type="text" className="input font-bold text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                  <input type="text" className="input text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Professional Title" />
                  <input type="text" className="input text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Location" />
                  <input type="tel" className="input text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone (+91 ...)" />
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-black mb-1 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{user?.name}</h2>
                  <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-secondary)' }}>{user?.title}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                    {user?.location && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}><MapPin size={14} className="text-[var(--color-primary)]" /> {user.location}</span>}
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}><Mail size={14} className="text-[var(--color-primary)]" /> {user?.email}</span>
                    {user?.phone && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}><Phone size={14} className="text-[var(--color-primary)]" /> {user.phone}</span>}
                  </div>
                </>
              )}
            </div>
            <div className="shrink-0 mt-4 md:mt-0 md:pb-4">
              {isEditing ? (
                <button onClick={handleSaveProfile} className="btn btn-primary shadow-xl shadow-indigo-500/20 flex items-center gap-2"><Check size={18} strokeWidth={3} /> Save</button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="btn bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm flex items-center gap-2 transition-all"><Edit2 size={16} /> Edit</button>
              )}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-sm font-extrabold block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>Profile Strength</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Complete your profile to stand out</span>
              </div>
              <span className="font-black text-2xl" style={{ color: 'var(--color-primary)' }}>{calculateCompletion()}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden shadow-inner" style={{ background: 'var(--color-bg-tertiary)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${calculateCompletion()}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} className="h-full gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Upload */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 shadow-md border border-[var(--color-border)]">
              <h3 className="text-lg font-black mb-5 flex items-center gap-2 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                <div className="p-2 rounded-lg bg-[var(--color-primary-light)]"><Upload size={18} className="text-[var(--color-primary)]" /></div> Resume
                {user?.resumeUploaded && <span className="badge badge-success text-xs ml-auto">✓ Uploaded</span>}
              </h3>
              <input type="file" ref={fileRef} className="hidden" accept=".pdf,.txt,.docx" onChange={e => handleResumeUpload(e.target.files?.[0])} />
              <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative overflow-hidden group ${dragOver ? 'scale-[1.02] border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-primary)]'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}>
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-surface)] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {user?.resumeUploaded ? <Check size={28} className="text-[var(--color-success)]" /> : <Upload size={28} className="text-[var(--color-primary)]" />}
                  </div>
                  <p className="text-base font-extrabold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.resumeUploaded ? `${user.resumeFileName || 'Resume Ready'}` : 'Drag & drop your resume'}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    or <span className="text-[var(--color-primary)] font-bold">browse files</span> (PDF, DOCX, TXT up to 5MB)
                  </p>
                  {user?.resumeUploaded && user?.skills?.length > 0 && (
                    <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--color-success)' }}>
                      ✓ {user.skills.length} skills extracted from resume
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Resume Analysis Insights */}
            {user?.resumeUploaded && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 shadow-md border border-[var(--color-border)]">
                <h3 className="text-lg font-black mb-5 flex items-center gap-2 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  <div className="p-2 rounded-lg bg-[var(--color-primary-light)]"><Brain size={18} className="text-[var(--color-primary)]" /></div> AI Resume Analysis
                  {user?.resumeAnalysis?.analyzedAt && <span className="badge badge-success text-xs ml-auto">Analyzed</span>}
                </h3>

                {/* Detected Info */}
                {user?.resumeAnalysis && (
                  <div className="space-y-3 mb-5">
                    {user.resumeAnalysis.experienceLevel && (
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <TrendingUp size={14} className="text-[var(--color-primary)]" /> Experience Level
                        </span>
                        <span className="badge badge-primary font-bold">{user.resumeAnalysis.experienceLevel}</span>
                      </div>
                    )}
                    {user.resumeAnalysis.roles?.length > 0 && (
                      <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <span className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <Target size={14} className="text-[var(--color-primary)]" /> Best Matching Roles
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {user.resumeAnalysis.roles.map(r => (
                            <span key={r} className="badge badge-primary text-xs capitalize">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.resumeAnalysis.education?.length > 0 && (
                      <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <span className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <GraduationCap size={14} className="text-[var(--color-primary)]" /> Education Detected
                        </span>
                        {user.resumeAnalysis.education.map((edu, i) => (
                          <p key={i} className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{edu}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Match Insights */}
                {insightsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : resumeInsights ? (
                  <div className="space-y-4">
                    {/* Match Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <p className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>{resumeInsights.matchSummary?.totalMatches || 0}</p>
                        <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Matches</p>
                      </div>
                      <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <p className="text-xl font-extrabold" style={{ color: 'var(--color-success)' }}>{resumeInsights.matchSummary?.avgMatchScore || 0}%</p>
                        <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Avg Score</p>
                      </div>
                      <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <p className="text-xl font-extrabold" style={{ color: 'var(--color-warning)' }}>{resumeInsights.matchSummary?.profileStrength || 0}%</p>
                        <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Strength</p>
                      </div>
                    </div>

                    {/* Strong Skills */}
                    {resumeInsights.strongSkills?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
                          <Zap size={12} /> Your Strongest Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {resumeInsights.strongSkills.map(s => (
                            <span key={s} className="badge badge-success text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {resumeInsights.missingSkills?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
                          <AlertCircle size={12} /> Skills to Learn (High Demand)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {resumeInsights.missingSkills.map(s => (
                            <button key={s} onClick={() => { updateProfile({ skills: [...(user?.skills || []), s] }); toast.success(`Added ${s}`) }}
                              className="badge text-xs cursor-pointer hover:scale-105 transition-transform"
                              style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                              + {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Categories */}
                    {resumeInsights.bestCategories?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Best Job Categories</p>
                        <div className="space-y-2">
                          {resumeInsights.bestCategories.slice(0, 3).map(cat => (
                            <div key={cat.category} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{cat.category}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{cat.jobCount} jobs</span>
                                <span className="badge badge-primary text-xs">{cat.avgScore}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {resumeInsights.suggestions?.length > 0 && (
                      <div className="p-4 rounded-xl" style={{ background: 'var(--color-primary-light)' }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>
                          <Award size={12} className="inline mr-1" /> Improvement Tips
                        </p>
                        <ul className="space-y-1">
                          {resumeInsights.suggestions.map((s, i) => (
                            <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                              <span className="text-[var(--color-primary)] shrink-0">→</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* Skills */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 shadow-md border border-[var(--color-border)]">
              <h3 className="text-lg font-black mb-5 flex items-center gap-2 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                <div className="p-2 rounded-lg bg-[var(--color-primary-light)]"><Briefcase size={18} className="text-[var(--color-primary)]" /></div> Top Skills
              </h3>
              <div className="flex flex-wrap gap-2.5 mb-6">
                {(user?.skills || []).map(s => (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={s} className="badge badge-primary px-3.5 py-1.5 flex items-center gap-2 text-sm shadow-sm font-semibold">
                    {s} <button onClick={() => removeSkill(s)} className="hover:bg-white/20 p-0.5 rounded-full"><X size={14} /></button>
                  </motion.span>
                ))}
                {(!user?.skills || user.skills.length === 0) && <span className="text-sm italic font-medium" style={{ color: 'var(--color-text-tertiary)' }}>No skills yet. Upload resume to auto-extract or add manually.</span>}
              </div>
              <div className="flex gap-3">
                <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="input flex-1 bg-[var(--color-bg-tertiary)]" placeholder="e.g. React, Python, DevOps" />
                <button onClick={addSkill} className="btn btn-primary px-8 font-bold hover:scale-105 transition-transform">Add</button>
              </div>
            </motion.div>

            {/* Notification Settings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6 shadow-md border border-[var(--color-border)]">
              <h3 className="text-lg font-black mb-2 flex items-center gap-2 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                <div className="p-2 rounded-lg bg-[var(--color-primary-light)]"><Bell size={18} className="text-[var(--color-primary)]" /></div> Job Match Notifications
              </h3>
              <p className="text-xs mb-5" style={{ color: 'var(--color-text-tertiary)' }}>Get alerted when jobs match your resume skills</p>

              <div className="space-y-3 mb-5">
                {[
                  { key: 'email', label: 'Email Notifications', emoji: '✉️', desc: `Alerts sent to ${user?.email}` },
                  { key: 'sms', label: 'SMS Notifications', emoji: '📱', desc: user?.phone ? `Alerts sent to ${user.phone}` : 'Add phone number above' },
                ].map(n => (
                  <label key={n.key} className="flex items-center justify-between p-4 rounded-xl cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{n.emoji}</span>
                      <div>
                        <span className="text-sm font-bold block" style={{ color: 'var(--color-text-primary)' }}>{n.label}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{n.desc}</span>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${notifPrefs[n.key] ? 'justify-end' : 'justify-start'}`}
                      style={{ background: notifPrefs[n.key] ? 'var(--color-primary)' : 'var(--color-border)', padding: '3px' }}
                      onClick={(e) => { e.preventDefault(); handleNotifPrefChange(n.key, !notifPrefs[n.key]) }}>
                      <div className="w-4.5 h-4.5 bg-white rounded-full shadow-sm" style={{ width: 18, height: 18 }} />
                    </div>
                  </label>
                ))}
              </div>

              {/* Frequency */}
              <div className="mb-5">
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Alert Frequency</label>
                <div className="flex gap-2">
                  {[{ v: 'realtime', l: '⚡ Real-time' }, { v: 'daily', l: '📅 Daily Digest' }, { v: 'weekly', l: '📆 Weekly' }].map(f => (
                    <button key={f.v} onClick={() => handleNotifPrefChange('frequency', f.v)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: notifPrefs.frequency === f.v ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                        color: notifPrefs.frequency === f.v ? 'white' : 'var(--color-text-secondary)',
                        border: `1px solid ${notifPrefs.frequency === f.v ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      }}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Match Score */}
              <div className="mb-5">
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Minimum Match Score: <span style={{ color: 'var(--color-primary)' }}>{notifPrefs.minMatchScore || 50}%</span>
                </label>
                <input type="range" min="20" max="90" step="10" value={notifPrefs.minMatchScore || 50}
                  onChange={e => handleNotifPrefChange('minMatchScore', parseInt(e.target.value))}
                  className="w-full accent-[var(--color-primary)]" />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>More jobs (20%)</span><span>Best matches (90%)</span>
                </div>
              </div>

              {/* Test Notification */}
              <button onClick={handleTestNotification} disabled={sendingNotif}
                className="btn btn-secondary w-full flex items-center justify-center gap-2">
                {sendingNotif ? <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                {sendingNotif ? 'Sending...' : 'Send Test Notification'}
              </button>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Online Presence */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6 shadow-md border border-[var(--color-border)]">
              <h3 className="text-lg font-black mb-2 flex items-center gap-2 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                <div className="p-2 rounded-lg bg-[var(--color-primary-light)]"><Globe size={18} className="text-[var(--color-primary)]" /></div> Online Presence
              </h3>
              <p className="text-xs font-medium mb-6 text-[var(--color-text-secondary)]">Add links to help recruiters find you.</p>
              <div className="space-y-4">
                {[
                  { id: 'github', icon: <Code2 size={18} />, label: 'GitHub', placeholder: 'github.com/username', value: formData.github },
                  { id: 'linkedin', icon: <Users size={18} />, label: 'LinkedIn', placeholder: 'linkedin.com/in/username', value: formData.linkedin },
                  { id: 'portfolio', icon: <Globe size={18} />, label: 'Portfolio', placeholder: 'yourwebsite.com', value: formData.portfolio },
                ].map(link => (
                  <div key={link.id} className="group">
                    <label className="text-xs font-bold mb-1.5 block ml-1 uppercase tracking-wider text-[var(--color-text-secondary)]">{link.label}</label>
                    <div className="flex items-center gap-3 p-1 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] group-hover:border-[var(--color-primary-light)]">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-surface)] shadow-sm text-[var(--color-text-secondary)]">{link.icon}</div>
                      <input type="text" value={link.value} onChange={e => setFormData({...formData, [link.id]: e.target.value})} onBlur={e => handleLinkChange(link.id, e.target.value)}
                        className="flex-1 text-sm bg-transparent border-none focus:outline-none font-medium placeholder-[var(--color-text-tertiary)]" placeholder={link.placeholder} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Account Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6 shadow-md border border-[var(--color-border)]">
              <h3 className="text-lg font-black mb-5 tracking-tight text-[var(--color-text-primary)]">Account Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Joined', value: user?.joinedDate || 'Recently' },
                  { label: 'Applications', value: user?.appliedJobsCount || 0, badge: 'primary' },
                  { label: 'Saved Jobs', value: user?.savedJobsCount || 0, badge: 'success' },
                  { label: 'Resume', value: user?.resumeUploaded ? '✓ Uploaded' : 'Not uploaded', badge: user?.resumeUploaded ? 'success' : 'warning' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                    <span className="text-sm font-bold text-[var(--color-text-secondary)]">{s.label}</span>
                    {s.badge ? <span className={`badge badge-${s.badge} font-black px-3 py-1`}>{s.value}</span>
                      : <span className="text-sm font-black text-[var(--color-text-primary)]">{s.value}</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
