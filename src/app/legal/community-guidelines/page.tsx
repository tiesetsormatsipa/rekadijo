import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Community Guidelines" };

export default function CommunityGuidelinesPage() {
  return (
    <LegalLayout title="Community Guidelines" lastUpdated="4 July 2026">
      <p>
        RekaDijo works because buyers, vendors, and drivers treat each other with respect. These guidelines apply
        to everyone on the platform, in every interaction — quotation messages, reviews, and support conversations
        included.
      </p>

      <LegalH2>Be honest</LegalH2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Vendors: describe your food, quantities, and availability accurately.</li>
        <li>Buyers: give real quantities and event details so vendors can quote accurately.</li>
        <li>Everyone: reviews must reflect a genuine experience — no fake reviews, in either direction.</li>
      </ul>

      <LegalH2>Be respectful</LegalH2>
      <p>
        Harassment, threats, discriminatory language, or abusive behaviour toward any buyer, vendor, driver, or
        TechTur Solutions team member is not tolerated and may result in immediate suspension.
      </p>

      <LegalH2>Be safe</LegalH2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Follow food safety and hygiene practices appropriate to your role.</li>
        <li>Drivers: drive safely and lawfully; never ask a buyer or vendor to compromise on safety to save time.</li>
        <li>Don&apos;t share personal contact details to bypass the platform for the purpose of avoiding fees or accountability.</li>
      </ul>

      <LegalH2>No fraud or manipulation</LegalH2>
      <p>
        Don&apos;t create fake accounts, manipulate ratings, misuse promo codes, or attempt to defraud another user
        or TechTur Solutions. Confirmed fraud results in permanent removal from the platform and may be reported
        to relevant authorities.
      </p>

      <LegalH2>Reporting a problem</LegalH2>
      <p>
        If someone violates these guidelines, use in-app messaging to raise it directly where appropriate, or
        contact TechTur Solutions support at techtursolutions@gmail.com with details. We review every report.
      </p>
    </LegalLayout>
  );
}
