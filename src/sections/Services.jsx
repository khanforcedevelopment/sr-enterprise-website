import { Link } from 'react-router-dom'
import { CheckCircle2, FileText } from 'lucide-react'
import SectionHeading from '../components/SectionHeading'
import SmartImage from '../components/SmartImage'
import Reveal from '../components/Reveal'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { SERVICES } from '../config/services'
import { priceLabel } from '../config/pricing'
import { whatsappLink, serviceInquiryMessage } from '../utils/whatsapp'

export default function Services() {
  return (
    <section id="services" className="section bg-navy-50/60">
      <div className="container-x">
        <SectionHeading
          eyebrow="Our Services"
          title="Licensed services for UAE businesses"
          intro="Three focused areas of work, each delivered with clear scope, practical recommendations and regular communication."
        />

        <div className="mt-16 space-y-10 lg:space-y-16">
          {SERVICES.map((service, index) => {
            const Icon = service.icon
            const reversed = index % 2 === 1
            return (
              <Reveal
                as="article"
                key={service.id}
                id={service.id}
                className="scroll-mt-28 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-navy-100 lg:grid lg:grid-cols-2"
                aria-labelledby={`${service.id}-title`}
              >
                <div className={`relative min-h-[260px] ${reversed ? 'lg:order-last' : ''}`}>
                  <SmartImage
                    src={service.image.src}
                    alt={service.image.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent" aria-hidden="true" />
                  <span className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-navy-950/80 px-3 py-1 text-xs font-semibold tracking-widest text-gold-300 backdrop-blur">
                    0{index + 1}
                  </span>
                </div>

                <div className="p-8 sm:p-10 lg:p-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-navy-950 shadow-gold">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 id={`${service.id}-title`} className="mt-6 font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
                    {service.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-navy-600">{service.description}</p>
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5 text-sm">
                    <span className="text-navy-500">Estimated price:</span>
                    <span className="font-semibold text-navy-900">{priceLabel(service.id)}</span>
                  </p>

                  <h4 className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Key Features</h4>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-navy-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={`/?service=${encodeURIComponent(service.id)}&type=quote#enquiry`}
                      className="btn-navy justify-center"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      Request a Quote
                    </Link>
                    <a
                      href={whatsappLink(serviceInquiryMessage(service.title))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp justify-center"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      WhatsApp Inquiry
                    </a>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
