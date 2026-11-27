/**
 * Keeps payment records up to date and makes sure every confirmed payment gets its receipt email.
 * Used by the admin panel, the Ziina webhook and the scheduled payment-sync function.
 * Ziina statuses are always read from Ziina's API (never taken from a request body).
 */
import { ziinaGet } from './shared.mjs'
import { listPayments, updatePayment } from './store.mjs'
import { sendReceiptOnce } from './send-receipt.mjs'

export const FINAL = new Set(['completed', 'failed', 'canceled', 'refunded'])

/** Reads one Ziina payment's status from Ziina and saves it. Returns the updated record. */
export async function refreshZiina(p) {
  const intent = await ziinaGet(`/payment_intent/${encodeURIComponent(p.id)}`)
  const status = String(intent.status || p.status)
  if (status === p.status) return p
  const expected = Math.round(Number(p.amount) * 100)
  // Only count it as paid when Ziina's amount is the amount the client chose.
  const mismatch = status === 'completed' && intent.amount !== undefined && Number(intent.amount) !== expected
  const patch = {
    status: mismatch ? 'pending' : status,
    updatedAt: new Date().toISOString(),
    ...(mismatch ? { amountMismatch: true } : {}),
    ...(status === 'completed' && !mismatch && !p.paidAt ? { paidAt: new Date().toISOString() } : {}),
  }
  Object.assign(p, patch)
  await updatePayment(p.id, patch)
  return p
}

/**
 * Refreshes unfinished Ziina payments (newest first, at most `limit`) and sends any receipts still owed.
 * `maxAgeDays` limits which payments are looked at. Mutates and returns the list.
 */
export async function syncPayments({ list, limit = 25, maxAgeDays = null, origin } = {}) {
  const all = list || (await listPayments())
  const since = maxAgeDays ? Date.now() - maxAgeDays * 86400000 : 0
  const recent = (p) => !since || Date.parse(p.createdAt || 0) >= since
  if (process.env.ZIINA_API_TOKEN) {
    const open = all.filter((p) => (p.provider || 'ziina') === 'ziina' && !FINAL.has(p.status) && recent(p)).slice(0, limit)
    await Promise.all(
      open.map(async (p) => {
        try {
          await refreshZiina(p)
        } catch {
          p.statusError = true
        }
      })
    )
  }
  const owed = all.filter((p) => p.status === 'completed' && p.paidAt && !p.receiptSentAt && p.email && recent(p))
  for (const p of owed.slice(0, 10)) {
    const result = await sendReceiptOnce(p, { origin })
    if (result === 'sent') p.receiptSentAt = new Date().toISOString()
  }
  return all
}
