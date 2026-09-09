import type { Metadata } from "next";
import { PageShell } from "@/components/public/page-shell";
import { ResultsLanding } from "@/components/public/results-landing";

export const metadata: Metadata = {
  title: "Check Olympiad Results | i-CAPE",
  description:
    "View student and school olympiad results for i-CAPE Innovative Talent Search Examination.",
};

export default function ResultsPage() {
  return (
    <PageShell
      eyebrow="Olympiad Year 2025-26"
      title="Check Your Olympiad Results"
    >
      <ResultsLanding />
    </PageShell>
  );
}
