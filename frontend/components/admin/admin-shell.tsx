"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  FilePenLine,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/schools", label: "Schools", icon: School },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/olympiads", label: "Olympiads", icon: Trophy },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
  { href: "/admin/results/upload", label: "Upload Results", icon: FileUp },
  { href: "/admin/results/update", label: "Update Results", icon: FilePenLine },
  { href: "/admin/ratings", label: "Ratings", icon: Award },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/reports", label: "Student Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

const ADMIN_CACHE_KEY = "icape-admin-session";

function readAdminCache(): { name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: string; at?: number };
    if (!parsed?.name || !parsed.at) return null;
    // Keep UI warm for 60 minutes; still revalidated in background
    if (Date.now() - parsed.at > 60 * 60 * 1000) return null;
    return { name: parsed.name };
  } catch {
    return null;
  }
}

function writeAdminCache(name: string) {
  try {
    sessionStorage.setItem(
      ADMIN_CACHE_KEY,
      JSON.stringify({ name, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

function clearAdminCache() {
  try {
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function isNavActive(href: string, pathname: string) {
  if (href === "/admin/results") {
    return pathname === "/admin/results";
  }
  if (
    href === "/admin/results/upload" ||
    href === "/admin/results/update"
  ) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Must match SSR: never read sessionStorage during render (hydration-safe)
  const [ready, setReady] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    let cancelled = false;

    const cached = readAdminCache();
    if (cached) {
      setAdminName(cached.name);
      setReady(true);
    }

    async function check() {
      const res = await apiRequest<{ name: string }>("/auth/me");
      if (cancelled) return;
      if (!res.success) {
        // Only force logout on real auth failures — not transient network errors
        // (backend restart, Failed to fetch, etc.)
        if (res.networkError) {
          if (!cached) setReady(true);
          return;
        }
        if (res.status === 401 || res.message === "Unauthorized") {
          clearAdminCache();
          setReady(false);
          router.replace("/admin/login");
          return;
        }
        if (!cached) setReady(true);
        return;
      }
      const name = res.data?.name ?? "Admin";
      writeAdminCache(name);
      setAdminName(name);
      setReady(true);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    clearAdminCache();
    await apiRequest("/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] text-white">
        Loading admin…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef2f8]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[11.7rem] flex-col border-r border-white/10 bg-[#0d173b] text-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-bold">i-CAPE Admin</p>
            <p className="truncate text-xs text-white/60">{adminName}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-white/10 md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 pb-4">
          {nav.map((item) => {
            const active = isNavActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-accent text-brand"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/10 p-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col md:pl-[11.7rem]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-brand hover:bg-brand-soft md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>
          <p className="font-semibold text-brand">Administration Portal</p>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
