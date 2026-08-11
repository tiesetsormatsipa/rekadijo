"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "rekadijo:cookie-notice-dismissed";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // ignore
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-lg px-4 md:bottom-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-charcoal-100 bg-white p-4 shadow-cardHover">
        <p className="text-xs text-charcoal-600">
          We use a login cookie and local storage for your saved address — no tracking or ad cookies. See our{" "}
          <Link href="/legal/cookies" className="font-semibold text-amber-700">
            Cookie Policy
          </Link>
          .
        </p>
        <button onClick={dismiss} className="rounded-full bg-charcoal-800 px-4 py-1.5 text-xs font-semibold text-cream-100">
          Got it
        </button>
      </div>
    </div>
  );
}
