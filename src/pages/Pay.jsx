import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CreditCard, Loader2, Lock, ShieldCheck, ArrowLeft, Mail } from 'lucide-react'
import FormField from '../components/FormField'
import { ErrorBanner } from '../components/FormStatus'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { useSeo } from '../hooks/useSeo'
import { COMPANY, EMAIL_HREF } from '../config/company'
import { MIN_PAYMENT_AED, PAYMENTS_ENABLED, ZIINA_ORIGIN } from '../config/payments'
import { whatsappLink } from '../utils/whatsapp'

const fmt = (v) => v.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const cleanRef = (v) => String(v || '').replace(/[^A-Za-z0-9_/-]/g, '').slice(0, 60)

const PIXEL_ID = 'paymob-pixel'

const GATEWAYS = {
  ziina: { label: 'Ziina', note: 'Card, Apple Pay or Google Pay' },
  paymob: { label: 'Paymob', note: 'Card, Apple Pay and more' },
}

/**
 * Pay Online: the client enters their invoice/reference number and how much they want to pay now
 * (full or part payment), picks a gateway when more than one is set up (Ziina or Paymob), and pays on
 * that gateway's secure form, shown inside this page (Ziina's embedded form when ZIINA_EMBEDDED is on, Paymob Pixel).
 */
