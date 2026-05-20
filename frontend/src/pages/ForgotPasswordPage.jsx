import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Briefcase, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setSent(true)
    toast.success('Reset link sent!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--color-bg-primary)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="text-xl font-extrabold"><span className="gradient-text">Job</span>Fusion</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>Check Your Email</h1>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>We sent a reset link to <strong>{email}</strong></p>
            <Link to="/login" className="btn btn-primary">Back to Sign In</Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>Reset Password</h1>
            <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>Enter your email to receive a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input pl-11" placeholder="you@example.com" id="forgot-email" />
              </div>
              <button type="submit" className="btn btn-primary w-full btn-lg rounded-xl">Send Reset Link <ArrowRight size={18} /></button>
            </form>
            <Link to="/login" className="flex items-center gap-2 mt-6 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}
