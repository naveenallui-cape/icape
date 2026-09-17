"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  School,
  Users,
  WalletCards,
} from "lucide-react";
import {
  adminQueryKeys,
  ADMIN_LIST_REFETCH_MS,
  fetchAdminDashboard,
  type AdminDashboardData,
} from "@/lib/admin-queries";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function formatInr(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function KpiCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  href: string;
  icon: typeof School;
  tone?: "brand" | "amber" | "green" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50/80"
      : tone === "green"
        ? "border-green-200 bg-green-50/80"
        : tone === "red"
          ? "border-red-200 bg-red-50/80"
          : "border-border bg-white";
  const iconClass =
    tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : tone === "green"
        ? "bg-green-100 text-green-800"
        : tone === "red"
          ? "bg-red-100 text-red-800"
          : "bg-brand-soft text-brand";

  return (
    <Link
      href={href}
      className={cn(
        "group rounded-2xl border p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md",
        toneClass,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-brand">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl",
            iconClass,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-80 group-hover:opacity-100">
        View
        <ArrowRight className="size-3.5" aria-hidden />
      </p>
    </Link>
  );
}

function StatusBar({
  label,
  count,
  total,
  className,
  href,
}: {
  label: string;
  count: number;
  total: number;
  className: string;
  href?: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const body = (
    <>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-brand">{label}</span>
        <span className="tabular-nums font-semibold text-brand">{count}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", className)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </>
  );
  if (!href) return <div>{body}</div>;
  return (
    <Link href={href} className="block rounded-lg transition hover:opacity-90">
      {body}
    </Link>
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-64 rounded-2xl bg-slate-100 lg:col-span-2" />
        <div className="h-64 rounded-2xl bg-slate-100 lg:col-span-3" />
      </div>
    </div>
  );
}

function DashboardBody({ data }: { data: AdminDashboardData }) {
  const { schools, students, payments, attention, recentApproved, olympiadYear } =
    data;
  const pipelineTotal =
    schools.draft + schools.underReview + schools.approved + schools.rejected ||
    1;
  const olympiadMax = Math.max(students.imo, students.iso, students.ieo, 1);
  const needsAttention = payments.awaitingReview > 0 || schools.rejected > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Live overview for{" "}
            <span className="font-semibold text-brand">
              Olympiad Year {olympiadYear?.label || "—"}
            </span>
            . Counts refresh automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/registrations"
            className={buttonVariants({ variant: "accent" })}
          >
            Payment verification
          </Link>
          <Link
            href="/admin/schools/register"
            className={buttonVariants({ variant: "outline" })}
          >
            Register school
          </Link>
        </div>
      </div>

      {needsAttention ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertCircle className="size-5 shrink-0 text-amber-700" aria-hidden />
          <p className="min-w-0 flex-1 font-medium">
            {payments.awaitingReview > 0
              ? `${payments.awaitingReview} payment${payments.awaitingReview === 1 ? "" : "s"} awaiting verification`
              : null}
            {payments.awaitingReview > 0 && schools.rejected > 0 ? " · " : null}
            {schools.rejected > 0
              ? `${schools.rejected} rejected registration${schools.rejected === 1 ? "" : "s"} may need follow-up`
              : null}
          </p>
          <Link
            href={
              payments.awaitingReview > 0
                ? "/admin/registrations?status=UNDER_REVIEW"
                : "/admin/registrations?status=REJECTED"
            }
            className="inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline"
          >
            Review now
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Approved schools"
          value={schools.approved}
          hint={`${schools.totalAccounts} portal accounts total`}
          href="/admin/schools"
          icon={School}
          tone="green"
        />
        <KpiCard
          label="Awaiting verification"
          value={payments.awaitingReview}
          hint={
            payments.pendingAmount > 0
              ? `${formatInr(payments.pendingAmount)} pending`
              : "Payment proofs to review"
          }
          href="/admin/registrations?status=UNDER_REVIEW"
          icon={WalletCards}
          tone={payments.awaitingReview > 0 ? "amber" : "brand"}
        />
        <KpiCard
          label="Incomplete registrations"
          value={schools.incomplete}
          hint="Draft, rejected, or not started"
          href="/admin/incomplete-registrations"
          icon={ClipboardList}
          tone={schools.incomplete > 0 ? "amber" : "brand"}
        />
        <KpiCard
          label="Approved students"
          value={students.approved.toLocaleString("en-IN")}
          hint={`${students.underReview.toLocaleString("en-IN")} in review`}
          href="/admin/students"
          icon={Users}
          tone="brand"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-brand">Registration pipeline</h2>
            <p className="mt-1 text-sm text-muted">
              Active Olympiad Year status mix
            </p>
          </div>
          <div className="space-y-4">
            <StatusBar
              label="Approved"
              count={schools.approved}
              total={pipelineTotal}
              className="bg-green-600"
              href="/admin/registrations?status=APPROVED"
            />
            <StatusBar
              label="Under review"
              count={schools.underReview}
              total={pipelineTotal}
              className="bg-amber-500"
              href="/admin/registrations?status=UNDER_REVIEW"
            />
            <StatusBar
              label="Draft"
              count={schools.draft}
              total={pipelineTotal}
              className="bg-brand"
              href="/admin/incomplete-registrations"
            />
            <StatusBar
              label="Rejected"
              count={schools.rejected}
              total={pipelineTotal}
              className="bg-red-500"
              href="/admin/registrations?status=REJECTED"
            />
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-brand">Olympiad entries</h2>
              <p className="mt-1 text-sm text-muted">
                Subject selections across all saved student lists
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
              count={students.imo}
              max={olympiadMax}
              className="bg-brand"
            />
            <OlympiadBar
              code="ISO"
              count={students.iso}
              max={olympiadMax}
              className="bg-sky-600"
            />
            <OlympiadBar
              code="IEO"
              count={students.ieo}
              max={olympiadMax}
              className="bg-accent"
            />
          </div>
          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
            {(
              [
                ["IMO approved", students.imoApproved],
                ["ISO approved", students.isoApproved],
                ["IEO approved", students.ieoApproved],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-slate-50/80 px-3 py-2.5"
              >
                <p className="text-xs font-semibold text-muted">{label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-brand">
                  {value.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-brand">Needs attention</h2>
              <p className="mt-1 text-sm text-muted">
                Under review or rejected — open payment verification
              </p>
            </div>
            <Clock3 className="size-5 text-muted" aria-hidden />
          </div>
          {attention.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              Nothing waiting right now.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {attention.map((row) => (
                <li key={row.id}>
                  <Link
                    href={
                      row.status === "REJECTED"
                        ? "/admin/registrations?status=REJECTED"
                        : "/admin/registrations?status=UNDER_REVIEW"
                    }
                    className="flex items-start justify-between gap-3 py-3 transition hover:bg-brand-soft/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand">
                        {row.schoolName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {row.schoolCode} · {row.studentCount} students
                        {row.amountExpected > 0
                          ? ` · ${formatInr(row.amountExpected)}`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(row.submittedAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                        row.status === "UNDER_REVIEW"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-800",
                      )}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-brand">Recently approved</h2>
              <p className="mt-1 text-sm text-muted">
                Latest schools cleared for this Olympiad Year
              </p>
            </div>
            <CheckCircle2 className="size-5 text-green-600" aria-hidden />
          </div>
          {recentApproved.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              No approved schools yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recentApproved.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand">
                      {row.schoolName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {row.schoolCode} · {row.studentCount} students
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDate(row.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 border-t border-border pt-3">
            <Link
              href="/admin/schools"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              All approved schools
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-brand">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Verify payments",
              text: "Approve or reject submitted proofs",
              href: "/admin/registrations?status=UNDER_REVIEW",
            },
            {
              title: "Incomplete follow-up",
              text: "Schools still in draft or rejected",
              href: "/admin/incomplete-registrations",
            },
            {
              title: "Student list",
              text: "Browse and export approved students",
              href: "/admin/students",
            },
            {
              title: "Results tools",
              text: "Upload, update, or search results",
              href: "/admin/results",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-border bg-slate-50/70 p-4 transition hover:border-accent/40 hover:bg-white"
            >
              <p className="font-bold text-brand">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: () => fetchAdminDashboard(),
    refetchInterval: ADMIN_LIST_REFETCH_MS,
  });

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-900">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-red-800">
          {error instanceof Error
            ? error.message
            : "Could not load dashboard data."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isFetching && !isLoading ? (
        <span className="absolute right-0 top-0 text-xs font-medium text-muted">
          Updating…
        </span>
      ) : null}
      <DashboardBody data={data} />
    </div>
  );
}
