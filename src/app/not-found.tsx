import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-amber-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-charcoal-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-sm text-charcoal-500">
        It may have moved, or the link might be out of date. Try searching for a vendor instead.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <Link
          href="/vendors"
          className="inline-flex items-center rounded-full border border-charcoal-200 px-4 py-2.5 text-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
        >
          Find vendors
        </Link>
      </div>
    </div>
  );
}
