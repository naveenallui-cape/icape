import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Production admin table wrapper:
 * - keeps layout stable
 * - no blur / hide / "Loading…" text
 * - use with AdminTableSkeletonRows for first paint
 */
export function AdminTableShell({
  loading = false,
  className,
  children,
}: {
  loading?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(className)} aria-busy={loading || undefined}>
      {children}
    </div>
  );
}

/** Subtle skeleton rows that match real table density. */
export function AdminTableSkeletonRows({
  columns,
  rows = 8,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-border">
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="px-3 py-3">
              <div
                className={cn(
                  "h-4 animate-pulse rounded bg-slate-200/90",
                  colIndex === 0 ? "w-[70%]" : "w-[55%]",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
