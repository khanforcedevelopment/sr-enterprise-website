import { Phone, Mail, MapPin, Navigation, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { COMPANY, PHONE_HREF, EMAIL_HREF } from '../config/company'
import { whatsappLink } from '../utils/whatsapp'

export default function Contact() {
  const actions = [
    { href: PHONE_HREF, icon: Phone, label: 'Call Us', cls: 'btn-navy' },
    { href: EMAIL_HREF, icon: Mail, label: 'Email Us', cls: 'btn-gold' },
    { href: whatsappLink(`Hello ${COMPANY.shortName}, I would like to get in touch.`), icon: null, label: 'WhatsApp Chat', cls: 'btn-whatsapp', external: true },
    { href: COMPANY.mapsUrl, icon: Navigation, label: 'Get Directions', cls: 'btn-outline', external: true },
  ]

  return (
    <section id="contact" className="section bg-white">
      <div className="container-x">
        <SectionHeading
          eyebrow="Contact Us"
          title="Visit or contact our office"
          intro="Call, email or message us on WhatsApp. To send a request, use the enquiry form above."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          <Reveal className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl bg-navy-900 p-8 text-white shadow-card">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-gold-400" aria-hidden="true" />
                <h3 className="font-serif text-xl font-semibold">{COMPANY.name}</h3>
              </div>
              <address className="mt-6 space-y-4 text-sm not-italic text-navy-100">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                  <span>
                    {COMPANY.addressLines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </span>
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                  <a href={PHONE_HREF} className="hover:text-gold-300">Phone: {COMPANY.phoneDisplay}</a>
                </p>
                <p className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                  <a href={EMAIL_HREF} className="break-all hover:text-gold-300">Email: {COMPANY.email}</a>
                </p>
              </address>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {actions.map(({ href, icon: Icon, label, cls, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`${cls} justify-center py-3.5`}
                >
                  {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : <WhatsAppIcon className="h-4 w-4" />}
                  {label}
                </a>
              ))}
            </div>
            <Link to="/#enquiry" className="block text-center text-sm font-medium text-gold-700 underline-offset-2 hover:underline">
              Need a quote or an invoice? Open the enquiry form
            </Link>
          </Reveal>

          <Reveal className="lg:col-span-3">
            <div className="h-full min-h-[360px] overflow-hidden rounded-2xl border border-navy-100 shadow-card">
              <iframe
                title={`Map showing ${COMPANY.name} at Amber Gem Tower, Ajman`}
                src={COMPANY.mapEmbedUrl}
                className="h-full min-h-[360px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
