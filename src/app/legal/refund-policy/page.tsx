import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Refund & Cancellation Policy" };

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" lastUpdated="4 July 2026">
      <p>
        RekaDijo is a marketplace connecting buyers with independent vendors. Because every vendor sets their own
        lead times and preparation schedules, cancellation windows can vary — but the platform-wide baseline
        rules below apply to every order.
      </p>

      <LegalH2>1. Quotation requests</LegalH2>
      <p>
        You can cancel a quotation request at any time before you&apos;ve accepted it — no charge applies, since
        payment is only collected after acceptance. Once you&apos;ve accepted a quotation and paid, the order
        follows the rules below.
      </p>

      <LegalH2>2. Instant and paid orders</LegalH2>
      <p>You can cancel a paid order yourself, free of charge, as long as it hasn&apos;t yet entered preparation — that is, while it shows any of these statuses:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Payment pending</li>
        <li>Paid</li>
        <li>Scheduled</li>
      </ul>
      <p>
        Once a vendor marks an order &quot;In preparation&quot;, self-service cancellation is no longer available,
        since ingredients or food may already be committed. Contact the vendor directly (via in-app messaging) to
        discuss — most vendors will still work with you where reasonably possible, but a cancellation fee or
        partial refund may apply at the vendor&apos;s discretion for that stage.
      </p>

      <LegalH2>3. Refunds</LegalH2>
      <p>
        Approved cancellations and vendor-declined quotations are refunded to your original payment method.
        Refund processing times depend on the payment method and provider once a live payment gateway is
        connected; in the interim development/demo environment, refunds are recorded as reversed in your order
        history immediately.
      </p>

      <LegalH2>4. Order issues</LegalH2>
      <p>
        If your order arrives incomplete, incorrect, or below expected quality, contact the vendor first via
        in-app messaging — most issues are resolved directly and quickly. If you can&apos;t reach a resolution,
        contact TechTur Solutions support at techtursolutions@gmail.com with your order reference, and we&apos;ll
        help mediate.
      </p>

      <LegalH2>5. Vendor-initiated cancellations</LegalH2>
      <p>
        A vendor may cancel an order they can no longer fulfil (e.g. unexpected stock shortage). You&apos;ll be
        notified immediately and refunded in full — you will never be charged for an order a vendor cancels.
      </p>

      <LegalH2>6. No-shows for pickup orders</LegalH2>
      <p>
        For pickup orders, please collect within the vendor&apos;s stated collection window. Repeated no-shows may
        result in a vendor declining future instant orders from your account, at their discretion.
      </p>
    </LegalLayout>
  );
}
