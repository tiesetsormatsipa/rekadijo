import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Sell on RekaDijo" };

export default function VendorJoinPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Register your business</h1>
      <p className="mt-2 text-charcoal-500">
        Tell us about your business. Your first branch and menu can be set up next — you can add more branches
        later. New businesses start in <strong>pending verification</strong> until an admin approves them.
      </p>

      <div className="mt-8 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <OnboardingForm />
      </div>
    </div>
  );
}
