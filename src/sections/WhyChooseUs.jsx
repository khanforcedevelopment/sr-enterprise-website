import { Users, ClipboardCheck, MessagesSquare, Lightbulb } from 'lucide-react'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'

const REASONS = [
  {
    icon: Users,
    title: 'Client-Focused Approach',
    text: 'Every engagement starts with understanding your business, your constraints and what success looks like for you.',
  },
  {
    icon: ClipboardCheck,
    title: 'Professional Planning',
    text: 'Structured methods, documented scope and realistic schedules so you always know what is being delivered and when.',
  },
  {
    icon: MessagesSquare,
    title: 'Clear Communication',
    text: 'Straightforward updates by email, phone or WhatsApp, with written records of decisions and progress.',
  },
  {
    icon: Lightbulb,
    title: 'Practical Business Solutions',
    text: 'Recommendations that are realistic to implement and sized to your budget, not one-size-fits-all templates.',
  },
]

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="section relative overflow-hidden bg-navy-900">
      <div className="absolute inset-0 bg-grid opacity-[0.05]" aria-hidden="true" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
      <div className="container-x relative">
        <SectionHeading
          light
          eyebrow="Why Choose Us"
          title="A dependable partner for your next project"
          intro="We keep our work simple to follow and focused on outcomes that matter to your business."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, text }, i) => (
            <Reveal
              key={title}
              delay={i * 90}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition duration-300 hover:-translate-y-1 hover:border-gold-400/50 hover:bg-white/[0.07]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-400/40 text-gold-300 transition group-hover:bg-gold-500 group-hover:text-navy-950">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-200">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
