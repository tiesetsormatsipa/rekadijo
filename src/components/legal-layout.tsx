import Link from "next/link";

export function LegalLayout({
  title,
  lastUpdated,
  children
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/legal" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
        ← All legal documents
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal-900">{title}</h1>
      <p className="mt-1 text-xs text-charcoal-400">Last updated: {lastUpdated}</p>

      <div className="prose-legal mt-8 space-y-5 text-sm leading-relaxed text-charcoal-700">{children}</div>

      <div className="mt-10 rounded-xl bg-charcoal-50 p-4 text-xs text-charcoal-500">
        Questions about this document? Contact TechTur Solutions at{" "}
        <a href="mailto:techtursolutions@gmail.com" className="font-semibold text-amber-700">
          techtursolutions@gmail.com
        </a>{" "}
        or WhatsApp{" "}
        <a href="https://wa.me/27671714777" className="font-semibold text-amber-700">
          +27 67 171 4777
        </a>
        .
      </div>
    </div>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 font-display text-lg font-semibold text-charcoal-900">{children}</h2>;
}
