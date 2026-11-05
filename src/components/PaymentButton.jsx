import { Link } from 'react-router-dom'
import { CreditCard, Lock } from 'lucide-react'
import { payPageLink, PAYMENTS_ENABLED } from '../config/payments'

/**
 * "Pay Online" button that opens the pay page with the invoice reference filled in.
 * Renders nothing while PAYMENTS_ENABLED is false.
 */
export default function PaymentButton({ invoiceReference, className = '' }) {
  if (!PAYMENTS_ENABLED) return null
  return (
    <Link to={payPageLink({ reference: invoiceReference })} className={`btn-navy justify-center ${className}`}>
      <CreditCard className="h-4 w-4" aria-hidden="true" />
      Pay Online
      <Lock className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
    </Link>
  )
}
