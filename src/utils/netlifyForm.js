// Submits a form to Netlify Forms. Works on any Netlify-hosted deploy; no backend required.
export async function submitNetlifyForm(formName, values) {
  const body = new URLSearchParams({ 'form-name': formName, ...values }).toString()
  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    throw new Error(`Form submission failed (${response.status})`)
  }
  return true
}
