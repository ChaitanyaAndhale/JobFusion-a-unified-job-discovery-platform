import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8" style={{ background: 'var(--color-bg-primary)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>Page Not Found</h1>
        <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/" className="btn btn-primary"><Home size={16} /> Go Home</Link>
          <Link to="/jobs" className="btn btn-secondary"><Search size={16} /> Find Jobs</Link>
        </div>
      </motion.div>
    </div>
  )
}
