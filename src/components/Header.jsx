import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, Mail, MapPin, FileText } from 'lucide-react'
import Logo from './Logo'
import WhatsAppIcon from './WhatsAppIcon'
import { NAV_LINKS } from '../config/navigation'
import { COMPANY, PHONE_HREF, EMAIL_HREF } from '../config/company'
import { whatsappLink } from '../utils/whatsapp'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const menuButtonRef = useRef(null)
  const isHome = location.pathname === '/'
  const solid = scrolled || !isHome || open

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation
  useEffect(() => setOpen(false), [location.pathname, location.hash])

  // Lock page scroll and allow Escape while the mobile menu is open
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {open && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 -z-10 bg-navy-950/60 backdrop-blur-sm xl:hidden"
        />
      )}
      {/* Top contact bar (desktop) */}
      <div
        className={`hidden border-b border-white/10 bg-navy-950 text-xs text-navy-100 transition-all duration-300 lg:block ${
          scrolled ? 'h-0 overflow-hidden opacity-0' : 'h-9 opacity-100'
        }`}
      >
        <div className="container-x flex h-9 items-center justify-between">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />
            {COMPANY.addressOneLine}
          </p>
          <div className="flex items-center gap-6">
            <a href={PHONE_HREF} className="flex items-center gap-2 hover:text-gold-300">
              <Phone className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />
              {COMPANY.phoneDisplay}
            </a>
            <a href={EMAIL_HREF} className="flex items-center gap-2 hover:text-gold-300">
              <Mail className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />
              {COMPANY.email}
            </a>
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ${
          solid ? 'bg-white/95 shadow-card backdrop-blur-md' : 'bg-gradient-to-b from-navy-950/70 to-transparent'
        }`}
      >
        <nav className="container-x flex h-20 items-center justify-between" aria-label="Main navigation">
          <Link to="/#home" aria-label={`${COMPANY.name} home`} className="shrink-0">
            <Logo light={!solid} />
          </Link>

          <ul className="hidden items-center gap-1 xl:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    solid ? 'text-navy-700 hover:text-gold-600' : 'text-white/90 hover:text-gold-300'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 xl:flex">
            <Link to="/#enquiry" className="btn-gold">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Request a Quote
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-lg transition xl:hidden ${
              solid ? 'text-navy-900 hover:bg-navy-50' : 'text-white hover:bg-white/10'
            }`}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={`overflow-hidden bg-white transition-[max-height,opacity] duration-300 ease-out xl:hidden ${
            open ? 'max-h-[calc(100vh-5rem)] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
          }`}
          aria-hidden={!open}
        >
          <div className="container-x max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-navy-100 pb-8 pt-4">
            <ul className="space-y-1">
              {NAV_LINKS.map((link, i) => (
                <li key={link.to} style={{ transitionDelay: `${open ? i * 40 : 0}ms` }} className={`transition-all duration-300 ${open ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'}`}>
                  <Link
                    to={link.to}
                    tabIndex={open ? 0 : -1}
                    className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-navy-800 hover:bg-navy-50 hover:text-gold-600"
                  >
                    {link.label}
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link to="/#enquiry" tabIndex={open ? 0 : -1} className="btn-gold justify-center">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Request a Quote
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={open ? 0 : -1}
                className="btn-whatsapp justify-center"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp Us
              </a>
            </div>
            <div className="mt-6 space-y-2 rounded-xl bg-navy-50 p-4 text-sm text-navy-700">
              <a href={PHONE_HREF} tabIndex={open ? 0 : -1} className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold-600" aria-hidden="true" /> {COMPANY.phoneDisplay}
              </a>
              <a href={EMAIL_HREF} tabIndex={open ? 0 : -1} className="flex items-center gap-3 break-all">
                <Mail className="h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" /> {COMPANY.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
