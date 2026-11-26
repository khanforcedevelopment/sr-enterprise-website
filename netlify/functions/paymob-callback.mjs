/**
 * Paymob callbacks for payments started on /pay. Both are checked with PAYMOB_HMAC_SECRET before anything is saved.
 *   POST /api/paymob/callback  "Transaction processed" callback, sent by Paymob's servers.
 *   GET  /api/paymob/callback  "Transaction response" redirect: the client's browser comes back here after paying
 *                              and is sent on to /payment/success or /payment/cancel.
 * The status saved here is what the admin panel shows. Always confirm payments in the Paymob dashboard too.
 */
import { json } from '../lib/shared.mjs'
import { listPayments, updatePayment, payments } from '../lib/store.mjs'
import { fieldsFromTransaction, fieldsFromQuery, verifyHmac, statusFromFields } from '../lib/paymob.mjs'

async function findRecord(merchantOrderId, orderId) {
  if (merchantOrderId) {
    const r = await payments().get(String(merchantOrderId).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 120)).catch(() => null)
    if (r?.provider === 'paymob') return r
  }
  if (!orderId) return null
  const list = await listPayments()
  return list.find((p) => p.provider === 'paymob' && p.paymobOrderId && p.paymobOrderId === String(orderId)) || null
}

/** Saves the new status. A payment only counts as paid when Paymob's amount matches the amount the client chose. */
async function record(fields, merchantOrderId) {
  const rec = await findRecord(merchantOrderId, fields['order.id'])
  if (!rec) {
    console.warn(`Paymob callback for unknown order ${String(fields['order.id']).slice(0, 30)}`)
    return null
  }
  let status = statusFromFields(fields)
  const expected = Math.round(Number(rec.amount) * 100)
  const amountMismatch = status === 'completed' && Number(fields.amount_cents) !== expected
  if (amountMismatch) status = 'pending'
  const patch = {
    status,
    paymobTransactionId: String(fields.id || ''),
    updatedAt: new Date().toISOString(),
    ...(amountMismatch ? { amountMismatch: true } : {}),
  }
  // Never let a late "pending" or "failed" overwrite a payment already recorded as paid.
  if (rec.status === 'completed' && status !== 'refunded' && status !== 'canceled') return rec
  await updatePayment(rec.id, patch)
  console.log(`Paymob ${rec.id}: ${status}${amountMismatch ? ' (amount mismatch)' : ''}`)
  return { ...rec, ...patch }
}

export default async (req) => {
  const url = new URL(req.url)
  const hmac = url.searchParams.get('hmac')

  if (req.method === 'GET') {
    const fields = fieldsFromQuery(url.searchParams)
    const valid = verifyHmac(fields, hmac)
    let status = 'unknown'
    if (valid) {
      status = statusFromFields(fields)
      try {
        await record(fields, url.searchParams.get('merchant_order_id'))
      } catch (err) {
        console.error('Paymob return: could not save status:', err.message)
      }
    }
    // An unchecked return goes to the neutral "being processed" page: it is never proof of payment.
    const to = status === 'failed' || status === 'canceled' ? '/payment/cancel?failed=1' : '/payment/success'
    return new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'no-store' } })
  }

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  let body
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }
  if (body?.type !== 'TRANSACTION' || !body.obj || typeof body.obj !== 'object') return json(200, { ok: true, ignored: true })
  const fields = fieldsFromTransaction(body.obj)
  if (!verifyHmac(fields, hmac)) return json(401, { error: 'Invalid signature.' })
  try {
    await record(fields, body.obj.order?.merchant_order_id || body.obj.special_reference)
  } catch (err) {
    console.error('Paymob callback: could not save status:', err.message)
    return json(500, { error: 'Could not save.' })
  }
  return json(200, { ok: true })
}

export const config = {
  path: '/api/paymob/callback',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
