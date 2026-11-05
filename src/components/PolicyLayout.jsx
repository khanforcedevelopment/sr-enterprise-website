import { Link } from 'react-router-dom'
import { ChevronRight, AlertTriangle, FileText } from 'lucide-react'
import { useSeo } from '../hooks/useSeo'
import { SHOW_POLICY_REVIEW_NOTES, POLICY_LAST_UPDATED } from '../config/legal'
import { LEGAL_LINKS } from '../config/navigation'

export function ReviewNote({ children }) {
  if (!SHOW_POLICY_REVIEW_NOTES) return null
  return (
    <aside className="my-5 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      <div>
        <strong className="font-semibold">Owner review required: </strong>
        {children}
      </div>
    </aside>
  )
}

export function PolicySection({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-semibold text-navy-900">{title}</h2>
      <div className="policy-body mt-4 space-y-4 text-[0.95rem] leading-relaxed text-navy-700">{children}</div>
    </section>
  )
}

export default function PolicyLayout({ title, description, path, children }) {
  useSeo({ title: `${title} | Sunil Rana Enterprise FZE LLC`, description, path })
  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 pb-16 pt-36 text-white lg:pt-44">
        <div className="absolute inset-0 bg-grid opacity-[0.05]" aria-hidden="true" />
        <div className="container-x relative">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-navy-200">
            <Link to="/" className="hover:text-gold-300">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-current="page" className="text-gold-300">{title}</span>
          </nav>
          <h1 className="mt-4 font-serif text-4xl font-semibold sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-navy-200">Last updated: {POLICY_LAST_UPDATED}</p>
        </div>
      </section>

      <div className="container-x grid gap-12 py-16 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-28 rounded-xl border border-navy-100 bg-navy-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Legal</p>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition ${
                      l.to === path ? 'bg-white font-semibold text-navy-900 shadow-sm' : 'text-navy-600 hover:text-gold-600'
                    }`}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <article className="max-w-3xl lg:col-span-3">{children}</article>
      </div>
    </>
  )
}
