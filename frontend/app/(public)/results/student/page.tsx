import { Suspense } from "react";
import type { Metadata } from "next";
import { PageShell } from "@/components/public/page-shell";
import { StudentResultView } from "@/components/public/student-result-view";

export const metadata: Metadata = {
  title: "Student Result | i-CAPE",
  robots: { index: false, follow: false },
};

export default function StudentResultPage() {
  return (
    <PageShell
      title="Student Result"
      description="Your olympiad performance across IMO, ISO and IEO."
    >
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/60" />
        }
      >
        <StudentResultView />
      </Suspense>
    </PageShell>
  );
}
