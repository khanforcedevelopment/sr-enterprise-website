/**
 * ESTIMATED PRICES (editable)
 * ---------------------------
 * Fill in your own starting prices. Leave a price as null to show "Price on request".
 * All amounts are in AED. These are shown as ESTIMATES only; the final price is always
 * confirmed by your team in a formal quotation.
 *
 *   startingFrom: number or null   e.g. 1500
 *   unit:         short text        e.g. 'per project', 'per day', 'per hour', 'per order'
 *   note:         optional short text shown under the price
 */
export const SERVICE_PRICING = {
  'facilities-planning': { startingFrom: null, unit: 'per project', note: '' },
  'project-management': { startingFrom: null, unit: 'per project', note: '' },
  'model-supplies': { startingFrom: null, unit: 'per order', note: '' },
}

export const CURRENCY = 'AED'

// Optional: number of days an emailed estimate stays valid. Leave null to not mention validity.
export const ESTIMATE_VALIDITY_DAYS = null

export function formatPrice(amount) {
  return `${CURRENCY} ${Number(amount).toLocaleString('en-AE', { maximumFractionDigits: 2 })}`
}

export function getPricing(serviceId) {
  const p = SERVICE_PRICING[serviceId]
  if (!p) return null
  return { ...p, hasPrice: typeof p.startingFrom === 'number' && p.startingFrom > 0 }
}

export function priceLabel(serviceId) {
  const p = getPricing(serviceId)
  if (!p || !p.hasPrice) return 'Price on request'
  return `From ${formatPrice(p.startingFrom)}${p.unit ? ` ${p.unit}` : ''}`
}
