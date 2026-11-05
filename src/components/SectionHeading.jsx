import Reveal from './Reveal'

export default function SectionHeading({ eyebrow, title, intro, light = false, align = 'center' }) {
  const alignment = align === 'center' ? 'mx-auto text-center' : 'text-left'
  return (
    <Reveal className={`max-w-3xl ${alignment}`}>
      {eyebrow && (
        <p className="mb-3 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-500">
          <span className="h-px w-8 bg-gold-500" aria-hidden="true" />
          {eyebrow}
          {align === 'center' && <span className="h-px w-8 bg-gold-500" aria-hidden="true" />}
        </p>
      )}
      <h2 className={`font-serif text-3xl font-semibold leading-tight sm:text-4xl ${light ? 'text-white' : 'text-navy-900'}`}>
        {title}
      </h2>
      {intro && <p className={`mt-4 text-base leading-relaxed sm:text-lg ${light ? 'text-navy-100' : 'text-navy-600'}`}>{intro}</p>}
    </Reveal>
  )
}
