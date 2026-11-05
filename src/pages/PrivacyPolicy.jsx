import PolicyLayout, { PolicySection, ReviewNote } from '../components/PolicyLayout'
import { COMPANY, EMAIL_HREF } from '../config/company'

export default function PrivacyPolicy() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      path="/privacy-policy"
      description="How Sunil Rana Enterprise FZE LLC collects, uses and protects personal information submitted through its website."
    >
      <ReviewNote>
        This policy is a professional template written for a UAE free zone consultancy and trading company. Please have
        it reviewed by a qualified legal adviser to confirm it reflects how your business actually handles personal
        data and complies with Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data and any free zone
        requirements that apply to you.
      </ReviewNote>

      <PolicySection title="1. Who we are">
        <p>
          This website is operated by {COMPANY.name} (“we”, “us”, “our”), a company licensed by{' '}
          {COMPANY.licensingAuthority} under Business License No. {COMPANY.licenseNumber}, with its registered address
          at {COMPANY.addressOneLine}.
        </p>
        <p>
          This Privacy Policy explains what personal information we collect through this website, how we use it and the
          choices you have.
        </p>
      </PolicySection>

      <PolicySection title="2. Information we collect">
        <p>We only collect information that you choose to give us, including when you:</p>
        <ul>
          <li>submit the Request a Quote form (name, company name, email, mobile number, selected service, project description and optional budget);</li>
          <li>submit the Contact form (name, email, optional phone number, subject and message);</li>
          <li>use the Request Invoice form, which prepares a WhatsApp message containing the details you enter;</li>
          <li>contact us directly by phone, email or WhatsApp.</li>
        </ul>
        <p>
          We do not collect or store payment card or bank account details on this website. The Request Invoice form is
          not stored by the website; its contents are passed to WhatsApp on your device and are only received by us if
          you choose to send the message.
        </p>
      </PolicySection>

      <PolicySection title="3. How we use your information">
        <ul>
          <li>to respond to your enquiries and prepare quotations or invoices you request;</li>
          <li>to provide and manage the services you engage us for;</li>
          <li>to communicate with you about your project, order or account;</li>
          <li>to keep business records and meet our legal, accounting and regulatory obligations;</li>
          <li>to protect our website against spam and misuse.</li>
        </ul>
        <p>We do not sell your personal information, and we do not use it for unrelated marketing without your consent.</p>
      </PolicySection>

      <PolicySection title="4. Service providers">
        <p>We use trusted third-party services to operate this website and communicate with you, including:</p>
        <ul>
          <li><strong>Netlify</strong>: website hosting and form submission handling;</li>
          <li><strong>WhatsApp (Meta)</strong>: messaging, when you choose to contact us via WhatsApp;</li>
          <li><strong>Google</strong>: email (Gmail), map display and fonts;</li>
          <li><strong>Ziina</strong>: secure online card payments on our Pay Online page. Card details are entered only on Ziina’s payment form and are never received by this website. We share the invoice reference, amount and the name you enter with Ziina so the payment can be matched to your invoice.</li>
        </ul>
        <p>
          These providers process information under their own privacy policies and may store data outside the UAE.
        </p>
        <ReviewNote>
          Confirm this list matches the tools you actually use (for example, if you add analytics, a CRM or a
          different email provider) and update it whenever that changes.
        </ReviewNote>
      </PolicySection>

      <PolicySection title="5. Cookies">
        <p>
          This website does not use advertising or tracking cookies. Our hosting provider and embedded services (such as
          the Google Maps embed) may set technical cookies needed for them to function.
        </p>
        <ReviewNote>If you add analytics (e.g. Google Analytics) or marketing pixels, update this section and consider a cookie consent banner.</ReviewNote>
      </PolicySection>

      <PolicySection title="6. How long we keep information">
        <p>
          We keep enquiry and business records only for as long as needed for the purposes described above, including
          any period required by applicable UAE law for commercial and accounting records.
        </p>
        <ReviewNote>Insert your specific retention periods once confirmed with your accountant or legal adviser.</ReviewNote>
      </PolicySection>

      <PolicySection title="7. Security">
        <p>
          The website is served over an encrypted (HTTPS) connection and we take reasonable measures to protect the
          information we hold. No method of transmission over the internet is completely secure, so we cannot guarantee
          absolute security.
        </p>
      </PolicySection>

      <PolicySection title="8. Your rights">
        <p>
          Subject to applicable law, you may ask us to access, correct, or delete the personal information we hold
          about you, or object to certain uses of it. To make a request, email{' '}
          <a href={EMAIL_HREF}>{COMPANY.email}</a>. We may need to verify your identity before responding.
        </p>
      </PolicySection>

      <PolicySection title="9. Children">
        <p>This website and our services are intended for businesses and adults. We do not knowingly collect information from children.</p>
      </PolicySection>

      <PolicySection title="10. Changes to this policy">
        <p>We may update this policy from time to time. The “Last updated” date at the top shows when it was last changed.</p>
      </PolicySection>

      <PolicySection title="11. Contact">
        <p>
          {COMPANY.name}
          <br />
          {COMPANY.addressOneLine}
          <br />
          Email: <a href={EMAIL_HREF}>{COMPANY.email}</a> · Phone: {COMPANY.phoneDisplay}
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
