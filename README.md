# SR Enterprise Website

Corporate website for **Sunil Rana Enterprise FZE LLC**, Ajman, UAE.
Built with React 18, Vite 7, React Router 7, Tailwind CSS 3 and Lucide icons. No database, no paid APIs, no backend.

---

## 1. Run it locally

Requires Node.js 20.19 or newer (Netlify builds with Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build at http://localhost:4173
```

Note: the enquiry form's "Submit Request" button only delivers submissions once the site is hosted on Netlify. Locally they show the
error message with email/WhatsApp fallbacks, which is expected.

## 2. Project structure

```
index.html                  SEO meta, Open Graph, schema.org data, hidden Netlify form definitions
netlify.toml                Build settings, SPA redirect, security headers
scripts/seo-files-plugin.js Generates sitemap.xml + robots.txt at build time
scripts/brand/              Source for the OG image and PNG favicons (optional re-render)
public/                     favicon.svg, PNG icons, og-image.png, web manifest
src/
  config/company.js         ALL company details (name, address, phone, email, licence)
  config/services.js        The three licensed services, features and images
  config/payments.js        Online payments (Ziina Pay Online page) on/off
netlify/functions/         Server function that creates Ziina payments (needs a GitHub deploy)
  config/legal.js           Toggle for "Owner review required" notes on policy pages
  components/               Header, Footer, Logo, forms, layout, etc.
  sections/                 Home page sections (Hero, About, Services, Why Us, Quote, Invoice, Contact)
  pages/                    Home, Privacy, Terms, Refund, Payment success/cancel, 404
  utils/                    WhatsApp message builder, Netlify form submit, validation
```

To change a phone number, email or address, edit `src/config/company.js` only.
The schema.org block and the `<noscript>` text in `index.html` also contain the contact details; update them too.

## 3. Put the code on GitHub

```bash
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin https://github.com/<your-account>/sr-enterprise-website.git
git push -u origin main
```

## 4. Deploy on Netlify

### Option A: drag and drop (no GitHub needed)

1. Run `npm run build` (or use the ready-made `sr-enterprise-netlify-drop.zip`, unzipped).
2. Go to https://app.netlify.com/drop and drag the `dist` folder (the unzipped folder) onto the page.
3. `_redirects` and `_headers` inside the folder handle page routing and security headers.
4. Turn on **Forms → Enable form detection** for the site, then drag the folder in again once
   (Site → **Deploys** → drag the folder onto the deploys area) so Netlify registers the forms.

To update the site later, drag a new build onto the **Deploys** page of the same site.
Once you have a domain, build with `SITE_URL=https://www.yourdomain.com VITE_SITE_URL=https://www.yourdomain.com npm run build`
so `sitemap.xml` and absolute share links are included.

### Option B: from GitHub (auto-deploys on every push)

1. Sign in at https://app.netlify.com and choose **Add new site → Import an existing project**.
2. Connect GitHub and pick the repository.
3. Netlify reads `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy**. Your site is live at `https://<random-name>.netlify.app` (you can rename it under
   **Site configuration → Site details → Change site name**).

Every push to `main` redeploys automatically.

### Turn on form notifications

Netlify detects the single form (`enquiry`) on the first deploy. It covers quotes, invoice requests and general
enquiries; the `requestType` field in each submission shows which one the customer chose.

1. Go to **Site configuration → Forms** (enable form detection if prompted, then redeploy once).
2. Submissions appear under the **Forms** tab.
3. Under **Forms → Form notifications → Add notification → Email notification**, send the form to
   `admin@srenterprisefz.com`.

Spam protection: a hidden honeypot field is already included. Netlify's free tier includes a monthly submission
allowance; check your plan for current limits.

The form's **Send on WhatsApp** button skips Netlify and opens WhatsApp with the same details pre-filled to +971551436877.

The map location is set in `src/config/company.js` (`mapsUrl` / `mapEmbedUrl`). To pin your exact office, paste your
own Google Maps share link and "Embed a map" URL there.

## 5. Connect a custom domain

1. Buy a domain from any registrar (e.g. a `.com` or `.ae` domain).
2. In Netlify: **Domain management → Add a domain** and enter it (e.g. `www.yourdomain.com`).
3. Either:
   - **Use Netlify DNS (simplest):** change the domain's nameservers at your registrar to the four Netlify
     nameservers shown, or
   - **Keep your registrar's DNS:** add a `CNAME` record for `www` pointing to `<your-site>.netlify.app`, and for the
     bare domain an `A` record to Netlify's load balancer IP shown in the Netlify UI (or an `ALIAS`/`ANAME` record
     if your registrar supports it).
