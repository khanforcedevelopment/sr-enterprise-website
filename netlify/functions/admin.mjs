/**
 * Admin panel API (/admin page). Password login, then read-only views of:
 *   - enquiries from Netlify Forms (quotes, invoice requests, general)
 *   - online payments made on /pay, with their current status from Ziina
 *
 * Netlify environment variables:
 *   ADMIN_PASSWORD          Admin panel password, 12+ characters.
 *   ADMIN_SESSION_SECRET    Random text, 32+ characters, used to sign the login cookie. Changing it logs everyone out.
 *   NETLIFY_ACCESS_TOKEN    Optional. Netlify personal access token, needed to show form enquiries.
 *   ZIINA_API_TOKEN         Already set for payments; used here to refresh payment statuses.
 */
import { createHmac } from 'node:crypto'
import { json, safeEqual, readJsonRequest, clientIp, ziinaGet } from '../lib/shared.mjs'
import { listPayments, updatePayment, adminLocks } from '../lib/store.mjs'

const COOKIE = 'sr_admin'
const SESSION_HOURS = 8
const LOCK_AFTER = 5
const LOCK_MS = 15 * 60 * 1000
const FINAL = new Set(['completed', 'failed', 'canceled'])

const secretReady = () => String(process.env.ADMIN_SESSION_SECRET || '').length >= 32
const passwordReady = () => String(process.env.ADMIN_PASSWORD || '').length >= 12

const sign = (value) => createHmac('sha256', `sr-admin:${process.env.ADMIN_SESSION_SECRET}`).update(value).digest('base64url')

function makeSession() {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000
  return `${exp}.${sign(String(exp))}`
}

function validSession(req) {
  if (!secretReady()) return false
  const cookie = req.headers.get('cookie') || ''
  const raw = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || ''
  const [exp, sig] = raw.split('.')
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false
  return safeEqual(sig, sign(exp))
}

const cookieHeader = (value, maxAge) =>
  `${COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`

function withCookie(res, value, maxAge) {
  res.headers.append('Set-Cookie', cookieHeader(value, maxAge))
  return res
}

/** Wrong-password lockout per IP, kept in Netlify Blobs so it holds across function instances. */
async function lockState(ip) {
  const s = adminLocks()
  const key = ip.replace(/[^A-Za-z0-9_.:-]/g, '_').replace(/:/g, '_')
  const f = (await s.get(key).catch(() => null)) || null
  const fresh = !f || Date.now() - f.first > LOCK_MS
  return {
    locked: !fresh && f.count >= LOCK_AFTER,
    async fail() {
      await s.setJSON(key, fresh ? { count: 1, first: Date.now() } : { ...f, count: f.count + 1 }).catch(() => {})
    },
    async clear() {
      await s.delete(key).catch(() => {})
    },
  }
}

async function login(req, body, context) {
  if (!passwordReady() || !secretReady()) {
    return json(503, { error: 'Admin panel is not set up yet. Add ADMIN_PASSWORD (12+) and ADMIN_SESSION_SECRET (32+) in Netlify.' })
  }
  const lock = await lockState(clientIp(req, context))
  if (lock.locked) return json(429, { error: 'Too many wrong passwords. Please wait 15 minutes and try again.' })
  if (!safeEqual(body.password, process.env.ADMIN_PASSWORD)) {
    await lock.fail()
    await new Promise((r) => setTimeout(r, 1500))
    return json(401, { error: 'Wrong password.' })
  }
  await lock.clear()
  return withCookie(json(200, { ok: true }), makeSession(), SESSION_HOURS * 3600)
}

/** Form submissions from the Netlify API (newest first). */
async function enquiries(context) {
  const token = process.env.NETLIFY_ACCESS_TOKEN
  const siteId = context?.site?.id || process.env.SITE_ID
  if (!token || !siteId) return { configured: false, items: [] }
  const base = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(process.env.NETLIFY_API_BASE || '')
    ? process.env.NETLIFY_API_BASE
    : 'https://api.netlify.com'
  const res = await fetch(`${base}/api/v1/sites/${encodeURIComponent(siteId)}/submissions?per_page=200`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Netlify API ${res.status}`)
  const list = await res.json()
  const items = (Array.isArray(list) ? list : []).map((s) => {
    const d = s.data || {}
    return {
      id: String(s.id || ''),
      createdAt: s.created_at || '',
      form: s.form_name || '',
      type: String(d.requestType || ''),
      reference: String(d.reference || ''),
      name: String(d.fullName || s.name || ''),
      company: String(d.companyName || s.company || ''),
      email: String(d.email || s.email || ''),
      mobile: String(d.mobile || ''),
      service: String(d.service || ''),
      amount: String(d.amount || ''),
      estimatedPrice: String(d.estimatedPrice || ''),
      message: String(d.message || ''),
    }
  })
  return { configured: true, items }
}

/** Payments saved by /api/start-payment, with statuses refreshed from Ziina for unfinished ones. */
async function paymentsWithStatus() {
  const list = await listPayments()
  if (!process.env.ZIINA_API_TOKEN) return list
  const open = list.filter((p) => !FINAL.has(p.status)).slice(0, 25)
  await Promise.all(
    open.map(async (p) => {
      try {
        const intent = await ziinaGet(`/payment_intent/${encodeURIComponent(p.id)}`)
        const status = String(intent.status || p.status)
        if (status !== p.status) {
          Object.assign(p, { status, updatedAt: new Date().toISOString() })
          await updatePayment(p.id, { status, updatedAt: p.updatedAt })
        }
      } catch {
        p.statusError = true
      }
    })
  )
  return list
}

async function data(context) {
  const [enq, pays] = await Promise.allSettled([enquiries(context), paymentsWithStatus()])
  return json(200, {
    enquiries: enq.status === 'fulfilled' ? enq.value : { configured: true, items: [], error: 'Could not load enquiries from Netlify.' },
    payments: pays.status === 'fulfilled' ? pays.value : [],
    paymentsError: pays.status === 'rejected' ? 'Could not load payments.' : undefined,
    ziinaConfigured: Boolean(process.env.ZIINA_API_TOKEN),
    live: process.env.ZIINA_MODE === 'live',
  })
}

export default async (req, context) => {
  const { body, error } = await readJsonRequest(req)
  if (error) return error
  const action = new URL(req.url).pathname.split('/').pop()

  if (action === 'login') return login(req, body, context)
  if (action === 'logout') return withCookie(json(200, { ok: true }), '', 0)
  if (!validSession(req)) return json(401, { error: 'Please log in.' })
  if (action === 'session') return json(200, { ok: true })
  if (action === 'data') return data(context)
  return json(404, { error: 'Not found' })
}

export const config = {
  path: ['/api/admin/login', '/api/admin/logout', '/api/admin/session', '/api/admin/data'],
  // Netlify rate limit: at most 30 admin requests a minute from one IP address.
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
