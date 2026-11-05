import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, ShieldCheck } from 'lucide-react'
import Logo from './Logo'
import WhatsAppIcon from './WhatsAppIcon'
import { NAV_LINKS, LEGAL_LINKS } from '../config/navigation'
import { SERVICES } from '../config/services'
import { COMPANY, PHONE_HREF, EMAIL_HREF } from '../config/company'
import { whatsappLink } from '../utils/whatsapp'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-navy-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.04]" aria-hidden="true" />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link to="/#home" aria-label={`${COMPANY.name} home`}>
            <Logo light />
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-navy-200">
            {COMPANY.name} is an Ajman-based company providing facilities resources planning consultancy, project
            management services and architectural model supplies to businesses across the UAE.
          </p>
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-navy-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
            <span>
              Licensed by {COMPANY.licensingAuthority}
              <br />
              Business License No. {COMPANY.licenseNumber}
            </span>
          </p>
        </div>

        <div className="lg:col-span-2">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="footer-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h3 className="footer-heading">Our Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <Link to={`/#${s.id}`} className="footer-link">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h3 className="footer-heading">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
              <a href={COMPANY.mapsUrl} target="_blank" rel="noopener noreferrer" className="footer-link">
                {COMPANY.addressOneLine}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
              <a href={PHONE_HREF} className="footer-link">
                {COMPANY.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <WhatsAppIcon className="h-4 w-4 shrink-0 text-gold-400" />
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="footer-link">
                WhatsApp {COMPANY.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
              <a href={EMAIL_HREF} className="footer-link break-all">
                {COMPANY.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col gap-4 pb-24 pt-6 text-xs md:pb-6 text-navy-300 md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 {COMPANY.name}. All rights reserved.
            <span className="mx-2 hidden text-navy-500 sm:inline" aria-hidden="true">|</span>
            <span className="mt-1 block whitespace-nowrap sm:mt-0 sm:inline">
              Developed by <span className="font-semibold text-gold-300">Khan Force Development</span>
            </span>
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="footer-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
