/**
 * Stripe webhook (/api/stripe-webhook): Stripe calls this when a Checkout payment finishes, fails or expires,
 * and the payment record in the admin panel is updated straight away. Every call is checked against
 * STRIPE_WEBHOOK_SECRET, so nobody else can mark a payment as paid.
 *
 * Setup: Stripe Dashboard → Developers → Webhooks → Add endpoint
 *   URL:    https://srenterprisefz.com/api/stripe-webhook
 *   Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 *           checkout.session.async_payment_failed, checkout.session.expired
 * Then copy the endpoint's signing secret (whsec_...) into the Netlify variable STRIPE_WEBHOOK_SECRET.
 */
import { json, verifyStripeSignature, stripeSessionStatus } from '../lib/shared.mjs'
import { getPayment, updatePayment } from '../lib/store.mjs'

const EVENTS = {
  'checkout.session.completed': null, // status read from the session (paid, or still processing)
  'checkout.session.async_payment_succeeded': 'completed',
  'checkout.session.async_payment_failed': 'failed',
  'checkout.session.expired': 'canceled',
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return json(503, { error: 'Webhook not configured' })

  const raw = await req.text()
  if (raw.length > 512 * 1024) return json(413, { error: 'Too large' })
  if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret)) {
    return json(400, { error: 'Invalid signature' })
  }

  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  if (!(event.type in EVENTS)) return json(200, { received: true })
  const session = event.data?.object || {}
  if (!session.id) return json(200, { received: true })

  const status = EVENTS[event.type] || stripeSessionStatus(session)
  try {
    const current = await getPayment(session.id)
    if (!current) {
      console.log(`Stripe ${event.type} for ${session.id}: no matching record`)
      return json(200, { received: true })
    }
    // Events can arrive out of order: never move a paid payment back to processing.
    if (current.status === 'completed' && status === 'pending') return json(200, { received: true })
    await updatePayment(session.id, { status, updatedAt: new Date().toISOString() })
    console.log(`Stripe ${event.type} for ${session.id}: ${status}`)
  } catch (err) {
    // A 500 makes Stripe retry the event later.
    console.error('Could not update payment record:', err.message)
    return json(500, { error: 'Storage error' })
  }
  return json(200, { received: true })
}

export const config = {
  path: '/api/stripe-webhook',
  rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
