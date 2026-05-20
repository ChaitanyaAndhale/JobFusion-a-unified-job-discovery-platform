import { useState } from 'react'
import { getCompanyInitials } from '../../services/jobApi'

/**
 * Company logo component with real logo from Google Favicons + graceful fallback
 */
export default function CompanyLogo({ name, logoUrl, logo, size = 48, className = '' }) {
  const [imgError, setImgError] = useState(false)
  const initials = getCompanyInitials(name)

  // Determine the best image source
  const imgSrc = !imgError ? (logoUrl || logo) : null

  if (!imgSrc) {
    // Show initials fallback
    return (
      <div
        className={`flex items-center justify-center rounded-xl font-bold text-white shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: `hsl(${(name?.charCodeAt(0) || 0) * 7 % 360}, 60%, 50%)`,
          fontSize: size * 0.35,
        }}
      >
        {initials}
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        background: 'var(--color-bg-tertiary)',
      }}
    >
      <img
        src={imgSrc}
        alt={`${name} logo`}
        style={{ width: size * 0.7, height: size * 0.7, objectFit: 'contain' }}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    </div>
  )
}
