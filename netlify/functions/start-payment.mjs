/**
 * Pay page (/pay): creates a payment for the amount the client chose with the payment method they picked.
 *   - Ziina: returns Ziina's payment form (embedded in the page when ZIINA_EMBEDDED is "true", otherwise a link).
 *   - Stripe: returns a link to Stripe's hosted Checkout page.
 * Card details are entered only on the provider's page, never on this website.
 * GET /api/payment-options tells the pay page which methods are switched on.
 *
 * Netlify environment variables (set one or both):
 *   ZIINA_API_TOKEN     API token from https://ziina.com/business/connect (needs write_payment_intents).
 *   ZIINA_MODE          "live" for real Ziina payments. Leave it out while testing.
 *   ZIINA_EMBEDDED      Optional, "true" to show Ziina inside the pay page (after Ziina approves your domain).
 *   STRIPE_SECRET_KEY   Secret or restricted key from https://dashboard.stripe.com/apikeys.
 *                       sk_test_... = test payments, sk_live_... = real payments.
 *   STRIPE_WEBHOOK_SECRET  Signing secret (whsec_...) of the webhook for /api/stripe-webhook (see stripe-webhook.mjs).
 * Optional:
 *   PAY_MAX_AED         Largest single payment in AED (default 100000).
 */
import {
  json, cleanReference, cleanText, toAmount, maxAed, readJsonRequest, ziina, ziinaLive, ziinaEmbedded, isHttps,
  ZIINA_PAY_ORIGIN, MIN_AED, stripePost, stripeReady, stripeLive, STRIPE_CHECKOUT_ORIGIN,
} from '../lib/shared.mjs'
import { savePayment } from '../lib/store.mjs'

const ziinaReady = () => Boolean(process.env.ZIINA_API_TOKEN)

function options() {
  const methods = []
  if (ziinaReady()) methods.push('ziina')
  if (stripeReady()) methods.push('stripe')
  return json(200, { methods })
}

async function startZiina({ reference, name, amount, origin, message }) {
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
  return {
    url,
    embedded,
    live: ziinaLive(),
    record: { id: String(intent.id), provider: 'ziina', reference, name, amount, status: String(intent.status || 'requires_payment_instrument'), test: !ziinaLive() },
  }
}

async function startStripe({ reference, name, amount, origin, message }) {
  const session = await stripePost('/v1/checkout/sessions', {
    mode: 'payment',
    client_reference_id: reference,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aed',
          unit_amount: Math.round(amount * 100), // fils
          product_data: { name: message.slice(0, 250) },
        },
      },
    ],
    payment_intent_data: { description: message.slice(0, 250), metadata: { reference, name } },
    metadata: { reference, name },
    success_url: `${origin}/payment/success`,
    cancel_url: `${origin}/payment/cancel`,
  })
  if (!isHttps(session.url, STRIPE_CHECKOUT_ORIGIN)) throw new Error('no payment url')
  return {
    url: session.url,
    embedded: false,
    live: stripeLive(),
    record: { id: String(session.id), provider: 'stripe', reference, name, amount, status: 'requires_payment_instrument', test: !stripeLive() },
  }
}

export default async (req) => {
  if (req.method === 'GET' && new URL(req.url).pathname === '/api/payment-options') return options()

  const { body, error } = await readJsonRequest(req)
  if (error) return error

  const provider = body.method === 'stripe' ? 'stripe' : body.method === 'ziina' || !body.method ? 'ziina' : ''
  if (!provider) return json(400, { error: 'Please choose a payment method.' })
  if ((provider === 'ziina' && !ziinaReady()) || (provider === 'stripe' && !stripeReady())) {
    return json(503, { error: 'This payment method is not available right now. Please choose another or contact us on WhatsApp or email.' })
  }

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

  try {
    const start = provider === 'stripe' ? startStripe : startZiina
    const { url, embedded, live, record } = await start({ reference, name, amount, origin, message })

    // Keep a record for the admin panel. A storage problem must never block the payment.
    try {
      await savePayment({ ...record, currency: 'AED', createdAt: new Date().toISOString() })
    } catch (err) {
      console.error('Could not save payment record:', err.message)
    }

    console.log(`${provider} payment ${record.id} for ${reference}: AED ${amount.toFixed(2)}${live ? '' : ' (test)'}`)
    return json(200, { url, embedded, amount, live, method: provider })
  } catch (err) {
    console.error(`${provider} error:`, err.message)
    return json(502, { error: 'We could not open the payment page right now. Please try again or contact us.' })
  }
}

export const config = {
  path: ['/api/start-payment', '/api/payment-options'],
  // Netlify rate limit: at most 20 payment attempts a minute from one IP address.
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
