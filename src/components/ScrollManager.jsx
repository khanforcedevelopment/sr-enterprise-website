import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to #hash targets (including after navigating from another page) or to the top on route change.
export default function ScrollManager() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (hash) {
      const raw = decodeURIComponent(hash.slice(1))
      // Old links to the former separate forms now land on the single enquiry form
      const id = { 'request-quote': 'enquiry', 'request-invoice': 'enquiry' }[raw] || raw
      let tries = 0
      const attempt = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (tries++ < 20) {
          requestAnimationFrame(attempt)
        }
      }
      attempt()
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [pathname, hash, key])

  return null
}
