"use client";

import { ServerOff } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import {
  reportServerUnreachable,
  subscribeServerStatus,
} from "@/lib/server-status";

const HEALTHY_POLL_MS = 15_000;
const RETRY_POLL_MS = 4_000;

type ServerStatusProviderProps = {
  children: ReactNode;
};

export function ServerStatusProvider({ children }: ServerStatusProviderProps) {
  const [unreachable, setUnreachable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [mounted, setMounted] = useState(false);

  const probe = useCallback(async (manual = false) => {
    if (manual) setChecking(true);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        reportServerUnreachable();
        return;
      }
      await apiRequest("/health");
    } finally {
      if (manual) setChecking(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    return subscribeServerStatus(setUnreachable);
  }, []);

  useEffect(() => {
    void probe();

    const onOnline = () => {
      void probe();
    };
    const onOffline = () => {
      reportServerUnreachable();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void probe();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [probe]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void probe();
    }, unreachable ? RETRY_POLL_MS : HEALTHY_POLL_MS);
    return () => window.clearInterval(id);
  }, [probe, unreachable]);

  useEffect(() => {
    if (!unreachable) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [unreachable]);

  return (
    <>
      {children}
      {mounted && unreachable
        ? createPortal(
            <ServerUnreachableScreen
              checking={checking}
              onRetry={() => {
                void probe(true);
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function ServerUnreachableScreen({
  checking,
  onRetry,
}: {
  checking: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="no-print fixed inset-0 z-[300] flex items-center justify-center bg-[#0b1228]/85 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="server-unreachable-title"
        aria-describedby="server-unreachable-desc"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white px-6 py-8 text-center shadow-2xl sm:px-8"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ServerOff className="size-7" aria-hidden />
        </div>
        <h2
          id="server-unreachable-title"
          className="font-serif text-2xl font-semibold tracking-tight text-brand"
        >
          Server unreachable
        </h2>
        <p id="server-unreachable-desc" className="mt-2 text-sm leading-relaxed text-muted">
          The i-CAPE server is not responding. Check your connection, then try
          again.
        </p>
        <Button
          className="mt-6 min-w-36"
          onClick={onRetry}
          disabled={checking}
          autoFocus
        >
          {checking ? "Checking…" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
