import { PolicyLayout, PolicySection } from '../components/policy-layout'
import {
  CORE_RETURN_WINDOW_DAYS,
  DAMAGE_REPORT_DAYS,
  REFUND_PROCESSING_BUSINESS_DAYS,
  RESTOCKING_FEE_PERCENT,
  RETURN_WINDOW_DAYS,
} from '../policy-values'

export function ReturnsPolicyPage() {
  return (
    <PolicyLayout
      title="Returns & Refunds"
      intro={
        <p>
          We want you to get the right part the first time. This policy explains how to return a
          part, how refunds work and how to return a core to receive your core refund.
        </p>
      }
    >
      <PolicySection title="Return Window">
        <p>
          You may return most parts within {RETURN_WINDOW_DAYS} days of the delivery date. To be
          eligible, a part must be:
        </p>
        <ul>
          <li>New, unused and not installed.</li>
          <li>In its original, undamaged packaging, with all hardware, instructions and labels.</li>
          <li>Free of grease, fluids, marks or other signs of installation or use.</li>
        </ul>
      </PolicySection>
      <PolicySection title="How to Start a Return">
        <p>
          Contact us with your order number before sending anything back. We will review the
          request and, if approved, send you return instructions. Packages sent without an
          approved return may be refused or delayed. Once we receive the part, we inspect it and
          let you know whether the return is accepted.
        </p>
      </PolicySection>
      <PolicySection title="Non-Returnable Items">
        <ul>
          <li>
            Electrical and electronic parts, such as sensors, control modules and wiring
            harnesses, once they have been installed.
          </li>
          <li>Parts that have been installed, modified or damaged during installation.</li>
          <li>Parts returned without their original packaging or with missing components.</li>
          <li>Parts returned after the return window has ended.</li>
        </ul>
      </PolicySection>
      <PolicySection title="Restocking Fees and Return Shipping">
        <p>
          Returns that are not caused by an error on our part are subject to a{' '}
          {RESTOCKING_FEE_PERCENT}% restocking fee, and the customer pays the return shipping. We
          recommend a trackable shipping method; we are not responsible for returns lost in
          transit.
        </p>
        <p>
          If we shipped the wrong part, or the part does not fit the vehicle whose VIN was
          verified at checkout, there is no restocking fee and we will cover return shipping.
        </p>
      </PolicySection>
      <PolicySection title="Damaged, Defective or Incorrect Parts">
        <p>
          Contact us within {DAMAGE_REPORT_DAYS} days of delivery if a part arrives damaged,
          defective or different from what you ordered. Please include your order number and
          photos. Claims for parts that fail after installation are handled under the
          manufacturer's warranty, and we will help you start the claim.
        </p>
      </PolicySection>
      <PolicySection title="Refunds">
        <p>
          Approved refunds are issued to the original payment method within{' '}
          {REFUND_PROCESSING_BUSINESS_DAYS} business days after the inspection is complete. Your
          bank or card issuer may take additional time to post the refund. Original shipping
          charges are refunded only when the return is caused by an error on our part.
        </p>
      </PolicySection>
      <PolicySection title="Core Returns">
        <p>
          Some parts, usually remanufactured ones, carry a core charge. The core charge is shown on the product page and is charged at checkout
          together with the part. It is a refundable deposit for your old part, the core.
        </p>
        <p>To receive a core refund, return the used core:</p>
        <ul>
          <li>Within {CORE_RETURN_WINDOW_DAYS} days of the delivery date of your new part.</li>
          <li>
            In rebuildable condition: complete, assembled, and not cracked, broken, burned, seized
            or damaged by accident or improper handling.
          </li>
          <li>Drained of fuel, oil and coolant, and packed in the box the new part came in.</li>
          <li>With your order number included in the package.</li>
        </ul>
        <p>
          Contact us before shipping the core so we can match it to your order. The customer pays
          the shipping to return the core unless we tell you otherwise. When the core arrives, we
          inspect it. If it is accepted, we refund the core charge to the original payment method.
          If it is not rebuildable or arrives after the core return window, the core charge is
          not refunded and we will let you know why.
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
