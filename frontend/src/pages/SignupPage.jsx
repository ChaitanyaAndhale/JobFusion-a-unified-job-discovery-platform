import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Briefcase, User, Phone, Upload, CheckCircle2, Sparkles, Shield, Bell, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STEPS = [
  { label: 'Account', icon: <User size={14} /> },
  { label: 'Details', icon: <Phone size={14} /> },
  { label: 'Resume', icon: <FileText size={14} /> },
]

function InputField({ icon: Icon, label, fieldName, type = 'text', value, onChange, placeholder, extra, focusedField, setFocusedField }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
        style={{ color: focusedField === fieldName ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center rounded-l-xl transition-colors"
          style={{ background: focusedField === fieldName ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)' }}>
          <Icon size={16} style={{ color: focusedField === fieldName ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
        </div>
        <input type={type} value={value} onChange={onChange}
          onFocus={() => setFocusedField(fieldName)} onBlur={() => setFocusedField(null)}
          className="input pl-14 h-12 rounded-xl" placeholder={placeholder}
          style={{ background: 'var(--color-bg-tertiary)', border: focusedField === fieldName ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)' }} />
        {extra}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const fileRef = useRef(null)
  const { signup, googleLogin, uploadResume, updateProfile } = useAuth()
  const navigate = useNavigate()

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    const levels = [
      { level: 1, label: 'Weak', color: 'var(--color-danger)' },
      { level: 2, label: 'Fair', color: 'var(--color-warning)' },
      { level: 3, label: 'Good', color: 'var(--color-secondary)' },
      { level: 4, label: 'Strong', color: 'var(--color-success)' },
    ]
    return levels[score - 1] || { level: 0, label: '', color: '' }
  }
  const strength = getPasswordStrength()

  const handleNext = () => {
    if (step === 0) {
      if (!name || !email || !password) return toast.error('Please fill all fields')
      if (password.length < 6) return toast.error('Password must be at least 6 characters')
    }
    setStep(s => Math.min(s + 1, 2))
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      await signup(name, email, password, phone)
      // Upload resume if selected
      if (resumeFile) {
        try {
          const result = await uploadResume(resumeFile)
          toast.success(`Resume parsed! Found ${result.extractedSkills?.length || 0} skills`)
        } catch { toast.error('Resume upload failed, you can try again from profile') }
      }
      // Set notification preferences
      await updateProfile({
        notificationPrefs: { email: notifyEmail, sms: notifySms, frequency: 'daily', minMatchScore: 50 },
        phone,
      })
      toast.success('Account created! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleClick = () => {
    toast.error('Google Sign-In requires a Google Cloud OAuth Client ID. Add it in App.jsx to enable.')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB')
      setResumeFile(file)
      toast.success(`Selected: ${file.name}`)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold"><span className="gradient-text">Job</span>Fusion</span>
          </Link>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--color-primary-light)' }}>
                <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>Get Started Free</span>
            </div>
            <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Create Account</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Start your smart job search journey today.</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                  onClick={() => i < step && setStep(i)}
                  style={{
                    background: i <= step ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                    color: i <= step ? 'white' : 'var(--color-text-tertiary)',
                  }}>
                  {i < step ? <CheckCircle2 size={12} /> : s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 2 && <div className="flex-1 h-0.5 rounded-full" style={{ background: i < step ? 'var(--color-primary)' : 'var(--color-border)' }} />}
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); step < 2 ? handleNext() : handleSubmit() }}>
            <AnimatePresence mode="wait">
              {/* Step 1: Account */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <InputField icon={User} label="Full Name" fieldName="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" focusedField={focusedField} setFocusedField={setFocusedField} />
                  <InputField icon={Mail} label="Email" fieldName="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" focusedField={focusedField} setFocusedField={setFocusedField} />
                  <div>
                    <InputField icon={Lock} label="Password" fieldName="password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                      focusedField={focusedField} setFocusedField={setFocusedField}
                      extra={
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      } />
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">{[1,2,3,4].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= strength.level ? strength.color : 'var(--color-border)' }} />
                        ))}</div>
                        <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Phone & Notifications */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <InputField icon={Phone} label="Phone Number (for SMS alerts)" fieldName="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" focusedField={focusedField} setFocusedField={setFocusedField} />
                  
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Bell size={16} style={{ color: 'var(--color-primary)' }} />
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Job Match Notifications</span>
                    </div>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>Get notified when jobs match your resume skills</p>
                    
                    {[{ label: 'Email Notifications', emoji: '✉️', checked: notifyEmail, onChange: setNotifyEmail },
                      { label: 'SMS Notifications', emoji: '📱', checked: notifySms, onChange: setNotifySms }].map(n => (
                      <label key={n.label} className="flex items-center justify-between p-3 rounded-xl mb-2 cursor-pointer hover:bg-[var(--color-surface)] transition-colors" style={{ border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{n.emoji}</span>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{n.label}</span>
                        </div>
                        <div className={`w-10 h-6 rounded-full flex items-center transition-all ${n.checked ? 'justify-end' : 'justify-start'}`}
                          style={{ background: n.checked ? 'var(--color-primary)' : 'var(--color-border)', padding: '3px' }}
                          onClick={() => n.onChange(!n.checked)}>
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Resume */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <input type="file" ref={fileRef} className="hidden" accept=".pdf,.txt,.docx" onChange={handleFileSelect} />
                  <div onClick={() => fileRef.current?.click()}
                    className="p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] group"
                    style={{ borderColor: resumeFile ? 'var(--color-success)' : 'var(--color-border)', background: resumeFile ? 'var(--color-success-light)' : 'var(--color-bg-tertiary)' }}>
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: resumeFile ? 'var(--color-success-light)' : 'var(--color-surface)' }}>
                      {resumeFile ? <CheckCircle2 size={28} style={{ color: 'var(--color-success)' }} /> : <Upload size={28} style={{ color: 'var(--color-primary)' }} />}
                    </div>
                    <p className="font-bold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {resumeFile ? resumeFile.name : 'Upload Your Resume'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {resumeFile ? 'Click to change file' : 'PDF, DOCX or TXT • Max 5MB'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderOpacity: 0.2 }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                      🎯 Why upload your resume?
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      We'll extract your skills and auto-match with jobs. Get instant email & SMS alerts when perfect opportunities appear!
                    </p>
                  </div>

                  <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    You can skip this and upload later from your profile.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="btn btn-secondary h-12 rounded-xl px-5 flex items-center gap-1.5">
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                className="flex-1 h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : step < 2 ? (
                  <>Continue <ArrowRight size={18} /></>
                ) : (
                  <>Create Account <Sparkles size={18} /></>
                )}
              </motion.button>
            </div>

            {step === 0 && (
              <>
                <div className="relative flex items-center py-4">
                  <div className="flex-grow h-px" style={{ background: 'var(--color-border)' }} />
                  <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Or</span>
                  <div className="flex-grow h-px" style={{ background: 'var(--color-border)' }} />
                </div>
                <button type="button" onClick={handleGoogleClick}
                  className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:shadow-md"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign up with Google
                </button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold" style={{ color: 'var(--color-primary)' }}>Sign In</Link>
          </p>
        </motion.div>
      </div>

      {/* Right Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <motion.div animate={{ y: [15, -15, 15], x: [10, -10, 10] }} transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25), transparent 70%)' }} />
          <motion.div animate={{ y: [-10, 20, -10] }} transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)' }} />
        </div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="relative z-10 text-center p-12 max-w-md">
          <div className="text-7xl mb-6">✨</div>
          <h2 className="text-3xl font-black text-white mb-4">Join 50,000+ Professionals</h2>
          <p className="text-white/60 text-lg mb-8">Get personalized job recommendations and instant notifications when opportunities match your skills.</p>
          <div className="flex justify-center gap-3">
            {['🎯 Smart Match', '📧 Email Alerts', '📱 SMS Alerts'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-bold text-white/80 bg-white/10 border border-white/10">{f}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
