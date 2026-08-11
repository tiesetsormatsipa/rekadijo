import Link from "next/link";
import { FileText } from "lucide-react";

const DOCS = [
  { href: "/legal/terms", title: "Terms of Service", desc: "The rules for using RekaDijo as a buyer, vendor, or driver." },
  { href: "/legal/privacy", title: "Privacy Policy", desc: "How TechTur Solutions collects, uses, and protects your information under POPIA." },
  { href: "/legal/cookies", title: "Cookie Policy", desc: "How we use cookies and similar technologies." },
  { href: "/legal/refund-policy", title: "Refund & Cancellation Policy", desc: "When orders and quotations can be cancelled or refunded." },
  { href: "/legal/vendor-agreement", title: "Vendor / Merchant Agreement", desc: "Terms for businesses selling on RekaDijo." },
  { href: "/legal/driver-agreement", title: "Driver Agreement", desc: "Terms for independent delivery partners." },
  { href: "/legal/community-guidelines", title: "Community Guidelines", desc: "Expected conduct for everyone on the platform." },
  { href: "/legal/accessibility", title: "Accessibility Statement", desc: "Our commitment to an accessible experience." }
];

export const metadata = { title: "Legal" };

export default function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Legal</h1>
      <p className="mt-2 text-charcoal-500">Policies and agreements governing RekaDijo, operated by TechTur Solutions.</p>

      <div className="mt-8 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {DOCS.map((doc) => (
          <Link key={doc.href} href={doc.href} className="flex items-start gap-3 p-4 hover:bg-charcoal-50">
            <FileText className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
            <span>
              <span className="block text-sm font-semibold text-charcoal-900">{doc.title}</span>
              <span className="block text-xs text-charcoal-500">{doc.desc}</span>
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-charcoal-400">
        These documents are TechTur Solutions&apos; drafted templates for RekaDijo. They should be reviewed by a
        qualified attorney before relying on them in production, to confirm they meet current South African law
        (including the Protection of Personal Information Act and Consumer Protection Act) and your specific
        business circumstances.
      </p>
    </div>
  );
}
