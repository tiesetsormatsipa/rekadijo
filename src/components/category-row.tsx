import Link from "next/link";
import { Sandwich, Cookie, Pizza, CupSoda, Beef, Cake, Salad, Soup, Coffee, IceCreamCone } from "lucide-react";

const CATEGORIES = [
  { label: "Kota & Sphatlo", query: "kota", icon: Sandwich },
  { label: "Biscuits & Baking", query: "biscuits", icon: Cookie },
  { label: "Pizza", query: "pizza", icon: Pizza },
  { label: "Drinks", query: "ginger beer", icon: CupSoda },
  { label: "Braai & Meat", query: "braai", icon: Beef },
  { label: "Cakes & Desserts", query: "cake", icon: Cake },
  { label: "Home-cooked", query: "home-cooked", icon: Soup },
  { label: "Salads", query: "salad", icon: Salad },
  { label: "Coffee", query: "coffee", icon: Coffee },
  { label: "Ice Cream", query: "ice cream", icon: IceCreamCone }
];

export function CategoryRow() {
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-10">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.label}
            href={`/search?q=${encodeURIComponent(cat.query)}`}
            className="flex w-20 flex-none flex-col items-center gap-2 text-center sm:w-auto"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-100">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-xs font-medium leading-tight text-charcoal-600">{cat.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
