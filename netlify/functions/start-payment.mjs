/**
 * Pay page (/pay): creates a payment for the amount the client chose, with the gateway the client picked:
 *   - Ziina: returns Ziina's payment form (embedded when ZIINA_EMBEDDED is "true", otherwise Ziina's own page).
 *   - Paymob: returns Paymob's Unified Checkout page (see netlify/lib/paymob.mjs for its environment variables).
 * Card details are entered only on the gateway's page, never on this website.
 *
 * Netlify environment variables:
 *   ZIINA_API_TOKEN   API token from https://ziina.com/business/connect (needs write_payment_intents).
 *   ZIINA_MODE        "live" for real payments. Leave it out while testing: payments are then Ziina test payments.
 * Optional:
 *   ZIINA_EMBEDDED    "true" to show Ziina inside the pay page. Only after Ziina has approved your domain.
 *   PAY_MAX_AED       Largest single payment in AED (default 100000).
 */
import {
  json, cleanReference, cleanText, toAmount, maxAed, readJsonRequest, ziina, ziinaLive, ziinaEmbedded, isHttps,
  ZIINA_PAY_ORIGIN, MIN_AED,
} from '../lib/shared.mjs'
import { savePayment } from '../lib/store.mjs'
import { paymobConfigured, paymobLive, paymobIntegrationIds, createIntention, newPaymobRef } from '../lib/paymob.mjs'

const NOT_AVAILABLE = 'Online payment is not available yet. Please contact us on WhatsApp or email.'
const cleanEmail = (v) => {
  const e = String(v || '').trim().slice(0, 120)
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(e) ? e : ''
}
const cleanPhone = (v) => String(v || '').replace(/[^\d+]/g, '').slice(0, 16)

export default async (req) => {
  const { body, error } = await readJsonRequest(req)
  if (error) return error
  const provider = body.provider === 'paymob' ? 'paymob' : 'ziina'
  if (provider === 'paymob' ? !paymobConfigured() : !process.env.ZIINA_API_TOKEN) return json(503, { error: NOT_AVAILABLE })

  const reference = cleanReference(body.reference)
  if (reference.length < 2) return json(400, { error: 'Please enter your invoice or reference number.' })
  const name = cleanText(body.name, 80)

  const amount = toAmount(body.amount)
  const max = maxAed()
  if (!Number.isFinite(amount) || amount < MIN_AED) return json(400, { error: `The minimum payment is AED ${MIN_AED}.00.` })
  if (amount > max) {
    return json(400, { error: `Online payments are limited to AED ${max.toLocaleString('en-US')} each. Please contact us for larger amounts.` })
  }

  const origin = new URL(req.url).origin
  const message = `Invoice ${reference}${name ? ` - ${name}` : ''}`

  if (provider === 'paymob') return startPaymob({ body, reference, name, amount, origin, message })

  try {
    const intent = await ziina('/payment_intent', {
      amount: Math.round(amount * 100), // fils
      currency_code: 'AED',
      message: message.slice(0, 250),
      success_url: `${origin}/payment/success`,
      cancel_url: `${origin}/payment/cancel`,
      failure_url: `${origin}/payment/cancel?failed=1`,
      test: !ziinaLive(),
    })

    const embedded = ziinaEmbedded() && isHttps(intent.embedded_url, ZIINA_PAY_ORIGIN)
    const url = embedded ? intent.embedded_url : intent.redirect_url
    if (!isHttps(url)) throw new Error('no payment url')

    // Keep a record for the admin panel. A storage problem must never block the payment.
    try {
      await savePayment({
        id: String(intent.id),
        reference,
        name,
        amount,
        currency: 'AED',
        provider: 'ziina',
        status: String(intent.status || 'requires_payment_instrument'),
        test: !ziinaLive(),
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Could not save payment record:', err.message)
    }

    console.log(`Ziina intent ${intent.id} for ${reference}: AED ${amount.toFixed(2)}${ziinaLive() ? '' : ' (test)'}`)
    return json(200, { url, embedded, amount, live: ziinaLive() })
  } catch (err) {
    console.error('Ziina error:', err.message)
    return json(502, { error: 'We could not open the payment page right now. Please try again or contact us.' })
  }
}

/** Paymob needs the client's email and mobile number for its checkout and receipt. */
async function startPaymob({ body, reference, name, amount, origin, message }) {
  const email = cleanEmail(body.email)
  const phone = cleanPhone(body.phone)
  if (!email) return json(400, { error: 'Please enter a valid email address.' })
  if (phone.replace(/\D/g, '').length < 7) return json(400, { error: 'Please enter a valid mobile number.' })

  const [first, ...rest] = (name || 'Customer').split(/\s+/)
  const firstName = first.slice(0, 40) || 'Customer'
  const lastName = rest.join(' ').slice(0, 40) || 'NA'
  const id = newPaymobRef()
  const cents = Math.round(amount * 100) // fils

  try {
    const { intention, checkoutUrl } = await createIntention({
      amount: cents,
      currency: 'AED',
      payment_methods: paymobIntegrationIds(),
      items: [{ name: `Invoice ${reference}`.slice(0, 50), amount: cents, description: message.slice(0, 250), quantity: 1 }],
      billing_data: {
        first_name: firstName, last_name: lastName, email, phone_number: phone,
        apartment: 'NA', floor: 'NA', street: 'NA', building: 'NA', city: 'NA', state: 'NA', country: 'AE',
      },
      customer: { first_name: firstName, last_name: lastName, email },
      special_reference: id,
      notification_url: `${origin}/api/paymob/callback`,
      redirection_url: `${origin}/api/paymob/callback`,
      extras: { reference },
    })
    if (!isHttps(checkoutUrl) && !process.env.PAYMOB_API_BASE) throw new Error('no payment url')

    try {
      await savePayment({
        id, provider: 'paymob', paymobIntentionId: String(intention.id || ''),
        paymobOrderId: String(intention.intention_order_id || ''),
        reference, name, email, amount, currency: 'AED', status: 'requires_payment_instrument',
        test: !paymobLive(), createdAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Could not save payment record:', err.message)
    }

    console.log(`Paymob intention ${id} for ${reference}: AED ${amount.toFixed(2)}${paymobLive() ? '' : ' (test)'}`)
    return json(200, { url: checkoutUrl, embedded: false, amount, live: paymobLive() })
  } catch (err) {
    console.error('Paymob error:', err.message)
    return json(502, { error: 'We could not open the payment page right now. Please try again or contact us.' })
  }
}

export const config = {
  path: '/api/start-payment',
  // Netlify rate limit: at most 20 payment attempts a minute from one IP address.
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
