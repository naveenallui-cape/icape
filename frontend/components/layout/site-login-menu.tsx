"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Shield,
  University,
  UserRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  broadcastAuthChanged,
  subscribeAuthChanged,
} from "@/lib/auth-session-sync";
import { openNamedTab, TAB_NAMES } from "@/lib/open-named-tab";
import { schoolAuthMe, schoolLogout } from "@/lib/school-api";
import { cn } from "@/lib/utils";

type SessionKind = "school" | "admin";

type AuthedSession = {
  kind: SessionKind;
  email: string;
  label: string;
  href: string;
};

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authed"; sessions: AuthedSession[] };

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

  const loadSession = useCallback(async () => {
    const [adminRes, schoolRes] = await Promise.all([
      apiRequest<{ email?: string; name?: string }>("/auth/me"),
      schoolAuthMe(),
    ]);

    const sessions: AuthedSession[] = [];

    if (schoolRes.success && schoolRes.data?.email) {
      sessions.push({
        kind: "school",
        email: schoolRes.data.email,
        label: "School portal",
        href: "/school/portal?tab=registration",
      });
    }

    if (adminRes.success && adminRes.data) {
      const email = adminRes.data.email || adminRes.data.name || "admin";
      sessions.push({
        kind: "admin",
        email,
        label: "Admin",
        href: "/admin/dashboard",
      });
    }

    if (sessions.length > 0) {
      setSession({ status: "authed", sessions });
      return;
    }

    setSession({ status: "guest" });
  }, []);

  useEffect(() => {
    void loadSession();
  }, [pathname, loadSession]);

  useEffect(() => {
    return subscribeAuthChanged(() => {
      void loadSession();
    });
  }, [loadSession]);

  const isAuthed = session.status === "authed";
  const primary = isAuthed ? session.sessions[0] : null;

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

  async function onLogout(kind?: SessionKind) {
    if (session.status !== "authed") return;
    const targets = kind
      ? session.sessions.filter((s) => s.kind === kind)
      : session.sessions;

    for (const s of targets) {
      if (s.kind === "school") await schoolLogout();
      else await apiRequest("/auth/logout", { method: "POST" });
    }

    broadcastAuthChanged();
    await loadSession();
    setOpen(false);
    onNavigate?.();
    router.refresh();
  }

  function openSchoolLogin() {
    setOpen(false);
    onNavigate?.();
    openNamedTab("/school/login", TAB_NAMES.school);
  }

  function openAdminLogin() {
    setOpen(false);
    onNavigate?.();
    openNamedTab("/admin/login", TAB_NAMES.admin);
  }

  function openAuthedApp(s: AuthedSession) {
    setOpen(false);
    onNavigate?.();
    openNamedTab(
      s.href,
      s.kind === "school" ? TAB_NAMES.school : TAB_NAMES.admin,
    );
  }

  const guestLinks = (
    <>
      <button
        type="button"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 text-left font-semibold text-brand hover:bg-brand-soft",
          compact ? "rounded-xl px-4 py-3 text-base" : "px-3.5 py-2.5 text-sm",
        )}
        onClick={openSchoolLogin}
      >
        <University className="size-4 text-muted" aria-hidden />
        School login
      </button>
      <button
        type="button"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 text-left font-semibold text-brand hover:bg-brand-soft",
          compact ? "rounded-xl px-4 py-3 text-base" : "px-3.5 py-2.5 text-sm",
        )}
        onClick={openAdminLogin}
      >
        <Shield className="size-4 text-muted" aria-hidden />
        Admin login
      </button>
    </>
  );

  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        {session.status === "loading" ? (
          <div className="h-12 rounded-xl bg-brand-soft/60" aria-hidden />
        ) : isAuthed && primary ? (
          <>
            {session.sessions.map((s) => (
              <button
                key={s.kind}
                type="button"
                onClick={() => openAuthedApp(s)}
                className="flex w-full items-center gap-3 rounded-xl bg-brand px-4 py-3 text-left text-white"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-brand">
                  {emailInitial(s.email)}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{s.label}</span>
                  <span className="block truncate text-xs text-white/75">
                    {s.email}
                  </span>
                </span>
              </button>
            ))}
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
        {isAuthed && primary ? (
          <>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-accent">
              {emailInitial(primary.email)}
            </span>
            <span className="hidden max-w-[7.5rem] truncate lg:inline">
              {session.sessions.length > 1 ? "Account" : primary.label}
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
              {session.sessions.map((s) => (
                <div key={s.kind}>
                  <div className="border-b border-border px-3.5 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {s.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-brand">
                      {s.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3.5 py-2.5 text-left text-sm font-semibold text-brand hover:bg-brand-soft"
                    onClick={() => openAuthedApp(s)}
                  >
                    {s.kind === "school" ? "Open portal" : "Open dashboard"}
                  </button>
                </div>
              ))}
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 border-t border-border px-3.5 py-2.5 text-left text-sm font-semibold text-brand hover:bg-brand-soft"
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
