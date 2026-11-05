import { CheckCircle2, AlertTriangle } from 'lucide-react'

export function SuccessPanel({ title, children, onReset, resetLabel = 'Send another request' }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center rounded-2xl bg-white p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </div>
      <h3 className="mt-6 font-serif text-2xl font-semibold text-navy-900">{title}</h3>
      <div className="mt-3 max-w-md text-sm leading-relaxed text-navy-600">{children}</div>
      {onReset && (
        <button type="button" onClick={onReset} className="btn-outline mt-8">
          {resetLabel}
        </button>
      )}
    </div>
  )
}

export function ErrorBanner({ children }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
