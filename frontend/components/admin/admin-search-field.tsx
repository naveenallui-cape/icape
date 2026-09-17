"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder: string;
  className?: string;
};

export function AdminSearchField({
  value,
  onChange,
  onClear,
  placeholder,
  className,
}: AdminSearchFieldProps) {
  return (
    <div className={cn("relative min-w-[220px] flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pl-9", value ? "pr-9" : undefined)}
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-brand-soft hover:text-brand"
          aria-label="Clear"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
