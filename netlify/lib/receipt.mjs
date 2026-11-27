/**
 * Payment receipt sent to the client after a confirmed online payment: a branded PDF and the matching email.
 * It confirms money received against the client's invoice. It is not a tax invoice (no TRN / VAT lines).
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createHash } from 'node:crypto'
import { LOGO_PNG_BASE64 } from './logo.mjs'

// Keep in sync with src/config/company.js (that file uses Vite-only code, so it can't be imported here).
export const COMPANY = {
  name: 'Sunil Rana Enterprise FZE LLC',
  shortName: 'SR Enterprise',
  addressLines: ['BC-894507, 26th Floor, Amber Gem Tower', 'Ajman, United Arab Emirates'],
  email: 'admin@srenterprisefz.com',
  phone: '+971 55 143 6877',
  licence: 'ANC Free Zone, Ajman · Licence 2627921920888',
}

const NAVY = rgb(0x12 / 255, 0x1e / 255, 0x36 / 255)
const GOLD = rgb(0xb8 / 255, 0x8a / 255, 0x2e / 255)
const GREY = rgb(0.38, 0.42, 0.5)
const LINE = rgb(0.86, 0.88, 0.92)
const GREEN = rgb(0.09, 0.5, 0.28)

const PROVIDER_LABEL = { ziina: 'Ziina', paymob: 'Paymob' }

/** Short, stable receipt number for one payment, e.g. RCPT-20261127-4F2A9C. */
export function receiptNumber(rec) {
  const day = String(rec.paidAt || rec.updatedAt || rec.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '')
  const hash = createHash('sha256').update(String(rec.id)).digest('hex').slice(0, 6).toUpperCase()
  return `RCPT-${day}-${hash}`
}

