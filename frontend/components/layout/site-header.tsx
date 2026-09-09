"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteStatsBar } from "@/components/layout/site-stats-bar";
import { RegistrationDeadlineBar } from "@/components/layout/registration-deadline-bar";
import { SiteSearch } from "@/components/layout/site-search";
import { siteNavItems, type NavItem } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

function isItemActive(item: NavItem, pathname: string) {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div className="relative border-b border-border bg-white">
        <Link
          href="/"
          className="absolute left-4 top-1/2 z-10 shrink-0 -translate-y-1/2 sm:left-6"
        >
          <Image
            src="/brand/icape-logo.webp"
            alt="i-CAPE"
            width={72}
            height={72}
            className="h-14 w-auto object-contain sm:h-16"
            priority
          />
        </Link>

        <div className="absolute right-4 top-1/2 z-10 hidden shrink-0 -translate-y-1/2 md:right-6 md:block">
          <Image
            src="/brand/vitaran-learning.webp"
            alt="Vitaran Learning"
            width={160}
            height={56}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        <button
          type="button"
          className="absolute right-4 top-1/2 z-10 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-md text-brand hover:bg-brand-soft md:hidden"
          aria-expanded={open}
          aria-controls="mobile-side-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="size-7" /> : <Menu className="size-7" />}
        </button>

        {/* Mobile: logo + menu only */}
        <div className="min-h-[4.75rem] md:hidden" aria-hidden />

        {/* Desktop: title */}
        <div className="hidden min-h-[5.75rem] items-center justify-center px-36 py-5 md:flex">
          <p className="text-center text-3xl font-bold tracking-wide text-brand lg:text-4xl">
            Innovative Talent Search Examination
          </p>
        </div>
      </div>

      {/* Mobile title bar — full width with small side gaps */}
      <div className="w-full border-b border-border bg-brand-soft px-1.5 py-2.5 md:hidden">
        <p className="w-full text-center text-[4.4vw] font-bold leading-none tracking-wide text-brand whitespace-nowrap">
          Innovative Talent Search Examination
        </p>
      </div>

      <nav className="hidden border-b border-border bg-brand-soft md:block">
        <div className="relative mx-auto flex max-w-7xl items-center justify-center px-6 py-2">
          <SiteSearch className="absolute left-6 z-10 w-52 lg:w-60" />

          <ul className="flex items-center justify-center gap-1 lg:gap-2">
            {siteNavItems.map((item) => {
              const active = isItemActive(item, pathname);
              const hasChildren = Boolean(item.children?.length);

              return (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1 border-b-2 border-transparent px-3.5 py-2.5 text-xl font-bold text-brand",
                      active && "border-brand",
                    )}
                  >
                    {item.label}
                    {hasChildren ? (
                      <ChevronDown
                        className="size-4 opacity-70 transition group-hover:rotate-180"
                        aria-hidden
                      />
                    ) : null}
                  </Link>

                  {hasChildren ? (
                    <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <ul className="overflow-hidden rounded-xl border border-border bg-white py-2 shadow-[0_12px_30px_rgba(13,23,59,0.14)]">
                        {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block px-4 py-2.5 text-sm font-semibold leading-snug text-brand hover:bg-brand-soft"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <SiteStatsBar />
      <RegistrationDeadlineBar />

      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-brand/50 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />

        <aside
          id="mobile-side-nav"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] flex-col bg-white shadow-[-8px_0_30px_rgba(13,23,59,0.18)] transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border bg-brand px-5 py-4">
            <div>
              <p className="text-lg font-bold text-white">i-CAPE</p>
              <p className="text-sm text-white/75">Menu</p>
            </div>
            <button
              type="button"
              className="inline-flex rounded-md p-2 text-white hover:bg-white/10"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="size-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {siteNavItems.map((item) => {
                const active = isItemActive(item, pathname);
                const hasChildren = Boolean(item.children?.length);
                const expanded = mobileExpanded === item.href;

                return (
                  <li key={item.href}>
                    {hasChildren ? (
                      <div className="rounded-xl bg-brand-soft/60">
                        <div className="flex items-stretch">
                          <Link
                            href={item.href}
                            className={cn(
                              "flex-1 rounded-l-xl px-4 py-3.5 text-lg font-bold",
                              active ? "text-brand" : "text-brand",
                            )}
                            onClick={() => setOpen(false)}
                          >
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 text-brand"
                            aria-expanded={expanded}
                            aria-label={`${expanded ? "Hide" : "Show"} ${item.label} links`}
                            onClick={() =>
                              setMobileExpanded((prev) =>
                                prev === item.href ? null : item.href,
                              )
                            }
                          >
                            <ChevronDown
                              className={cn(
                                "size-5 transition",
                                expanded && "rotate-180",
                              )}
                            />
                          </button>
                        </div>

                        {expanded ? (
                          <ul className="space-y-1 border-t border-border/70 px-2 pb-2 pt-1">
                            {item.children!.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold leading-snug text-brand hover:bg-white"
                                  onClick={() => setOpen(false)}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-xl px-4 py-3.5 text-lg font-bold transition",
                          active
                            ? "bg-brand text-white"
                            : "text-brand hover:bg-brand-soft",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border bg-brand-soft px-5 py-4">
            <p className="text-sm font-medium text-muted">
              Innovative Talent Search Examination
            </p>
          </div>
        </aside>
      </div>
    </header>
  );
}
