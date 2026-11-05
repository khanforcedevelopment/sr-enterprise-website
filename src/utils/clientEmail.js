import { EMAIL_AUTOREPLY_ENABLED, EMAILJS } from '../config/email'

export const clientEmailConfigured = () =>
  EMAIL_AUTOREPLY_ENABLED && Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey)

// Sends the estimate/proforma to the client through EmailJS's REST API (no SDK needed).
export async function sendClientEmail({ toEmail, toName, subject, html, reference }) {
  if (!clientEmailConfigured()) return false
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: { to_email: toEmail, to_name: toName, subject, html_body: html, reference },
    }),
  })
  if (!response.ok) throw new Error(`Email failed (${response.status}): ${await response.text()}`)
  return true
}
