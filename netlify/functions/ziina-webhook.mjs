/**
 * Ziina webhook (POST /api/ziina/webhook): Ziina calls this when a payment's status changes, so the receipt email
 * goes out right away instead of waiting for the 5-minute payment-sync.
 * The request body is never trusted: only the payment id is read from it, and the real status is fetched from
 * Ziina's API with our own token. Unknown ids are ignored.
 *
 * Optional Netlify environment variable:
 *   ZIINA_WEBHOOK_SECRET   The secret you gave Ziina when registering the webhook. When set, the request's
 *                          X-Hmac-Signature (HMAC-SHA256 of the body) must match.
 */
import { createHmac } from 'node:crypto'
import { json, safeEqual } from '../lib/shared.mjs'
import { payments, safeKey } from '../lib/store.mjs'
import { refreshZiina, FINAL } from '../lib/payment-sync.mjs'
import { sendReceiptOnce } from '../lib/send-receipt.mjs'

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  if (!process.env.ZIINA_API_TOKEN) return json(503, { error: 'Not configured.' })
  const raw = await req.text()
  const secret = process.env.ZIINA_WEBHOOK_SECRET
  if (secret) {
    const given = String(req.headers.get('x-hmac-signature') || '').toLowerCase()
    if (!safeEqual(given, createHmac('sha256', secret).update(raw).digest('hex'))) return json(401, { error: 'Invalid signature.' })
  }
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'Invalid request.' })
  }
  const id = String(body?.data?.id || body?.id || '').slice(0, 80)
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return json(200, { ok: true, ignored: true })
  const rec = await payments().get(safeKey(id)).catch(() => null)
  if (!rec || (rec.provider || 'ziina') !== 'ziina') return json(200, { ok: true, ignored: true })
  try {
    if (!FINAL.has(rec.status)) await refreshZiina(rec)
  } catch (err) {
    console.error('Ziina webhook: could not refresh status:', err.message)
    return json(502, { error: 'Could not check payment.' })
  }
  await sendReceiptOnce(rec, { origin: new URL(req.url).origin })
  return json(200, { ok: true })
}

export const config = {
  path: '/api/ziina/webhook',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
