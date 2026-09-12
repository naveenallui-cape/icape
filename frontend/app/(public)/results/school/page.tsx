import { Suspense } from "react";
import type { Metadata } from "next";
import { SchoolResultView } from "@/components/public/school-result-view";

export const metadata: Metadata = {
  title: "School Results | i-CAPE",
  robots: { index: false, follow: false },
};

export default function SchoolResultPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/60" />
        </div>
      }
    >
      <SchoolResultView />
    </Suspense>
  );
}
