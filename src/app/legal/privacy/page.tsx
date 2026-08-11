import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="4 July 2026">
      <p>
        TechTur Solutions (&quot;we&quot;, &quot;us&quot;) operates RekaDijo. This policy explains what personal
        information we collect, why, and how it&apos;s protected, in line with South Africa&apos;s Protection of
        Personal Information Act 4 of 2013 (POPIA).
      </p>

      <LegalH2>1. Information we collect</LegalH2>
      <p>We collect information you give us directly, and information generated as you use RekaDijo:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account details: name, email, phone number, password (stored as a salted hash, never in plain text).</li>
        <li>Order and quotation activity: items requested or ordered, delivery/pickup addresses, event details you provide.</li>
        <li>Location: only when you choose to share it (e.g. &quot;use current location&quot;), used to show nearby vendors and estimate delivery distance/fees. We don&apos;t track your location in the background.</li>
        <li>Vendor and driver information: business details, verification documents, banking details for payouts (once a payment provider is connected).</li>
        <li>Communications: messages sent through the in-app messaging system, and support requests.</li>
        <li>Technical data: device/browser type and basic usage logs, for security and reliability.</li>
      </ul>

      <LegalH2>2. Why we process it (our lawful basis)</LegalH2>
      <ul className="list-disc space-y-1 pl-5">
        <li>To perform our contract with you — creating your account, processing quotations and orders, connecting you with vendors/drivers.</li>
        <li>Legitimate business interests — fraud prevention, platform security, improving the service.</li>
        <li>Legal obligations — record-keeping for tax and consumer-protection purposes.</li>
        <li>Consent — for optional features like sharing your live location, and for marketing communications you can opt out of at any time.</li>
      </ul>

      <LegalH2>3. Who we share it with</LegalH2>
      <p>
        We share only what&apos;s needed to fulfil your request: your name, order details, and delivery
        information go to the vendor (and driver, if delivery is involved) handling your order. We don&apos;t sell
        personal information. Once real payment, mapping, or messaging providers are connected (see our{" "}
        <a href="/legal/cookies" className="font-semibold text-amber-700">Cookie Policy</a> and product
        documentation for current status), those providers process the minimum data needed to perform their
        function under their own agreements with us.
      </p>

      <LegalH2>4. How long we keep it</LegalH2>
      <p>
        We retain account and transaction data for as long as your account is active and for a reasonable period
        afterward to meet legal, accounting, and dispute-resolution requirements. You can request deletion of your
        account at any time (see Section 6).
      </p>

      <LegalH2>5. Security</LegalH2>
      <p>
        We use industry-standard measures — including encrypted password storage, role-based access controls, and
        session-based authentication — to protect your information. No system is 100% secure, and we encourage
        you to use a strong, unique password.
      </p>

      <LegalH2>6. Your rights under POPIA</LegalH2>
      <p>You have the right to:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Access the personal information we hold about you.</li>
        <li>Request correction of inaccurate or outdated information.</li>
        <li>Request deletion of your personal information, subject to legal retention requirements.</li>
        <li>Object to processing based on legitimate interest, or withdraw consent where processing is based on consent.</li>
        <li>Lodge a complaint with the Information Regulator of South Africa if you believe your rights have been infringed.</li>
      </ul>
      <p>To exercise any of these rights, contact us at techtursolutions@gmail.com.</p>

      <LegalH2>7. Children</LegalH2>
      <p>RekaDijo is not directed at children, and we don&apos;t knowingly collect personal information from children without appropriate consent as required by POPIA.</p>

      <LegalH2>8. Changes to this policy</LegalH2>
      <p>We may update this policy as the platform evolves. We&apos;ll update the &quot;last updated&quot; date above when we do.</p>
    </LegalLayout>
  );
}
