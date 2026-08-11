import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm",
  secondary: "bg-charcoal-800 text-cream-100 hover:bg-charcoal-700",
  ghost: "bg-transparent text-charcoal-700 hover:bg-charcoal-100",
  outline: "border border-charcoal-200 text-charcoal-800 hover:bg-charcoal-50",
  danger: "bg-red-600 text-white hover:bg-red-700"
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base"
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:opacity-50 disabled:pointer-events-none focus-ring";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}>
      {children}
    </Link>
  );
}
