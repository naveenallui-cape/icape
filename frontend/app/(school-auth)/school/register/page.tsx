"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolRegisterPage } from "@/components/school/school-register-page";
import { schoolAuthMe } from "@/lib/school-api";

export default function SchoolRegisterRoute() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await schoolAuthMe();
      if (cancelled) return;
      if (res.success && res.data?.email) {
        router.replace("/school/portal?tab=registration");
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

  return <SchoolRegisterPage />;
}
