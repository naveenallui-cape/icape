"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { apiRequest } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await apiRequest("/auth/me");
      if (cancelled) return;
      if (res.success) {
        router.replace("/admin/dashboard");
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] text-sm text-white/70">
        Loading…
      </div>
    );
  }

  return <AdminLoginForm />;
}
