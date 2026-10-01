import { PolicyLayout, PolicySection } from '../components/policy-layout'

export function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      intro={
        <p>
          This policy describes the personal information TorqueTrack Diesel collects when you use
          our website, place an order or request a quote, and how we use and protect it.
        </p>
      }
    >
      <PolicySection title="Information We Collect">
        <ul>
          <li>
            <strong>Contact details:</strong> your name, company, email address and phone number.
          </li>
          <li>
            <strong>Shipping details:</strong> the addresses you provide for delivery.
          </li>
          <li>
            <strong>Vehicle details:</strong> the VIN and vehicle information (such as year, make,
            model and engine) used to check that parts fit your vehicle.
          </li>
          <li>
            <strong>Order and quote history:</strong> the parts you buy or ask us to quote, and
            your returns and core returns.
          </li>
          <li>
            <strong>Tax exemption details:</strong> exemption certificates and related
            information you submit to purchase tax-exempt.
          </li>
          <li>
            <strong>Account details:</strong> your sign-in email and password. Passwords are
            stored in a protected, non-readable form.
          </li>
          <li>
            <strong>Technical data:</strong> your IP address and basic request information, used
            to keep the site secure and prevent abuse.
          </li>
        </ul>
        <p>
          Payment card details are entered on a page hosted by our payment processor, Stripe. We do
          not receive or store your full card number.
        </p>
      </PolicySection>
      <PolicySection title="How We Use Your Information">
        <ul>
          <li>To process, ship and support your orders, returns and core returns.</li>
          <li>To prepare and follow up on quotes you request.</li>
          <li>To verify parts fitment for your vehicle.</li>
          <li>To calculate sales tax and review tax exemption requests.</li>
          <li>
            To send account and order emails, such as email verification and password resets.
          </li>
          <li>To prevent fraud, protect our site and comply with legal obligations.</li>
        </ul>
      </PolicySection>
      <PolicySection title="How We Share Your Information">
        <p>
          We do not sell your personal information. We share it only with service providers that
          help us run the store, and only as needed for them to do so:
        </p>
        <ul>
          <li>Our payment processor, to take payments and issue refunds.</li>
          <li>Shipping rate providers and carriers, to quote and deliver your shipments.</li>
          <li>Our sales tax calculation provider, to calculate the tax on your order.</li>
          <li>A vehicle data service, to decode the VIN you enter.</li>
          <li>Our email delivery provider, to send account and order emails.</li>
        </ul>
        <p>
          We may also disclose information when required by law, to protect our rights or the
          safety of others, or as part of a sale or reorganization of our business.
        </p>
      </PolicySection>
      <PolicySection title="Cookies and Browser Storage">
        <p>
          We use cookies that are needed for the site to work, such as keeping you signed in and
          protecting forms against misuse. Your browser also stores a copy of your cart so it is
          kept between visits. We do not currently use advertising cookies.
        </p>
      </PolicySection>
      <PolicySection title="Data Retention and Security">
        <p>
          We keep order, tax and payment records for as long as needed to provide our services
          and to meet legal, tax and accounting requirements. We use reasonable administrative and
          technical safeguards to protect your information, but no method of transmission or
          storage is completely secure.
        </p>
      </PolicySection>
      <PolicySection title="Your Choices and Rights">
        <p>
          You can review and update your profile in your account at any time. You may also
          contact us to request access to, correction of or deletion of your personal
          information. We will respond as required by applicable law, and some records may need
          to be kept for legal or tax reasons. Depending on your state of residence, you may have
          additional privacy rights.
        </p>
      </PolicySection>
      <PolicySection title="Children's Privacy">
        <p>
          Our website is intended for business and adult customers and is not directed to
          children under 13. We do not knowingly collect personal information from children.
        </p>
      </PolicySection>
      <PolicySection title="Changes to This Policy">
        <p>
          We may update this policy from time to time. The date at the top of this page shows when
          it was last updated.
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
