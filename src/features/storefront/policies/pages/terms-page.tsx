import { Link } from 'react-router-dom'

import { PolicyLayout, PolicySection } from '../components/policy-layout'
import { GOVERNING_STATE } from '../policy-values'

const link = 'text-sky-900 hover:underline'

export function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      intro={
        <p>
          These terms apply to your use of the TorqueTrack Diesel website and to every order and
          quote placed with us. By using the site or placing an order, you agree to them.
        </p>
      }
    >
      <PolicySection title="Accounts">
        <p>
          You are responsible for keeping your sign-in details confidential and for activity
          under your account. Please keep your contact and shipping information up to date.
        </p>
      </PolicySection>
      <PolicySection title="Orders and Pricing">
        <p>
          All prices are in U.S. dollars. Prices and availability may change without notice, and
          the price that applies is the one shown at checkout. An order is accepted when payment
          is confirmed. We may cancel an order, with a full refund, if a part is unavailable, a
          price or description is clearly in error, or we suspect fraud or a breach of these
          terms.
        </p>
      </PolicySection>
      <PolicySection title="Payment">
        <p>
          Payment in full is required at checkout before an order is processed. Payments are
          processed securely by our payment processor, Stripe. Quotes are valid for 30 days and
          are also paid in full online when you accept them.
        </p>
      </PolicySection>
      <PolicySection title="Sales Tax and Tax Exemption">
        <p>
          Sales tax is calculated from your shipping address and collected where we are required
          to collect it. Core charges are included in the taxable amount. To purchase tax-exempt,
          submit a valid exemption certificate from your account. Orders are taxed until our team
          has reviewed and verified the certificate.
        </p>
      </PolicySection>
      <PolicySection title="Core Charges">
        <p>
          Some parts include a refundable core charge that is charged at checkout. Core refunds
          are issued when you return a rebuildable core as described in our{' '}
          <Link className={link} to="/policies/returns">
            Returns &amp; Refunds
          </Link>{' '}
          policy.
        </p>
      </PolicySection>
      <PolicySection title="Fitment and VIN Verification">
        <p>
          At checkout we check the parts in your order against the vehicle identified by the VIN
          you enter. This check relies on manufacturer and catalog data and is provided to help
          you choose the right part. You remain responsible for confirming the part number and
          suitability before installation. If you are unsure, contact us before you order.
        </p>
      </PolicySection>
      <PolicySection title="Emissions-Related Parts">
        <p>
          Emissions-related parts, including diesel particulate filters (DPF), diesel oxidation
          catalysts (DOC) and selective catalytic reduction (SCR) components, are sold only for
          legal use that keeps your vehicle compliant with applicable emissions laws. We do not
          sell parts intended to remove, bypass, defeat or disable any emissions control device,
          and we may refuse or cancel any order we believe is intended for that purpose.
        </p>
        <p>
          Some parts may not be legal for sale or use in California, or in other states that
          adopt California Air Resources Board (CARB) standards, on pollution-controlled
          vehicles. It is your responsibility to confirm that a part is legal for your vehicle
          and location before you buy and install it.
        </p>
      </PolicySection>
      <PolicySection title="Installation and Use">
        <p>
          Diesel parts should be installed by a qualified technician following the manufacturer's
          instructions. We are not responsible for damage or injury caused by improper
          installation, misuse, modification or use of a part for a purpose other than the one it
          was designed for.
        </p>
      </PolicySection>
      <PolicySection title="Shipping and Returns">
        <p>
          Shipping and returns are governed by our{' '}
          <Link className={link} to="/policies/shipping">
            Shipping Policy
          </Link>{' '}
          and{' '}
          <Link className={link} to="/policies/returns">
            Returns &amp; Refunds
          </Link>{' '}
          policy, which form part of these terms.
        </p>
      </PolicySection>
      <PolicySection title="Warranties">
        <p>
          Parts may be covered by the manufacturer's warranty, and we will help you with
          manufacturer warranty claims. Except for those warranties and as required by law, parts
          and the website are provided "as is", without other warranties of any kind, express or
          implied.
        </p>
      </PolicySection>
      <PolicySection title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, our total liability for any claim related to a
          part or order is limited to the amount you paid for that part. We are not liable for
          indirect, incidental or consequential damages, including labor costs, towing, vehicle
          downtime or lost profits.
        </p>
      </PolicySection>
      <PolicySection title="Governing Law">
        <p>
          These terms are governed by the laws of the State of {GOVERNING_STATE}, without regard
          to its conflict of law rules.
        </p>
      </PolicySection>
      <PolicySection title="Changes to These Terms">
        <p>
          We may update these terms from time to time. The version posted on this page at the
          time of your order applies to that order.
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
