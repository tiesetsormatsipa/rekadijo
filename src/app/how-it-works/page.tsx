const STEPS = [
  { title: "Browse vendors & menus", body: "Search by category, location, or ordering mode. See which items support instant order vs quotation." },
  { title: "Build a quotation request", body: "Pick items and quantities, add your event type, date, and pickup or delivery preference." },
  { title: "Vendor responds", body: "The vendor reviews your request and can accept as-is, revise pricing/quantities, or decline." },
  { title: "You review & accept", body: "If revised, you review the new quotation and accept or decline it." },
  { title: "Pay after approval", body: "Payment only happens once you've accepted a quotation — never before." },
  { title: "Scheduled & fulfilled", body: "Your order is scheduled, prepared, and marked ready for pickup or delivery." }
];

export const metadata = { title: "How quotations work" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">How quotation-based ordering works</h1>
      <p className="mt-3 text-charcoal-600">
        RekaDijo is built for bulk orders, catering, and events — not instant delivery. Some vendors also enable
        instant ordering for everyday items, but quotations remain available for bulk requests either way.
      </p>

      <ol className="mt-8 space-y-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-800">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-charcoal-900">{step.title}</p>
              <p className="mt-1 text-sm text-charcoal-500">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
