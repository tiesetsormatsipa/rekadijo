import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-charcoal-100 text-charcoal-700",
  warning: "bg-amber-100 text-amber-800",
  success: "bg-olive-100 text-olive-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-charcoal-800/10 text-charcoal-800"
};

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "success" | "danger" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