export const money = (n) =>
  `AED ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dubaiDate = (iso) =>
  new Date(iso || Date.now()).toLocaleString('en-GB', {
    timeZone: 'Asia/Dubai', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

/** The built-in PDF fonts only cover Latin-1; anything else becomes "?". */
const pdfText = (v) => String(v ?? '').replace(/·/g, '-').replace(/[^\x20-\x7e\xa0-\xff]/g, '?')

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Facts shown on both the PDF and the email. */
export function receiptFacts(rec) {
  return {
    number: receiptNumber(rec),
    date: dubaiDate(rec.paidAt || rec.updatedAt || rec.createdAt),
    reference: rec.reference || '-',
    name: rec.name || '',
    email: rec.email || '',
    amount: money(rec.amount),
    method: `Online card payment via ${PROVIDER_LABEL[rec.provider] || 'card'}`,
    transaction: String(rec.paymobTransactionId || rec.id || ''),
    test: Boolean(rec.test),
  }
}

/** Builds the PDF receipt and returns its bytes. */
export async function receiptPdf(rec) {
  const f = receiptFacts(rec)
  const doc = await PDFDocument.create()
  doc.setTitle(`Payment receipt ${f.number}`)
  doc.setAuthor(COMPANY.name)
  doc.setCreator(COMPANY.shortName)
  const page = doc.addPage([595.28, 841.89]) // A4
  const { width } = page.getSize()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const M = 50
  const text = (s, x, y, o = {}) =>
    page.drawText(pdfText(s), { x, y, size: o.size || 10, font: o.bold ? bold : regular, color: o.color || NAVY })
  const right = (s, xr, y, o = {}) => {
    const w = (o.bold ? bold : regular).widthOfTextAtSize(pdfText(s), o.size || 10)
    text(s, xr - w, y, o)
  }

  // Header band
  page.drawRectangle({ x: 0, y: 835, width, height: 7, color: GOLD })
  const logo = await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, 'base64'))
  const lw = 200
  page.drawImage(logo, { x: M, y: 760, width: lw, height: (logo.height / logo.width) * lw })
  let y = 800
  for (const [i, line] of [COMPANY.name, ...COMPANY.addressLines, COMPANY.email, COMPANY.phone].entries()) {
    right(line, width - M, y, { size: i === 0 ? 10 : 8.5, bold: i === 0, color: i === 0 ? NAVY : GREY })
    y -= 13
  }

  // Title
  y = 705
  text('PAYMENT RECEIPT', M, y, { size: 22, bold: true })
  if (f.test) text('TEST PAYMENT - NO MONEY WAS CHARGED', M, y - 18, { size: 9, bold: true, color: rgb(0.75, 0.2, 0.2) })
  // PAID badge
  page.drawRectangle({ x: width - M - 80, y: y - 6, width: 80, height: 28, borderColor: GREEN, borderWidth: 1.5, color: rgb(0.92, 0.97, 0.93) })
  right('PAID', width - M - 22, y + 3, { size: 14, bold: true, color: GREEN })

  // Receipt details + billed to
  y = 645
  page.drawLine({ start: { x: M, y: y + 18 }, end: { x: width - M, y: y + 18 }, thickness: 1, color: LINE })
  text('RECEIVED FROM', M, y, { size: 8, bold: true, color: GOLD })
  text('RECEIPT DETAILS', 330, y, { size: 8, bold: true, color: GOLD })
  const who = [f.name || 'Client', f.email].filter(Boolean)
  who.forEach((l, i) => text(l, M, y - 18 - i * 14, { size: 10, bold: i === 0 }))
  const details = [
    ['Receipt no.', f.number],
    ['Date', `${f.date} (UAE)`],
    ['Invoice ref.', f.reference],
  ]
  details.forEach(([k, v], i) => {
    text(k, 330, y - 18 - i * 14, { size: 9, color: GREY })
    right(v, width - M, y - 18 - i * 14, { size: 9, bold: true })
  })

  // Line items table
  y = 545
  page.drawRectangle({ x: M, y: y - 6, width: width - 2 * M, height: 24, color: NAVY })
  text('DESCRIPTION', M + 12, y + 2, { size: 8.5, bold: true, color: rgb(1, 1, 1) })
  right('AMOUNT', width - M - 12, y + 2, { size: 8.5, bold: true, color: rgb(1, 1, 1) })
  y -= 32
  text(`Payment against invoice ${f.reference}`, M + 12, y, { size: 10, bold: true })
  right(f.amount, width - M - 12, y, { size: 10, bold: true })
  text(f.method, M + 12, y - 15, { size: 8.5, color: GREY })
  if (f.transaction) text(`Transaction ID: ${f.transaction}`, M + 12, y - 28, { size: 8.5, color: GREY })
  y -= 48
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1, color: LINE })

  // Total
  y -= 30
  page.drawRectangle({ x: 330, y: y - 10, width: width - M - 330, height: 32, color: rgb(0.97, 0.95, 0.9) })
  text('TOTAL PAID', 342, y + 1, { size: 10, bold: true })
  right(f.amount, width - M - 12, y + 1, { size: 13, bold: true })

  // Notes
  y -= 70
  text('Thank you for your payment.', M, y, { size: 11, bold: true })
  const notes = [
    'This receipt confirms the online payment above was received against your invoice.',
    'If this was a part payment, any remaining balance stays due as per your invoice.',
    `Questions? Email ${COMPANY.email} or WhatsApp ${COMPANY.phone}.`,
  ]
  notes.forEach((l, i) => text(l, M, y - 18 - i * 14, { size: 9, color: GREY }))

  // Footer
  page.drawLine({ start: { x: M, y: 70 }, end: { x: width - M, y: 70 }, thickness: 1, color: LINE })
  text(`${COMPANY.name} - ${COMPANY.licence}`, M, 55, { size: 7.5, color: GREY })
  text('Computer-generated receipt, no signature required. This is a payment receipt, not a tax invoice.', M, 43, { size: 7.5, color: GREY })

  return doc.save()
}

/** Subject, HTML and plain-text body of the receipt email. logoUrl is the public logo on the website. */
export function receiptEmail(rec, { logoUrl } = {}) {
  const f = receiptFacts(rec)
  const hello = f.name ? `Dear ${f.name},` : 'Dear Client,'
  const subject = `${f.test ? '[TEST] ' : ''}Payment received - Invoice ${f.reference} (${f.amount})`
  const row = (k, v) =>
    `<tr><td style="padding:8px 0;color:#5f6b80;font-size:14px">${esc(k)}</td><td style="padding:8px 0;text-align:right;color:#121e36;font-size:14px;font-weight:600">${esc(v)}</td></tr>`
  const html = `<!doctype html><html><body style="margin:0;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="height:6px;background:#b88a2e"></td></tr>
