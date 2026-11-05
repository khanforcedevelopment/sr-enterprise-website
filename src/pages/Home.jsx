import Hero from '../sections/Hero'
import About from '../sections/About'
import Services from '../sections/Services'
import WhyChooseUs from '../sections/WhyChooseUs'
import Enquiry from '../sections/Enquiry'
import Contact from '../sections/Contact'
import { useSeo } from '../hooks/useSeo'

export default function Home() {
  useSeo({
    title: 'Sunil Rana Enterprise FZE LLC | Business Consultancy & Project Management in Ajman, UAE',
    description:
      'Sunil Rana Enterprise FZE LLC is an Ajman-based company offering facilities resources planning consultancy, project management services and architectural model supplies across the UAE.',
    path: '/',
  })
  return (
    <>
      <Hero />
      <About />
      <Services />
      <WhyChooseUs />
      <Enquiry />
      <Contact />
    </>
  )
}
