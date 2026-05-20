import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { fetchResumeInsights as fetchResumeInsightsAPI, applyToJob as applyToJobAPI } from '../services/jobApi'

const AuthContext = createContext()

const API = import.meta.env.PROD ? '' : ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('jf-token'))
  const [loading, setLoading] = useState(true)

  // Fetch user profile from backend
  const fetchProfile = useCallback(async (authToken) => {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setUser(data.user)
          localStorage.setItem('jf-current-user', JSON.stringify(data.user))
          return data.user
        }
      }
      // Token expired or invalid
      localStorage.removeItem('jf-token')
      localStorage.removeItem('jf-current-user')
      setToken(null)
      setUser(null)
    } catch {
      // Backend might be down — fallback to cached user
      const cached = localStorage.getItem('jf-current-user')
      if (cached) setUser(JSON.parse(cached))
    }
    return null
  }, [])

  useEffect(() => {
    if (token) {
      fetchProfile(token).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token, fetchProfile])

  // ── Login ─────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Login failed')

    localStorage.setItem('jf-token', data.token)
    localStorage.setItem('jf-current-user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  // ── Signup ────────────────────────────────────────────
  const signup = async (name, email, password, phone) => {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Signup failed')

    localStorage.setItem('jf-token', data.token)
    localStorage.setItem('jf-current-user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  // ── Google Login ──────────────────────────────────────
  const googleLogin = async (profileData) => {
    const res = await fetch(`${API}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Google login failed')

    localStorage.setItem('jf-token', data.token)
    localStorage.setItem('jf-current-user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  // ── Logout ────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('jf-token')
    localStorage.removeItem('jf-current-user')
    setToken(null)
    setUser(null)
  }

  // ── Update Profile ────────────────────────────────────
  const updateProfile = async (updates) => {
    const authToken = localStorage.getItem('jf-token')
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        localStorage.setItem('jf-current-user', JSON.stringify(data.user))
        return data.user
      }
    } catch {
      // Fallback: update locally
      const updated = { ...user, ...updates }
      setUser(updated)
      localStorage.setItem('jf-current-user', JSON.stringify(updated))
      return updated
    }
  }

  // ── Upload Resume ─────────────────────────────────────
  const uploadResume = async (file) => {
    const authToken = localStorage.getItem('jf-token')
    const formData = new FormData()
    formData.append('resume', file)

    const res = await fetch(`${API}/api/profile/resume`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed')

    setUser(data.user)
    localStorage.setItem('jf-current-user', JSON.stringify(data.user))
    return data
  }

  // ── Toggle Saved Job ──────────────────────────────────
  const toggleSavedJob = (job) => {
    if (!user) {
      toast.error('Please login to save jobs')
      return false
    }
    const currentSavedJobs = user.savedJobsList || []
    const isSaved = currentSavedJobs.some(j => j.id === job.id)

    let updatedSavedJobs
    if (isSaved) {
      updatedSavedJobs = currentSavedJobs.filter(j => j.id !== job.id)
      toast.success('Job removed from saved list')
    } else {
      updatedSavedJobs = [...currentSavedJobs, job]
      toast.success('Job saved successfully')
    }

    updateProfile({ savedJobsList: updatedSavedJobs, savedJobsCount: updatedSavedJobs.length })
    return !isSaved
  }

  // ── Fetch Matched Jobs ────────────────────────────────
  const fetchMatches = async (threshold = 30) => {
    const authToken = localStorage.getItem('jf-token')
    try {
      const res = await fetch(`${API}/api/matches?threshold=${threshold}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const data = await res.json()
      if (data.success) return data
    } catch { }
    return { matches: [], total: 0, userSkills: [] }
  }

  // ── Send Test Notification ────────────────────────────
  const sendTestNotification = async () => {
    const authToken = localStorage.getItem('jf-token')
    try {
      const res = await fetch(`${API}/api/notifications/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      return await res.json()
    } catch {
      return { success: false, error: 'Failed to send notification' }
    }
  }

  // ── Track Job Application ─────────────────────────────
  const trackApplication = async (job) => {
    const authToken = localStorage.getItem('jf-token')
    if (!authToken || !user) {
      toast.error('Please login to track applications')
      return null
    }
    try {
      const result = await applyToJobAPI(authToken, {
        jobId: job.id,
        title: job.title,
        company: job.company?.name || job.company || 'Unknown',
        location: job.location || '',
        source: job.source || '',
        applyUrl: job.applyUrl || job.sourceUrl || '',
      })
      if (result.success) {
        setUser(result.user)
        localStorage.setItem('jf-current-user', JSON.stringify(result.user))
        toast.success('Application tracked!')
      }
      return result
    } catch {
      return null
    }
  }

  // ── Get Resume Insights ──────────────────────────────
  const getResumeInsights = async () => {
    const authToken = localStorage.getItem('jf-token')
    if (!authToken) return null
    return await fetchResumeInsightsAPI(authToken)
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, signup, logout, googleLogin,
      updateProfile, uploadResume,
      toggleSavedJob, fetchMatches, sendTestNotification,
      trackApplication, getResumeInsights,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
