import { z } from "zod";
import { OLYMPIAD_CODES } from "../utils/result.utils";

export const studentResultQuerySchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required"),
  grade: z.coerce.number().int().min(3).max(10),
  olympiadYear: z.string().trim().optional(),
});

export const schoolSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "School ID or name is required"),
  olympiadYear: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(25).optional().default(10),
});

export const schoolResultsQuerySchema = z.object({
  schoolCode: z.string().trim().min(1).optional(),
  schoolId: z.string().trim().min(1).optional(),
  olympiad: z.enum(OLYMPIAD_CODES).optional(),
  grade: z.coerce.number().int().min(3).max(10).optional(),
  /** Student name or registration number */
  student: z.string().trim().optional(),
  olympiadYear: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

/** School portal — school is resolved from session, never from client */
export const schoolMineResultsQuerySchema = z.object({
  olympiad: z.enum(OLYMPIAD_CODES).optional(),
  grade: z.coerce.number().int().min(3).max(10).optional(),
  student: z.string().trim().optional(),
  olympiadYear: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const adminResultsQuerySchema = z.object({
  q: z.string().trim().optional(),
  olympiad: z.enum(OLYMPIAD_CODES).optional(),
  schoolCode: z.string().trim().optional(),
  grade: z.coerce.number().int().min(3).max(10).optional(),
  olympiadYear: z.string().trim().optional(),
  status: z
    .enum(["QUALIFIED", "PASSED", "PARTICIPATED", "ABSENT"])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const manualResultRowSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number required"),
  studentName: z.string().trim().min(1, "Student name required"),
  schoolName: z.string().trim().min(1, "School name required"),
  schoolCode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  place: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  state: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  grade: z.coerce.number().int().min(3).max(10),
  olympiadCode: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(OLYMPIAD_CODES)),
  olympiadYear: z.string().trim().min(1, "Olympiad Year required"),
  marksObtained: z.coerce.number().min(0),
  totalMarks: z.coerce.number().positive().optional(),
  rank: z
    .union([
      z.coerce.number().int(),
      z.null(),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v === "" || v === undefined || Number.isNaN(v as number) ? null : v)),
  schoolRank: z
    .union([
      z.coerce.number().int(),
      z.null(),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v === "" || v === undefined || Number.isNaN(v as number) ? null : v)),
  status: z
    .enum(["QUALIFIED", "PASSED", "PARTICIPATED", "ABSENT"])
    .optional()
    .default("PARTICIPATED"),
});

export const manualResultsCreateSchema = z.object({
  rows: z.array(manualResultRowSchema).min(1).max(500),
});
