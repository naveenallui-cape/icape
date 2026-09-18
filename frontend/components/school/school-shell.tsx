"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  ClipboardList,
  ClipboardPen,
  FileText,
  LogOut,
  Menu,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchMyRegistration, schoolAuthMe, schoolLogout } from "@/lib/school-api";
import { broadcastAuthChanged } from "@/lib/auth-session-sync";
import { cn } from "@/lib/utils";

export type SchoolPortalTab =
  | "registration"
  | "list"
  | "results"
  | "certificates"
  | "reports"
  | "rankings";

const NAV: Array<{
  tab: SchoolPortalTab;
  label: string;
  icon: typeof ClipboardPen;
  /** Show only before approval */
  hideWhenApproved?: boolean;
  /** Show only after approval */
  requiresApproved?: boolean;
}> = [
  {
    tab: "registration",
    label: "Registration",
    icon: ClipboardPen,
    hideWhenApproved: true,
  },
  {
    tab: "list",
    label: "Registered students",
    icon: ClipboardList,
    requiresApproved: true,
  },
  { tab: "results", label: "Results", icon: BarChart3 },
  { tab: "certificates", label: "Certificates", icon: Award },
  { tab: "reports", label: "Student reports", icon: FileText },
  { tab: "rankings", label: "Rankings", icon: Trophy },
];

function emailInitial(email: string) {
  const ch = email.trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function SchoolShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [schoolLabel, setSchoolLabel] = useState("School portal");
  const [approved, setApproved] = useState(false);

  const rawTab = searchParams.get("tab") || "registration";
  const activeTab = rawTab as SchoolPortalTab;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await schoolAuthMe();
      if (cancelled) return;
      if (!me.success || !me.data?.email) {
        router.replace("/school/login");
        return;
      }
      setEmail(me.data.email);
      setSchoolLabel(me.data.name || "School portal");

      const reg = await fetchMyRegistration();
      if (!cancelled) {
        if (reg.success && reg.data) {
          if (reg.data.schoolName) setSchoolLabel(reg.data.schoolName);
          setApproved(reg.data.status === "APPROVED");
        } else {
          // No registration yet — keep Registration, hide Registered students
          setApproved(false);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  // Approved → no Registration page. Not approved → no Registered students page.
  // Legacy dashboard tab → Registration (or list if approved).
  useEffect(() => {
    if (!ready) return;
    if (rawTab === "dashboard" || (!approved && activeTab === "list")) {
      router.replace(
        approved ? "/school/portal?tab=list" : "/school/portal?tab=registration",
      );
      return;
    }
    if (approved && activeTab === "registration") {
      router.replace("/school/portal?tab=list");
    }
  }, [ready, approved, activeTab, rawTab, router]);

  async function logout() {
    await schoolLogout();
    broadcastAuthChanged();
    window.location.assign("/school/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] text-white">
        <div className="text-center">
          <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
          <p className="text-sm text-white/80">Opening school portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef2f8]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-white/10 bg-[#0d173b] text-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-bold">i-CAPE School</p>
            <p className="truncate text-xs text-white/60">School portal</p>
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
          {NAV.map((item) => {
            if (item.requiresApproved && !approved) return null;
            if (item.hideWhenApproved && approved) return null;
            const href = `/school/portal?tab=${item.tab}`;
            const active = activeTab === item.tab;
            const Icon = item.icon;
            return (
              <Link
                key={item.tab}
                href={href}
                prefetch
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-accent text-brand"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-brand">
              {emailInitial(schoolLabel !== "School portal" ? schoolLabel : email)}
            </span>
            <div className="min-w-0">
              <p
                className="truncate text-xs font-semibold text-white"
                title={schoolLabel}
              >
                {schoolLabel !== "School portal" ? schoolLabel : "School login"}
              </p>
              <p className="truncate text-[11px] text-white/65" title={email}>
                {email}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col md:pl-56">
        <button
          type="button"
          className="fixed left-3 top-3 z-20 rounded-md border border-border bg-white p-2 text-brand shadow-sm hover:bg-brand-soft md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="size-5" />
        </button>
        <main className="flex-1 p-4 pt-14 md:p-6 md:pt-6">{children}</main>
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

export function SchoolShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b1228] text-sm text-white/80">
          Opening school portal…
        </div>
      }
    >
      <SchoolShellInner>{children}</SchoolShellInner>
    </Suspense>
  );
}
