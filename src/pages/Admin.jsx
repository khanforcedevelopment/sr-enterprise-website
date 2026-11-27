import { useCallback, useEffect, useMemo, useState } from 'react'
import { Lock, LogOut, RefreshCw, Loader2, Search, CreditCard, Inbox, FileText, Receipt, MessageSquare, AlertTriangle, Mail, Banknote, X, CheckCircle2 } from 'lucide-react'
import FormField from '../components/FormField'
import { ErrorBanner } from '../components/FormStatus'
import { useSeo } from '../hooks/useSeo'

const fmtAed = (v) =>
  `AED ${Number(v || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (iso) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-AE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS = {
  completed: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  pending: { label: 'Processing', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  requires_user_action: { label: 'Waiting for client', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  requires_payment_instrument: { label: 'Not paid yet', cls: 'bg-navy-50 text-navy-600 ring-navy-200' },
  failed: { label: 'Failed', cls: 'bg-red-50 text-red-700 ring-red-200' },
  canceled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 ring-red-200' },
  refunded: { label: 'Refunded', cls: 'bg-navy-50 text-navy-600 ring-navy-200' },
  awaiting_cash: { label: 'Waiting for cash', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
}
const PROVIDERS = { ziina: 'Ziina', paymob: 'Paymob', cash: 'Cash' }
const TYPES = {
  quote: { label: 'Quote', icon: FileText },
  invoice: { label: 'Invoice request', icon: Receipt },
  general: { label: 'General', icon: MessageSquare },
}

async function api(action, body = {}) {
  const res = await fetch(`/api/admin/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  let data = {}
  try {
    data = await res.json()
  } catch {
    /* not JSON */
  }
  if (res.status === 404 && !data.error) throw Object.assign(new Error('The admin panel is not installed on this deployment.'), { status: 404 })
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status })
  return data
}

