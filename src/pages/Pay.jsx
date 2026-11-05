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

/**
 * Pay Online: the client enters their invoice/reference number and how much they want to pay now
 * (full or part payment) and pays on Ziina's secure form, embedded here or on Ziina's own page.
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
      amount: Number.isFinite(amount) && amount >= MIN_PAYMENT_AED ? amount.toFixed(2) : '',
    }
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | embedded | error
  const [message, setMessage] = useState('')
  const [checkout, setCheckout] = useState(null) // { url, amount }
  const frameRef = useRef(null)

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

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const reference = cleanRef(values.reference)
    const amount = Math.round(Number(values.amount) * 100) / 100
    const errs = {}
    if (reference.length < 2) errs.reference = 'Please enter the invoice or reference number from your invoice.'
    if (!Number.isFinite(amount) || amount < MIN_PAYMENT_AED) errs.amount = `Please enter at least AED ${fmt(MIN_PAYMENT_AED)}.`
    setErrors(errs)
    if (Object.keys(errs).length) return

    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/start-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, name: values.name.trim(), amount }),
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
      if (data.embedded && url.origin === ZIINA_ORIGIN) {
        url.searchParams.set('version', 'v1')
        setCheckout({ url: url.toString(), amount })
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
    <PayShell wide={status === 'embedded'}>
      {status === 'embedded' && checkout ? (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-navy-700">
              Paying <strong className="text-navy-900">AED {fmt(checkout.amount)}</strong> for{' '}
              <strong className="font-mono text-navy-900">{cleanRef(values.reference)}</strong>
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
          <iframe
            ref={frameRef}
            src={checkout.url}
            title="Ziina secure payment"
            allow="payment"
            className="mx-auto block h-[820px] w-full max-w-[450px] border-0"
          />
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
            required
            placeholder="e.g. SR-20261105-ABC"
            autoComplete="off"
            hint="You will find it at the top of your invoice."
          />
          <FormField
            label="Your name or company"
            name="name"
            value={values.name}
            onChange={set('name')}
            maxLength={80}
            autoComplete="organization"
          />
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

function PayShell({ children, wide = false }) {
  return (
    <section className="bg-navy-50/60 pb-20 pt-36">
      <div className="container-x">
        <div className={`mx-auto rounded-2xl bg-white p-6 shadow-card ring-1 ring-navy-100 sm:p-10 ${wide ? 'max-w-2xl' : 'max-w-xl'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Invoice payment</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-navy-900">Pay Online</h1>
          <div className="mt-6">{children}</div>
          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-navy-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
            Card details are entered only on Ziina’s secure payment form. This website never sees or stores your card details.
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
