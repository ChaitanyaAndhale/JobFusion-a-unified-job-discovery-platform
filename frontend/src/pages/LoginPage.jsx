import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Briefcase, Shield, Zap, Users, CheckCircle2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const SOCIAL_PROOF = [
  { icon: <Users size={16} />, text: '50K+ Professionals' },
  { icon: <Briefcase size={16} />, text: '10K+ Jobs Daily' },
  { icon: <Shield size={16} />, text: 'Secure & Private' },
]

const FEATURES = [
  { icon: '🎯', title: 'Smart Matching', desc: 'AI matches your resume with perfect jobs' },
  { icon: '🔔', title: 'Instant Alerts', desc: 'Email & SMS when opportunities match' },
  { icon: '📊', title: 'Track Progress', desc: 'Dashboard to manage applications' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem('jf-remembered-email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      await login(email, password)
      if (rememberMe) localStorage.setItem('jf-remembered-email', email)
      else localStorage.removeItem('jf-remembered-email')
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleClick = () => {
    toast.error('Google Sign-In requires a Google Cloud OAuth Client ID. Add it in App.jsx to enable.')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Left — Premium Illustration Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)' }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)' }} />
          <motion.div animate={{ y: [15, -15, 15], x: [10, -10, 10] }} transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)' }} />
          <motion.div animate={{ y: [10, -20, 10] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)' }} />
        </div>

        {/* Glass card content */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 max-w-md p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Briefcase size={24} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white">JobFusion</span>
          </div>

          {/* Hero text */}
          <h2 className="text-4xl font-black text-white mb-3 leading-tight">
            Your Career,<br />
            <span style={{ background: 'linear-gradient(135deg, #06b6d4, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Supercharged.
            </span>
          </h2>
          <p className="text-white/60 text-base mb-10 leading-relaxed">
            Smart job matching, instant alerts, and a powerful dashboard to land your dream role.
          </p>

          {/* Feature cards */}
          <div className="space-y-4 mb-10">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all cursor-default">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{f.title}</p>
                  <p className="text-white/50 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4">
            {SOCIAL_PROOF.map(s => (
              <div key={s.text} className="flex items-center gap-1.5 text-white/40 text-xs font-medium">
                {s.icon} {s.text}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold">
              <span className="gradient-text">Job</span>Fusion
            </span>
          </Link>

          {/* Welcome header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--color-primary-light)' }}>
                <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>Welcome Back</span>
            </div>
            <h1 className="text-3xl font-black mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Sign In</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                style={{ color: focusedField === 'email' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center rounded-l-xl transition-colors"
                  style={{ background: focusedField === 'email' ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)' }}>
                  <Mail size={16} style={{ color: focusedField === 'email' ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                  className="input pl-14 h-12 rounded-xl" placeholder="you@example.com" id="login-email"
                  style={{ background: 'var(--color-bg-tertiary)', border: focusedField === 'email' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)' }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                style={{ color: focusedField === 'password' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center rounded-l-xl transition-colors"
                  style={{ background: focusedField === 'password' ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)' }}>
                  <Lock size={16} style={{ color: focusedField === 'password' ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
                </div>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  className="input pl-14 pr-12 h-12 rounded-xl" placeholder="••••••••" id="login-password"
                  style={{ background: 'var(--color-bg-tertiary)', border: focusedField === 'password' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--color-surface)] transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer group" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="relative">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="sr-only peer" />
                  <div className="w-5 h-5 rounded-md border-2 peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] transition-all flex items-center justify-center"
                    style={{ borderColor: 'var(--color-border)' }}>
                    {rememberMe && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
                <span className="text-sm font-medium">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
              id="login-submit">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow h-px" style={{ background: 'var(--color-border)' }} />
              <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Or</span>
              <div className="flex-grow h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            {/* Google Login */}
            <button type="button" onClick={handleGoogleClick}
              className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:shadow-md"
              style={{ background: 'var(--color-bg-tertiary)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
                Create Account
              </Link>
            </p>
          </div>

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <Shield size={12} />
            <span>Protected by 256-bit encryption</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