4. Netlify issues a free HTTPS certificate automatically once DNS resolves (can take up to 24–48 hours).
5. Set the domain as primary in Netlify, then add an environment variable under
   **Site configuration → Environment variables**:
   ```
   SITE_URL=https://www.yourdomain.com
   VITE_SITE_URL=https://www.yourdomain.com
   ```
   and trigger a redeploy. This updates the canonical links, Open Graph tags, structured data, `sitemap.xml` and
   `robots.txt`. (Without it, Netlify's own site URL is used automatically.)
6. Submit `https://www.yourdomain.com/sitemap.xml` in Google Search Console, and create a Google Business Profile
   for the Ajman address to help local search.

## 6. Estimated prices

Edit `src/config/pricing.js`. For each service set `startingFrom` (a number in AED) and `unit`
(e.g. `'per project'`, `'per hour'`, `'per order'`). Services left as `null` show **"Price on request"**.
Prices appear on each service card, in the enquiry form when a service is selected, in the WhatsApp message and in
the client email. They are always labelled as estimates.

## 7. Automatic client emails (Estimate / Proforma)

When a client submits a **Quote** or **Invoice** request with "Submit Request", the site can automatically email
them a branded **Quotation Estimate** or **Proforma / Order Request** (clearly marked as not a tax invoice and not a
payment receipt), with a copy to you. It uses **EmailJS** (free plan, sends from your own Gmail) and works with
Netlify drag-and-drop deploys.

1. Create a free account at https://www.emailjs.com.
2. **Email Services → Add New Service**, pick the provider that hosts `admin@srenterprisefz.com` (e.g. Google Workspace, Outlook/Microsoft 365 or SMTP) and connect it, copy the **Service ID**.
3. **Email Templates → Create New Template**:
   - Subject: `{{subject}}`
   - Content: switch to the code/HTML editor and enter exactly `{{{html_body}}}` (three braces)
   - To Email: `{{to_email}}`
   - From Name: `SR Enterprise` · Reply To: `admin@srenterprisefz.com` · Bcc: `admin@srenterprisefz.com`
   - Save, copy the **Template ID**.
4. **Account → General**: copy the **Public Key**. Under **Account → Security**, restrict it to your website domain.
5. Paste the three values into `src/config/email.js`, set `EMAIL_AUTOREPLY_ENABLED = true`, run `npm run build`
   and upload the new `dist` folder.

If the email service fails, the request is still saved in Netlify Forms and the client is told your team will
contact them. Check the EmailJS free plan's monthly email limit on their pricing page.

## 8. Online payments with Ziina (Pay Online page)

Clients open **https://srenterprisefz.com/pay**, enter their invoice/reference number and how much they want to pay
now (full or part payment, minimum AED 2), and pay by card on Ziina's secure form. The website never sees card
details. "Pay Online" is in the menu and footer. You can also send a client a pre-filled link, for example
`https://srenterprisefz.com/pay?ref=SR-20261105-ABC&amount=2500` (they can still change the amount).

**Payments need a GitHub deploy.** The payment uses a Netlify Function (`netlify/functions/start-payment.mjs`) that
keeps the Ziina token secret. Drag-and-drop deploys do not run functions, so deploy this site from GitHub
(section 4, Option B). Netlify Forms keep working the same way.

Netlify → **Project configuration → Environment variables**:

| Variable | Value |
|---|---|
| `ZIINA_API_TOKEN` | API token from https://ziina.com/business/connect (needs `write_payment_intents`) |
| `ZIINA_MODE` | leave out while testing (all payments are Ziina **test** payments, no money moves); set to `live` for real payments |
| `ZIINA_EMBEDDED` | optional, `true` to show Ziina's form inside the page. Only after Ziina approves your domain |
| `PAY_MAX_AED` | optional, largest single payment (default 100000) |

Then **Deploys → Trigger deploy**.

**Embedded checkout (Ziina's form inside your page):**
1. Ask Ziina support to approve `srenterprisefz.com` (and `www.`) for embedded checkout.
2. The Apple Pay domain verification file from Ziina's docs is already included at
   `public/.well-known/apple-developer-merchantid-domain-association` and is served as plain text at
   `https://srenterprisefz.com/.well-known/apple-developer-merchantid-domain-association`. Tell Ziina once it is live.
3. Set `ZIINA_EMBEDDED` = `true` and redeploy.

Until then clients are sent to Ziina's own payment page and come back to `/payment/success` or `/payment/cancel`.

Each payment shows in your Ziina account with the message "Invoice <reference> - <name>". The site has no database,
so it does not add up part payments or check them against invoice totals: always confirm payments (and how much
has been paid on an invoice) in your Ziina account, never from the website's success page.

Security: the token is only read inside the function and only sent to `api-v2.ziina.com`; the function accepts only
same-site JSON POSTs and is rate-limited to 20 attempts a minute per IP; the Content-Security-Policy allows only
`pay.ziina.com` to be embedded for payments. Set `PAYMENTS_ENABLED = false` in `src/config/payments.js` to hide the
Pay Online page and links.

## 9. Before going live: checklist

- [ ] Review the three policy pages. Each item marked **"Owner review required"** needs your (ideally legal)
      confirmation. When done, set `SHOW_POLICY_REVIEW_NOTES = false` in `src/config/legal.js`.
- [ ] Do not add a VAT/TRN number anywhere unless the company is registered with the Federal Tax Authority.
- [ ] Replace the stock photos with your own if you prefer (see below).
- [ ] Set up Netlify form email notifications.
- [ ] Set `SITE_URL` / `VITE_SITE_URL` once your domain is connected.
- [ ] Test each form and WhatsApp button on a phone.

## 10. Images

Service and hero photos are free-to-use Unsplash images loaded from `images.unsplash.com`, sized and compressed via
URL parameters and lazy-loaded below the fold. If an image ever fails to load, a branded navy/gold placeholder is
shown instead, so the layout never breaks.

To use your own photos, put them in `public/images/` (WebP or JPG, ~1600px wide for the hero, ~1200px for others)
and change the `src` values in `src/config/services.js`, `src/sections/Hero.jsx` and `src/sections/About.jsx` to
e.g. `/images/hero.webp`.

## 11. Brand assets

- Logo: `src/components/Logo.jsx` (SVG mark + text, no image files needed)
- Favicon: `public/favicon.svg` plus PNG fallbacks
- Social share image: `public/og-image.png` (1200×630)

To re-render the PNGs after editing `scripts/brand/og-image.html` or `public/favicon.svg`:
`npm i -D playwright && npx playwright install chromium && node scripts/brand/render.cjs`
