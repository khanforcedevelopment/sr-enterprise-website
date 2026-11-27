/**
 * Emails the client a PDF payment receipt once a payment is CONFIRMED by the gateway:
 *   - Paymob: HMAC-checked callback (/api/paymob/callback)
 *   - Ziina:  status read back from Ziina's API (/api/ziina/webhook, the 5-minute sync, or the admin panel)
 * Never from the browser's word alone. Each payment gets at most one receipt (see sendReceiptOnce).
 *
 * Netlify environment variables (Site configuration → Environment variables):
 *   RESEND_API_KEY        API key from https://resend.com/api-keys ("Sending access" is enough).
 *   RECEIPT_FROM          Sender, on a domain verified in Resend, e.g. "SR Enterprise <billing@srenterprisefz.com>".
 * Optional:
 *   RECEIPT_BCC           Copy of every receipt to you (default admin@srenterprisefz.com, "off" for none).
 *   RECEIPT_REPLY_TO      Where client replies go (default admin@srenterprisefz.com).
 *   RECEIPT_SEND_TEST     "false" to stop receipts for test payments (default: sent, marked [TEST]).
 */
import { receiptLocks, safeKey, updatePayment } from './store.mjs'
import { receiptEmail, receiptPdf, receiptNumber, COMPANY } from './receipt.mjs'

const STALE_MS = 10 * 60 * 1000 // a "sending" lock older than this is treated as a crashed attempt
const MAX_ATTEMPTS = 5
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/

export const receiptsConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.RECEIPT_FROM)

function resendBase() {
  const custom = process.env.RESEND_API_BASE // local tests only
  if (custom && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(custom)) return custom
  return 'https://api.resend.com'
}

function siteUrl(fallback) {
  const u = String(process.env.SITE_URL || process.env.URL || fallback || '').replace(/\/$/, '')
  return /^https:\/\//.test(u) ? u : ''
}

async function sendWithResend(rec, origin) {
  const site = siteUrl(origin)
  const mail = receiptEmail(rec, { logoUrl: site ? `${site}/email-logo.png` : '' })
  const pdf = await receiptPdf(rec)
  const bccEnv = String(process.env.RECEIPT_BCC ?? COMPANY.email).trim()
  const bcc = bccEnv && bccEnv.toLowerCase() !== 'off' ? bccEnv.split(',').map((s) => s.trim()).filter((s) => EMAIL_RE.test(s)) : []
  const replyTo = String(process.env.RECEIPT_REPLY_TO || COMPANY.email).trim()
  const res = await fetch(`${resendBase()}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Resend drops a repeat of the same key for 24 hours: a second guard against duplicates.
      'Idempotency-Key': `receipt/${safeKey(rec.id)}`,
    },
    body: JSON.stringify({
      from: process.env.RECEIPT_FROM,
      to: [rec.email],
      ...(bcc.length ? { bcc } : {}),
      reply_to: replyTo,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: [{ filename: mail.filename, content: Buffer.from(pdf).toString('base64') }],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Resend ${res.status}${data?.name ? ` (${String(data.name).slice(0, 40)})` : ''}`)
  return String(data.id || '')
}

/**
 * Sends the receipt for one payment record, at most once. Safe to call from every place that sees a payment
 * become "completed", at the same time: a lock in Netlify Blobs (create-only / compare-and-swap writes) lets
 * exactly one caller send. Never throws; returns what happened.
 */
export async function sendReceiptOnce(rec, { origin } = {}) {
  try {
    if (!rec || rec.status !== 'completed' || rec.amountMismatch) return 'not-paid'
    if (rec.receiptSentAt) return 'already-sent'
    // paidAt is only set when this code saw the payment become paid, so payments from before receipts existed are skipped.
    if (!rec.paidAt) return 'not-paid'
    if (!EMAIL_RE.test(String(rec.email || ''))) return 'no-email'
    if (rec.test && process.env.RECEIPT_SEND_TEST === 'false') return 'test-skipped'
    if (!receiptsConfigured()) return 'not-configured'

    const locks = receiptLocks()
    const key = safeKey(rec.id)
    const mine = { state: 'sending', at: new Date().toISOString() }
    let claimed = (await locks.setJSON(key, { ...mine, attempts: 1 }, { onlyIfNew: true }))?.modified !== false
    let attempts = 1
    if (!claimed) {
      const cur = await locks.getWithMetadata(key)
      const lock = cur?.data || {}
      if (lock.state === 'sent') return 'already-sent'
      attempts = (Number(lock.attempts) || 1) + 1
      const stale = lock.state === 'failed' || Date.now() - Date.parse(lock.at || 0) > STALE_MS
      if (!stale) return 'in-progress'
      if (attempts > MAX_ATTEMPTS) return 'gave-up'
      claimed = (await locks.setJSON(key, { ...mine, attempts }, { onlyIfMatch: cur.etag }))?.modified !== false
      if (!claimed) return 'in-progress'
    }

    try {
      const emailId = await sendWithResend(rec, origin)
      const sentAt = new Date().toISOString()
      await locks.setJSON(key, { state: 'sent', at: sentAt, attempts, emailId })
      await updatePayment(rec.id, { receiptSentAt: sentAt, receiptNumber: receiptNumber(rec), receiptError: null })
      console.log(`Receipt ${receiptNumber(rec)} sent for ${rec.id}`)
      return 'sent'
    } catch (err) {
      // Release the lock so the next callback / sync can try again (up to MAX_ATTEMPTS).
      await locks.setJSON(key, { state: 'failed', at: new Date().toISOString(), attempts, error: err.message.slice(0, 120) })
      await updatePayment(rec.id, { receiptError: err.message.slice(0, 120) }).catch(() => {})
      console.error(`Receipt for ${rec.id} not sent: ${err.message}`)
      return 'failed'
    }
  } catch (err) {
    console.error(`Receipt for ${rec?.id} not sent: ${err.message}`)
    return 'failed'
  }
}

/**
 * Tells the admin that a client chose "Pay in cash" on /pay (sent to RECEIPT_BCC, default admin@...).
 * Only when receipt emails are set up. Never throws.
 */
export async function notifyCashRequest(rec, { origin } = {}) {
  try {
    if (!receiptsConfigured()) return 'not-configured'
    const bccEnv = String(process.env.RECEIPT_BCC ?? COMPANY.email).trim()
    const to = (bccEnv.toLowerCase() === 'off' ? COMPANY.email : bccEnv).split(',').map((s) => s.trim()).filter((s) => EMAIL_RE.test(s))
    if (!to.length) return 'no-email'
    const site = siteUrl(origin)
    const amount = `AED ${Number(rec.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const lines = [
      `A client chose to pay in cash on the website.`,
      '',
      `Invoice: ${rec.reference}`,
      `Amount: ${amount}`,
      `Name: ${rec.name || '-'}`,
      `Email: ${rec.email}`,
      `Mobile: ${rec.phone || '-'}`,
      '',
      `When you receive the cash, open ${site ? `${site}/admin` : 'the admin panel'} and click "Mark cash received".`,
      'The client then gets the PDF receipt by email.',
    ]
    const res = await fetch(`${resendBase()}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `cash-request/${safeKey(rec.id)}`,
      },
      body: JSON.stringify({
        from: process.env.RECEIPT_FROM,
        to,
        reply_to: rec.email,
        subject: `Cash payment requested - Invoice ${rec.reference} (${amount})`,
        text: lines.join('\n'),
      }),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}`)
    return 'sent'
  } catch (err) {
    console.error(`Cash request email for ${rec?.id} not sent: ${err.message}`)
    return 'failed'
  }
}
