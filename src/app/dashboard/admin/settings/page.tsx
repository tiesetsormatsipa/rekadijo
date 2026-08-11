import { prisma } from "@/lib/prisma";
import { SettingRow } from "./setting-row";

const KNOWN_SETTINGS = [
  { key: "default_delivery_base_fee", label: "Default delivery base fee (R)", defaultValue: "25" },
  { key: "default_delivery_per_km", label: "Default delivery rate per km (R)", defaultValue: "6" },
  { key: "default_delivery_fee_cap", label: "Default delivery fee cap (R)", defaultValue: "250" },
  { key: "support_email", label: "Support email", defaultValue: "techtursolutions@gmail.com" },
  { key: "support_whatsapp", label: "Support WhatsApp", defaultValue: "+27671714777" }
];

export default async function AdminSettingsPage() {
  const rows = await prisma.platformSetting.findMany();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Platform settings</h1>
      <p className="mt-1 text-charcoal-500">
        These feed the delivery-fee estimator (<code className="rounded bg-charcoal-100 px-1">src/lib/geo.ts</code>) and
        default support contact details shown across the site.
      </p>

      <div className="mt-6 space-y-3">
        {KNOWN_SETTINGS.map((s) => {
          const stored = rows.find((r) => r.key === s.key);
          const value = stored ? JSON.stringify(stored.value).replace(/^"|"$/g, "") : s.defaultValue;
          return <SettingRow key={s.key} settingKey={s.key} label={s.label} value={value} />;
        })}
      </div>
    </div>
  );
}
