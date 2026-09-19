import { cn } from "@/lib/utils";
import {
  PAYMENT_DETAILS,
  summarizeRegistrationFee,
} from "@/lib/payment-details";

type StudentLike = {
  name?: string;
  grade?: number;
  imo: boolean;
  iso: boolean;
  ieo: boolean;
};

type GradeRow = {
  grade: number;
  imo: number;
  ieo: number;
  iso: number;
  total: number;
};

function summarizeByClass(students: StudentLike[]): GradeRow[] {
  const map = new Map<number, GradeRow>();
  for (let grade = 3; grade <= 10; grade += 1) {
    map.set(grade, { grade, imo: 0, ieo: 0, iso: 0, total: 0 });
  }
  for (const s of students) {
    if (s.name !== undefined && !String(s.name).trim()) continue;
    const grade = Number(s.grade);
    if (!Number.isInteger(grade) || grade < 3 || grade > 10) continue;
    const row = map.get(grade)!;
    if (s.imo) row.imo += 1;
    if (s.ieo) row.ieo += 1;
    if (s.iso) row.iso += 1;
    row.total = row.imo + row.ieo + row.iso;
  }
  return [...map.values()];
}

export function PaymentFeeSummary({
  students,
  className,
  variant = "school",
}: {
  students: StudentLike[];
  className?: string;
  /** School portal asks to pay; admin registration asks to verify payment. */
  variant?: "school" | "admin";
}) {
  const summary = summarizeRegistrationFee(students);
  const classRows = summarizeByClass(students);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border bg-brand px-4 py-2.5">
          <p className="text-sm font-bold text-white">Payment summary</p>
          <p className="text-xs text-white/75">{PAYMENT_DETAILS.feeLabel}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-sm">
            <thead className="bg-brand-stats text-white">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold">Class</th>
                <th className="px-2 py-2.5 text-center font-semibold">IMO</th>
                <th className="px-2 py-2.5 text-center font-semibold">IEO</th>
                <th className="px-2 py-2.5 text-center font-semibold">ISO</th>
                <th className="px-3 py-2.5 text-center font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {classRows.map((row) => (
                <tr key={row.grade} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-brand">
                    Class {row.grade}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-brand">
                    {row.imo}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-brand">
                    {row.ieo}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-brand">
                    {row.iso}
                  </td>
                  <td className="px-3 py-2 text-center font-semibold tabular-nums text-brand">
                    {row.total}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-border bg-brand-soft/40">
                <td className="px-3 py-2.5 font-semibold text-brand">
                  Total
                </td>
                <td className="px-2 py-2.5 text-center font-semibold tabular-nums text-brand">
                  {summary.imoCount}
                </td>
                <td className="px-2 py-2.5 text-center font-semibold tabular-nums text-brand">
                  {summary.ieoCount}
                </td>
                <td className="px-2 py-2.5 text-center font-semibold tabular-nums text-brand">
                  {summary.isoCount}
                </td>
                <td className="px-3 py-2.5 text-center font-bold tabular-nums text-brand">
                  {summary.olympiadSlots}
                </td>
              </tr>
              <tr className="border-t border-border bg-brand-soft/50">
                <td
                  colSpan={4}
                  className="px-3 py-3 text-left text-sm font-semibold text-brand"
                >
                  Total registrations {summary.olympiadSlots} × 150
                </td>
                <td className="px-3 py-3 text-center text-base font-bold tabular-nums text-brand">
                  ₹{summary.totalFee.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm leading-relaxed text-brand">
        {variant === "admin" ? (
          <>
            Verify payment of{" "}
            <span className="font-bold">
              ₹{summary.totalFee.toLocaleString("en-IN")}
            </span>{" "}
            and submit the payment details below.
          </>
        ) : (
          <>
            Please complete payment of{" "}
            <span className="font-bold">
              ₹{summary.totalFee.toLocaleString("en-IN")}
            </span>{" "}
            through UPI or bank transfer, then submit the payment details below.
          </>
        )}
      </p>
    </div>
  );
}
