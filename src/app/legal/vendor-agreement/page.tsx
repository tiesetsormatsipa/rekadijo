import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Vendor / Merchant Agreement" };

export default function VendorAgreementPage() {
  return (
    <LegalLayout title="Vendor / Merchant Agreement" lastUpdated="4 July 2026">
      <p>
        This Agreement applies in addition to our general{" "}
        <a href="/legal/terms" className="font-semibold text-amber-700">Terms of Service</a> to any business that
        registers as a vendor on RekaDijo (&quot;Vendor&quot;, &quot;you&quot;).
      </p>

      <LegalH2>1. Onboarding and verification</LegalH2>
      <p>
        New businesses start in &quot;pending verification&quot; and become visible to buyers only once approved.
        We may request supporting documents (e.g. business registration, ID, health/food-safety permits where
        applicable) and may decline or suspend a listing at our discretion, including for incomplete or inaccurate
        information.
      </p>

      <LegalH2>2. Your responsibilities</LegalH2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Accurately describe your menu, pricing, quantities, unit sizes, and dietary information.</li>
        <li>Comply with all applicable food safety, health, and municipal trading regulations for your area and business type.</li>
        <li>Honour accepted quotations and paid instant orders within the lead times and hours you&apos;ve set.</li>
        <li>Keep branch information current — operating hours, delivery radius, instant-order availability, and stock levels.</li>
        <li>Respond to quotation requests within your stated response window where reasonably possible.</li>
      </ul>

      <LegalH2>3. Multi-branch businesses</LegalH2>
      <p>
        If you operate more than one branch under the same business, each branch is independently responsible for
        its own availability, stock, hours, and fulfillment — while sharing your business-level menu, branding,
        and reputation (ratings apply at the business level).
      </p>

      <LegalH2>4. Pricing and payouts</LegalH2>
      <p>
        You set your own prices, minimum order amounts, and delivery zones/fees. Once a live payment gateway is
        connected, payouts will follow the schedule and any applicable platform commission disclosed to you at
        that time — no commission is currently deducted while payments run through the placeholder gateway.
      </p>

      <LegalH2>5. Cancellations by you</LegalH2>
      <p>
        If you must cancel an accepted order, do so as early as possible via your dashboard and notify the buyer.
        Repeated avoidable cancellations may affect your visibility or standing on the platform.
      </p>

      <LegalH2>6. Reviews</LegalH2>
      <p>
        Buyers may rate and review completed orders. You may respond to reviews via support but may not solicit,
        purchase, or fabricate reviews.
      </p>

      <LegalH2>7. Suspension and termination</LegalH2>
      <p>
        We may suspend or remove a Vendor listing for repeated food-safety complaints, fraud, harassment of
        buyers/drivers, or breach of this Agreement or our{" "}
        <a href="/legal/community-guidelines" className="font-semibold text-amber-700">Community Guidelines</a>.
        You may close your account at any time by contacting support.
      </p>
    </LegalLayout>
  );
}
