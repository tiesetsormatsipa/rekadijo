import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Create your account</h1>
      <p className="mt-2 text-charcoal-500">Order for events, bulk gatherings, or your everyday cravings.</p>

      <div className="mt-8 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-charcoal-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-800">
          Log in
        </Link>
      </p>
    </div>
  );
}
