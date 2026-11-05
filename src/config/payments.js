/**
 * ONLINE PAYMENTS (Ziina)
 * -----------------------
 * Clients pay at /pay: they enter their invoice/reference number and the amount they want to pay now
 * (full or part payment), then pay by card on Ziina's secure payment form. This website never sees or
 * stores card details. The Ziina API token lives only in Netlify environment variables (see README).
 *
 * Set PAYMENTS_ENABLED to false to hide the Pay Online page, menu link and buttons.
 * Always confirm payments in your Ziina business account, never from this website.
 */
export const PAYMENTS_ENABLED = true

export const PAY_PATH = '/pay'
export const MIN_PAYMENT_AED = 2
export const ZIINA_ORIGIN = 'https://pay.ziina.com'

/** Link to the pay page, optionally pre-filled with an invoice reference and amount. */
export function payPageLink({ reference, amount } = {}) {
  const params = new URLSearchParams()
  if (reference) params.set('ref', String(reference).slice(0, 60))
  if (amount) params.set('amount', String(amount))
  const q = params.toString()
  return q ? `${PAY_PATH}?${q}` : PAY_PATH
}
