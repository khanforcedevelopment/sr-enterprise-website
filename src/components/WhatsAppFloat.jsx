import WhatsAppIcon from './WhatsAppIcon'
import { whatsappLink } from '../utils/whatsapp'
import { COMPANY } from '../config/company'

export default function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink(`Hello ${COMPANY.shortName}, I have an enquiry.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white/70 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-gold-400"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}
