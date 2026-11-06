import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Send, Loader2, FileText, Receipt, MessageSquare, ShieldCheck, Info, ExternalLink, CreditCard } from 'lucide-react'
import SectionHeading from '../components/SectionHeading'
import FormField from '../components/FormField'
import Reveal from '../components/Reveal'
import WhatsAppIcon from '../components/WhatsAppIcon'
import PaymentButton from '../components/PaymentButton'
import { SuccessPanel, ErrorBanner } from '../components/FormStatus'
import { SERVICES, SERVICE_OPTIONS } from '../config/services'
import { PAYMENTS_ENABLED } from '../config/payments'
import { COMPANY, EMAIL_HREF } from '../config/company'
import { submitNetlifyForm } from '../utils/netlifyForm'
import { whatsappLink, enquiryMessage, makeRequestReference, REQUEST_TYPES } from '../utils/whatsapp'
import { validate, required, isEmail, isPhone, maxLen } from '../utils/validation'
import { priceLabel } from '../config/pricing'
import { buildEstimate } from '../utils/estimate'
import { sendClientEmail, clientEmailConfigured } from '../utils/clientEmail'

const FORM_NAME = 'enquiry'

const TYPE_OPTIONS = [
  { value: 'quote', icon: FileText, hint: 'Get a price for a service' },
  { value: 'invoice', icon: Receipt, hint: 'Ask us to issue an invoice' },
  { value: 'general', icon: MessageSquare, hint: 'Any other question' },
]

const EMPTY = {
  requestType: 'quote',
  fullName: '',
  companyName: '',
  email: '',
  mobile: '',
  service: '',
  message: '',
  amount: '',
}

const FIELD_COPY = {
  quote: {
    message: ['Project Description', 'Scope, location, timeline and any specific requirements'],
    amount: ['Estimated Budget', 'e.g. AED 10,000 – 20,000'],
  },
  invoice: {
    message: ['Service Description', 'What should the invoice cover? e.g. scope, quantities, agreed quotation reference'],
    amount: ['Amount (AED)', 'If an amount has already been agreed, enter it here'],
  },
  general: {
    message: ['Message', 'How can we help you?'],
    amount: null,
  },
}

const rulesFor = (type) => ({
  fullName: [[required, 'Please enter your full name.'], [maxLen(100), 'Name is too long.']],
  email: [[required, 'Please enter your email address.'], [isEmail, 'Please enter a valid email address.']],
  mobile: [[required, 'Please enter your mobile number.'], [isPhone, 'Please enter a valid mobile number, e.g. +971 50 123 4567.']],
  service: type === 'general' ? [] : [[required, 'Please select a service.']],
  message: [[required, 'Please add a few details.'], [maxLen(3000), 'Please keep this under 3000 characters.']],
  amount: [[maxLen(60), 'Please keep this short.']],
})

