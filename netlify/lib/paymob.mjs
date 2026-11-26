/**
 * Paymob (UAE) Unified Checkout / Intention API.
 * The secret key and HMAC secret are only read on the server and only sent to Paymob's own domain.
 *
 * Netlify environment variables:
 *   PAYMOB_SECRET_KEY       Secret key (sk_test_... or sk_live_...) from Paymob dashboard → Settings → Account info.
 *   PAYMOB_PUBLIC_KEY       Public key (are_pk_test_... or are_pk_live_...) from the same page.
 *   PAYMOB_INTEGRATION_IDS  Payment integration IDs to offer, comma separated (e.g. card and Apple Pay): "12345,67890".
 *   PAYMOB_HMAC_SECRET      HMAC secret from the same page. Used to check that callbacks really come from Paymob.
 * Optional:
 *   PAYMOB_REGION           "uae" (default), "ksa", "oman", "egypt" or "pakistan". The website charges in AED, so keep "uae".
 */
import { createHmac, randomBytes } from 'node:crypto'
import { safeEqual } from './shared.mjs'

const REGIONS = {
  uae: 'https://uae.paymob.com',
  ksa: 'https://ksa.paymob.com',
  oman: 'https://oman.paymob.com',
  egypt: 'https://accept.paymob.com',
  pakistan: 'https://pakistan.paymob.com',
}

/** Paymob host for API calls and the checkout page. PAYMOB_API_BASE is only for local tests (localhost only). */
export function paymobBase() {
  const custom = process.env.PAYMOB_API_BASE
  if (custom && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(custom)) return custom
  return REGIONS[String(process.env.PAYMOB_REGION || 'uae').toLowerCase()] || REGIONS.uae
}

export const paymobIntegrationIds = () =>
  String(process.env.PAYMOB_INTEGRATION_IDS || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)

export const paymobConfigured = () =>
  Boolean(process.env.PAYMOB_SECRET_KEY && process.env.PAYMOB_PUBLIC_KEY && process.env.PAYMOB_HMAC_SECRET) &&
  paymobIntegrationIds().length > 0

/** Live when the secret key is a live key. Test keys create Paymob test payments (no money moves). */
export const paymobLive = () => String(process.env.PAYMOB_SECRET_KEY || '').startsWith('sk_live')

/** Our own unique reference for one Paymob payment (Paymob's "special_reference"). */
export const newPaymobRef = () => `SRPM-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`

/** Creates a payment intention and returns { intention, checkoutUrl }. */
export async function createIntention(body) {
  const res = await fetch(`${paymobBase()}/v1/intention/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.client_secret) {
    const detail = typeof data?.detail === 'string' ? ` (${data.detail.slice(0, 80)})` : ''
    throw new Error(`Paymob error ${res.status}${detail}`)
  }
  const url = new URL('/unifiedcheckout/', paymobBase())
  url.searchParams.set('publicKey', process.env.PAYMOB_PUBLIC_KEY)
  url.searchParams.set('clientSecret', data.client_secret)
  return { intention: data, checkoutUrl: url.toString() }
}

/** Fields Paymob signs, in Paymob's fixed order. */
const HMAC_FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction', 'id', 'integration_id',
  'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment', 'is_voided', 'order.id', 'owner',
  'pending', 'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
]

const str = (v) => (v === undefined || v === null ? '' : String(v))

/** Flattens a transaction object from the server callback (POST) into the signed fields. */
export function fieldsFromTransaction(obj = {}) {
  const order = obj.order && typeof obj.order === 'object' ? obj.order : { id: obj.order }
  const src = obj.source_data || {}
  return {
    amount_cents: obj.amount_cents, created_at: obj.created_at, currency: obj.currency, error_occured: obj.error_occured,
    has_parent_transaction: obj.has_parent_transaction, id: obj.id, integration_id: obj.integration_id,
    is_3d_secure: obj.is_3d_secure, is_auth: obj.is_auth, is_capture: obj.is_capture, is_refunded: obj.is_refunded,
    is_standalone_payment: obj.is_standalone_payment, is_voided: obj.is_voided, 'order.id': order.id, owner: obj.owner,
    pending: obj.pending, 'source_data.pan': src.pan, 'source_data.sub_type': src.sub_type, 'source_data.type': src.type,
    success: obj.success,
  }
}

/** Reads the signed fields from the browser return (GET query string). Paymob calls the order id "order" there. */
export function fieldsFromQuery(params) {
  const out = {}
  for (const f of HMAC_FIELDS) out[f] = params.get(f === 'order.id' ? 'order' : f)
  return out
}

/** True when the HMAC Paymob sent matches the fields, signed with PAYMOB_HMAC_SECRET. */
export function verifyHmac(fields, given) {
  const secret = process.env.PAYMOB_HMAC_SECRET
  if (!secret || !given) return false
  const text = HMAC_FIELDS.map((f) => str(fields[f])).join('')
  const expected = createHmac('sha512', secret).update(text).digest('hex')
  return safeEqual(String(given).toLowerCase(), expected)
}

/** Maps a Paymob transaction to the statuses the admin panel already knows. */
export function statusFromFields(f) {
  const yes = (v) => String(v) === 'true'
  if (yes(f.is_refunded)) return 'refunded'
  if (yes(f.is_voided)) return 'canceled'
  if (yes(f.success)) return 'completed'
  if (yes(f.pending)) return 'pending'
  return 'failed'
}
