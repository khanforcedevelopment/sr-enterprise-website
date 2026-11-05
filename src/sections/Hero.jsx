import { Link } from 'react-router-dom'
import { ArrowRight, MessageSquare, ChevronDown } from 'lucide-react'
import SmartImage from '../components/SmartImage'
import { SERVICES } from '../config/services'
import { COMPANY } from '../config/company'

export default function Hero() {
  return (
    <section id="home" className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-navy-950">
      <SmartImage
        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=70"
        alt="Modern glass corporate tower"
        eager
        fallbackIcon={false}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-900/50" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.06]" aria-hidden="true" />

      <div className="container-x pb-24 pt-36 lg:pt-44">
        <div className="max-w-3xl">
          <p className="animate-fade-up inline-flex items-center gap-3 rounded-full border border-gold-400/40 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />
            {COMPANY.city}, {COMPANY.country}
          </p>
          <h1 className="animate-fade-up mt-6 font-serif text-4xl font-semibold leading-[1.1] text-white [animation-delay:120ms] sm:text-5xl lg:text-6xl">
            Professional Business Consultancy &amp;{' '}
            <span className="text-gold-gradient">Project Management</span> Solutions
          </h1>
          <p className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-navy-100 [animation-delay:240ms] sm:text-lg">
            Supporting businesses across the UAE with facilities resource planning, project management services, and
            architectural model supply solutions.
          </p>
          <div className="animate-fade-up mt-10 flex flex-col gap-4 [animation-delay:360ms] sm:flex-row">
            <Link to="/#services" className="btn-gold justify-center px-7 py-3.5 text-base">
              Explore Our Services
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link to="/#contact" className="btn-outline-light justify-center px-7 py-3.5 text-base">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
              Contact Us
            </Link>
          </div>
        </div>

        <ul className="animate-fade-up mt-16 grid gap-4 [animation-delay:480ms] sm:grid-cols-3 lg:max-w-4xl">
          {SERVICES.map(({ id, shortTitle, icon: Icon }) => (
            <li key={id}>
              <Link
                to={`/#${id}`}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-medium text-white backdrop-blur transition hover:border-gold-400/50 hover:bg-white/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-300 transition group-hover:bg-gold-500 group-hover:text-navy-950">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {shortTitle}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to="/#about"
        aria-label="Scroll to About section"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/60 transition hover:text-gold-300 md:block"
      >
        <ChevronDown className="h-7 w-7 animate-bounce" />
      </Link>
    </section>
  )
}
