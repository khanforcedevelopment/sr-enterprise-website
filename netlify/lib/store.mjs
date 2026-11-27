/**
 * Small storage for the admin panel, using Netlify Blobs (included in every Netlify plan).
 * Stores one record per payment (Ziina or Paymob), the receipt-email locks and the admin wrong-password counters. No card data is ever stored.
 * SR_BLOBS_MEMORY=1 keeps everything in memory instead; it is only for local testing.
 */
import { getStore } from '@netlify/blobs'

const memory = new Map()
function memoryStore(name) {
  const map = memory.get(name) || new Map()
  memory.set(name, map)
  return {
    async get(key) {
      return map.has(key) ? JSON.parse(map.get(key)) : null
    },
    async getWithMetadata(key) {
      return map.has(key) ? { data: JSON.parse(map.get(key)), etag: String(map.get(key).length) + map.get(key) } : null
    },
    async setJSON(key, value, opts = {}) {
      const cur = map.get(key)
      if (opts.onlyIfNew && cur !== undefined) return { modified: false }
      if (opts.onlyIfMatch && (cur === undefined || String(cur.length) + cur !== opts.onlyIfMatch)) return { modified: false }
      map.set(key, JSON.stringify(value))
      return { modified: true }
    },
    async delete(key) {
      map.delete(key)
    },
    async list() {
      return { blobs: [...map.keys()].map((key) => ({ key })) }
    },
  }
}

function store(name) {
  if (process.env.SR_BLOBS_MEMORY === '1') return memoryStore(name)
  const s = getStore({ name, consistency: 'strong' })
  return {
    get: (key) => s.get(key, { type: 'json' }),
    getWithMetadata: (key) => s.getWithMetadata(key, { type: 'json' }),
    setJSON: (key, value, opts) => s.setJSON(key, value, opts),
    delete: (key) => s.delete(key),
    list: () => s.list(),
  }
}

export const payments = () => store('payments')
export const adminLocks = () => store('admin-locks')
/** One entry per payment whose receipt email was sent (or is being sent), so a receipt never goes out twice. */
export const receiptLocks = () => store('receipt-locks')

export const safeKey = (k) => String(k).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 120)

export async function savePayment(record) {
  await payments().setJSON(safeKey(record.id), record)
}

export async function listPayments(limit = 500) {
  const s = payments()
  const { blobs } = await s.list()
  const items = await Promise.all(blobs.slice(-limit).map((b) => s.get(b.key).catch(() => null)))
  return items.filter(Boolean).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function updatePayment(id, patch) {
  const s = payments()
  const key = safeKey(id)
  const current = await s.get(key)
  if (!current) return null
  const next = { ...current, ...patch }
  await s.setJSON(key, next)
  return next
}
