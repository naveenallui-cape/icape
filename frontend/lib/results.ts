export type OlympiadCode = "IMO" | "ISO" | "IEO";

export type StudentResultPayload = {
  student: {
    name: string;
    registrationNumber: string;
    grade: number;
  };
  school: {
    id: string;
    schoolCode: string;
    name: string;
    city: string | null;
    state: string | null;
  };
  olympiadYear: {
    id: string;
    label: string;
    code: string;
  };
  summary: {
    olympiadsParticipated: number;
    bestRank: number | null;
    averagePercentage: number | null;
  };
  results: Array<{
    olympiad: { code: OlympiadCode; name: string; fullName: string };
    grade: number;
    marksObtained: number | null;
    totalMarks: number | null;
    percentage: number | null;
    rank: number | null;
    schoolRank: number | null;
    status: string;
    certificateUrl: string | null;
    certificateNo: string | null;
    examDate: string | null;
  }>;
};

export type SchoolSearchItem = {
  id: string;
  schoolCode: string;
  name: string;
  city: string | null;
  state: string | null;
};

export type SchoolResultsPayload = {
  school: {
    schoolCode: string;
    name: string;
    city: string | null;
    state: string | null;
  };
  olympiadYear: { label: string; code: string };
  filters: { olympiad: OlympiadCode | null; grade: number | null };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  results: Array<{
    registrationNumber: string;
    studentName: string;
    grade: number;
    olympiad: { code: OlympiadCode; name: string; fullName: string };
    marksObtained: number | null;
    totalMarks: number | null;
    percentage: number | null;
    rank: number | null;
    schoolRank: number | null;
    status: string;
  }>;
};

export const RESULT_GRADES = [3, 4, 5, 6, 7, 8, 9, 10] as const;
export const RESULT_OLYMPIADS: OlympiadCode[] = ["IMO", "ISO", "IEO"];

/** Display helper: capitalize each word for names stored in lowercase. */
export function formatPersonName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word.length <= 2 && word === word.toUpperCase()) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
