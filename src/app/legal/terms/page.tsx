import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="4 July 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern access to and use of RekaDijo, a quotation-first food
        ordering platform operated by TechTur Solutions (&quot;TechTur Solutions&quot;, &quot;we&quot;,
        &quot;us&quot;). By creating an account, browsing vendors, requesting a quotation, or placing an instant
        order, you agree to these Terms. If you don&apos;t agree, please don&apos;t use RekaDijo.
      </p>

      <LegalH2>1. What RekaDijo is</LegalH2>
      <p>
        RekaDijo is a marketplace that connects buyers with independent food vendors — including caterers,
        home-cooked food sellers, kota and sphatlo shops, and other small businesses — for bulk and event
        quotations, and, where a vendor chooses to enable it, instant ordering. TechTur Solutions is not the
        seller of any food or drink listed on the platform; each vendor is solely responsible for the food they
        prepare, its quality, safety, pricing, and fulfillment.
      </p>

      <LegalH2>2. Accounts</LegalH2>
      <p>
        You must provide accurate information when registering and keep your login credentials confidential.
        You&apos;re responsible for all activity under your account. We may suspend or terminate accounts that
        violate these Terms, our Community Guidelines, or applicable law.
      </p>

      <LegalH2>3. Quotations</LegalH2>
      <p>
        A quotation request is not a binding order. A vendor may accept, decline, or revise a request before it
        becomes a paid order. Payment is only ever collected after you have explicitly accepted a vendor&apos;s
        quotation (or its revision) — RekaDijo will not charge you for a quotation you haven&apos;t approved.
      </p>

      <LegalH2>4. Instant orders</LegalH2>
      <p>
        Where a vendor enables instant ordering for specific items or branches, payment is collected immediately
        on checkout and the order proceeds without a separate approval step. Vendors set their own minimum order
        amounts, lead times, and delivery/pickup rules, which are displayed before you check out.
      </p>

      <LegalH2>5. Pricing, fees, and payment</LegalH2>
      <p>
        Prices are set by each vendor and may include delivery fees, calculated based on distance and the
        vendor&apos;s delivery zones. Any tip you add for a driver or vendor is voluntary and paid in addition to
        the order total. Promotional codes are subject to the terms shown at the time they&apos;re applied and may
        be withdrawn or limited by the issuing vendor or TechTur Solutions at any time.
      </p>

      <LegalH2>6. Cancellations and refunds</LegalH2>
      <p>
        See our <a href="/legal/refund-policy" className="font-semibold text-amber-700">Refund &amp; Cancellation
        Policy</a> for when orders and quotations can be cancelled, and how refunds are handled.
      </p>

      <LegalH2>7. Vendor and driver responsibilities</LegalH2>
      <p>
        Vendors are independent businesses responsible for food safety, licensing, accurate menu information, and
        fulfilling accepted orders on time. Drivers are independent delivery partners responsible for safe,
        timely delivery. Neither vendors nor drivers are employees or agents of TechTur Solutions. Additional
        terms applicable to vendors and drivers are set out in the{" "}
        <a href="/legal/vendor-agreement" className="font-semibold text-amber-700">Vendor Agreement</a> and{" "}
        <a href="/legal/driver-agreement" className="font-semibold text-amber-700">Driver Agreement</a>.
      </p>

      <LegalH2>8. Reviews and content</LegalH2>
      <p>
        Ratings and reviews must reflect genuine experiences. We may remove content that is false, abusive, or
        violates our Community Guidelines, and may suspend accounts that misuse the review system.
      </p>

      <LegalH2>9. Liability</LegalH2>
      <p>
        RekaDijo is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, TechTur
        Solutions is not liable for the quality, safety, or legality of items listed by vendors, the accuracy of
        vendor-provided information, or the conduct of vendors, drivers, or buyers. Nothing in these Terms limits
        liability that cannot be excluded under South African law, including under the Consumer Protection Act 68
        of 2008 where it applies.
      </p>

      <LegalH2>10. Changes to these Terms</LegalH2>
      <p>
        We may update these Terms from time to time. Continued use of RekaDijo after an update constitutes
        acceptance of the revised Terms. Material changes will be highlighted on this page.
      </p>

      <LegalH2>11. Governing law</LegalH2>
      <p>
        These Terms are governed by the laws of the Republic of South Africa, without regard to conflict-of-law
        principles.
      </p>
    </LegalLayout>
  );
}
