import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal-100 bg-charcoal-800 text-cream-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-lg font-semibold text-cream-100">
            Reka<span className="text-amber-400">Dijo</span>
          </p>
          <p className="mt-2 text-sm text-charcoal-200">BuyFood — quotation-first food ordering.</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-charcoal-400">A TechTur Solutions product</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-cream-100">Buyers</p>
          <ul className="mt-3 space-y-2 text-sm text-charcoal-200">
            <li><Link href="/vendors" className="hover:text-amber-400">Find vendors</Link></li>
            <li><Link href="/how-it-works" className="hover:text-amber-400">How quotations work</Link></li>
            <li><Link href="/dashboard/buyer" className="hover:text-amber-400">My orders</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-cream-100">Vendors</p>
          <ul className="mt-3 space-y-2 text-sm text-charcoal-200">
            <li><Link href="/vendors/join" className="hover:text-amber-400">Sell on RekaDijo</Link></li>
            <li><Link href="/dashboard/vendor" className="hover:text-amber-400">Vendor dashboard</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-cream-100">Support</p>
          <ul className="mt-3 space-y-2 text-sm text-charcoal-200">
            <li><Link href="/help" className="hover:text-amber-400">Help &amp; support</Link></li>
            <li><Link href="/about" className="hover:text-amber-400">About RekaDijo</Link></li>
            <li>
              <a href="mailto:techtursolutions@gmail.com" className="hover:text-amber-400">
                techtursolutions@gmail.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/27671714777" className="hover:text-amber-400">
                WhatsApp +27 67 171 4777
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-charcoal-700">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-charcoal-400 sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} TechTur Solutions. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/legal/terms" className="hover:text-amber-400">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-amber-400">Privacy</Link>
            <Link href="/legal/cookies" className="hover:text-amber-400">Cookies</Link>
            <Link href="/legal/refund-policy" className="hover:text-amber-400">Refunds</Link>
            <Link href="/legal/vendor-agreement" className="hover:text-amber-400">Vendor terms</Link>
            <Link href="/legal/driver-agreement" className="hover:text-amber-400">Driver terms</Link>
            <Link href="/legal/community-guidelines" className="hover:text-amber-400">Community guidelines</Link>
            <Link href="/legal/accessibility" className="hover:text-amber-400">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
