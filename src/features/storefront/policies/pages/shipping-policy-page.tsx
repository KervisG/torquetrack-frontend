import { Link } from 'react-router-dom'

import { PolicyLayout, PolicySection } from '../components/policy-layout'
import { DAMAGE_REPORT_DAYS, PROCESSING_BUSINESS_DAYS } from '../policy-values'

export function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping Policy"
      intro={
        <p>
          This policy explains where we ship, how shipping is priced and what to do if a package
          arrives damaged or does not arrive.
        </p>
      }
    >
      <PolicySection title="Where We Ship">
        <p>
          We currently ship to addresses within the United States. Orders ship from our facility
          in Sarasota, Florida.
        </p>
      </PolicySection>
      <PolicySection title="Order Processing">
        <p>
          All orders are paid in full at checkout. In-stock orders usually leave our facility
          within {PROCESSING_BUSINESS_DAYS} business days after payment is confirmed. Orders placed
          on weekends or holidays are processed the next business day. If a part is delayed or
          out of stock, we will contact you before it ships.
        </p>
      </PolicySection>
      <PolicySection title="Shipping Rates and Methods">
        <p>
          Shipping is calculated at checkout, before you pay, using live rates from carriers such
          as UPS, FedEx and USPS. The rate is based on your shipping address and the weight and
          package size of the parts in your order. Depending on your destination, you may choose
          from ground, second-day and overnight services.
        </p>
        <p>
          Rates shown at checkout are held for a limited time. If they expire before you pay, you
          will be asked to refresh them, and the updated rate will be shown before payment.
        </p>
        <p>
          Some large or heavy parts may require special handling. If an item needs a different
          shipping arrangement, we will contact you before it ships.
        </p>
      </PolicySection>
      <PolicySection title="Delivery Times and Tracking">
        <p>
          Delivery times shown by carriers are estimates and begin when the package ships, not
          when the order is placed. Unless the carrier guarantees a service, we cannot guarantee
          a delivery date.
        </p>
        <p>
          When your order ships, the carrier and tracking number appear in the order history of
          your account. If you checked out as a guest, contact us and we will send you the
          tracking details.
        </p>
      </PolicySection>
      <PolicySection title="Shipping Address">
        <p>
          Please make sure your shipping address is complete and correct before you pay. Contact
          us as soon as possible if it needs to change. Once an order has shipped, we may not be
          able to redirect it, and carrier fees for address corrections or returned packages may
          apply.
        </p>
      </PolicySection>
      <PolicySection title="Damaged, Missing or Lost Packages">
        <p>
          Please inspect your package when it arrives. If it is damaged, a part is missing or the
          tracking shows it as delivered but you did not receive it, contact us within{' '}
          {DAMAGE_REPORT_DAYS} days of the delivery date. Include your order number and photos of
          the package and the part, and keep all packaging until the claim is resolved. We will
          work with the carrier to repair, replace or refund the affected items.
        </p>
      </PolicySection>
      <PolicySection title="Sales Tax">
        <p>
          Sales tax is calculated at checkout from your shipping address and is collected only
          where we are required to collect it. See our{' '}
          <Link className="text-sky-900 hover:underline" to="/policies/terms">
            Terms of Service
          </Link>{' '}
          for details on tax-exempt purchases.
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
