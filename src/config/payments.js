/**
 * ONLINE PAYMENTS (Ziina and Stripe)
 * ----------------------------------
 * Clients pay at /pay: they enter their invoice/reference number and the amount they want to pay now
 * (full or part payment), pick a payment method, then pay on Ziina's or Stripe's secure payment page.
 * This website never sees or stores card details. The API keys live only in Netlify environment
 * variables (see README); a method shows on /pay only when its key is set.
 *
 * Set PAYMENTS_ENABLED to false to hide the Pay Online page, menu link and buttons.
 * Always confirm payments in your Ziina or Stripe account, never from this website.
 */
export const PAYMENTS_ENABLED = true

export const PAY_PATH = '/pay'
export const MIN_PAYMENT_AED = 2
export const ZIINA_ORIGIN = 'https://pay.ziina.com'
export const STRIPE_CHECKOUT_ORIGIN = 'https://checkout.stripe.com'

/** Labels for the payment methods on /pay, in the order they are shown. */
export const PAYMENT_METHODS = {
  ziina: { label: 'Ziina', note: 'Card, Apple Pay, Google Pay' },
  stripe: { label: 'Stripe', note: 'Card, Apple Pay, Google Pay' },
}

/** Link to the pay page, optionally pre-filled with an invoice reference and amount. */
export function payPageLink({ reference, amount } = {}) {
  const params = new URLSearchParams()
  if (reference) params.set('ref', String(reference).slice(0, 60))
  if (amount) params.set('amount', String(amount))
  const q = params.toString()
  return q ? `${PAY_PATH}?${q}` : PAY_PATH
}
