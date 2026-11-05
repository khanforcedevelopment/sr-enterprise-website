import PolicyLayout, { PolicySection, ReviewNote } from '../components/PolicyLayout'
import { COMPANY, EMAIL_HREF } from '../config/company'

export default function RefundPolicy() {
  return (
    <PolicyLayout
      title="Refund & Cancellation Policy"
      path="/refund-policy"
      description="Refund and cancellation policy for consultancy, project management and architectural model supply services from Sunil Rana Enterprise FZE LLC."
    >
      <ReviewNote>
        Refund timeframes, percentages and conditions below are suggested starting points. Please confirm each one
        reflects your actual business practice before publishing. Payment providers such as Ziina require a clear,
        accurate refund policy to be displayed.
      </ReviewNote>

      <PolicySection title="1. Overview">
        <p>
          This policy explains how cancellations and refunds work for services and goods provided by {COMPANY.name}.
          The specific terms in your quotation, invoice or service agreement take priority if they differ from this
          policy. Nothing in this policy limits any rights you have under applicable UAE law.
        </p>
      </PolicySection>

      <PolicySection title="2. Consultancy and project management services">
        <ul>
          <li><strong>Before work starts:</strong> if you cancel in writing before any work has started, any advance payment will be refunded, less any non-refundable costs already incurred on your behalf.</li>
          <li><strong>After work starts:</strong> fees are charged for work completed and costs committed up to the date of cancellation. Any amount paid in excess of this will be refunded.</li>
          <li><strong>Completed work:</strong> fees for services that have been delivered are not refundable.</li>
          <li><strong>Milestone-based work:</strong> payments for milestones that have been delivered and accepted are not refundable.</li>
        </ul>
        <ReviewNote>Decide whether you want a fixed cancellation notice period or cancellation fee, and state it here and in your quotations.</ReviewNote>
      </PolicySection>

      <PolicySection title="3. Building maquettes and model requisites (goods)">
        <ul>
          <li><strong>Damaged, defective or incorrect items:</strong> please notify us within 7 days of delivery with photos. We will replace the item or issue a refund for it.</li>
          <li><strong>Change of mind:</strong> unused items in their original, undamaged packaging may be returned within 7 days of delivery, subject to our approval. Return delivery costs are the customer’s responsibility unless the item was faulty.</li>
          <li><strong>Non-returnable items:</strong> custom-cut, special-order, made-to-measure, or opened consumable materials cannot be returned unless faulty.</li>
        </ul>
        <ReviewNote>Confirm the 7-day periods and which product categories are non-returnable.</ReviewNote>
      </PolicySection>

      <PolicySection title="4. How to request a cancellation or refund">
        <p>
          Email <a href={EMAIL_HREF}>{COMPANY.email}</a> or message us on WhatsApp at {COMPANY.phoneDisplay} with your
          name, invoice or request reference, and the reason for your request. We will acknowledge your request and
          confirm the outcome in writing.
        </p>
      </PolicySection>

      <PolicySection title="5. How refunds are paid">
        <ul>
          <li>Approved refunds are made to the original payment method wherever possible.</li>
          <li>Card payments made online through our payment provider (Ziina) are refunded to the same card. Your bank may take additional days to show the refund.</li>
          <li>We aim to process approved refunds within 14 business days of approval.</li>
          <li>Bank or transfer charges incurred by us may be deducted where permitted.</li>
        </ul>
        <ReviewNote>Confirm your refund processing timeframe and whether any bank or transaction fees are deducted.</ReviewNote>
      </PolicySection>

      <PolicySection title="6. Cancellation by the Company">
        <p>
          If we need to cancel an engagement or order for reasons within our control, we will refund any amount paid
          for services not delivered or goods not supplied.
        </p>
      </PolicySection>

      <PolicySection title="7. Contact">
        <p>
          {COMPANY.name}, {COMPANY.addressOneLine}. Email: <a href={EMAIL_HREF}>{COMPANY.email}</a> · Phone:{' '}
          {COMPANY.phoneDisplay}
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
