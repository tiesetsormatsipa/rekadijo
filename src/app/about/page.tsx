import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "About RekaDijo" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">About RekaDijo</h1>
      <p className="mt-4 text-charcoal-600">
        RekaDijo — &quot;BuyFood&quot; — is a quotation-first food ordering platform built by{" "}
        <strong>TechTur Solutions</strong>. We started from a simple observation: most food-ordering apps are
        built around instant delivery of individual meals, but a huge amount of real food commerce — church
        orders, birthdays, office lunches, family gatherings, school events — is bulk, planned, and needs a real
        conversation about quantity, pricing, and timing before any money changes hands.
      </p>
      <p className="mt-4 text-charcoal-600">
        So RekaDijo puts quotations first. Request what you need, a vendor sends back a real price, you review it,
        and you only pay once you&apos;ve accepted. For everyday cravings, vendors can also switch on instant
        ordering — so the same platform works for a Tuesday kota and a 200-person church function.
      </p>
      <p className="mt-4 text-charcoal-600">
        We built RekaDijo specifically with small and informal food businesses in mind — home bakers, kota and
        sphatlo sellers, caterers working out of a single kitchen — supporting multi-branch operations, flexible
        pickup and delivery rules, and branch-by-branch stock control, without requiring the overhead a bigger
        platform assumes every seller has.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-charcoal-900">TechTur Solutions</h2>
      <p className="mt-3 text-charcoal-600">
        TechTur Solutions builds practical software for South African businesses. RekaDijo is our food-ordering
        product; you can reach our team any time at{" "}
        <a href="mailto:techtursolutions@gmail.com" className="font-semibold text-amber-700">
          techtursolutions@gmail.com
        </a>{" "}
        or WhatsApp{" "}
        <a href="https://wa.me/27671714777" className="font-semibold text-amber-700">
          +27 67 171 4777
        </a>
        .
      </p>

      <div className="mt-8 flex gap-3">
        <ButtonLink href="/vendors">Find vendors</ButtonLink>
        <ButtonLink href="/vendors/join" variant="outline">
          Sell on RekaDijo
        </ButtonLink>
      </div>
    </div>
  );
}
