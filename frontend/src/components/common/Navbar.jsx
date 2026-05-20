import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Menu, X, Sun, Moon, User, LogOut, 
  Briefcase, LayoutDashboard, BookmarkCheck, Bell, ChevronDown
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { theme, toggleTheme, isDark } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { path: '/', label: 'Home', icon: null },
    { path: '/jobs', label: 'Find Jobs', icon: <Briefcase size={16} /> },
    ...(isAuthenticated ? [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    ] : []),
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'backdrop-blur-xl bg-[var(--color-surface)]/80 border-b border-[var(--color-border)] shadow-sm'
            : 'bg-transparent'
        }`}
        style={{ height: '72px' }}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between max-w-7xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" id="nav-logo">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              <span className="gradient-text">Job</span>
              <span style={{ color: 'var(--color-text-primary)' }}>Fusion</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                id={`nav-link-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                style={{
                  color: location.pathname === link.path ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'var(--color-primary-light)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {link.icon}
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="btn-icon btn-ghost p-2 rounded-lg"
              id="nav-search-toggle"
              aria-label="Toggle search"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Search size={20} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-icon btn-ghost p-2 rounded-lg"
              id="nav-theme-toggle"
              aria-label="Toggle theme"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </motion.div>
            </button>

            {/* Auth / Profile */}
            {isAuthenticated ? (
              <div className="relative">
                {/* Notification Bell */}
                <button
                  className="btn-icon btn-ghost p-2 rounded-lg relative hidden sm:block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-danger)' }}></span>
                </button>
              </div>
            ) : null}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl transition-all hover:bg-[var(--color-bg-tertiary)]"
                  id="nav-profile-menu"
                >
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown size={14} style={{ color: 'var(--color-text-tertiary)' }} className="hidden sm:block" />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-64 rounded-xl overflow-hidden z-50"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-xl)',
                      }}
                    >
                      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{user?.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <User size={16} /> Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <BookmarkCheck size={16} /> Saved Jobs
                        </Link>
                      </div>
                      <div className="p-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-danger-light)]"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm" id="nav-login">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm" id="nav-signup">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden btn-icon btn-ghost p-2 rounded-lg"
              id="nav-mobile-toggle"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSearchOpen(false)}
          >
            <motion.form
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--color-border)',
              }}
              onClick={e => e.stopPropagation()}
              onSubmit={handleSearch}
            >
              <div className="flex items-center gap-3 p-4">
                <Search size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search jobs, companies, skills..."
                  className="flex-1 bg-transparent outline-none text-lg"
                  style={{ color: 'var(--color-text-primary)' }}
                  autoFocus
                />
                <kbd
                  className="hidden sm:block px-2 py-1 rounded text-xs font-mono"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-border)' }}
                >
                  ESC
                </kbd>
              </div>
              <div className="px-4 pb-3 flex gap-2 flex-wrap">
                {['React Developer', 'Remote', 'Fresher Jobs', 'Data Scientist'].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion)
                      navigate(`/jobs?q=${encodeURIComponent(suggestion)}`)
                      setSearchOpen(false)
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-[72px] right-0 bottom-0 w-72 z-[55] p-6 flex flex-col gap-4 md:hidden"
            style={{
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: location.pathname === link.path ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: location.pathname === link.path ? 'var(--color-primary-light)' : 'transparent',
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <hr style={{ borderColor: 'var(--color-border)' }} />
            {!isAuthenticated && (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="btn btn-secondary w-full">Sign In</Link>
                <Link to="/signup" className="btn btn-primary w-full">Get Started</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[54] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Spacer for fixed navbar */}
      <div style={{ height: '72px' }} />
    </>
  )
}
