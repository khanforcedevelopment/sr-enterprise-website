export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim())

// Accepts UAE and international numbers: digits, spaces, dashes, brackets and a leading +.
export const isPhone = (v) => {
  const s = String(v).trim()
  return /^\+?[\d\s()-]{7,20}$/.test(s) && s.replace(/\D/g, '').length >= 7
}

export function validate(values, rules) {
  const errors = {}
  for (const [field, checks] of Object.entries(rules)) {
    const value = values[field] ?? ''
    for (const [test, message] of checks) {
      if (!test(value, values)) {
        errors[field] = message
        break
      }
    }
  }
  return errors
}

export const required = (v) => String(v).trim().length > 0
export const maxLen = (n) => (v) => String(v).length <= n
export const optionalAmount = (v) => !String(v).trim() || /^\d+(\.\d{1,2})?$/.test(String(v).replace(/,/g, '').trim())
