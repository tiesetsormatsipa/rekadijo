import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Welcome back</h1>
      <p className="mt-2 text-charcoal-500">Log in to manage your quotations and orders.</p>

      <div className="mt-8 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-charcoal-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-amber-700 hover:text-amber-800">
          Sign up
        </Link>
      </p>

      <div className="mt-10 rounded-xl bg-charcoal-50 p-4 text-xs text-charcoal-500">
        <p className="font-semibold text-charcoal-700">Development seed accounts (password: Password@123)</p>
        <ul className="mt-2 space-y-1">
          <li>superadmin@rekadijo.co.za — SuperAdmin</li>
          <li>admin@rekadijo.co.za — Admin</li>
          <li>vendor@rekadijo.co.za — Vendor (TR. Matsipa Market)</li>
          <li>staff@rekadijo.co.za — Vendor staff</li>
          <li>buyer@rekadijo.co.za — Buyer</li>
          <li>driver@rekadijo.co.za — Driver</li>
        </ul>
      </div>
    </div>
  );
}