<tr><td style="padding:28px 32px 8px">${logoUrl ? `<img src="${esc(logoUrl)}" width="220" alt="${esc(COMPANY.shortName)}" style="display:block;border:0;width:220px;height:auto">` : `<strong style="font-size:20px;color:#121e36">${esc(COMPANY.shortName)}</strong>`}</td></tr>
<tr><td style="padding:16px 32px 0">
${f.test ? '<p style="margin:0 0 12px;padding:8px 12px;background:#fdecec;color:#a12626;font-size:13px;border-radius:6px"><strong>Test payment.</strong> No money was charged.</p>' : ''}
<p style="margin:0 0 6px;display:inline-block;padding:4px 10px;background:#e9f6ee;color:#17804a;font-size:12px;font-weight:700;border-radius:20px;letter-spacing:.05em">PAYMENT RECEIVED</p>
<h1 style="margin:12px 0 4px;font-size:30px;color:#121e36">${esc(f.amount)}</h1>
<p style="margin:0 0 20px;color:#5f6b80;font-size:14px">${esc(hello)} thank you, we have received your online payment.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e6ee;border-bottom:1px solid #e2e6ee">
${row('Invoice ref.', f.reference)}${row('Receipt no.', f.number)}${row('Date', `${f.date} (UAE)`)}${row('Paid with', f.method.replace('Online card payment via ', 'Card via '))}${f.transaction ? row('Transaction ID', f.transaction) : ''}
</table>
<p style="margin:20px 0 0;color:#5f6b80;font-size:14px;line-height:1.6">Your receipt is attached as a PDF. If this was a part payment, any remaining balance stays due as per your invoice.</p>
<p style="margin:16px 0 28px;color:#5f6b80;font-size:14px;line-height:1.6">Questions? Just reply to this email or WhatsApp us on ${esc(COMPANY.phone)}.</p>
</td></tr>
<tr><td style="padding:18px 32px;background:#121e36;color:#c9d1e0;font-size:12px;line-height:1.6"><strong style="color:#ffffff">${esc(COMPANY.name)}</strong><br>${COMPANY.addressLines.map(esc).join('<br>')}<br>${esc(COMPANY.email)} · ${esc(COMPANY.phone)}</td></tr>
</table></td></tr></table></body></html>`
  const text = [
    f.test ? 'TEST PAYMENT - no money was charged.\n' : '',
    hello,
    '',
    `Thank you, we have received your online payment of ${f.amount}.`,
    '',
    `Invoice ref.: ${f.reference}`,
    `Receipt no.: ${f.number}`,
    `Date: ${f.date} (UAE)`,
    `Paid with: ${f.method}`,
    f.transaction ? `Transaction ID: ${f.transaction}` : '',
    '',
    'Your receipt is attached as a PDF. If this was a part payment, any remaining balance stays due as per your invoice.',
    `Questions? Reply to this email or WhatsApp us on ${COMPANY.phone}.`,
    '',
    COMPANY.name,
    ...COMPANY.addressLines,
  ]
    .filter((l) => l !== null)
    .join('\n')
  return { subject, html, text, filename: `SR-Enterprise-Receipt-${f.number}.pdf` }
}
