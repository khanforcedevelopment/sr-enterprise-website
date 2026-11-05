import { COMPANY } from '../config/company'
import { SERVICES } from '../config/services'
import { getPricing, formatPrice, ESTIMATE_VALIDITY_DAYS } from '../config/pricing'

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const parseAmount = (v) => {
  const n = Number(String(v ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Builds the client-facing Estimate (for quotes) or Proforma (for invoice requests / orders).
 * Never a tax invoice; never states that payment was received.
 */
export function buildEstimate(values, reference, date = new Date()) {
  const service = SERVICES.find((s) => s.title === values.service)
  const pricing = service ? getPricing(service.id) : null
  const isInvoice = values.requestType === 'invoice'
  const agreedAmount = isInvoice ? parseAmount(values.amount) : null

  let priceLine
  if (agreedAmount) priceLine = { label: 'Amount (as requested)', value: formatPrice(agreedAmount) }
  else if (pricing?.hasPrice)
    priceLine = { label: 'Estimated price', value: `From ${formatPrice(pricing.startingFrom)}${pricing.unit ? ` ${pricing.unit}` : ''}` }
  else priceLine = { label: 'Estimated price', value: 'To be confirmed by our team' }

  const docTitle = isInvoice ? 'Proforma / Order Request' : 'Quotation Estimate'
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const validity =
    !isInvoice && ESTIMATE_VALIDITY_DAYS ? `This estimate is valid for ${ESTIMATE_VALIDITY_DAYS} days from the date above.` : ''

  const notes = [
    isInvoice
      ? 'This is a proforma for your order request. It is NOT a tax invoice and no payment has been received. Our team will review your request and send you the official invoice with payment instructions.'
      : 'This is an estimate based on the information you provided. Final pricing will be confirmed in a formal quotation after our team reviews your requirements.',
    validity,
    pricing?.note || '',
  ].filter(Boolean)

  const rows = [
    ['Reference', reference],
    ['Date', dateStr],
    ['Client', values.fullName],
    ['Company', values.companyName],
    ['Email', values.email],
    ['Mobile', values.mobile],
    ['Service', values.service],
    [isInvoice ? 'Order / service details' : 'Project details', values.message],
    !isInvoice && values.amount ? ['Your estimated budget', values.amount] : null,
    [priceLine.label, priceLine.value],
  ].filter((r) => r && String(r[1] ?? '').trim())

  const subject = `${docTitle} ${reference} | ${COMPANY.name}`

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f2f5fa;font-family:Arial,Helvetica,sans-serif;color:#121e36">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5fa;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#121e36;padding:24px 28px">
  <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;letter-spacing:3px;color:#ffffff">SR <span style="color:#d3a952">ENTERPRISE</span></div>
  <div style="font-size:10px;letter-spacing:2px;color:#ead9a9;margin-top:4px">${esc(COMPANY.logoSubtitle)}</div>
</td></tr>
<tr><td style="padding:28px">
  <div style="font-size:12px;letter-spacing:2px;color:#a9762f;text-transform:uppercase;font-weight:bold">${esc(docTitle)}</div>
  <p style="font-size:15px;line-height:1.6;margin:12px 0 20px">Dear ${esc(values.fullName)},<br>Thank you for contacting ${esc(COMPANY.name)}. Please find the details of your request below.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
  ${rows
    .map(
      ([k, v], i) =>
        `<tr style="background:${i % 2 ? '#ffffff' : '#f7f9fc'}"><td style="padding:10px 12px;color:#43639f;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:10px 12px;font-weight:${
          k === priceLine.label ? 'bold' : 'normal'
        };white-space:pre-wrap">${esc(v)}</td></tr>`
    )
    .join('')}
  </table>
  <div style="margin-top:20px;padding:14px 16px;background:#fbf8ef;border-left:3px solid #c5933a;font-size:13px;line-height:1.6;color:#283e6a">${notes.map(esc).join('<br><br>')}</div>
  <p style="font-size:14px;line-height:1.6;margin-top:22px">For any questions, reply to this email or contact us on WhatsApp at ${esc(COMPANY.phoneDisplay)}.</p>
  <p style="font-size:14px;margin:0">Kind regards,<br><strong>${esc(COMPANY.name)}</strong></p>
</td></tr>
<tr><td style="background:#0a1224;padding:18px 28px;font-size:11px;line-height:1.6;color:#97aed2">
  ${esc(COMPANY.addressOneLine)}<br>Phone: ${esc(COMPANY.phoneDisplay)} &middot; Email: ${esc(COMPANY.email)}<br>Licensed by ${esc(COMPANY.licensingAuthority)} &middot; License No. ${esc(COMPANY.licenseNumber)}
</td></tr>
</table></td></tr></table></body></html>`

  return { subject, html, priceLine, docTitle }
}
