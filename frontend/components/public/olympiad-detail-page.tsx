import Link from "next/link";
import {
  Award,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  FileDown,
  GraduationCap,
  ListChecks,
  UserCheck,
} from "lucide-react";
import { PageShell } from "@/components/public/page-shell";
import type { OlympiadPageContent } from "@/lib/olympiad-pages";

type Props = {
  content: OlympiadPageContent;
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-brand sm:text-3xl">{children}</h2>
      <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
    </div>
  );
}

export function OlympiadDetailPage({ content }: Props) {
  const patternAnchor = `#${content.id}`;

  return (
    <PageShell
      title={`${content.code} — ${content.fullName}`}
      description={`${content.fullName} by i-CAPE for Grades 3 to 10 · Olympiad Year 2026-27.`}
    >
      <div className="space-y-12">
        <section className="max-w-4xl space-y-4 text-base leading-relaxed text-muted sm:text-lg">
          {content.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </section>

        <section className="space-y-5">
          <SectionHeading>
            {content.fullName} ({content.code}) Exam 2026-27 Overview
          </SectionHeading>
          <p className="max-w-3xl text-base text-muted sm:text-lg">
            Know important details about the i-CAPE {content.fullName} (
            {content.code}) exam.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <tbody>
                {content.overview.map((row, index) => (
                  <tr
                    key={row.label}
                    className={
                      index % 2 === 0 ? "bg-surface" : "bg-background"
                    }
                  >
                    <th className="w-[36%] border-b border-border px-4 py-3 align-top text-base font-semibold text-brand sm:px-5">
                      {row.label}
                    </th>
                    <td className="border-b border-border px-4 py-3 text-base leading-relaxed text-muted sm:px-5">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-1 size-6 shrink-0 text-accent" />
            <div className="space-y-4">
              <SectionHeading>
                {content.code} Exam Pattern & Syllabus
              </SectionHeading>
              <p className="max-w-4xl text-base leading-relaxed text-muted sm:text-lg">
                {content.patternBlurb}
              </p>
              <Link
                href={`/pattern${patternAnchor}`}
                className="inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                View full {content.code} pattern & syllabus
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <UserCheck className="mt-1 size-6 shrink-0 text-accent" />
            <div className="space-y-4">
              <SectionHeading>{content.code} Eligibility Criteria</SectionHeading>
              <ul className="max-w-4xl list-disc space-y-2 pl-5 text-base leading-relaxed text-muted sm:text-lg">
                {content.eligibility.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <ListChecks className="mt-1 size-6 shrink-0 text-accent" />
            <div className="space-y-4">
              <SectionHeading>
                How To Participate in {content.code}
              </SectionHeading>
              <ol className="max-w-4xl list-decimal space-y-2 pl-5 text-base leading-relaxed text-muted sm:text-lg">
                {content.howToParticipate.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/registration-forms"
                  className="inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  Download registration forms
                </Link>
                <Link
                  href="/registration-fee"
                  className="inline-flex rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-brand hover:border-accent"
                >
                  Registration fee details
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-1 size-6 shrink-0 text-accent" />
            <div className="space-y-4">
              <SectionHeading>{content.code} Exam Date</SectionHeading>
              <p className="max-w-4xl text-base leading-relaxed text-muted sm:text-lg">
                {content.examDatesNote}
              </p>
              <div className="inline-flex flex-col rounded-xl border border-accent/50 bg-surface px-5 py-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                  {content.code}
                </p>
                <p className="mt-1 text-xl font-bold text-brand">
                  {content.examDate}
                </p>
                <p className="text-base text-muted">{content.examDay}</p>
                <Link
                  href="/exam-schedule"
                  className="mt-3 inline-flex text-base font-semibold text-brand underline underline-offset-2"
                >
                  View full exam schedule
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <FileDown className="mt-1 size-6 shrink-0 text-accent" />
            <div className="space-y-4">
              <SectionHeading>{content.code} Sample / Model Papers</SectionHeading>
              <p className="max-w-4xl text-base leading-relaxed text-muted sm:text-lg">
                {content.samplePapersBlurb}
              </p>
              <Link
                href="/sample-papers"
                className="inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                View & download {content.code} papers
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <Award className="mt-1 size-6 shrink-0 text-accent" />
            <div className="space-y-4">
              <SectionHeading>
                {content.code} Awards / Scholarships / Recognition
              </SectionHeading>
              <p className="max-w-4xl text-base leading-relaxed text-muted sm:text-lg">
                {content.awardsBlurb}
              </p>
              <Link
                href="/rewards"
                className="inline-flex rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-brand hover:border-accent"
              >
                View rewards & recognitions
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 size-6 shrink-0 text-accent" />
            <div className="space-y-4">
              <SectionHeading>How To Prepare for {content.code}</SectionHeading>
              <p className="max-w-4xl text-base leading-relaxed text-muted sm:text-lg">
                The i-CAPE {content.fullName} tests {content.subjectFocus}.
                Prepare thoroughly and strategically:
              </p>
              <ol className="max-w-4xl list-decimal space-y-2 pl-5 text-base leading-relaxed text-muted sm:text-lg">
                {content.prepareTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center gap-3">
                <BookOpenCheck className="size-5 text-accent" aria-hidden />
                <Link
                  href={`/pattern${patternAnchor}`}
                  className="font-semibold text-brand underline underline-offset-2"
                >
                  Pattern & syllabus
                </Link>
                <span className="text-border">·</span>
                <Link
                  href="/sample-papers"
                  className="font-semibold text-brand underline underline-offset-2"
                >
                  Model papers
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
