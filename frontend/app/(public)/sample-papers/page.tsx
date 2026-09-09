import { Suspense } from "react";
import { DownloadAllButton } from "@/components/public/download-all-button";
import { PageShell } from "@/components/public/page-shell";
import { SamplePapersShowcase } from "@/components/public/sample-papers-showcase";

export default function SamplePapersPage() {
  return (
    <PageShell
      title="Sample / Model Papers"
      description="View and download IMO, ISO, and IEO model papers for Grades 3 to 10."
      action={
        <DownloadAllButton
          href="/sample-papers/i-CAPE-All-Sample-Papers.zip"
          fileName="i-CAPE-All-Sample-Papers.zip"
          label="Download all PDFs"
        />
      }
    >
      <Suspense
        fallback={
          <p className="text-base text-muted sm:text-lg">Loading papers…</p>
        }
      >
        <SamplePapersShowcase />
      </Suspense>
    </PageShell>
  );
}
