import { useId } from 'react'

const base =
  'w-full rounded-lg border bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gold-400'

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  options,
  rows = 4,
  hint,
  className = '',
  id: idProp,
  ...rest
}) {
  const generatedId = useId()
  const id = idProp || generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  const border = error ? 'border-red-400' : 'border-navy-200 focus:border-gold-400'
  const common = {
    id,
    name,
    value,
    onChange,
    required,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    className: `${base} ${border}`,
    ...rest,
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-800">
        {label}
        {required ? (
          <span className="ml-0.5 text-gold-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 text-xs font-normal text-navy-400">(optional)</span>
        )}
      </label>
      {type === 'select' ? (
        <select {...common}>
          <option value="">Select a service</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea rows={rows} {...common} />
      ) : (
        <input type={type} {...common} />
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-navy-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
