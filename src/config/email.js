/**
 * AUTOMATIC CLIENT EMAILS (EmailJS, free plan)
 * --------------------------------------------
 * When a client submits a Quote or Invoice request, the website emails them an
 * Estimate / Proforma (not a tax invoice) from your own Gmail account, with a copy to you.
 * Works on Netlify drag-and-drop deploys: no server, no paid API.
 *
 * Setup (see README "Automatic client emails"):
 *   1. Create a free account at https://www.emailjs.com
 *   2. Email Services > Add New Service > choose your email provider for admin@srenterprisefz.com  -> copy the Service ID
 *   3. Email Templates > Create New Template:
 *        Subject:    {{subject}}
 *        Content:    switch the editor to code view and enter exactly:  {{{html_body}}}
 *        To Email:   {{to_email}}
 *        From Name:  SR Enterprise
 *        Reply To:   admin@srenterprisefz.com
 *        Bcc:        admin@srenterprisefz.com     (so you receive a copy of every estimate)
 *      Save and copy the Template ID
 *   4. Account > General > copy the Public Key
 *   5. Paste the three values below, set EMAIL_AUTOREPLY_ENABLED = true, rebuild and redeploy.
 *
 * The Public Key is designed to be public. In EmailJS > Account > Security, add your website
 * domain to the allow-list so nobody else can use it.
 */
export const EMAIL_AUTOREPLY_ENABLED = false

export const EMAILJS = {
  serviceId: '', // e.g. 'service_abc123'
  templateId: '', // e.g. 'template_xyz789'
  publicKey: '', // e.g. 'AbCdEf123456'
}
