/**
 * Pay page (/pay): creates a Ziina payment for the amount the client chose and returns Ziina's payment form
 * (embedded in the page when ZIINA_EMBEDDED is "true", otherwise a link to Ziina's own page).
 * Card details are entered only on Ziina's page, never on this website.
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

export default async (req) => {
  const { body, error } = await readJsonRequest(req)
  if (error) return error
  if (!process.env.ZIINA_API_TOKEN) {
    return json(503, { error: 'Online payment is not available yet. Please contact us on WhatsApp or email.' })
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

    console.log(`Ziina intent ${intent.id} for ${reference}: AED ${amount.toFixed(2)}${ziinaLive() ? '' : ' (test)'}`)
    return json(200, { url, embedded, amount, live: ziinaLive() })
  } catch (err) {
    console.error('Ziina error:', err.message)
    return json(502, { error: 'We could not open the payment page right now. Please try again or contact us.' })
  }
}

export const config = {
  path: '/api/start-payment',
  // Netlify rate limit: at most 20 payment attempts a minute from one IP address.
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
