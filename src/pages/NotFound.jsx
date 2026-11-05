import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSeo } from '../hooks/useSeo'

export default function NotFound() {
  useSeo({ title: 'Page Not Found | SR Enterprise', description: 'The page you are looking for could not be found.', path: '/404', noindex: true })
  return (
    <section className="flex min-h-[80vh] items-center bg-white pb-20 pt-36">
      <div className="container-x text-center">
        <p className="font-serif text-7xl font-bold text-gold-500">404</p>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-navy-900">Page not found</h1>
        <p className="mt-3 text-navy-600">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn-navy mt-8">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Home
        </Link>
      </div>
    </section>
  )
}
