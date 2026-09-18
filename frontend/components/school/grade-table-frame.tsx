"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Remounts children on grade change with a short swap animation. */
export function GradeTableFrame({
  grade,
  children,
  className,
}: {
  grade: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="space-y-2">
      <p
        key={`label-${grade}`}
        className="text-sm font-semibold text-brand animate-[gradeTableIn_0.28s_ease-out]"
      >
        Showing Grade {grade} students
      </p>
      <div
        key={grade}
        className={cn(
          "overflow-x-auto rounded-xl border border-border animate-[gradeTableIn_0.32s_ease-out]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
