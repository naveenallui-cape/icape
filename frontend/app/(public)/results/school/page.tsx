import { Suspense } from "react";
import type { Metadata } from "next";
import { PageShell } from "@/components/public/page-shell";
import { SchoolResultView } from "@/components/public/school-result-view";

export const metadata: Metadata = {
  title: "School Results | i-CAPE",
  robots: { index: false, follow: false },
};

export default function SchoolResultPage() {
  return (
    <PageShell
      title="School Results"
      description="Search school-wide olympiad results by School ID or name."
    >
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/60" />
        }
      >
        <SchoolResultView />
      </Suspense>
    </PageShell>
  );
}
