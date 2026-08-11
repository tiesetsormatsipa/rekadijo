import { LegalLayout, LegalH2 } from "@/components/legal-layout";

export const metadata = { title: "Cookie Policy" };

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="4 July 2026">
      <p>
        RekaDijo uses a small number of cookies and browser storage mechanisms to keep the platform working
        properly. This policy explains what they are and why we use them.
      </p>

      <LegalH2>1. Strictly necessary</LegalH2>
      <p>
        A single session cookie keeps you logged in securely. It&apos;s required for the platform to function and
        can&apos;t be disabled without logging you out.
      </p>

      <LegalH2>2. Functional (local storage)</LegalH2>
      <p>
        We use your browser&apos;s local storage (not a tracking cookie) to remember your selected delivery
        address and your delivery-vs-pickup preference between visits, so you don&apos;t have to re-enter them
        every time. This data stays on your device and is not sent to any advertising network.
      </p>

      <LegalH2>3. What we don&apos;t do</LegalH2>
      <p>
        RekaDijo and TechTur Solutions do not display third-party advertising and do not use advertising or
        cross-site tracking cookies. Any future analytics tooling will be disclosed here before it&apos;s enabled.
      </p>

      <LegalH2>4. Managing cookies</LegalH2>
      <p>
        You can clear cookies and local storage at any time through your browser settings. Doing so will log you
        out and reset your saved address preference.
      </p>
    </LegalLayout>
  );
}
