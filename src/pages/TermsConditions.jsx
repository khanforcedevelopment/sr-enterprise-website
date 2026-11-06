import { Link } from 'react-router-dom'
import PolicyLayout, { PolicySection, ReviewNote } from '../components/PolicyLayout'
import { COMPANY, EMAIL_HREF } from '../config/company'
import { SERVICES } from '../config/services'

export default function TermsConditions() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      path="/terms-and-conditions"
      description="Terms and conditions for using the Sunil Rana Enterprise FZE LLC website and engaging its consultancy, project management and model supply services."
    >
      <ReviewNote>
        These terms are a general template for a UAE free zone consultancy and trading company. Have them reviewed by a
        qualified legal adviser before relying on them, and make sure they match your quotations, contracts and
        invoices.
      </ReviewNote>

      <PolicySection title="1. About these terms">
        <p>
          These Terms &amp; Conditions govern your use of this website and any request for quotation, invoice or
          services from {COMPANY.name} (“the Company”, “we”, “us”), licensed by {COMPANY.licensingAuthority} under
          Business License No. {COMPANY.licenseNumber}. By using this website you agree to these terms.
        </p>
      </PolicySection>

      <PolicySection title="2. Our licensed services">
        <p>The Company offers only the following licensed activities:</p>
        <ul>
          {SERVICES.map((s) => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
        <p>Information on this website is a general description of these services and does not form an offer or a contract.</p>
      </PolicySection>

      <PolicySection title="3. Quotations and engagement">
        <ul>
          <li>Quotations are provided on request, are based on the information you give us, and are valid for the period stated on the quotation.</li>
          <li>A binding engagement is formed only when you accept a written quotation or sign a service agreement with us, and any required advance payment has been received.</li>
          <li>The specific scope, deliverables, timelines and fees for each engagement are set out in the quotation or agreement, which takes priority over these general terms if they differ.</li>
        </ul>
        <ReviewNote>Confirm your standard quotation validity period, advance-payment requirements and whether you use a separate signed service agreement.</ReviewNote>
      </PolicySection>

      <PolicySection title="4. Invoices and payment">
        <ul>
          <li>Invoice requests submitted through this website are requests only. An invoice is valid only when issued by the Company directly.</li>
          <li>Payment terms, accepted payment methods and due dates are stated on each invoice.</li>
          <li>Online card payments, including part payments, are processed on a secure form provided by our payment providers (Ziina or Stripe). This website does not collect or store card details. A payment is confirmed only when we have verified it, not by the website’s confirmation page.</li>
          <li>All prices are in UAE Dirhams (AED) unless stated otherwise. Any taxes that apply by law will be shown on the invoice.</li>
        </ul>
        <ReviewNote>
          Do not state a VAT/TRN number on the website or on invoices unless the company is registered for VAT with the
          Federal Tax Authority. Confirm your tax position with your accountant.
        </ReviewNote>
      </PolicySection>

      <PolicySection title="5. Client responsibilities">
        <p>
          You agree to provide accurate, complete and timely information, access and approvals reasonably needed for us
          to deliver the services. Delays or changes caused by incomplete information may affect timelines and fees.
        </p>
      </PolicySection>

      <PolicySection title="6. Supply of model-making requisites">
        <ul>
          <li>Product descriptions and images are for guidance. Colours, finishes and dimensions may vary slightly.</li>
          <li>Delivery or collection arrangements, timelines and any charges will be confirmed in the quotation or invoice.</li>
          <li>Risk in goods passes to you on delivery or collection. Please inspect goods promptly on receipt.</li>
        </ul>
        <ReviewNote>Confirm your delivery areas, delivery charges and inspection/claims period for goods.</ReviewNote>
      </PolicySection>

      <PolicySection title="7. Consultancy and project management advice">
        <p>
          Our consultancy and project management services are provided with reasonable skill and care. Recommendations
          are based on information available at the time. Final business, design, construction and investment decisions
          remain the responsibility of the client and its appointed professionals.
        </p>
      </PolicySection>

      <PolicySection title="8. Intellectual property">
        <p>
          Website content, logos and materials belong to the Company unless stated otherwise. Ownership and use of
          deliverables prepared for a client will be as set out in the relevant quotation or agreement.
        </p>
      </PolicySection>

      <PolicySection title="9. Limitation of liability">
        <p>
          To the extent permitted by UAE law, the Company is not liable for indirect or consequential losses, and its
          total liability in connection with any engagement is limited to the fees paid for that engagement.
        </p>
        <ReviewNote>Liability limits must be reviewed by a legal adviser to confirm they are enforceable for your contracts.</ReviewNote>
      </PolicySection>

      <PolicySection title="10. Cancellations and refunds">
        <p>
          Cancellations and refunds are handled under our <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link>.
        </p>
      </PolicySection>

      <PolicySection title="11. Website use">
        <p>
          You must not misuse this website, submit false information, attempt unauthorised access, or send spam through
          its forms. We may update website content at any time without notice.
        </p>
      </PolicySection>

      <PolicySection title="12. Governing law">
        <p>
          These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Ajman. Any
          dispute will be subject to the jurisdiction of the competent courts of the Emirate of Ajman.
        </p>
        <ReviewNote>Confirm the governing law and dispute forum (courts or arbitration) with your legal adviser.</ReviewNote>
      </PolicySection>

      <PolicySection title="13. Contact">
        <p>
          Questions about these terms can be sent to <a href={EMAIL_HREF}>{COMPANY.email}</a> or {COMPANY.phoneDisplay}.
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
