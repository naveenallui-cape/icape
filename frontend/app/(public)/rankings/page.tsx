import Link from "next/link";
import {
  Award,
  CheckCircle2,
  MapPinned,
  Medal,
  MessagesSquare,
  Trophy,
} from "lucide-react";
import { PageShell } from "@/components/public/page-shell";

const qualificationCriteria = [
  {
    title: "Top 5% class-wise",
    detail:
      "Top 5% of students, class-wise, who appear for the 1st level exam. In case of a tie of marks, priority will be given to marks scored in different sections to determine ranks.",
  },
  {
    title: "Zone toppers",
    detail:
      "From each Zone — top 25 rank holders from each class.",
  },
  {
    title: "School class topper",
    detail:
      "Class topper from each participating school where at least 10 students from a class appear in the exam and the topper scores 50% qualifying marks.",
  },
] as const;

const levelTwoTieBreakers = [
  "Marks scored in sections in the Level 2 exam accorded higher priority.",
  "Total marks scored in the Level 1 exam.",
  "Marks scored in sections in the Level 1 exam accorded higher priority.",
  "If two or more students still score the same under all categories above, they will be awarded the same rank.",
] as const;

const singleLevelTieBreakers = [
  "Marks obtained in the exam.",
  "In case of a tie, ranks will be determined on the basis of marks scored in sections accorded higher priority.",
  "If two or more students still score the same under both criteria above, they will be awarded the same rank.",
] as const;

const relatedLinks = [
  {
    href: "/zones",
    title: "Update Zone",
    description: "View zone / state categorization for ranking purposes.",
    icon: MapPinned,
  },
  {
    href: "/rewards",
    title: "Awards & Recognitions",
    description: "Trophies, medals, certificates, and scholarships.",
    icon: Trophy,
  },
  {
    href: "/gallery",
    title: "Awards Function Gallery",
    description: "Highlights from recognition and award moments.",
    icon: Award,
  },
  {
    href: "/contact",
    title: "Feedback",
    description: "Share your valuable feedback with i-CAPE.",
    icon: MessagesSquare,
  },
] as const;

export default function RankingsPage() {
  return (
    <PageShell
      title="Rankings / 2nd Level Qualification"
      description="Criteria for 2nd level qualification and ranking for i-CAPE olympiads (IMO, ISO & IEO)."
    >
      <div className="space-y-14">
        <section className="max-w-4xl space-y-5">
          <ol className="space-y-4">
            {qualificationCriteria.map((item, index) => (
              <li
                key={item.title}
                className="flex gap-4 rounded-xl border border-border bg-surface p-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-brand">{item.title}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-muted">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-4xl space-y-5">
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">Ranking</h2>
          <div className="h-0.5 w-14 bg-accent" aria-hidden />
          <div className="space-y-3 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              Normally, a student scoring higher total marks will be accorded a
              higher rank.
            </p>
            <p>
              However, if two or more students score the same total marks, a
              higher rank will be awarded to the student scoring higher marks in
              sections accorded higher priority.
            </p>
          </div>
        </section>

        <section className="max-w-4xl space-y-5">
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">
            Criteria for Ranking in 2nd Level Olympiad Exams
          </h2>
          <div className="h-0.5 w-14 bg-accent" aria-hidden />
          <p className="text-base leading-relaxed text-muted sm:text-lg">
            In 2nd level exams, ranks will be accorded on the following criteria:
          </p>

          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Medal
                className="mt-0.5 size-5 shrink-0 text-accent"
                aria-hidden
              />
              <p className="text-base font-semibold text-brand sm:text-lg">
                Total marks scored in the Level 2 exam.
              </p>
            </div>
            <p className="mt-4 text-base text-muted">
              If two or more students score the same number of marks, ranks will
              be determined as follows:
            </p>
            <ul className="mt-3 space-y-2.5">
              {levelTwoTieBreakers.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base text-muted">
                  <CheckCircle2
                    className="mt-1 size-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="max-w-4xl space-y-5">
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">
            Criteria for Ranking — Single Level Olympiad Exams
          </h2>
          <div className="h-0.5 w-14 bg-accent" aria-hidden />
          <p className="text-base leading-relaxed text-muted sm:text-lg">
            Where only a single level exam is conducted (or Level 1 results are
            treated as final), ranks will be accorded on the following criteria:
          </p>

          <ul className="space-y-2.5 rounded-xl border border-border bg-surface p-5 sm:p-6">
            {singleLevelTieBreakers.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-base text-muted">
                <CheckCircle2
                  className="mt-1 size-4 shrink-0 text-accent"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              In case of any confusion, the decision of the i-CAPE Academic
              Council will be final and binding. A telephonic round of questions
              may be conducted at the sole discretion of i-CAPE to determine
              ranks.
            </p>
            <p>
              Second level exams may be conducted based on prevalent conditions
              and feasibility across states at that time. If 2nd level exams are
              not conducted, results of the 1st level exams will be treated as
              final results.
            </p>
            <p>
              An awards function may be conducted to felicitate international /
              national top rank holders. Due to logistics or other factors, only
              select awardees may be invited to attend. Awards and scholarships
              for other winners will be sent to their respective schools.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-brand sm:text-3xl">
            Related information
          </h2>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-border bg-surface p-5 transition hover:border-accent/60"
                >
                  <Icon className="size-5 text-accent" aria-hidden />
                  <h3 className="mt-3 text-lg font-bold text-brand">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
