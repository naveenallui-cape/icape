import { cn } from "@/lib/utils";
import {
  PAYMENT_DETAILS,
  summarizeRegistrationFee,
} from "@/lib/payment-details";

type StudentLike = {
  name?: string;
  imo: boolean;
  iso: boolean;
  ieo: boolean;
};

export function PaymentFeeSummary({
  students,
  className,
}: {
  students: StudentLike[];
  className?: string;
}) {
  const summary = summarizeRegistrationFee(students);

  const rows = [
    { label: "Students registered", value: String(summary.studentCount) },
    { label: "IMO entries", value: String(summary.imoCount) },
    { label: "ISO entries", value: String(summary.isoCount) },
    { label: "IEO entries", value: String(summary.ieoCount) },
    {
      label: "Total olympiad entries",
      value: String(summary.olympiadSlots),
    },
    {
      label: `TOTAL (₹${summary.feePerSlot} × ${summary.olympiadSlots})`,
      value: `₹${summary.totalFee.toLocaleString("en-IN")}`,
      emphasize: true,
    },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white",
        className,
      )}
    >
      <div className="border-b border-border bg-brand px-4 py-2.5">
        <p className="text-sm font-bold text-white">Payment summary</p>
        <p className="text-xs text-white/75">{PAYMENT_DETAILS.feeLabel}</p>
      </div>
      <dl>
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2 text-sm",
              index < rows.length - 1 ? "border-b border-border/70" : "",
              row.emphasize ? "bg-brand-soft/50" : "",
            )}
          >
            <dt
              className={cn(
                row.emphasize
                  ? "font-semibold text-brand"
                  : "text-muted",
              )}
            >
              {row.label}
            </dt>
            <dd
              className={cn(
                "tabular-nums",
                row.emphasize
                  ? "text-base font-bold text-brand"
                  : "font-semibold text-brand",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
