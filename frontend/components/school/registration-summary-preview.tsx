"use client";

import { Check } from "lucide-react";
import type { SchoolRegistration } from "@/lib/school-api";
import { PAYMENT_DETAILS } from "@/lib/payment-details";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "School details" },
  { id: 2, label: "Student details" },
  { id: 3, label: "Payment" },
] as const;

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/70 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-brand sm:text-right">{value}</dd>
    </div>
  );
}

export function RegistrationSummaryPreview({
  reg,
  students,
}: {
  reg: SchoolRegistration;
  students: Array<{
    registrationNumber?: string;
    name: string;
    grade: number;
    section: string;
    mobile: string;
    imo: boolean;
    iso: boolean;
    ieo: boolean;
  }>;
}) {
  const named = students.filter((s) => s.name.trim());
  const byGrade = named.reduce<Record<number, number>>((acc, s) => {
    acc[s.grade] = (acc[s.grade] || 0) + 1;
    return acc;
  }, {});
  const feeExpected = named.reduce((sum, s) => {
    return (
      sum +
      ((s.imo ? 1 : 0) + (s.iso ? 1 : 0) + (s.ieo ? 1 : 0)) *
        PAYMENT_DETAILS.feeAmount
    );
  }, 0);

  return (
    <div className="space-y-6">
      <nav
        aria-label="Registration steps summary"
        className="w-full overflow-x-auto rounded-2xl border border-border bg-white px-3 py-4 shadow-sm sm:px-6"
      >
        <ol className="flex min-w-[640px] items-center justify-between gap-1 sm:min-w-0">
          {STEPS.map((item, index) => (
            <li key={item.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex w-full min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-green-600 bg-green-600 text-white">
                  <Check className="size-5" strokeWidth={3} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-green-700 sm:text-base">
                    {item.label}
                  </span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-green-600">
                    Completed
                  </span>
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <span
                  className="mx-1 size-6 shrink-0 text-green-600 sm:mx-2"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <p className="text-sm text-muted">
        Summary preview — details below are read-only. Use{" "}
        <span className="font-semibold text-brand">Add More Students</span> to
        register additional students.
      </p>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-brand">1. School details</h2>
        <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <SummaryRow label="School code" value={reg.schoolCode} />
          <SummaryRow label="School name" value={reg.schoolName} />
          <SummaryRow label="Trust / Society" value={reg.trustName} />
          <SummaryRow label="Address" value={reg.address} />
          <SummaryRow label="City" value={reg.city} />
          <SummaryRow label="District" value={reg.district} />
          <SummaryRow label="State" value={reg.state} />
          <SummaryRow label="Pin code" value={reg.pincode} />
          <SummaryRow label="School mobile" value={reg.schoolMobile} />
          <SummaryRow label="Email" value={reg.email} />
          <SummaryRow label="Principal" value={reg.principalName} />
          <SummaryRow label="Principal mobile" value={reg.principalMobile} />
          <SummaryRow label="Contact person" value={reg.contactName} />
          <SummaryRow label="Contact phone" value={reg.phone} />
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-brand">2. Student details</h2>
        <p className="mt-1 text-sm text-muted">
          {named.length} registered student{named.length === 1 ? "" : "s"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(byGrade)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([grade, count]) => (
              <span
                key={grade}
                className="rounded-full border border-border bg-brand-soft/50 px-3 py-1 text-xs font-semibold text-brand"
              >
                Grade {grade}: {count}
              </span>
            ))}
        </div>
        {named.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-soft/40 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">S.No.</th>
                  <th className="px-3 py-2 font-semibold">Reg. No.</th>
                  <th className="px-3 py-2 font-semibold">Student</th>
                  <th className="px-3 py-2 font-semibold">Grade</th>
                  <th className="px-3 py-2 font-semibold">Sec</th>
                  <th className="px-3 py-2 font-semibold">Olympiads</th>
                </tr>
              </thead>
              <tbody>
                {named.slice(0, 50).map((s, i) => (
                  <tr
                    key={`${s.name}-${s.grade}-${i}`}
                    className={cn(
                      "border-t border-border",
                      i % 2 ? "bg-slate-50/60" : "bg-white",
                    )}
                  >
                    <td className="px-3 py-2 text-muted">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs font-medium">
                      {s.registrationNumber || "—"}
                    </td>
                    <td className="px-3 py-2 font-semibold text-brand">
                      {s.name}
                    </td>
                    <td className="px-3 py-2">{s.grade}</td>
                    <td className="px-3 py-2">{s.section || "—"}</td>
                    <td className="px-3 py-2">
                      {[
                        s.imo ? "IMO" : null,
                        s.iso ? "ISO" : null,
                        s.ieo ? "IEO" : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {named.length > 50 ? (
              <p className="border-t border-border px-3 py-2 text-xs text-muted">
                Showing first 50 of {named.length}. Open Registered students for
                the full list.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-brand">3. Payment</h2>
        <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <SummaryRow
            label="Amount"
            value={
              reg.payment?.amountExpected != null
                ? `INR ${Number(reg.payment.amountExpected).toLocaleString("en-IN")}`
                : feeExpected
                  ? `INR ${feeExpected.toLocaleString("en-IN")}`
                  : "—"
            }
          />
          <SummaryRow
            label="Method"
            value={reg.payment?.paymentMethod || "—"}
          />
          <SummaryRow label="Reference" value={reg.payment?.utr || "—"} />
          <SummaryRow
            label="Status"
            value={reg.payment?.status?.replace(/_/g, " ") || "Verified"}
          />
        </dl>
      </section>
    </div>
  );
}
