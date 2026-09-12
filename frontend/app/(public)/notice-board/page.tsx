import Link from "next/link";
import { Bell, CalendarDays, CircleAlert } from "lucide-react";
import { PageShell } from "@/components/public/page-shell";
import { cn } from "@/lib/utils";

type Notice = {
  id: string;
  date: string;
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  important?: boolean;
};

const notices: Notice[] = [
  {
    id: "reg-deadline-2026-27",
    date: "07 Sep 2026",
    title: "Registration last date — 31st August 2026",
    body: "Schools must complete registration for Olympiad Year 2026-27 on or before 31st August 2026. Submit filled forms and payment proof to i-CAPE via WhatsApp.",
    href: "/registration-forms",
    hrefLabel: "Download registration forms",
    important: true,
  },
  {
    id: "exam-schedule-2026-27",
    date: "07 Sep 2026",
    title: "Exam schedule released for Olympiad Year 2026-27",
    body: "IMO — 14th December 2026 · ISO — 16th December 2026 · IEO — 18th December 2026. Exams are offline (OMR-based) for Grades 3 to 10.",
    href: "/exam-schedule",
    hrefLabel: "View full exam schedule",
    important: true,
  },
  {
    id: "registration-fee",
    date: "05 Sep 2026",
    title: "Registration fee — INR 150 per student per olympiad",
    body: "Fee can be paid via UPI / QR or bank transfer (IDFC First Bank). Keep the payment proof ready while submitting registration forms.",
    href: "/registration-fee",
    hrefLabel: "View fee & payment details",
  },
  {
    id: "sample-papers",
    date: "01 Sep 2026",
    title: "Model papers & previous papers available for IMO, ISO & IEO",
    body: "Grade-wise model papers and Level 1 / Level 2 previous papers (Set A & Set B) are listed for practice. Previous paper PDFs will be uploaded soon.",
    href: "/sample-papers",
    hrefLabel: "Open model & previous papers",
  },
  {
    id: "rewards",
    date: "28 Aug 2026",
    title: "Rewards and recognitions for olympiad performers",
    body: "Outstanding students, schools, and teachers are recognised through trophies, medals, certificates, and scholarships. Details are published on the Rewards page.",
    href: "/rewards",
    hrefLabel: "View rewards",
  },
];

export default function NoticeBoardPage() {
  return (
    <PageShell
      title="Notice Board"
      description="Latest important notices and updates from i-CAPE."
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-3.5 sm:px-5">
          <Bell className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Check this board regularly for registration deadlines, exam updates,
            and other official announcements for Olympiad Year 2026-27.
          </p>
        </div>

        <ul className="space-y-4">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className={cn(
                "rounded-xl border bg-surface p-5 sm:p-6",
                notice.important
                  ? "border-accent/50"
                  : "border-border",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
                  <CalendarDays className="size-4 text-accent" aria-hidden />
                  {notice.date}
                </span>
                {notice.important ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                    <CircleAlert className="size-3.5" aria-hidden />
                    Important
                  </span>
                ) : null}
              </div>

              <h2 className="mt-3 text-xl font-bold text-brand sm:text-2xl">
                {notice.title}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-muted">
                {notice.body}
              </p>

              {notice.href ? (
                <Link
                  href={notice.href}
                  className="mt-4 inline-flex text-base font-semibold text-brand underline underline-offset-2"
                >
                  {notice.hrefLabel ?? "Read more"}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
