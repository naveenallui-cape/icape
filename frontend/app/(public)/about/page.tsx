import { PageShell } from "@/components/public/page-shell";

export default function AboutPage() {
  return (
    <PageShell
      title="About us"
      description="i-CAPE — Innovative Talent Search Examination."
    >
      <div className="max-w-3xl space-y-4 text-base leading-relaxed text-foreground sm:text-lg">
        <p>
          i-CAPE (Innovative Talent Search Examination) organizes olympiad
          examinations that help schools identify and nurture student talent
          across subjects.
        </p>
        <p className="text-muted">
          Each Olympiad Year brings a fresh registration cycle so historical
          records stay intact while schools and students participate again with
          confidence.
        </p>
        <p className="text-muted">
          From registration forms and exam schedules to results and recognitions,
          i-CAPE supports schools through every step of the olympiad journey.
        </p>
      </div>
    </PageShell>
  );
}
