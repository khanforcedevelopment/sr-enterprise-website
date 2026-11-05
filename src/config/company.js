// Building's full street address (as published by ANC Free Zone, which is headquartered in the same tower)
const MAPS_QUERY = 'Amber Gem Tower, Sheikh Khalifa Bin Zayed St, Al Rashidiya 3, Ajman, United Arab Emirates'

// Single source of truth for company details. Update here and the whole site follows.
export const COMPANY = {
  name: 'Sunil Rana Enterprise FZE LLC',
  shortName: 'SR Enterprise',
  logoText: 'SR ENTERPRISE',
  logoSubtitle: 'SUNIL RANA ENTERPRISE FZE LLC',
  city: 'Ajman',
  country: 'United Arab Emirates',
  addressLines: ['BC-894507, 26th Floor', 'Amber Gem Tower', 'Ajman, United Arab Emirates'],
  addressOneLine: 'BC-894507, 26th Floor, Amber Gem Tower, Ajman, United Arab Emirates',
  email: 'admin@srenterprisefz.com',
  phoneDisplay: '+971 55 143 6877',
  phoneE164: '+971551436877',
  whatsappNumber: '971551436877',
  licensingAuthority: 'ANC Free Zone, Ajman',
  licenseNumber: '2627921920888',
  establishmentDate: 'October 15, 2026',
  // Map location. For a pin on your exact office, open Google Maps, search your building,
  // tap Share > "Copy link" and paste it as mapsUrl; for the embed use Share > "Embed a map" > copy the src="..." value.
  mapsQuery: MAPS_QUERY,
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(MAPS_QUERY),
  mapEmbedUrl: 'https://maps.google.com/maps?q=' + encodeURIComponent(MAPS_QUERY) + '&z=17&output=embed',
}

export const PHONE_HREF = `tel:${COMPANY.phoneE164}`
export const EMAIL_HREF = `mailto:${COMPANY.email}`

// Public site URL for canonical links. Falls back to the current origin in the browser.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/$/, '')
