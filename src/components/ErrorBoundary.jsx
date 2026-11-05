import { Component } from 'react'
import { COMPANY, PHONE_HREF, EMAIL_HREF } from '../config/company'

// Last-resort fallback so visitors can always reach the company, even if a component crashes.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unexpected error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6 text-center text-white">
        <div className="max-w-md">
          <h1 className="font-serif text-3xl font-semibold">Something went wrong</h1>
          <p className="mt-4 text-navy-200">Please refresh the page. You can also reach {COMPANY.name} directly:</p>
          <p className="mt-6 space-y-2">
            <a className="block text-gold-300 underline" href={PHONE_HREF}>{COMPANY.phoneDisplay}</a>
            <a className="block text-gold-300 underline" href={EMAIL_HREF}>{COMPANY.email}</a>
          </p>
          <button type="button" onClick={() => window.location.reload()} className="mt-8 rounded-lg bg-gold-500 px-6 py-3 font-semibold text-navy-950">
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
