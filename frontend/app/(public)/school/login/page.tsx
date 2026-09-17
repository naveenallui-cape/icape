"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolAuthShell } from "@/components/school/school-auth-shell";
import { SchoolLoginForm } from "@/components/school/school-login-form";
import { schoolAuthMe } from "@/lib/school-api";

export default function SchoolLoginPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await schoolAuthMe();
      if (cancelled) return;
      if (res.success && res.data?.email) {
        router.replace("/school/portal");
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
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <SchoolAuthShell
      title="School login"
      description="Please enter your registered Email ID and Password"
    >
      <SchoolLoginForm />
    </SchoolAuthShell>
  );
}
