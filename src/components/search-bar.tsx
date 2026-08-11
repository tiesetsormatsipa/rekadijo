"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;       // Cleans up or positions the outer form wrapper
  inputClassName?: string;  // Allows target overriding of the inner input box styles
  onChange?: (value: string) => void;
}

export function SearchBar({ 
  initialQuery = "", 
  placeholder = "Search for kota, biscuits, pizza...",
  className,
  inputClassName,
  onChange 
}: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
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

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-full border border-charcoal-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm focus-ring outline-none transition-all",
          inputClassName
        )}
      />
    </form>
  );
}