import Link from "next/link";
import { Download } from "lucide-react";
import { DownloadAllButton } from "@/components/public/download-all-button";
import { PageShell } from "@/components/public/page-shell";
import {
  allGrades,
  formatGradeLabel,
  olympiadPatterns,
  type GradePattern,
  type OlympiadPattern,
} from "@/lib/exam-pattern";

function patternGradeSlug(pattern: GradePattern) {
  return pattern.grades.length === 1
    ? `Grade-${pattern.grades[0]}`
    : `Grades-${pattern.grades.join("-")}`;
}

function PatternDownloadLink({
  href,
  fileName,
  label = "Download",
}: {
  href: string;
  fileName: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      download={fileName}
      className="inline-flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-brand shadow-sm transition hover:bg-accent-hover"
    >
      <Download className="size-4" aria-hidden />
      {label}
    </a>
  );
}

function GradeTable({ pattern }: { pattern: GradePattern }) {
  const rows: { label: string; value: string }[] = [
    { label: "Grade", value: formatGradeLabel(pattern.grades) },
    { label: "Total Questions", value: String(pattern.totalQuestions) },
    { label: "Time", value: pattern.time },
    { label: "Total Marks", value: String(pattern.totalMarks) },
    {
      label: "Marks per Question",
      value: String(pattern.marksPerQuestion),
    },
    {
      label: "Negative Marking",
      value: pattern.negativeMarking
        ? "Yes"
        : "No negative marks for wrong answers",
    },
    ...pattern.sections.map((section) => ({
      label: section.title,
      value: section.topics.join(" "),
    })),
    {
      label: "Instructions",
      value: pattern.instructions
        .map((item, index) => `${index + 1}. ${item}`)
        .join(" "),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead className="bg-brand-stats text-white">
          <tr>
            <th className="w-[28%] px-4 py-3 text-base font-semibold">
              Particulars
            </th>
            <th className="px-4 py-3 text-base font-semibold">Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.label}
              className={index % 2 === 0 ? "bg-surface" : "bg-background"}
            >
              <td className="align-top px-4 py-3 text-base font-semibold text-brand">
                {row.label}
              </td>
              <td className="px-4 py-3 text-base leading-relaxed text-muted">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OlympiadGradePatterns({ olympiad }: { olympiad: OlympiadPattern }) {
  const renderedPatternKeys = new Set<string>();

  if (olympiad.patterns.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-5 py-4 text-base text-muted">
        {olympiad.shortName} pattern details for Grades 3 to 10 will be added
        soon.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {allGrades.map((grade) => {
        const pattern = olympiad.patterns.find((item) =>
          item.grades.includes(grade),
        );

        if (!pattern) {
          return (
            <section
              key={`${olympiad.id}-${grade}`}
              id={`${olympiad.id}-grade-${grade}`}
              className="scroll-mt-28 space-y-4"
            >
              <div>
                <h3 className="text-xl font-bold text-brand sm:text-2xl">
                  Grade {grade}
                </h3>
                <div className="mt-2 h-0.5 w-12 bg-accent" aria-hidden />
              </div>
              <p className="rounded-xl border border-border bg-surface px-5 py-4 text-base text-muted">
                Pattern details for {olympiad.shortName} Grade {grade} will be
                added soon.
              </p>
            </section>
          );
        }

        const patternKey = `${olympiad.id}-${pattern.grades.join("-")}`;
        if (renderedPatternKeys.has(patternKey)) return null;
        renderedPatternKeys.add(patternKey);

        const label = formatGradeLabel(pattern.grades);
        const slug = patternGradeSlug(pattern);
        const fileName = `i-CAPE-${olympiad.shortName}-${slug}-Pattern.pdf`;

        return (
          <section
            key={patternKey}
            id={`${olympiad.id}-grade-${pattern.grades.join("-")}`}
            className="scroll-mt-28 space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-brand sm:text-2xl">
                  {label}
                </h3>
                <div className="mt-2 h-0.5 w-12 bg-accent" aria-hidden />
              </div>
              <PatternDownloadLink
                href={`/pattern/${fileName}`}
                fileName={fileName}
                label="Download PDF"
              />
            </div>
            <GradeTable pattern={pattern} />
          </section>
        );
      })}
    </div>
  );
}

export default function PatternPage() {
  return (
    <PageShell
      title="Pattern of Questions, Syllabus and Marking Scheme"
      description="Question pattern, syllabus areas, and marking scheme for IMO, ISO, and IEO — Grades 3 to 10."
      action={
        <DownloadAllButton
          href="/pattern/i-CAPE-Pattern-of-Questions-and-Marking-Scheme.pdf"
          fileName="i-CAPE-Pattern-of-Questions-and-Marking-Scheme.pdf"
          label="Download all PDFs"
        />
      }
    >
      <div className="space-y-14">
        <nav
          aria-label="Olympiad patterns"
          className="flex flex-wrap gap-3"
        >
          {olympiadPatterns.map((olympiad) => (
            <Link
              key={olympiad.id}
              href={`#${olympiad.id}`}
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-base font-bold text-brand transition hover:border-accent hover:bg-accent-soft"
            >
              {olympiad.shortName}
            </Link>
          ))}
        </nav>

        {olympiadPatterns.map((olympiad) => {
          const olympiadFile = `i-CAPE-${olympiad.shortName}-Pattern.pdf`;
          return (
            <section
              key={olympiad.id}
              id={olympiad.id}
              className="scroll-mt-28 space-y-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                    {olympiad.shortName}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-brand sm:text-3xl">
                    {olympiad.fullName}
                  </h2>
                  <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
                </div>
                <PatternDownloadLink
                  href={`/pattern/${olympiadFile}`}
                  fileName={olympiadFile}
                  label={`Download ${olympiad.shortName}`}
                />
              </div>

              <OlympiadGradePatterns olympiad={olympiad} />
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
