import { COMPANY } from '../config/company'
import { SERVICES } from '../config/services'
import { priceLabel } from '../config/pricing'

export function whatsappLink(message = '') {
  const base = `https://wa.me/${COMPANY.whatsappNumber}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function serviceInquiryMessage(serviceTitle) {
  return `Hello ${COMPANY.shortName},\n\nI would like to enquire about your *${serviceTitle}* service. Please share more details.\n\nThank you.`
}

// Short, human-readable reference so both sides can refer to the same request.
export function makeRequestReference(date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `REQ-${ymd}-${rand}`
}

export const REQUEST_TYPES = {
  quote: { label: 'Request a Quote', heading: 'QUOTE REQUEST' },
  invoice: { label: 'Request an Invoice', heading: 'INVOICE REQUEST' },
  general: { label: 'General Enquiry', heading: 'GENERAL ENQUIRY' },
}

// Formats the single enquiry form as a WhatsApp/email message.
export function enquiryMessage(data, reference) {
  const type = REQUEST_TYPES[data.requestType] || REQUEST_TYPES.general
  const line = (label, value) => (value && String(value).trim() ? `*${label}:* ${String(value).trim()}\n` : '')
  const amountLabel = data.requestType === 'invoice' ? 'Amount' : 'Estimated Budget'
  const detailsLabel =
    data.requestType === 'invoice' ? 'Service Description' : data.requestType === 'quote' ? 'Project Description' : 'Message'
  const closing =
    data.requestType === 'invoice'
      ? 'Please prepare an invoice for the above request.'
      : data.requestType === 'quote'
        ? 'Please share a quotation for the above requirement.'
        : 'Please get back to me.'
  return (
    `*${type.heading}*\n` +
    `Reference: ${reference}\n` +
    `--------------------------\n` +
    line('Name', data.fullName) +
    line('Company', data.companyName) +
    line('Email', data.email) +
    line('Mobile', data.mobile) +
    line('Service', data.service) +
    (data.requestType !== 'general' && SERVICES.find((s) => s.title === data.service)
      ? line('Estimated Price', priceLabel(SERVICES.find((s) => s.title === data.service).id))
      : '') +
    line(detailsLabel, data.message) +
    line(amountLabel, data.amount ? (/^[\d.,\s]+$/.test(data.amount) ? `AED ${data.amount}` : data.amount) : '') +
    `--------------------------\n` +
    `${closing} Sent from the ${COMPANY.shortName} website.`
  )
}
