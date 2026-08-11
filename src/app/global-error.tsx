"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hook point for real error reporting (Sentry, etc.) once wired.
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-charcoal-500">
            An unexpected error occurred. You can try again, or head back to the homepage.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link href="/" className="inline-flex items-center rounded-full border border-charcoal-200 px-4 py-2.5 text-sm font-semibold text-charcoal-700">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
