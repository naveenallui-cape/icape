"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  GraduationCap,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { summarizeRegistrationFee } from "@/lib/payment-details";
import type { RegistrationStudent, SchoolRegistration } from "@/lib/school-api";
import { cn } from "@/lib/utils";

function formatInr(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function ProgressBar({
  label,
  done,
  hint,
}: {
  label: string;
  done: boolean;
  hint: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-brand">{label}</span>
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wide",
            done ? "text-green-700" : "text-amber-700",
          )}
        >
          {done ? "Done" : "Pending"}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            done ? "w-full bg-green-600" : "w-[18%] bg-amber-400",
          )}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

function OlympiadBar({
  code,
  count,
  max,
  className,
}: {
  code: string;
  count: number;
  max: number;
  className: string;
}) {
  const pct = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-sm font-bold text-brand">{code}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full", className)}
          style={{ width: `${count === 0 ? 0 : pct}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-brand">
        {count.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

export function SchoolDashboard({
  reg,
  students,
  schoolDone,
  studentsReady,
  paymentDone,
  onOpenTab,
  onGoToStep,
  onResubmit,
}: {
  reg: SchoolRegistration | null;
  students: RegistrationStudent[];
  schoolDone: boolean;
  studentsReady: boolean;
  paymentDone: boolean;
  onOpenTab: (tab: string) => void;
  onGoToStep: (step: number) => void;
  onResubmit: () => void;
}) {
  const status = reg?.status || "DRAFT";
  const approved = status === "APPROVED";
  const underReview = status === "UNDER_REVIEW";
  const rejected = status === "REJECTED";
  const draftFlow = !approved && !underReview && !rejected;

  const fee = summarizeRegistrationFee(students);
  const namedStudents = fee.studentCount;
  const olympiadMax = Math.max(fee.imoCount, fee.isoCount, fee.ieoCount, 1);
  const feeExpected = reg?.feeExpected || fee.totalFee;

  const stepsDone =
    (schoolDone ? 1 : 0) + (studentsReady ? 1 : 0) + (paymentDone ? 1 : 0);

  const openRegistration = () => onOpenTab("registration");
  const openStudentsList = () => onOpenTab("list");

  const primaryCta = approved
    ? { label: "Registered students", action: openStudentsList }
    : rejected
      ? { label: "Submit again", action: onResubmit }
      : underReview
        ? { label: "View status", action: openRegistration }
        : {
            label: schoolDone
              ? studentsReady
                ? "Continue to payment"
                : "Continue registration"
              : "Start registration",
            action: () => {
              if (!schoolDone) onGoToStep(1);
              else if (!studentsReady) onGoToStep(2);
              else onGoToStep(3);
              openRegistration();
            },
          };

  return (
    <div className="space-y-6">
      <div className="flex flex-row flex-nowrap items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="min-w-0 shrink-0">
          <h1 className="text-2xl font-bold text-brand">Dashboard</h1>
          <p className="mt-0.5 whitespace-nowrap text-sm text-muted">
            Overview for{" "}
            <span className="font-semibold text-brand">
              Olympiad Year {reg?.olympiadYear?.label || "—"}
            </span>
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-row flex-nowrap items-baseline justify-center gap-x-5 px-2">
          {reg?.schoolName ? (
            <p className="whitespace-nowrap text-[1.3rem] leading-tight text-muted sm:text-[1.44rem]">
              School name:{" "}
              <span className="font-bold text-brand">{reg.schoolName}</span>
            </p>
          ) : null}
          {reg?.schoolCode ? (
            <p className="whitespace-nowrap text-[1.3rem] leading-tight text-muted sm:text-[1.44rem]">
              School code:{" "}
              <span className="font-mono font-bold tracking-wider text-brand">
                {reg.schoolCode}
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
          {approved ? (
            <>
              <button
                type="button"
                onClick={openStudentsList}
                className={buttonVariants({ variant: "accent" })}
              >
                Registered students
              </button>
              <button
                type="button"
                onClick={() => onOpenTab("results")}
                className={buttonVariants({ variant: "outline" })}
              >
                Results
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={primaryCta.action}
                className={buttonVariants({ variant: "accent" })}
              >
                {primaryCta.label}
              </button>
              <button
                type="button"
                onClick={openRegistration}
                className={buttonVariants({ variant: "outline" })}
              >
                Registration
              </button>
            </>
          )}
        </div>
      </div>

      {underReview ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Clock3 className="size-5 shrink-0 text-amber-700" aria-hidden />
          <p className="min-w-0 flex-1 font-medium">
            Registration is under review. Verification usually takes up to 24 hours —
            you will get an email when approved.
          </p>
          <button
            type="button"
            onClick={openRegistration}
            className="inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline"
          >
            View status
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      {approved ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950">
          <CheckCircle2 className="size-5 shrink-0 text-green-700" aria-hidden />
          <p className="min-w-0 flex-1 font-medium">
            Registration approved. Download or print your student list anytime.
          </p>
          <button
            type="button"
            onClick={openStudentsList}
            className="inline-flex items-center gap-1 font-semibold text-green-900 underline-offset-2 hover:underline"
          >
            Open list
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      {rejected ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <div className="flex flex-wrap items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Registration rejected by i-CAPE. You can submit again.
              </p>
              <div className="mt-2 rounded-xl border border-red-200 bg-white px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Reason
                </p>
                <p className="mt-1 font-medium text-red-950">
                  {reg?.rejectionNote?.trim() ||
                    "No reason was provided. Contact support if you need help."}
                </p>
              </div>
            </div>
            <Button type="button" variant="accent" onClick={onResubmit}>
              Submit again
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-brand">Registration progress</h2>
            <p className="mt-1 text-sm text-muted">
              {approved || underReview
                ? statusLabel(status)
                : `${stepsDone} of 3 steps complete`}
            </p>
          </div>
          <div className="space-y-4">
            <ProgressBar
              label="School details"
              done={schoolDone || approved || underReview}
              hint="School & contact information"
            />
            <ProgressBar
              label="Students"
              done={studentsReady || approved || underReview}
              hint={`${namedStudents} registered student${namedStudents === 1 ? "" : "s"}`}
            />
            <ProgressBar
              label="Payment"
              done={paymentDone || approved || underReview}
              hint={
                paymentDone || underReview || approved
                  ? "Proof submitted"
                  : "UTR + payment proof"
              }
            />
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-brand">Olympiad entries</h2>
              <p className="mt-1 text-sm text-muted">
                Subject selections in your student list
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <GraduationCap className="size-3.5" aria-hidden />
              IMO · ISO · IEO
            </span>
          </div>
          <div className="space-y-4">
            <OlympiadBar
              code="IMO"
              count={fee.imoCount}
              max={olympiadMax}
              className="bg-brand"
            />
            <OlympiadBar
              code="ISO"
              count={fee.isoCount}
              max={olympiadMax}
              className="bg-sky-600"
            />
            <OlympiadBar
              code="IEO"
              count={fee.ieoCount}
              max={olympiadMax}
              className="bg-accent"
            />
          </div>
          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
            {(
              [
                ["Students", namedStudents],
                ["Olympiad slots", fee.olympiadSlots],
                ["Fee", formatInr(feeExpected)],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-slate-50/80 px-3 py-2.5"
              >
                <p className="text-xs font-semibold text-muted">{label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-brand">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {draftFlow ? (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-brand">Continue registration</h2>
          <p className="mt-1 text-sm text-muted">
            Complete each step in order. Students unlock after school details are
            saved.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  step: 1,
                  title: "School details",
                  done: schoolDone,
                  text: "Save school & contact information",
                  locked: false,
                },
                {
                  step: 2,
                  title: "Students",
                  done: studentsReady,
                  text: `${namedStudents} registered · add olympiad subjects`,
                  locked: !schoolDone,
                },
                {
                  step: 3,
                  title: "Payment",
                  done: paymentDone,
                  text: "Upload proof and submit for verification",
                  locked: !schoolDone || !studentsReady,
                },
              ] as const
            ).map((item) => (
              <button
                key={item.step}
                type="button"
                disabled={item.locked}
                onClick={() => {
                  if (item.locked) return;
                  onGoToStep(item.step);
                  openRegistration();
                }}
                className={cn(
                  "rounded-xl border border-border bg-slate-50/70 p-4 text-left transition",
                  item.locked
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-accent/40 hover:bg-white",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-brand">{item.title}</p>
                  {item.done ? (
                    <CheckCircle2 className="size-5 text-green-600" aria-hidden />
                  ) : item.locked ? (
                    <span className="text-[11px] font-semibold text-muted">
                      Locked
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700">
                      Open
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-brand">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(approved
              ? [
                  {
                    title: "Registered students",
                    text: "View, filter, download or print",
                    action: openStudentsList,
                  },
                  {
                    title: "Results",
                    text: "Check school olympiad results",
                    action: () => onOpenTab("results"),
                  },
                  {
                    title: "Certificates",
                    text: "Coming soon for this Olympiad Year",
                    action: () => onOpenTab("certificates"),
                  },
                ]
              : [
                  {
                    title: "Registration status",
                    text: underReview
                      ? "See pending verification details"
                      : "Review and resubmit payment",
                    action: openRegistration,
                  },
                ]
            ).map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="rounded-xl border border-border bg-slate-50/70 p-4 text-left transition hover:border-accent/40 hover:bg-white"
              >
                <p className="font-bold text-brand">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
