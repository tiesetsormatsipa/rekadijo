import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Driver Agreement" };

export default function DriverAgreementPage() {
  return (
    <LegalLayout title="Driver Agreement" lastUpdated="4 July 2026">
      <p>
        This Agreement applies in addition to our general{" "}
        <a href="/legal/terms" className="font-semibold text-amber-700">Terms of Service</a> to anyone registering
        as a delivery partner (&quot;Driver&quot;, &quot;you&quot;) on RekaDijo.
      </p>

      <LegalH2>1. Independent contractor status</LegalH2>
      <p>
        Drivers are independent contractors, not employees or agents of TechTur Solutions. You choose when to be
        available for assignments by toggling your availability, and you&apos;re free to use other delivery
        platforms.
      </p>

      <LegalH2>2. Requirements</LegalH2>
      <ul className="list-disc space-y-1 pl-5">
        <li>A valid means of transport suited to the deliveries you accept, and any licence/registration your vehicle type requires under South African law.</li>
        <li>Safe, lawful driving and food-handling practices (keep deliveries upright, sealed, and hygienic).</li>
        <li>Timely status updates in the app so buyers and vendors can track progress.</li>
      </ul>

      <LegalH2>3. Assignments</LegalH2>
      <p>
        Vendors assign deliveries to available drivers. You may accept or decline an assignment; repeated declines
        may reduce how often you&apos;re offered assignments. Once accepted, please complete the delivery or
        communicate promptly if you&apos;re unable to.
      </p>

      <LegalH2>4. Payment and tips</LegalH2>
      <p>
        Delivery fees and any buyer tips are intended for the driver who completes the delivery. Payout mechanics
        will be disclosed once a live payment gateway is connected; currently, all payments run through a
        placeholder gateway for testing.
      </p>

      <LegalH2>5. Ratings</LegalH2>
      <p>
        Buyers may rate their delivery experience. Consistently low ratings, safety complaints, or reports of
        mishandled food may result in suspension from receiving further assignments.
      </p>

      <LegalH2>6. Liability and insurance</LegalH2>
      <p>
        You&apos;re responsible for your own vehicle, its roadworthiness, and any insurance required by law for
        your delivery activity. TechTur Solutions does not provide vehicle or liability insurance for delivery
        partners.
      </p>

      <LegalH2>7. Ending this Agreement</LegalH2>
      <p>You may deactivate your driver account at any time. We may suspend or remove driver access for safety complaints, fraud, or breach of this Agreement or our Community Guidelines.</p>
    </LegalLayout>
  );
}
