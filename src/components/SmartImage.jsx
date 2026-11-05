import { useState } from 'react'
import { Building2 } from 'lucide-react'

/**
 * Lazy-loaded image with a branded fallback. If the remote image cannot load
 * (offline, blocked, removed), a navy/gold architectural placeholder is shown instead.
 */
export default function SmartImage({ src, alt, className = '', eager = false, sizes, fallbackIcon = true }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div role="img" aria-label={alt} className={`image-fallback flex items-center justify-center ${className}`}>
        {fallbackIcon && <Building2 className="h-12 w-12 text-gold-400/70" aria-hidden="true" />}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={eager ? 'high' : undefined}
      onError={() => setFailed(true)}
      className={`${className} image-fallback`}
    />
  )
}
