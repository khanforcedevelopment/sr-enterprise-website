import { Link } from 'react-router-dom'
import { Clock, XCircle, ArrowLeft, Mail } from 'lucide-react'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { useSeo } from '../hooks/useSeo'
import { PAYMENTS_ENABLED } from '../config/payments'
import { COMPANY, EMAIL_HREF } from '../config/company'
import { whatsappLink } from '../utils/whatsapp'

function StatusShell({ icon: Icon, iconClass, title, children }) {
  return (
    <section className="flex min-h-[80vh] items-center bg-navy-50/60 pb-20 pt-36">
      <div className="container-x">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-navy-100">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
            <Icon className="h-9 w-9" aria-hidden="true" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-navy-900">{title}</h1>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-navy-600">{children}</div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn-navy justify-center">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Home
            </Link>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-whatsapp justify-center">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Ziina sends customers here after a payment (and the embedded form on /pay does too).
 * A visit to this page is NOT proof of payment: confirm every payment in the Ziina business account.
 */
export function PaymentSuccess() {
  useSeo({ title: 'Payment Submitted | SR Enterprise', description: 'Payment status page.', path: '/payment/success', noindex: true })
  return (
    <StatusShell icon={Clock} iconClass="bg-gold-50 text-gold-600" title="Thank you">
      {PAYMENTS_ENABLED ? (
        <>
          <p>
            If you completed your payment on Ziina’s secure payment form, it is now being processed.
          </p>
          <p>
            Our team will confirm once your payment has been verified. Please keep your invoice reference for any
            questions.
          </p>
        </>
      ) : (
        <p>Online payments are not active on this website yet. Please request an invoice and our team will share payment instructions with you.</p>
      )}
      <p>
        Questions? Email <a href={EMAIL_HREF} className="font-medium text-gold-700 underline">{COMPANY.email}</a>.
      </p>
    </StatusShell>
  )
}

export function PaymentCancel() {
  useSeo({ title: 'Payment Cancelled | SR Enterprise', description: 'Payment status page.', path: '/payment/cancel', noindex: true })
  return (
    <StatusShell icon={XCircle} iconClass="bg-red-50 text-red-500" title="Payment not completed">
      <p>Your payment was cancelled and no charge has been made.</p>
      <p>
        You can <Link to="/pay" className="font-medium text-gold-700 underline">try again</Link>, or contact us if
        you need help or prefer another payment method.
      </p>
      <p>
        <a href={EMAIL_HREF} className="inline-flex items-center gap-1 font-medium text-gold-700 underline">
          <Mail className="h-4 w-4" aria-hidden="true" /> {COMPANY.email}
        </a>
      </p>
    </StatusShell>
  )
}