/** Private admin panel: enquiries from the website forms and online payments from /pay. */
export default function Admin() {
  useSeo({ title: 'Admin | SR Enterprise', description: 'Admin panel.', path: '/admin', noindex: true })
  const [state, setState] = useState('checking') // checking | login | loading | ready
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('payments')
  const [query, setQuery] = useState('')
  const [cashOpen, setCashOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      setData(await api('data'))
      setState('ready')
    } catch (err) {
      if (err.status === 401) setState('login')
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    api('session')
      .then(() => load())
      .catch((err) => {
        setState('login')
        if (err.status !== 401) setError(err.message)
      })
  }, [load])

  async function onLogin(e) {
    e.preventDefault()
    if (!password) return setError('Please enter the admin password.')
    setBusy(true)
    setError('')
    try {
      await api('login', { password })
      setPassword('')
      setState('loading')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function onLogout() {
    await api('logout').catch(() => {})
    setData(null)
    setState('login')
  }

  const q = query.trim().toLowerCase()
  const payments = useMemo(
    () => (data?.payments || []).filter((p) => !q || [p.reference, p.name, p.email, p.id, String(p.amount)].join(' ').toLowerCase().includes(q)),
    [data, q]
  )
  const enquiries = useMemo(
    () =>
      (data?.enquiries?.items || []).filter(
        (s) => !q || [s.reference, s.name, s.company, s.email, s.mobile, s.service, s.message].join(' ').toLowerCase().includes(q)
      ),
    [data, q]
  )
  const totals = useMemo(() => {
    const list = data?.payments || []
    const paid = list.filter((p) => p.status === 'completed' && !p.test)
    const testPaid = list.filter((p) => p.status === 'completed' && p.test)
    const items = data?.enquiries?.items || []
    return {
      paidSum: paid.reduce((s, p) => s + Number(p.amount || 0), 0),
      paidCount: paid.length,
      testCount: testPaid.length,
      open: list.filter((p) => !['completed', 'failed', 'canceled', 'refunded'].includes(p.status)).length,
      enquiries: items.length,
      quotes: items.filter((s) => s.type === 'quote').length,
      invoices: items.filter((s) => s.type === 'invoice').length,
    }
  }, [data])

  if (state === 'checking' || state === 'login') {
    return (
      <section className="bg-navy-50/60 pb-20 pt-36">
        <div className="container-x">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-card ring-1 ring-navy-100 sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-gold-300">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-5 font-serif text-3xl font-semibold text-navy-900">Admin panel</h1>
            <p className="mt-2 text-sm text-navy-500">Enquiries and online payments for SR Enterprise.</p>
            {state === 'checking' ? (
              <p className="mt-8 flex items-center gap-2 text-sm text-navy-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking…
              </p>
            ) : (
              <form onSubmit={onLogin} noValidate className="mt-8 space-y-5">
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <FormField
                  label="Password"
                  name="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="submit" className="btn-navy w-full justify-center" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
                  Log in
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-navy-50/60 pb-20 pt-32">
      <div className="container-x">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Admin panel</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-navy-900">Overview</h1>
            <p className="mt-1 text-sm text-navy-500">
              Ziina: <strong className="text-navy-800">{data?.ziinaConfigured ? (data?.live ? 'Live' : 'Test') : 'Not set up'}</strong>
              {' · '}Paymob: <strong className="text-navy-800">{data?.paymobConfigured ? (data?.paymobLive ? 'Live' : 'Test') : 'Not set up'}</strong>
              {' · '}Receipt emails: <strong className="text-navy-800">{data?.receiptsConfigured ? 'On' : 'Not set up'}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setCashOpen(true); setNotice('') }} className="btn-outline">
              <Banknote className="h-4 w-4" aria-hidden="true" /> Record cash payment
            </button>
            <button type="button" onClick={load} className="btn-outline" disabled={busy}>
              <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
            </button>
            <button type="button" onClick={onLogout} className="btn-navy">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}
        {notice && (
          <p className="mt-6 flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {notice}
          </p>
        )}
        {cashOpen && (
          <CashForm
            receiptsOn={Boolean(data?.receiptsConfigured)}
            onClose={() => setCashOpen(false)}
            onSaved={(msg) => {
              setCashOpen(false)
              setNotice(msg)
              setTab('payments')
              load()
            }}
          />
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Paid (online + cash)" value={fmtAed(totals.paidSum)} note={`${totals.paidCount} payment${totals.paidCount === 1 ? '' : 's'}`} />
          <Stat label="Not finished" value={totals.open} note="started, not paid yet" />
          <Stat label="Enquiries" value={totals.enquiries} note={`Quotes: ${totals.quotes} · Invoice requests: ${totals.invoices}`} />
          <Stat label="Test payments paid" value={totals.testCount} note="no real money" />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg bg-white p-1 shadow-sm ring-1 ring-navy-100" role="tablist">
            <TabButton active={tab === 'payments'} onClick={() => setTab('payments')} icon={CreditCard} label={`Payments (${data?.payments?.length || 0})`} />
            <TabButton active={tab === 'enquiries'} onClick={() => setTab('enquiries')} icon={Inbox} label={`Enquiries (${data?.enquiries?.items?.length || 0})`} />
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, reference, email…"
              className="w-full rounded-lg border border-navy-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-900 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl bg-white shadow-card ring-1 ring-navy-100">
          {tab === 'payments' ? (
            <PaymentsList
              items={payments}
              error={data?.paymentsError}
              onCash={async (p, received) => {
                setError('')
                setNotice('')
                try {
                  const res = await api(received ? 'cash-received' : 'cash-cancel', { id: p.id })
                  const msg = received ? (RECEIPT_RESULT[res.receipt] || (() => ''))(res.payment.email) : ''
                  setNotice(
                    received
                      ? `Cash of ${fmtAed(res.payment.amount)} for ${res.payment.reference} marked as received. ${msg}`
                      : `Cash request for ${res.payment.reference} cancelled.`
                  )
                  await load()
                } catch (err) {
                  setError(err.message)
                }
              }}
            />
          ) : (
            <EnquiriesList items={enquiries} info={data?.enquiries} />
          )}
        </div>
        <p className="mt-4 text-xs text-navy-500">
          Always confirm a payment in your Ziina or Paymob account before marking an invoice as paid. Part payments for the same
          reference are listed separately.
        </p>
      </div>
    </section>
  )
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy-100">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-navy-900">{value}</p>
      <p className="mt-1 text-xs text-navy-500">{note}</p>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${active ? 'bg-navy-900 text-white' : 'text-navy-600 hover:text-navy-900'}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" /> {label}
    </button>
  )
}

function Empty({ children }) {
  return <p className="p-10 text-center text-sm text-navy-500">{children}</p>
}

function PaymentsList({ items, error, onCash }) {
  const [working, setWorking] = useState('')
  if (error) return <div className="p-6"><ErrorBanner>{error}</ErrorBanner></div>
  if (!items.length) return <Empty>No online payments yet.</Empty>
  return (
    <ul className="divide-y divide-navy-100">
      {items.map((p) => {
        const st = STATUS[p.status] || { label: p.status || 'Unknown', cls: 'bg-navy-50 text-navy-600 ring-navy-200' }
        return (
          <li key={p.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-navy-900">
                <span className="font-mono">{p.reference}</span>
                {p.name && <span className="text-navy-600">· {p.name}</span>}
                {p.test && <span className="rounded bg-navy-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-navy-600">Test</span>}
              </p>
              <p className="mt-1 text-xs text-navy-500">
                {p.provider === 'cash' ? (
                  <>
                    {p.status === 'awaiting_cash' ? (
                      <>Client chose cash on {fmtDate(p.createdAt)}{p.phone && <span className="ml-1">· {p.phone}</span>}</>
                    ) : p.status === 'canceled' ? (
                      <>Cash request cancelled</>
                    ) : (
                      <>Cash received {p.paidDateOnly ? new Date(p.paidAt).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }) : fmtDate(p.paidAt)}</>
                    )}
                    {p.note && <span className="ml-1">· {p.note}</span>}
                  </>
                ) : (
                  <>
                    {fmtDate(p.createdAt)} · {PROVIDERS[p.provider || 'ziina'] || p.provider} {p.provider === 'paymob' ? 'ref' : 'ID'}{' '}
                    <span className="font-mono">{p.id}</span>
                  </>
                )}
                {p.amountMismatch && (
                  <span className="ml-1 inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" /> amount differs, check Paymob
                  </span>
                )}
                {p.email && <span className="ml-1">· {p.email}</span>}
                {p.receiptSentAt && (
                  <span className="ml-1 inline-flex items-center gap-1 text-emerald-700">
                    <Mail className="h-3 w-3" aria-hidden="true" /> receipt emailed
                  </span>
                )}
                {p.receiptError && !p.receiptSentAt && (
                  <span className="ml-1 inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" /> receipt not sent yet, retrying
                  </span>
                )}
                {p.statusError && (
                  <span className="ml-1 inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" /> status not refreshed
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {p.provider === 'cash' && p.status === 'awaiting_cash' && (
                <>
                  <button
                    type="button"
                    className="btn-navy px-3 py-1.5 text-xs"
                    disabled={working === p.id}
                    onClick={async () => {
                      setWorking(p.id)
                      await onCash(p, true)
                      setWorking('')
                    }}
                  >
                    {working === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    Mark cash received
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-navy-500 underline hover:text-navy-800"
                    disabled={working === p.id}
                    onClick={async () => {
                      setWorking(p.id)
                      await onCash(p, false)
                      setWorking('')
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
              <span className="font-semibold text-navy-900">{fmtAed(p.amount)}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${st.cls}`}>{st.label}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function EnquiriesList({ items, info }) {
  if (info && !info.configured)
    return (
      <Empty>
        Enquiries are not connected yet. Add NETLIFY_ACCESS_TOKEN in Netlify (see README), then redeploy.
      </Empty>
    )
  if (info?.error) return <div className="p-6"><ErrorBanner>{info.error}</ErrorBanner></div>
  if (!items.length) return <Empty>No enquiries yet.</Empty>
  return (
    <ul className="divide-y divide-navy-100">
      {items.map((s) => {
        const t = TYPES[s.type] || { label: s.type || s.form || 'Enquiry', icon: Inbox }
        return (
          <li key={s.id} className="p-5">
            <details>
              <summary className="grid cursor-pointer list-none gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-navy-900">
                    <span className="inline-flex items-center gap-1 rounded bg-gold-50 px-2 py-0.5 text-xs font-semibold text-gold-700">
                      <t.icon className="h-3.5 w-3.5" aria-hidden="true" /> {t.label}
                    </span>
                    <span>{s.name || 'No name'}</span>
                    {s.company && <span className="text-navy-600">· {s.company}</span>}
                  </p>
                  <p className="mt-1 truncate text-xs text-navy-500">
                    {fmtDate(s.createdAt)}
                    {s.reference && <> · <span className="font-mono">{s.reference}</span></>}
                    {s.service && <> · {s.service}</>}
                  </p>
                </div>
                <span className="text-xs font-medium text-gold-700">Details</span>
              </summary>
              <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-lg bg-navy-50/60 p-4 text-sm sm:grid-cols-2">
                <Row label="Email" value={s.email} href={s.email ? `mailto:${s.email}` : undefined} />
                <Row label="Mobile" value={s.mobile} href={s.mobile ? `tel:${s.mobile.replace(/[^\d+]/g, '')}` : undefined} />
                <Row label="Service" value={s.service} />
                <Row label="Estimated price" value={s.estimatedPrice} />
                <Row label="Amount (invoice request)" value={s.amount} />
                <Row label="Reference" value={s.reference} />
                <div className="sm:col-span-2">
                  <dt className="text-xs text-navy-500">Message</dt>
                  <dd className="whitespace-pre-wrap break-words text-navy-800">{s.message || '—'}</dd>
                </div>
              </dl>
            </details>
          </li>
        )
      })}
    </ul>
  )
}

function Row({ label, value, href }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-navy-500">{label}</dt>
      <dd className="break-words text-navy-800">
        {value ? href ? <a href={href} className="text-gold-700 underline">{value}</a> : value : '—'}
      </dd>
    </div>
  )
}

const RECEIPT_RESULT = {
  sent: (e) => `Receipt emailed to ${e}.`,
  'already-sent': (e) => `Receipt was already emailed to ${e}.`,
  'not-configured': () => 'Receipt email NOT sent: receipt emails are not set up yet (RESEND_API_KEY / RECEIPT_FROM in Netlify).',
  failed: () => 'Receipt email could not be sent right now. It will be retried automatically within a few minutes.',
  'in-progress': () => 'Receipt email is being sent.',
}

const newRequestId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`

/** New invoice number like SR-20261127-K7QM (Dubai date + 4 random letters/digits, no look-alike 0/O/1/I). */
function newInvoiceNumber() {
  const ymd = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }).replace(/-/g, '')
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(4)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256)
  return `SR-${ymd}-${Array.from(bytes, (n) => abc[n % abc.length]).join('')}`
}

/** Admin records a cash payment: saved as paid and the client gets the same PDF receipt email as online payments. */
function CashForm({ receiptsOn, onClose, onSaved }) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' })
  const [v, setV] = useState(() => ({ reference: newInvoiceNumber(), name: '', email: '', amount: '', paidOn: today, note: '' }))
  const [requestId] = useState(newRequestId) // same id on retry, so one payment is never recorded twice
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (f) => (e) => {
    setV((x) => ({ ...x, [f]: e.target.value }))
    setErrors((x) => ({ ...x, [f]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (v.reference.replace(/[^A-Za-z0-9_/-]/g, '').length < 2) errs.reference = 'Enter the invoice or reference number.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) errs.email = 'Enter the client email for the receipt.'
    if (!(Number(v.amount) >= 2)) errs.amount = 'Enter the amount received (minimum AED 2).'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    setErr('')
    try {
      const res = await api('cash', { ...v, email: v.email.trim(), amount: Number(v.amount), requestId })
      const msg = (RECEIPT_RESULT[res.receipt] || (() => ''))(res.payment.email)
      onSaved(`Cash payment of ${fmtAed(res.payment.amount)} for ${res.payment.reference} recorded as paid. ${msg}`)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-navy-100 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-navy-900">
            <Banknote className="h-5 w-5 text-gold-600" aria-hidden="true" /> Record cash payment
          </h2>
          <p className="mt-1 text-sm text-navy-500">
            Saves the payment as paid{receiptsOn ? ' and emails the client a PDF receipt.' : '. Receipt emails are not set up yet, so no email will go out.'}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-navy-400 hover:text-navy-700" aria-label="Close">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
        {err && <div className="sm:col-span-2"><ErrorBanner>{err}</ErrorBanner></div>}
        <FormField
          label="Invoice number"
          name="cash-reference"
          value={v.reference}
          onChange={set('reference')}
          error={errors.reference}
          required
          autoComplete="off"
          hint="Made automatically. Change it if the client already has an invoice number."
        />
        <FormField label="Client name or company" name="cash-name" value={v.name} onChange={set('name')} maxLength={80} autoComplete="off" />
        <FormField label="Client email (receipt goes here)" name="cash-email" type="email" value={v.email} onChange={set('email')} error={errors.email} required maxLength={120} autoComplete="off" />
        <FormField label="Amount received (AED)" name="cash-amount" type="number" inputMode="decimal" min={2} step="0.01" value={v.amount} onChange={set('amount')} error={errors.amount} required placeholder="0.00" />
        <FormField label="Date received" name="cash-date" type="date" value={v.paidOn} onChange={set('paidOn')} max={today} />
        <FormField label="Note (only for you, not on the receipt)" name="cash-note" value={v.note} onChange={set('note')} maxLength={200} autoComplete="off" />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-outline justify-center">Cancel</button>
          <button type="submit" className="btn-navy justify-center" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            {receiptsOn ? 'Mark as paid & email receipt' : 'Mark as paid'}
          </button>
        </div>
      </form>
    </div>
  )
}
