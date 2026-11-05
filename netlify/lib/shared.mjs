/**
 * Helpers for the website's payment and admin functions.
 */
import { timingSafeEqual } from 'node:crypto'

/** Constant-time comparison of two strings (passwords, signatures). */
export function safeEqual(given, expected) {
  const a = Buffer.from(String(given ?? ''))
  const b = Buffer.from(String(expected ?? ''))
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b)
}

export const MIN_AED = 2

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

export const cleanReference = (v) => String(v || '').trim().replace(/[^A-Za-z0-9_/-]/g, '').slice(0, 60)
export const cleanText = (v, max) => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>]/g, '').trim().slice(0, max)
export const toAmount = (v) => Math.round(Number(v) * 100) / 100

/** Largest single payment accepted. PAY_MAX_AED can lower or raise it (default AED 100,000). */
export function maxAed() {
  const v = Number(process.env.PAY_MAX_AED)
  return Number.isFinite(v) && v >= MIN_AED ? v : 100_000
}

/**
 * Basic request checks (CSRF protection): only POST, only JSON, and if the browser says where the request came
 * from it must be this same site. Returns { error } with a Response, or { body } with the parsed JSON object.
 */
export async function readJsonRequest(req) {
  if (req.method !== 'POST') return { error: json(405, { error: 'Method not allowed' }) }
  const type = (req.headers.get('content-type') || '').toLowerCase()
  if (!type.startsWith('application/json')) return { error: json(415, { error: 'Invalid request.' }) }
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return { error: json(403, { error: 'Invalid request.' }) }
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return { error: json(403, { error: 'Invalid request.' }) }
  let body
  try {
    body = await req.json()
  } catch {
    return { error: json(400, { error: 'Invalid request.' }) }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: json(400, { error: 'Invalid request.' }) }
  return { body }
}

/**
 * Ziina API. The token is only ever sent to api-v2.ziina.com.
 * ZIINA_API_BASE is only for local testing and only accepts a localhost address.
 */
function ziinaBase() {
  const custom = process.env.ZIINA_API_BASE
  if (custom && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(custom)) return custom
  return 'https://api-v2.ziina.com/api'
}

/** Real payments only when ZIINA_MODE is "live"; anything else creates Ziina test payments. */
export const ziinaLive = () => process.env.ZIINA_MODE === 'live'

/** Embedded checkout only when ZIINA_EMBEDDED is "true" (needs Ziina to approve your domain first). */
export const ziinaEmbedded = () => process.env.ZIINA_EMBEDDED === 'true'

export const ZIINA_PAY_ORIGIN = 'https://pay.ziina.com'

export async function ziina(path, body) {
  const res = await fetch(`${ziinaBase()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.ZIINA_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Ziina error ${res.status}${data?.code ? ` (${String(data.code).slice(0, 40)})` : ''}`)
  return data
}

export function isHttps(u, origin) {
  try {
    const url = new URL(u)
    return url.protocol === 'https:' && (!origin || url.origin === origin)
  } catch {
    return false
  }
}

/** Client IP as Netlify reports it (used for the admin wrong-password lockout). */
export const clientIp = (req, context) =>
  context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

export async function ziinaGet(path) {
  const res = await fetch(`${ziinaBase()}${path}`, {
    headers: { Authorization: `Bearer ${process.env.ZIINA_API_TOKEN}`, Accept: 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Ziina error ${res.status}`)
  return data
}