export default function Pay() {
  useSeo({
    title: 'Pay Online | SR Enterprise',
    description: 'Pay your Sunil Rana Enterprise invoice online by card.',
    path: '/pay',
    noindex: true,
  })
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [values, setValues] = useState(() => {
    const amount = Number(params.get('amount'))
    return {
      reference: cleanRef(params.get('ref')),
      name: '',
      email: '',
      phone: '',
      amount: Number.isFinite(amount) && amount >= MIN_PAYMENT_AED ? amount.toFixed(2) : '',
    }
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | embedded | error
  const [message, setMessage] = useState('')
  const [checkout, setCheckout] = useState(null) // { url, amount, pixel? }
  const frameRef = useRef(null)
  // Which gateways are set up in Netlify. Until we know, assume Ziina (the original setup).
  const [methods, setMethods] = useState({ ziina: true, paymob: false })
  const [provider, setProvider] = useState('ziina')

  useEffect(() => {
    let alive = true
    fetch('/api/payment-methods', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!alive || !m) return
        const next = { ziina: Boolean(m.ziina), paymob: Boolean(m.paymob) }
        if (!next.ziina && !next.paymob) return
        setMethods(next)
        setProvider((p) => (next[p] ? p : next.ziina ? 'ziina' : 'paymob'))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  const both = methods.ziina && methods.paymob
  const isPaymob = provider === 'paymob'

  // Ziina's embedded form tells the page when the payment status changes.
  useEffect(() => {
    if (status !== 'embedded') return undefined
    function onMessage(event) {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow || event.origin !== ZIINA_ORIGIN) return
      const { type, data } = event.data || {}
      if (type !== 'ZIINA_PAYMENT_STATUS_CHANGE') return
      const state = String(data?.status || '').toUpperCase()
      if (state === 'COMPLETED') navigate('/payment/success')
      else if (state === 'FAILED' || state === 'CANCELED' || state === 'CANCELLED') {
        setCheckout(null)
        setStatus('error')
        setMessage(state === 'FAILED' ? 'The payment did not go through. You can try again.' : 'The payment was cancelled.')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [status, navigate])

  // Paymob Pixel: Paymob's card form shown inside this page. Card fields are Paymob's own iframes.
  // The SDK is large, so it is only loaded when a client actually pays with Paymob.
  useEffect(() => {
    if (status !== 'embedded' || !checkout?.pixel) return undefined
    let cancelled = false
    import('paymob-pixel')
      .then(() => {
        if (cancelled) return
        const el = document.getElementById(PIXEL_ID)
        if (el) el.innerHTML = ''
        // After paying, Pixel sends the browser to /api/paymob/callback, which checks the result and opens
        // /payment/success or /payment/cancel.
        new window.Pixel({
          publicKey: checkout.pixel.publicKey,
          clientSecret: checkout.pixel.clientSecret,
          paymentMethods: ['card'],
          elementId: PIXEL_ID,
          showSaveCard: false,
          customStyle: { Color_Primary: '#121e36', Width_of_Container: '100%', Radius_Border: '8' },
        })
      })
      .catch(() => {
        // If the embedded form cannot load, fall back to Paymob's own checkout page.
        if (!cancelled) window.location.assign(checkout.url)
      })
    return () => {
      cancelled = true
    }
  }, [status, checkout])

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const reference = cleanRef(values.reference)
    const amount = Math.round(Number(values.amount) * 100) / 100
    const errs = {}
    if (reference.length === 1) errs.reference = 'Please enter the full invoice number, or leave it empty.'
    if (!Number.isFinite(amount) || amount < MIN_PAYMENT_AED) errs.amount = `Please enter at least AED ${fmt(MIN_PAYMENT_AED)}.`
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errs.email = 'Please enter a valid email address.'
    if (isPaymob) {
      if (values.phone.replace(/\D/g, '').length < 7) errs.phone = 'Please enter your mobile number.'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return

    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/start-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          reference,
          name: values.name.trim(),
          amount,
          email: values.email.trim(),
          ...(isPaymob ? { phone: values.phone.trim() } : {}),
        }),
      })
      let data = {}
      try {
        data = await res.json()
      } catch {
        /* not JSON */
      }
      if (res.status === 404) throw new Error('Online payment is not available yet. Please contact us on WhatsApp or email.')
      if (!res.ok || !data.url) throw new Error(data.error || 'We could not open the payment page right now. Please try again or contact us.')
      const url = new URL(data.url)
      if (url.protocol !== 'https:') throw new Error('Unexpected payment address. Please contact us.')
      if (isPaymob && data.embedded && data.pixel?.publicKey && data.pixel?.clientSecret) {
        setCheckout({ url: url.toString(), amount, pixel: data.pixel, reference: data.reference || reference })
        setStatus('embedded')
        return
      }
      if (!isPaymob && data.embedded && url.origin === ZIINA_ORIGIN) {
        url.searchParams.set('version', 'v1')
        setCheckout({ url: url.toString(), amount, reference: data.reference || reference })
        setStatus('embedded')
        return
      }
      window.location.assign(url.toString())
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  if (!PAYMENTS_ENABLED) {
    return (
      <PayShell>
        <p className="text-sm text-navy-600">
          Online payments are not active yet. Please contact us and our team will share payment instructions.
        </p>
      </PayShell>
    )
  }

  return (
    <PayShell wide={status === 'embedded'} gateway={both ? null : GATEWAYS[provider].label}>
      {status === 'embedded' && checkout ? (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-navy-700">
              Paying <strong className="text-navy-900">AED {fmt(checkout.amount)}</strong> for{' '}
              <strong className="font-mono text-navy-900">{checkout.reference || cleanRef(values.reference)}</strong>
            </p>
            <button
              type="button"
              className="text-sm font-medium text-gold-700 underline"
              onClick={() => {
                setCheckout(null)
                setStatus('idle')
              }}
            >
              Change amount
            </button>
          </div>
          {checkout.pixel ? (
            <div id={PIXEL_ID} className="mx-auto min-h-[360px] w-full max-w-[450px]">
              <p className="flex items-center justify-center gap-2 py-16 text-sm text-navy-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading secure card form…
              </p>
            </div>
          ) : (
            <iframe
              ref={frameRef}
              src={checkout.url}
              title="Ziina secure payment"
              allow="payment"
              className="mx-auto block h-[820px] w-full max-w-[450px] border-0"
            />
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {status === 'error' && message && <ErrorBanner>{message}</ErrorBanner>}
          <FormField
            label="Invoice / reference number"
            name="reference"
            value={values.reference}
            onChange={set('reference')}
            error={errors.reference}
            placeholder="e.g. SR-20261105-ABC"
            autoComplete="off"
            hint="From the top of your invoice. No invoice number? Leave it empty and we will create one for you."
          />
          <FormField
            label="Your name or company"
            name="name"
            value={values.name}
            onChange={set('name')}
            maxLength={80}
            autoComplete="organization"
          />
          <div className={isPaymob ? 'grid gap-5 sm:grid-cols-2' : ''}>
            <FormField
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={set('email')}
              error={errors.email}
              required
              maxLength={120}
              autoComplete="email"
              hint={isPaymob ? undefined : 'Your payment receipt will be emailed here.'}
            />
            {isPaymob && (
              <FormField
                label="Mobile number"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={set('phone')}
                error={errors.phone}
                required
                maxLength={16}
                placeholder="+971 50 000 0000"
                autoComplete="tel"
              />
            )}
          </div>
          <FormField
            label="Amount to pay now (AED)"
            name="amount"
            type="number"
            inputMode="decimal"
            min={MIN_PAYMENT_AED}
            step="0.01"
            value={values.amount}
            onChange={set('amount')}
            error={errors.amount}
            required
            placeholder="0.00"
            hint={`Pay the full invoice amount or a part payment (minimum AED ${fmt(MIN_PAYMENT_AED)}).`}
          />
          {both && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-navy-800">Pay with</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(GATEWAYS).map(([key, g]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                      provider === key ? 'border-gold-400 bg-gold-50/50 ring-2 ring-gold-400' : 'border-navy-200 hover:border-navy-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={key}
                      checked={provider === key}
                      onChange={() => {
                        setProvider(key)
                        setErrors({})
                      }}
                      className="mt-1 accent-navy-900"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-navy-900">{g.label}</span>
                      <span className="block text-xs text-navy-500">{g.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <button type="submit" className="btn-navy w-full justify-center" disabled={status === 'submitting'}>
            {status === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening secure payment…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" aria-hidden="true" /> Continue to secure payment
                <Lock className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </PayShell>
  )
}

function PayShell({ children, wide = false, gateway = null }) {
  return (
    <section className="bg-navy-50/60 pb-20 pt-36">
      <div className="container-x">
        <div className={`mx-auto rounded-2xl bg-white p-6 shadow-card ring-1 ring-navy-100 sm:p-10 ${wide ? 'max-w-2xl' : 'max-w-xl'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Invoice payment</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-navy-900">Pay Online</h1>
          <div className="mt-6">{children}</div>
          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-navy-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
            Card details are entered only on {gateway ? `${gateway}’s secure payment form` : 'the secure payment form of Ziina or Paymob'}.
            This website never sees or stores your card details.
          </p>
          <div className="mt-6 flex flex-col gap-3 border-t border-navy-100 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="inline-flex items-center gap-1.5 text-navy-600 hover:text-navy-900">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Home
            </Link>
            <div className="flex flex-wrap gap-4">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-navy-600 hover:text-navy-900">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
              <a href={EMAIL_HREF} className="inline-flex items-center gap-1.5 break-all text-navy-600 hover:text-navy-900">
                <Mail className="h-4 w-4" aria-hidden="true" /> {COMPANY.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
