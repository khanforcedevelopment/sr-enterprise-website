/**
 * Tells the /pay page which payment gateways are set up, so it only shows the ones that work.
 * Returns only true/false values, never keys.
 */
import { json } from '../lib/shared.mjs'
import { paymobConfigured } from '../lib/paymob.mjs'

export default async (req) => {
  if (req.method !== 'GET') return json(405, { error: 'Method not allowed' })
  return json(200, { ziina: Boolean(process.env.ZIINA_API_TOKEN), paymob: paymobConfigured() })
}

export const config = {
  path: '/api/payment-methods',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
