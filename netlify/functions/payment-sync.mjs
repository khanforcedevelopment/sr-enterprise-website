/**
 * Scheduled every 5 minutes by Netlify: refreshes unfinished Ziina payments from Ziina's API and sends any
 * receipt emails still owed (for example after Resend was briefly down). Only looks at the last 3 days.
 * Scheduled functions can't be called from the web, so there is nothing to protect here.
 */
import { syncPayments } from '../lib/payment-sync.mjs'

export default async () => {
  try {
    await syncPayments({ maxAgeDays: 3, limit: 50 })
  } catch (err) {
    console.error('payment-sync failed:', err.message)
  }
}

export const config = { schedule: '*/5 * * * *' }