export default function Enquiry() {
  const [params] = useSearchParams()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | sent | whatsapp | error
  const [result, setResult] = useState(null)
  const [botField, setBotField] = useState('')

  // Pre-fill from links such as /?service=project-management&type=invoice#enquiry
  useEffect(() => {
    const match = SERVICES.find((s) => s.id === params.get('service'))
    const type = params.get('type')
    setValues((v) => ({
      ...v,
      ...(match ? { service: match.title } : {}),
      ...(REQUEST_TYPES[type] ? { requestType: type } : {}),
    }))
  }, [params])

  const copy = FIELD_COPY[values.requestType]
  const selectedService = SERVICES.find((s) => s.title === values.service)

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }))
  }

  const check = () => {
    const found = validate(values, rulesFor(values.requestType))
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`enquiry-${Object.keys(found)[0]}`)?.focus()
      return false
    }
    return true
  }

  const finish = (nextStatus, reference, extra = {}) => {
    const serviceId = SERVICES.find((s) => s.title === values.service)?.id
    setResult({ reference, type: values.requestType, serviceId, email: values.email, ...extra })
    setStatus(nextStatus)
    setValues({ ...EMPTY, requestType: values.requestType })
  }

  // Primary: send through Netlify Forms (arrives in Netlify + email notification)
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!check()) return
    const reference = makeRequestReference()
    setStatus('submitting')
    try {
      const estimate = values.requestType === 'general' ? null : buildEstimate(values, reference)
      await submitNetlifyForm(FORM_NAME, {
        ...values,
        requestType: REQUEST_TYPES[values.requestType].label,
        reference,
        estimatedPrice: estimate ? estimate.priceLine.value : '',
        'bot-field': botField,
      })
      // Email the estimate/proforma to the client. The request is already saved, so an email
      // failure is reported to the client but does not undo the submission.
      let emailStatus = 'off'
      if (estimate && clientEmailConfigured()) {
        try {
          await sendClientEmail({ toEmail: values.email, toName: values.fullName, subject: estimate.subject, html: estimate.html, reference })
          emailStatus = 'sent'
        } catch (err) {
          console.error(err)
          emailStatus = 'failed'
        }
      }
      finish('sent', reference, { emailStatus, docTitle: estimate?.docTitle })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  // Alternative: open WhatsApp with the same details pre-filled
  const onWhatsApp = () => {
    if (!check()) return
    const reference = makeRequestReference()
    const url = whatsappLink(enquiryMessage(values, reference))
    window.open(url, '_blank', 'noopener,noreferrer')
    finish('whatsapp', reference, { url })
  }

  return (
    <section id="enquiry" className="section bg-navy-50/60">
      <div className="container-x">
        <SectionHeading
          eyebrow="Enquiry Form"
          title="Request a quote, an invoice or ask us anything"
          intro="One simple form for every request. Send it to us directly, or send the same details on WhatsApp."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          <Reveal className="order-last space-y-6 lg:order-first lg:col-span-1">
            <div className="rounded-2xl bg-navy-900 p-7 text-white shadow-card">
              <h3 className="font-serif text-xl font-semibold">How it works</h3>
              <ol className="mt-5 space-y-4 text-sm text-navy-100">
                {[
                  'Choose what you need: a quote, an invoice or a general enquiry.',
                  'Fill in your details and pick the service.',
                  'Press “Submit Request”, or “Send on WhatsApp” to message us directly.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-950">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-gold-200 bg-white p-7 shadow-card">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-gold-600" aria-hidden="true" />
                <h3 className="font-serif text-lg font-semibold text-navy-900">Invoices &amp; payments</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-navy-600">
                {PAYMENTS_ENABLED
                  ? 'Once you receive your invoice, you can pay the full amount or a part payment online by card through our secure payment providers (Ziina or Stripe).'
                  : 'Online card payment is not available yet. Request an invoice and our team will share the payment instructions with you directly.'}
              </p>
              {PAYMENTS_ENABLED && <PaymentButton className="mt-5 w-full" />}
              <p className="mt-4 flex items-start gap-2 text-xs text-navy-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
                This website does not collect or store any card or bank details.
              </p>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-2">
            <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card sm:p-10">
              {status === 'sent' && result && (
                <SuccessPanel title="Thank you, your request has been received" onReset={() => setStatus('idle')}>
                  <p>
                    Our team will review it and contact you shortly. Your reference is{' '}
                    <strong className="font-mono text-navy-900">{result.reference}</strong>.
                  </p>
                  {result.emailStatus === 'sent' && (
                    <p className="mt-3">
                      A copy of your {result.docTitle?.toLowerCase()} has been emailed to <strong>{result.email}</strong>.
                    </p>
                  )}
                  {result.emailStatus === 'failed' && (
                    <p className="mt-3 text-xs text-navy-500">
                      We could not email you a copy right now, but your request has been received and our team will contact you.
                    </p>
                  )}
                  {result.type === 'invoice' && (
                    <p className="mt-3 text-xs text-navy-500">This is a request only. No tax invoice has been issued and no payment has been taken.</p>
                  )}
                </SuccessPanel>
              )}

              {status === 'whatsapp' && result && (
                <SuccessPanel title="Your message is ready in WhatsApp" onReset={() => setStatus('idle')} resetLabel="Start a new request">
                  <p>
                    Please press <strong>send</strong> in WhatsApp to deliver it to our team. Your reference is{' '}
                    <strong className="font-mono text-navy-900">{result.reference}</strong>.
                  </p>
                  {result.type === 'invoice' && (
                    <p className="mt-3 text-xs text-navy-500">This is a request only. No invoice has been issued and no payment has been taken.</p>
                  )}
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="btn-whatsapp justify-center">
                      <WhatsAppIcon className="h-4 w-4" />
                      Open WhatsApp again
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </SuccessPanel>
              )}

              {(status === 'idle' || status === 'submitting' || status === 'error') && (
                <form
                  name={FORM_NAME}
                  method="POST"
                  data-netlify="true"
                  netlify-honeypot="bot-field"
                  onSubmit={onSubmit}
                  noValidate
                  className="grid gap-5 sm:grid-cols-2"
                >
                  <input type="hidden" name="form-name" value={FORM_NAME} />
                  <p className="hidden" aria-hidden="true">
                    <label>
                      Do not fill this out:{' '}
                      <input name="bot-field" value={botField} onChange={(e) => setBotField(e.target.value)} tabIndex={-1} autoComplete="off" />
                    </label>
                  </p>

                  <fieldset className="sm:col-span-2">
                    <legend className="mb-2 block text-sm font-medium text-navy-800">
                      What do you need?<span className="ml-0.5 text-gold-600" aria-hidden="true">*</span>
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {TYPE_OPTIONS.map(({ value, icon: Icon, hint }) => {
                        const active = values.requestType === value
                        return (
                          <label
                            key={value}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                              active ? 'border-gold-400 bg-gold-50 ring-2 ring-gold-300' : 'border-navy-200 hover:border-gold-300'
                            }`}
                          >
                            <input type="radio" name="requestType" value={value} checked={active} onChange={onChange} className="sr-only" />
                            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? 'text-gold-600' : 'text-navy-400'}`} aria-hidden="true" />
                            <span>
                              <span className="block text-sm font-semibold text-navy-900">{REQUEST_TYPES[value].label}</span>
                              <span className="block text-xs text-navy-500">{hint}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>

                  <FormField id="enquiry-fullName" label="Full Name" name="fullName" value={values.fullName} onChange={onChange} error={errors.fullName} required autoComplete="name" />
                  <FormField id="enquiry-companyName" label="Company Name" name="companyName" value={values.companyName} onChange={onChange} autoComplete="organization" />
                  <FormField id="enquiry-email" label="Email Address" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} required autoComplete="email" />
                  <FormField id="enquiry-mobile" label="Mobile Number" name="mobile" type="tel" value={values.mobile} onChange={onChange} error={errors.mobile} required autoComplete="tel" placeholder="+971 5X XXX XXXX" />
                  <FormField
                    id="enquiry-service"
                    label="Select Service"
                    name="service"
                    type="select"
                    options={SERVICE_OPTIONS}
                    value={values.service}
                    onChange={onChange}
                    error={errors.service}
                    required={values.requestType !== 'general'}
                    className="sm:col-span-2"
                  />
                  {values.requestType !== 'general' && selectedService && (
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-sm sm:col-span-2" aria-live="polite">
                      <span className="text-navy-600">Estimated price for this service</span>
                      <span className="font-semibold text-navy-900">{priceLabel(selectedService.id)}</span>
                    </div>
                  )}
                  <FormField
                    id="enquiry-message"
                    label={copy.message[0]}
                    name="message"
                    type="textarea"
                    rows={5}
                    value={values.message}
                    onChange={onChange}
                    error={errors.message}
                    required
                    placeholder={copy.message[1]}
                    className="sm:col-span-2"
                  />
                  {copy.amount && (
                    <FormField
                      id="enquiry-amount"
                      label={copy.amount[0]}
                      name="amount"
                      value={values.amount}
                      onChange={onChange}
                      error={errors.amount}
                      placeholder={copy.amount[1]}
                      className="sm:col-span-2"
                    />
                  )}

                  {values.requestType === 'invoice' && (
                    <p className="flex items-start gap-2 rounded-lg bg-gold-50 p-4 text-xs leading-relaxed text-navy-700 sm:col-span-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                      Sending this form does not create an invoice or take any payment. Our team will review your request
                      and issue an official invoice to you.
                    </p>
                  )}

                  {status === 'error' && (
                    <div className="sm:col-span-2">
                      <ErrorBanner>
                        We could not send your request just now. Please try again, use “Send on WhatsApp”, or email us at{' '}
                        <a href={EMAIL_HREF} className="font-medium underline">{COMPANY.email}</a>.
                      </ErrorBanner>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onWhatsApp} className="btn-whatsapp justify-center px-6 py-3.5">
                      <WhatsAppIcon className="h-4 w-4" />
                      Send on WhatsApp
                    </button>
                    <button type="submit" disabled={status === 'submitting'} className="btn-gold justify-center px-8 py-3.5 disabled:cursor-not-allowed disabled:opacity-70">
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" aria-hidden="true" /> Submit Request
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-navy-500 sm:col-span-2 sm:text-right">
                    Fields marked <span className="text-gold-600">*</span> are required. By sending you agree to our{' '}
                    <Link to="/privacy-policy" className="underline hover:text-gold-600">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
