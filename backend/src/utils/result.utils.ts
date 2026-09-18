import { Decimal } from "@prisma/client/runtime/library";

export function toNumber(value: Decimal | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  return Number(value);
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function computePercentage(marksObtained: number, totalMarks: number) {
  if (totalMarks <= 0) return 0;
  return round2((marksObtained / totalMarks) * 100);
}

export const OLYMPIAD_CODES = ["IMO", "ISO", "IEO"] as const;
export type OlympiadCodeValue = (typeof OLYMPIAD_CODES)[number];

export const GRADES = [3, 4, 5, 6, 7, 8, 9, 10] as const;

export function isValidGrade(grade: number) {
  return GRADES.includes(grade as (typeof GRADES)[number]);
}

/**
 * i-CAPE exam totals (IMO / ISO / IEO):
 * Grades 3–5 → 70 marks
 * Grades 6–10 → 100 marks
 * Each grade band differs; never use one fixed total for the whole sheet.
 */
export function examTotalMarksForGrade(grade: number): number {
  if (grade >= 3 && grade <= 5) return 70;
  if (grade >= 6 && grade <= 10) return 100;
  return 0;
}

/** Parse grade from Excel values like 5, "5", "Grade 5", "V", "5th" */
export function parseGradeValue(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const g = Math.trunc(raw);
    return isValidGrade(g) ? g : null;
  }
  const text = String(raw).trim().toLowerCase();
  if (!text) return null;

  const digit = text.match(/(?:grade|class|std\.?|standard)?\s*([3-9]|10)\b/);
  if (digit) {
    const g = Number(digit[1]);
    return isValidGrade(g) ? g : null;
  }

  const roman: Record<string, number> = {
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
  };
  const key = text.replace(/[^a-z]/g, "");
  if (roman[key] && isValidGrade(roman[key])) return roman[key];

  return null;
}

export function normalizeRegistrationNumber(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeSchoolCode(value: string) {
  return value.trim().toUpperCase();
}

/** Title-case person/school display names (keeps internal spacing tidy). */
export function normalizePersonName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return "";
      // Keep all-caps short tokens (e.g. initials) as-is if length 1–2
      if (word.length <= 2 && word === word.toUpperCase()) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Readable status label for UI / PDF (avoids cramped ALL-CAPS overflow). */
export function formatResultStatus(status: string) {
  const key = status.trim().toUpperCase();
  const labels: Record<string, string> = {
    PARTICIPATED: "Participated",
    QUALIFIED: "Qualified",
    PASSED: "Passed",
    ABSENT: "Absent",
  };
  return labels[key] ?? normalizePersonName(status);
}
