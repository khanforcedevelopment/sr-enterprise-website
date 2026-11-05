import { COMPANY } from '../config/company'

export function LogoMark({ className = 'h-11 w-11' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sr-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ead9a9" />
          <stop offset="0.5" stopColor="#c5933a" />
          <stop offset="1" stopColor="#a9762f" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="10" fill="#121e36" />
      <rect x="6" y="6" width="52" height="52" rx="7" fill="none" stroke="url(#sr-gold)" strokeWidth="1.5" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="26"
        fontWeight="700"
        fill="url(#sr-gold)"
        letterSpacing="1"
      >
        SR
      </text>
    </svg>
  )
}

export default function Logo({ light = false, className = '' }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif text-lg font-bold tracking-[0.18em] sm:text-xl ${light ? 'text-white' : 'text-navy-900'}`}
        >
          SR <span className="text-gold-500">ENTERPRISE</span>
        </span>
        <span
          className={`mt-1 text-[0.55rem] font-semibold tracking-[0.2em] sm:text-[0.6rem] ${light ? 'text-gold-200' : 'text-navy-500'}`}
        >
          {COMPANY.logoSubtitle}
        </span>
      </span>
    </span>
  )
}
