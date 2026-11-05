import { Building, Target, Eye, Compass, MapPin, ShieldCheck } from 'lucide-react'
import SectionHeading from '../components/SectionHeading'
import SmartImage from '../components/SmartImage'
import Reveal from '../components/Reveal'
import { COMPANY } from '../config/company'

const PILLARS = [
  {
    icon: Building,
    title: 'Our Company',
    text: `${COMPANY.name} is a company based in ${COMPANY.city}, UAE, licensed by ${COMPANY.licensingAuthority}. We focus on business consultancy for facilities and resource planning, project management services, and the trading of architectural model and maquette requisites.`,
  },
  {
    icon: Target,
    title: 'Our Mission',
    text: 'To help businesses plan their facilities and resources sensibly, manage their projects with structure and clarity, and source the materials they need for professional architectural presentations.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    text: 'To become a dependable partner for organisations in the UAE that value careful planning, transparent communication and practical, well-organised delivery.',
  },
  {
    icon: Compass,
    title: 'Our Business Approach',
    text: 'We start by listening, define the scope in writing, agree clear deliverables and timelines, and keep clients informed at every stage. Recommendations are practical and matched to each client’s budget and goals.',
  },
]

export default function About() {
  return (
    <section id="about" className="section bg-white">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="relative order-last lg:order-first">
          <div className="relative overflow-hidden rounded-2xl shadow-card">
            <SmartImage
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=70"
              alt="Business professionals discussing a project plan in a meeting room"
              className="aspect-[4/5] w-full object-cover sm:aspect-[4/3] lg:aspect-[4/5]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" aria-hidden="true" />
          </div>
          <div className="absolute -bottom-6 left-6 right-6 rounded-xl border border-gold-200 bg-white p-5 shadow-card sm:left-auto sm:right-[-1rem] sm:w-72">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <MapPin className="h-4 w-4 text-gold-500" aria-hidden="true" />
              Based in {COMPANY.city}, UAE
            </p>
            <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-navy-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
              Licensed by {COMPANY.licensingAuthority}
            </p>
          </div>
          <div className="absolute -left-4 -top-4 -z-10 h-32 w-32 rounded-2xl border-2 border-gold-300" aria-hidden="true" />
        </Reveal>

        <div>
          <SectionHeading
            align="left"
            eyebrow="About Us"
            title="Planning, coordination and supply, handled with care"
            intro={`${COMPANY.name} supports businesses in the UAE with consultancy on facilities and resource planning, structured project management, and supplies for architectural maquettes and building models.`}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 80} className="group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-gold-400 transition group-hover:bg-gold-500 group-hover:text-navy-950">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-navy-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
