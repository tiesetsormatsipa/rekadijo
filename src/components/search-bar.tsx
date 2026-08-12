"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Store, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchSuggestion = {
  label: string;
  href: string;
  eyebrow?: string;
  type?: "item" | "vendor" | "category";
};

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;       // Cleans up or positions the outer form wrapper
  inputClassName?: string;  // Allows target overriding of the inner input box styles
  onChange?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
}

export function SearchBar({ 
  initialQuery = "", 
  placeholder = "Search for kota, biscuits, pizza...",
  className,
  inputClassName,
  onChange,
  suggestions = [],
  showSuggestions = false
}: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  // Keeps the input field text synced if initialQuery drops down from parent layers
  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function handleChange(text: string) {
    setValue(text);
    if (onChange) {
      onChange(text);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;

    // CIRCUIT BREAKER: Stops map view from navigating away to /search
    if (onChange) return;

    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  const visibleSuggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!showSuggestions || query.length < 1) return [];

    return suggestions
      .filter((suggestion) => {
        const haystack = `${suggestion.label} ${suggestion.eyebrow ?? ""}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 7);
  }, [showSuggestions, suggestions, value]);

  const shouldShowSuggestions = focused && visibleSuggestions.length > 0;

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "w-full rounded-full border border-charcoal-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm focus-ring outline-none transition-all",
          inputClassName
        )}
      />
      {shouldShowSuggestions && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-xl">
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-charcoal-400">
            Search suggestions
          </div>
          <div className="max-h-80 overflow-y-auto">
            {visibleSuggestions.map((suggestion) => {
              const Icon = suggestion.type === "vendor" ? Store : suggestion.type === "category" ? Search : Utensils;

              return (
                <Link
                  key={`${suggestion.type ?? "item"}-${suggestion.label}-${suggestion.href}`}
                  href={suggestion.href}
                  className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-charcoal-50"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-charcoal-50 text-charcoal-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-charcoal-900">{suggestion.label}</span>
                    {suggestion.eyebrow && (
                      <span className="block truncate text-xs text-charcoal-500">{suggestion.eyebrow}</span>
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4 flex-none text-charcoal-300" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
}
