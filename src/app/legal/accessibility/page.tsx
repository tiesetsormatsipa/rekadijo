import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Accessibility Statement" };

export default function AccessibilityPage() {
  return (
    <LegalLayout title="Accessibility Statement" lastUpdated="4 July 2026">
      <p>
        TechTur Solutions wants RekaDijo to be usable by as many people as possible, including people using
        assistive technology such as screen readers, keyboard-only navigation, or magnification tools.
      </p>

      <LegalH2>What we&apos;ve built in</LegalH2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Semantic HTML structure and labelled form fields throughout the buyer, vendor, driver, and admin experiences.</li>
        <li>Visible keyboard focus states on interactive elements.</li>
        <li>Colour choices checked for reasonable contrast against our cream/charcoal/amber palette.</li>
        <li>Alt text support for vendor and menu item images.</li>
        <li>Responsive layouts that work with browser zoom and a range of screen sizes.</li>
      </ul>

      <LegalH2>Ongoing work</LegalH2>
      <p>
        Accessibility is an ongoing process, not a one-time checklist. As RekaDijo grows, we&apos;ll continue
        auditing new features (like the map view and messaging) against WCAG 2.1 AA guidance.
      </p>

      <LegalH2>Let us know</LegalH2>
      <p>
        If you encounter an accessibility barrier anywhere on RekaDijo, please tell us — email
        techtursolutions@gmail.com with the page and a description of the issue, and we&apos;ll prioritise a fix.
      </p>
    </LegalLayout>
  );
}
