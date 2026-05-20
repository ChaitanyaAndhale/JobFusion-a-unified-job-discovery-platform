import { Link } from 'react-router-dom'
import { Briefcase, Code2, MessageCircle, Users, Mail, Heart, Phone, MapPin, ExternalLink } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    'For Job Seekers': [
      { label: 'Browse Jobs', path: '/jobs' },
      { label: 'Remote Jobs', path: '/jobs?mode=Remote' },
      { label: 'Fresher Jobs', path: '/jobs?experience=Fresher' },
      { label: 'Full Stack Jobs', path: '/jobs?q=full+stack' },
    ],
    'Resources': [
      { label: 'Resume Builder', path: '/profile' },
      { label: 'Smart Matching', path: '/dashboard' },
      { label: 'Job Alerts', path: '/profile' },
      { label: 'Career Dashboard', path: '/dashboard' },
    ],
    'Company': [
      { label: 'About Us', path: '#about' },
      { label: 'Contact Us', path: '#contact' },
      { label: 'Privacy Policy', path: '#' },
      { label: 'Terms of Service', path: '#' },
    ],
  }

  const socialLinks = [
    { icon: <Code2 size={18} />, href: 'https://github.com/codfoxsolutions', label: 'GitHub' },
    { icon: <MessageCircle size={18} />, href: '#', label: 'Twitter' },
    { icon: <Users size={18} />, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: <Mail size={18} />, href: 'mailto:codfoxsolutions@gmail.com', label: 'Email' },
  ]

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: 'var(--color-bg-secondary)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      {/* Gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] gradient-primary" />

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Briefcase size={18} className="text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                <span className="gradient-text">Job</span>
                <span style={{ color: 'var(--color-text-primary)' }}>Fusion</span>
              </span>
            </Link>
            <p
              className="text-sm leading-relaxed max-w-xs mb-6"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Your unified platform for discovering, tracking, and landing your dream job.
              Aggregating opportunities from 10+ platforms worldwide.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4
                className="text-sm font-bold uppercase tracking-wider mb-4"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm transition-colors hover:translate-x-1 inline-block duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                      onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
                      onMouseLeave={e => e.target.style.color = 'var(--color-text-tertiary)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info Column */}
          <div id="contact">
            <h4
              className="text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-2.5">
                <Phone size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Founder</p>
                  <a href="tel:+919209591382" className="text-sm font-medium transition-colors hover:underline"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
                    onMouseLeave={e => e.target.style.color = 'var(--color-text-tertiary)'}>
                    +91 9209591382
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Co-Founder</p>
                  <a href="tel:+918999106225" className="text-sm font-medium transition-colors hover:underline"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
                    onMouseLeave={e => e.target.style.color = 'var(--color-text-tertiary)'}>
                    +91 8999106225
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Team Email</p>
                  <a href="mailto:codfoxsolutions@gmail.com" className="text-sm font-medium transition-colors hover:underline break-all"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
                    onMouseLeave={e => e.target.style.color = 'var(--color-text-tertiary)'}>
                    codfoxsolutions@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Powered by strip */}
        <div className="py-4 flex flex-wrap items-center justify-center gap-4"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>Powered by</span>
          <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>CodFox Solutions</span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>•</span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Built with React, Node.js, & 10+ Job APIs</span>
        </div>

        {/* Bottom Bar */}
        <div
          className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
            © {currentYear} JobFusion. Made with <Heart size={14} className="text-red-500 fill-red-500" /> in India
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
              ● All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
