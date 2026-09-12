import { Suspense } from "react";
import { PageShell } from "@/components/public/page-shell";
import { SamplePapersShowcase } from "@/components/public/sample-papers-showcase";

export default function SamplePapersPage() {
  return (
    <PageShell title="Model Papers & Previous Papers">
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
