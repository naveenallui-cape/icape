"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Shield,
  University,
  UserRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { schoolAuthMe, schoolLogout } from "@/lib/school-api";
import { cn } from "@/lib/utils";

type SessionKind = "school" | "admin";

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | {
      status: "authed";
      kind: SessionKind;
      email: string;
      label: string;
      href: string;
    };

function emailInitial(email: string) {
  const ch = email.trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

export function SiteLoginMenu({
  className,
  onNavigate,
  compact,
}: {
  className?: string;
  onNavigate?: () => void;
  /** Mobile drawer style — full width links */
  compact?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [adminRes, schoolRes] = await Promise.all([
        apiRequest<{ email?: string; name?: string }>("/auth/me"),
        schoolAuthMe(),
      ]);
      if (cancelled) return;

      if (schoolRes.success && schoolRes.data?.email) {
        setSession({
          status: "authed",
          kind: "school",
          email: schoolRes.data.email,
          label: "School login",
          href: "/school/portal",
        });
        return;
      }

      if (adminRes.success && adminRes.data) {
        const email = adminRes.data.email || adminRes.data.name || "admin";
        setSession({
          status: "authed",
          kind: "admin",
          email,
          label: "Admin Login",
          href: "/admin/dashboard",
        });
        return;
      }

      setSession({ status: "guest" });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isAuthed = session.status === "authed";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onLogout() {
    if (session.status !== "authed") return;
    if (session.kind === "school") {
      await schoolLogout();
    } else {
      await apiRequest("/auth/logout", { method: "POST" });
    }
    setSession({ status: "guest" });
    setOpen(false);
    onNavigate?.();
    router.refresh();
  }

  const guestLinks = (
    <>
      <Link
        href="/school/login"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 font-semibold text-brand hover:bg-brand-soft",
          compact ? "rounded-xl px-4 py-3 text-base" : "px-3.5 py-2.5 text-sm",
        )}
        onClick={() => {
          setOpen(false);
          onNavigate?.();
        }}
      >
        <University className="size-4 text-muted" aria-hidden />
        School login
      </Link>
      <Link
        href="/admin/login"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 font-semibold text-brand hover:bg-brand-soft",
          compact ? "rounded-xl px-4 py-3 text-base" : "px-3.5 py-2.5 text-sm",
        )}
        onClick={() => {
          setOpen(false);
          onNavigate?.();
        }}
      >
        <Shield className="size-4 text-muted" aria-hidden />
        Admin login
      </Link>
    </>
  );

  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        {session.status === "loading" ? (
          <div className="h-12 rounded-xl bg-brand-soft/60" aria-hidden />
        ) : isAuthed ? (
          <>
            <Link
              href={session.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl bg-brand px-4 py-3 text-white"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-brand">
                {emailInitial(session.email)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{session.label}</span>
                <span className="block truncate text-xs text-white/75">
                  {session.email}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-base font-bold text-brand hover:bg-brand-soft"
            >
              <LogOut className="size-4" aria-hidden />
              Log out
            </button>
          </>
        ) : (
          <>
            <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Login
            </p>
            {guestLinks}
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={session.status === "loading"}
        onClick={() => {
          if (session.status === "loading") return;
          setOpen((v) => !v);
        }}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-accent bg-accent pl-1.5 pr-2.5 text-sm font-bold text-brand shadow-sm transition hover:bg-accent-hover disabled:opacity-80"
      >
        {isAuthed ? (
          <>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-accent">
              {emailInitial(session.email)}
            </span>
            <span className="hidden max-w-[7.5rem] truncate lg:inline">
              {session.label}
            </span>
          </>
        ) : session.status === "loading" ? (
          <>
            <span
              className="inline-flex size-7 items-center justify-center rounded-full bg-brand/10"
              aria-hidden
            />
            <span className="w-10" aria-hidden />
          </>
        ) : (
          <>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand/10 text-brand">
              <UserRound className="size-3.5" aria-hidden />
            </span>
            <span>Login</span>
          </>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-brand/80 transition",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && session.status !== "loading" ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white py-1.5 shadow-[0_12px_30px_rgba(13,23,59,0.14)]"
        >
          {isAuthed ? (
            <>
              <div className="border-b border-border px-3.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {session.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-brand">
                  {session.email}
                </p>
              </div>
              <Link
                href={session.href}
                role="menuitem"
                className="block px-3.5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                {session.kind === "school" ? "Open portal" : "Open dashboard"}
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-semibold text-brand hover:bg-brand-soft"
                onClick={() => void onLogout()}
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </button>
            </>
          ) : (
            guestLinks
          )}
        </div>
      ) : null}
    </div>
  );
}
