import { FaqAccordion } from "./faq-accordion";
import { ContactForm } from "./contact-form";
import { Mail, MessageCircle } from "lucide-react";

export const metadata = { title: "Help & Support" };

const FAQS = [
  {
    q: "What's the difference between a quotation and an instant order?",
    a: "A quotation is a request — you tell a vendor what you need and they send back real pricing, which you review and can accept or decline before paying anything. An instant order skips that step for items and branches where the vendor has enabled it: you pay immediately at checkout, like a typical delivery app."
  },
  {
    q: "When do I get charged for a quotation?",
    a: "Only after you've accepted the vendor's quotation (or their revised quotation). You'll never be charged for a request that's still pending, viewed, or declined."
  },
  {
    q: "Can I cancel an order?",
    a: "Yes — while it's payment pending, paid, or scheduled. Once a vendor marks it 'in preparation', self-service cancellation closes, since they may have already started. Message the vendor directly at that point."
  },
  {
    q: "How does delivery availability work?",
    a: "Each vendor branch sets its own delivery radius. If you're outside it, we'll show pickup instead (or quotation-only, if that's all the branch supports) rather than a broken checkout."
  },
  {
    q: "I run a small food business — can I sell on RekaDijo?",
    a: "Yes. Registration is open to home cooks, kota and sphatlo sellers, caterers, and any small food business. New vendors go through a quick verification step before going live."
  },
  {
    q: "How do I add more than one branch?",
    a: "From your vendor dashboard, go to Branches → Add branch. Your menu is shared across branches, but each branch controls its own hours, stock, delivery rules, and instant-order settings."
  },
  {
    q: "Is my payment information safe?",
    a: "RekaDijo doesn't store card details. Payments are designed to run through a certified payment gateway (currently a placeholder for testing) rather than through our own servers."
  }
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Help &amp; Support</h1>
      <p className="mt-2 text-charcoal-500">Answers to common questions, or reach the TechTur Solutions team directly.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href="mailto:techtursolutions@gmail.com"
          className="flex items-center gap-3 rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card hover:-translate-y-0.5 hover:shadow-cardHover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Mail className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-charcoal-900">Email support</span>
            <span className="block text-xs text-charcoal-500">techtursolutions@gmail.com</span>
          </span>
        </a>
        <a
          href="https://wa.me/27671714777"
          className="flex items-center gap-3 rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card hover:-translate-y-0.5 hover:shadow-cardHover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-charcoal-900">WhatsApp</span>
            <span className="block text-xs text-charcoal-500">+27 67 171 4777</span>
          </span>
        </a>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-charcoal-900">Frequently asked questions</h2>
      <div className="mt-4">
        <FaqAccordion items={FAQS} />
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-charcoal-900">Still stuck? Send us a message</h2>
      <div className="mt-4 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <ContactForm />
      </div>
    </div>
  );
}
