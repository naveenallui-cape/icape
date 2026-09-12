"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { homeCards, siteNavItems } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

type SearchEntry = {
  label: string;
  href: string;
  group: string;
};

function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const seen = new Set<string>();

  const add = (label: string, href: string, group: string) => {
    const key = href.split("#")[0] + "|" + label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ label, href, group });
  };

  for (const item of siteNavItems) {
    add(item.label, item.href, "Navigation");
    for (const child of item.children ?? []) {
      add(child.label, child.href, item.label);
    }
  }

  for (const card of homeCards) {
    add(card.title, card.href, "Pages");
  }

  return entries;
}

const SEARCH_INDEX = buildSearchIndex();

export function SiteSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.group.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const goTo = (href: string) => {
    setQuery("");
    setOpen(false);
    router.push(href);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (results[activeIndex]) {
      goTo(results[activeIndex].href);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-xs", className)}>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search site
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            ref={inputRef}
            id={`${listId}-input`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                setOpen(true);
                return;
              }
              if (event.key === "Escape") {
                setOpen(false);
                setQuery("");
                inputRef.current?.blur();
                return;
              }
              if (!results.length) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((i) => (i + 1) % results.length);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((i) => (i - 1 + results.length) % results.length);
              }
            }}
            placeholder="Search…"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open && (query.trim().length > 0 || results.length > 0)}
            className="h-7 border-brand/20 bg-white/90 pl-8 pr-8 text-sm shadow-none focus-visible:ring-brand/25"
          />
          {query ? (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted hover:bg-brand-soft hover:text-brand"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {open && query.trim() ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-72 overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-[0_12px_30px_rgba(13,23,59,0.14)]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted">No matching pages</li>
          ) : (
            results.map((entry, index) => (
              <li key={`${entry.href}-${entry.label}`} role="option" aria-selected={index === activeIndex}>
                <Link
                  href={entry.href}
                  className={cn(
                    "block px-3 py-2.5 text-sm transition",
                    index === activeIndex ? "bg-brand-soft" : "hover:bg-brand-soft/70",
                  )}
                  onClick={() => {
                    setQuery("");
                    setOpen(false);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="font-semibold text-brand">{entry.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{entry.group}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
