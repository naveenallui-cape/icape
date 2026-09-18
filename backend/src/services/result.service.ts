import { Prisma, ResultStatus } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  adminRepository,
  olympiadRepository,
  resultRepository,
  schoolRepository,
  studentRepository,
} from "../repositories/result.repository";
import {
  computePercentage,
  examTotalMarksForGrade,
  isValidGrade,
  normalizePersonName,
  normalizeRegistrationNumber,
  normalizeSchoolCode,
  toNumber,
} from "../utils/result.utils";
import { prisma } from "../lib/prisma";
import { resultCache } from "../lib/cache";
import {
  CURRENT_OLYMPIAD_YEAR,
  OLYMPIAD_YEAR_META,
  listOlympiadYears,
} from "../lib/olympiad-year";

function schoolCodeFromName(name: string) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return normalizeSchoolCode(base || "UNKNOWN-SCHOOL");
}

function mapResultRow(row: Awaited<ReturnType<typeof resultRepository.findByStudentYear>>[number]) {
  return {
    olympiad: row.olympiad,
    grade: row.grade,
    marksObtained: toNumber(row.marksObtained),
    totalMarks: toNumber(row.totalMarks),
    percentage: toNumber(row.percentage),
    rank: row.rank,
    schoolRank: row.schoolRank,
    status: row.status,
    certificateUrl: row.certificateUrl,
    certificateNo: row.certificateNo,
    examDate: row.examDate,
  };
}

export type StudentResultsPayload = {
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
    label: string;
    code: string;
  };
  summary: {
    olympiadsParticipated: number;
    bestRank: number | null;
    averagePercentage: number | null;
  };
  results: ReturnType<typeof mapResultRow>[];
};

export const resultService = {
  async getStudentResults(input: {
    registrationNumber: string;
    grade: number;
    olympiadYear?: string;
  }): Promise<StudentResultsPayload> {
    const reg = normalizeRegistrationNumber(input.registrationNumber);
    const version = await resultCache.getVersion();
    const cacheKey = resultCache.studentKey(
      version,
      CURRENT_OLYMPIAD_YEAR,
      reg,
      input.grade,
    );
    const cached = await resultCache.get<StudentResultsPayload>(cacheKey);
    if (cached) return cached;

    const student = await studentRepository.findByRegistrationAndGrade({
      registrationNumber: reg,
      grade: input.grade,
      olympiadYear: CURRENT_OLYMPIAD_YEAR,
    });

    if (!student) {
      throw new AppError(
        "We couldn't find a result matching the registration number and grade. Please verify your details and try again.",
        404,
      );
    }

    const results = await resultRepository.findByStudentYear(
      student.id,
      CURRENT_OLYMPIAD_YEAR,
    );

    if (results.length === 0) {
      throw new AppError(
        "No olympiad results found for this student in the selected Olympiad Year.",
        404,
      );
    }

    const percentages = results
      .map((r) => toNumber(r.percentage) ?? 0)
      .filter((n) => !Number.isNaN(n));
    const ranks = results
      .map((r) => r.rank)
      .filter((r): r is number => typeof r === "number");

    const payload: StudentResultsPayload = {
      student: {
        name: student.name,
        registrationNumber: student.registrationNumber,
        grade: student.grade,
      },
      school: student.school,
      olympiadYear: OLYMPIAD_YEAR_META,
      summary: {
        olympiadsParticipated: results.length,
        bestRank: ranks.length ? Math.min(...ranks) : null,
        averagePercentage: percentages.length
          ? Math.round(
              (percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100,
            ) / 100
          : null,
      },
      results: results.map(mapResultRow),
    };

    await resultCache.set(cacheKey, payload);
    return payload;
  },

  async searchSchools(input: {
    q: string;
    olympiadYear?: string;
    limit: number;
  }) {
    const version = await resultCache.getVersion();
    const cacheKey = resultCache.schoolSearchKey(
      version,
      CURRENT_OLYMPIAD_YEAR,
      input.q.trim(),
      input.limit,
    );
    const cached = await resultCache.get<{
      olympiadYear: { label: string; code: string };
      schools: unknown;
    }>(cacheKey);
    if (cached) return cached;

    const schools = await schoolRepository.search({
      q: input.q,
      olympiadYear: CURRENT_OLYMPIAD_YEAR,
      limit: input.limit,
    });
    const payload = {
      olympiadYear: OLYMPIAD_YEAR_META,
      schools,
    };
    await resultCache.set(cacheKey, payload, 120);
    return payload;
  },

  async getSchoolResults(input: {
    schoolCode?: string;
    schoolId?: string;
    olympiad?: "IMO" | "ISO" | "IEO";
    grade?: number;
    student?: string;
    olympiadYear?: string;
    page: number;
    limit: number;
  }) {
    const studentKey = (input.student || "").trim().toLowerCase() || "ALL";
    const schoolKey = input.schoolId || input.schoolCode || "";
    const version = await resultCache.getVersion();
    const cacheKey = resultCache.schoolResultsKey(
      version,
      CURRENT_OLYMPIAD_YEAR,
      schoolKey,
      input.olympiad || "ALL",
      input.grade != null ? String(input.grade) : "ALL",
      studentKey,
      input.page,
      input.limit,
    );
    type SchoolResultsPayload = {
      school: {
        schoolCode: string;
        name: string;
        city: string | null;
        state: string | null;
      };
      olympiadYear: { label: string; code: string };
      filters: {
        olympiad: "IMO" | "ISO" | "IEO" | null;
        grade: number | null;
        student: string | null;
      };
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
        olympiad: { code: string; name: string; fullName: string };
        marksObtained: number | null;
        totalMarks: number | null;
        percentage: number | null;
        rank: number | null;
        schoolRank: number | null;
        status: string;
      }>;
    };
    const cached = await resultCache.get<SchoolResultsPayload>(cacheKey);
    if (cached) return cached;

    let school = null;
    if (input.schoolId) {
      school = await schoolRepository.findById(input.schoolId);
      if (school && school.olympiadYear !== CURRENT_OLYMPIAD_YEAR) school = null;
    } else if (input.schoolCode) {
      school = await schoolRepository.findByCode(
        input.schoolCode,
        CURRENT_OLYMPIAD_YEAR,
      );
    }

    if (!school) {
      throw new AppError("School not found for the selected Olympiad Year", 404);
    }

    let olympiadId: string | undefined;
    if (input.olympiad) {
      const olympiad = await olympiadRepository.findByCode(input.olympiad);
      if (!olympiad) throw new AppError("Invalid olympiad", 400);
      olympiadId = olympiad.id;
    }

    const skip = (input.page - 1) * input.limit;
    const [rows, total] = await resultRepository.findSchoolResults({
      schoolId: school.id,
      olympiadYear: CURRENT_OLYMPIAD_YEAR,
      olympiadId,
      grade: input.grade,
      student: input.student,
      skip,
      take: input.limit,
    });

    const payload: SchoolResultsPayload = {
      school: {
        schoolCode: school.schoolCode,
        name: school.name,
        city: school.city,
        state: school.state,
      },
      olympiadYear: OLYMPIAD_YEAR_META,
      filters: {
        olympiad: input.olympiad ?? null,
        grade: input.grade ?? null,
        student: input.student?.trim() || null,
      },
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
      results: rows.map((row) => ({
        registrationNumber: row.student.registrationNumber,
        studentName: row.student.name,
        grade: row.grade,
        olympiad: row.olympiad,
        marksObtained: toNumber(row.marksObtained),
        totalMarks: toNumber(row.totalMarks),
        percentage: toNumber(row.percentage),
        rank: row.rank,
        schoolRank: row.schoolRank,
        status: row.status,
      })),
    };

    await resultCache.set(cacheKey, payload, 120);
    return payload;
  },

  /** Resolve school from logged-in school account registration (not client input). */
  async getMySchoolResults(
    accountId: string,
    input: {
      olympiad?: "IMO" | "ISO" | "IEO";
      grade?: number;
      student?: string;
      olympiadYear?: string;
      page: number;
      limit: number;
    },
  ) {
    const regForYear = await prisma.schoolRegistration.findFirst({
      where: {
        schoolAccountId: accountId,
        olympiadYear: CURRENT_OLYMPIAD_YEAR,
      },
      select: {
        schoolCode: true,
        schoolName: true,
        city: true,
        state: true,
      },
    });

    const regFallback =
      regForYear?.schoolCode?.trim()
        ? null
        : await prisma.schoolRegistration.findFirst({
            where: {
              schoolAccountId: accountId,
              schoolCode: { not: "" },
            },
            orderBy: { updatedAt: "desc" },
            select: {
              schoolCode: true,
              schoolName: true,
              city: true,
              state: true,
            },
          });

    const reg = regForYear?.schoolCode?.trim() ? regForYear : regFallback;
    const schoolCode = reg?.schoolCode?.trim();
    if (!reg || !schoolCode) {
      throw new AppError(
        "Complete school registration before viewing results",
        400,
      );
    }

    try {
      return await this.getSchoolResults({
        ...input,
        schoolCode,
      });
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 404) {
        // Registration exists but no result School row / published data yet
        return {
          school: {
            schoolCode,
            name: reg.schoolName || schoolCode,
            city: reg.city || null,
            state: reg.state || null,
          },
          olympiadYear: OLYMPIAD_YEAR_META,
          filters: {
            olympiad: input.olympiad ?? null,
            grade: input.grade ?? null,
            student: input.student?.trim() || null,
          },
          pagination: {
            page: input.page,
            limit: input.limit,
            total: 0,
            totalPages: 1,
          },
          results: [],
        };
      }
      throw err;
    }
  },

  async adminListResults(input: {
    q?: string;
    olympiad?: "IMO" | "ISO" | "IEO";
    schoolCode?: string;
    grade?: number;
    olympiadYear?: string;
    status?: ResultStatus;
    page: number;
    limit: number;
  }) {
    const where: Prisma.ResultWhereInput = {
      olympiadYear: CURRENT_OLYMPIAD_YEAR,
    };
    if (input.grade) where.grade = input.grade;
    if (input.status) where.status = input.status;
    if (input.olympiad) {
      const olympiad = await olympiadRepository.findByCode(input.olympiad);
      if (olympiad) where.olympiadId = olympiad.id;
    }
    if (input.schoolCode) {
      where.school = {
        schoolCode: {
          contains: input.schoolCode.trim(),
          mode: "insensitive",
        },
      };
    }
    if (input.q) {
      const q = input.q.trim();
      where.OR = [
        {
          student: {
            registrationNumber: {
              contains: normalizeRegistrationNumber(q),
              mode: "insensitive",
            },
          },
        },
        {
          student: {
            name: { contains: q, mode: "insensitive" },
          },
        },
        {
          school: {
            schoolCode: {
              contains: normalizeRegistrationNumber(q),
              mode: "insensitive",
            },
          },
        },
        {
          school: {
            name: { contains: q, mode: "insensitive" },
          },
        },
      ];
    }

    const skip = (input.page - 1) * input.limit;
    const [rows, total] = await resultRepository.adminSearch({
      where,
      skip,
      take: input.limit,
    });

    return {
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
      results: rows.map((row) => ({
        id: row.id,
        registrationNumber: row.student.registrationNumber,
        studentName: row.student.name,
        schoolCode: row.school.schoolCode,
        schoolName: row.school.name,
        olympiad: row.olympiad.code,
        olympiadYear: row.olympiadYear,
        grade: row.grade,
        marksObtained: toNumber(row.marksObtained),
        totalMarks: toNumber(row.totalMarks),
        percentage: toNumber(row.percentage),
        rank: row.rank,
        schoolRank: row.schoolRank,
        status: row.status,
      })),
    };
  },

  async adminDeleteResult(id: string) {
    try {
      await resultRepository.deleteById(id);
      await resultCache.bumpVersion();
      return { deleted: true };
    } catch {
      throw new AppError("Result not found", 404);
    }
  },

  async adminUpdateResult(
    id: string,
    data: {
      marksObtained?: number;
      totalMarks?: number;
      rank?: number | null;
      schoolRank?: number | null;
      status?: ResultStatus;
    },
  ) {
    const existing = await prisma.result.findUnique({ where: { id } });
    if (!existing) throw new AppError("Result not found", 404);

    const marksObtained = data.marksObtained ?? toNumber(existing.marksObtained)!;
    const totalMarks = data.totalMarks ?? toNumber(existing.totalMarks)!;
    if (marksObtained > totalMarks) {
      throw new AppError("Marks obtained cannot exceed total marks", 400);
    }

    const updated = await resultRepository.updateById(id, {
      marksObtained,
      totalMarks,
      percentage: computePercentage(marksObtained, totalMarks),
      rank: data.rank === undefined ? existing.rank : data.rank,
      schoolRank:
        data.schoolRank === undefined ? existing.schoolRank : data.schoolRank,
      status: data.status ?? existing.status,
    });

    await resultCache.bumpVersion();
    return updated;
  },

  async adminCreateManualResults(
    rows: Array<{
      registrationNumber: string;
      studentName: string;
      schoolName: string;
      schoolCode?: string;
      place?: string;
      state?: string;
      grade: number;
      olympiadCode: "IMO" | "ISO" | "IEO";
      olympiadYear?: string;
      marksObtained: number;
      totalMarks?: number;
      rank?: number | null;
      schoolRank?: number | null;
      status?: ResultStatus;
    }>,
    adminId: string,
  ) {
    const errors: Array<{ index: number; message: string }> = [];
    let inserted = 0;
    let updated = 0;

    // Resolve history olympiad from the first row (even if later rows fail)
    let historyOlympiadId: string | null = null;
    if (rows[0]) {
      const o = await olympiadRepository.findByCode(rows[0].olympiadCode);
      if (o) historyOlympiadId = o.id;
    }

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      try {
        if (!isValidGrade(raw.grade)) {
          throw new Error("Invalid grade (must be 3–10)");
        }
        const totalMarks =
          raw.totalMarks ?? examTotalMarksForGrade(raw.grade);
        if (!totalMarks || totalMarks <= 0) {
          throw new Error("Could not determine total marks");
        }
        if (
          !Number.isFinite(raw.marksObtained) ||
          raw.marksObtained < 0 ||
          raw.marksObtained > totalMarks
        ) {
          throw new Error(
            `Marks (${raw.marksObtained}) must be between 0 and ${totalMarks}`,
          );
        }

        const olympiad = await olympiadRepository.findByCode(raw.olympiadCode);
        if (!olympiad) {
          throw new Error(`Olympiad "${raw.olympiadCode}" not found`);
        }

        const registrationNumber = normalizeRegistrationNumber(
          raw.registrationNumber,
        );
        if (!registrationNumber) {
          throw new Error("Registration number required");
        }
        const studentName = normalizePersonName(raw.studentName);
        const schoolName = normalizePersonName(raw.schoolName);
        if (!studentName) throw new Error("Student name required");
        if (!schoolName) throw new Error("School name required");

        const schoolCode = raw.schoolCode?.trim()
          ? normalizeSchoolCode(raw.schoolCode)
          : schoolCodeFromName(schoolName);

        const school = await prisma.school.upsert({
          where: {
            schoolCode_olympiadYear: {
              schoolCode,
              olympiadYear: CURRENT_OLYMPIAD_YEAR,
            },
          },
          create: {
            schoolCode,
            name: schoolName,
            city: raw.place?.trim() || null,
            state: raw.state?.trim() || null,
            olympiadYear: CURRENT_OLYMPIAD_YEAR,
          },
          update: {
            name: schoolName,
            ...(raw.place?.trim() ? { city: raw.place.trim() } : {}),
            ...(raw.state?.trim() ? { state: raw.state.trim() } : {}),
          },
          select: { id: true },
        });

        const student = await prisma.student.upsert({
          where: {
            registrationNumber_olympiadYear: {
              registrationNumber,
              olympiadYear: CURRENT_OLYMPIAD_YEAR,
            },
          },
          create: {
            registrationNumber,
            name: studentName,
            grade: raw.grade,
            schoolId: school.id,
            olympiadYear: CURRENT_OLYMPIAD_YEAR,
          },
          update: {
            name: studentName,
            grade: raw.grade,
            schoolId: school.id,
          },
          select: { id: true },
        });

        const existing = await prisma.result.findUnique({
          where: {
            studentId_olympiadId_olympiadYear: {
              studentId: student.id,
              olympiadId: olympiad.id,
              olympiadYear: CURRENT_OLYMPIAD_YEAR,
            },
          },
          select: { id: true },
        });

        const percentage = computePercentage(raw.marksObtained, totalMarks);
        await prisma.result.upsert({
          where: {
            studentId_olympiadId_olympiadYear: {
              studentId: student.id,
              olympiadId: olympiad.id,
              olympiadYear: CURRENT_OLYMPIAD_YEAR,
            },
          },
          create: {
            studentId: student.id,
            schoolId: school.id,
            olympiadId: olympiad.id,
            olympiadYear: CURRENT_OLYMPIAD_YEAR,
            grade: raw.grade,
            marksObtained: raw.marksObtained,
            totalMarks,
            percentage,
            rank: raw.rank ?? null,
            schoolRank: raw.schoolRank ?? null,
            status: raw.status ?? "PARTICIPATED",
          },
          update: {
            schoolId: school.id,
            grade: raw.grade,
            marksObtained: raw.marksObtained,
            totalMarks,
            percentage,
            rank: raw.rank ?? null,
            schoolRank: raw.schoolRank ?? null,
            status: raw.status ?? "PARTICIPATED",
          },
        });

        if (existing) updated += 1;
        else inserted += 1;
      } catch (err) {
        errors.push({
          index: i,
          message: err instanceof Error ? err.message : "Failed to save row",
        });
      }
    }

    const saved = inserted + updated;
    let uploadId: string | null = null;

    if (historyOlympiadId && (saved > 0 || rows.length > 0)) {
      const upload = await prisma.resultUpload.create({
        data: {
          fileName: `Manual entry (${rows.length} row${rows.length === 1 ? "" : "s"})`,
          olympiadId: historyOlympiadId,
          olympiadYear: CURRENT_OLYMPIAD_YEAR,
          totalRows: rows.length,
          validRows: saved,
          invalidRows: errors.length,
          duplicateRows: 0,
          importedRows: saved,
          status:
            errors.length > 0 && saved > 0
              ? "COMPLETED_WITH_ERRORS"
              : saved > 0
                ? "COMPLETED"
                : "FAILED",
          errorSummary:
            errors.length > 0
              ? errors
                  .slice(0, 5)
                  .map((e) => `Row ${e.index + 1}: ${e.message}`)
                  .join(" · ")
              : `Manual entry · ${inserted} new · ${updated} updated`,
          uploadedById: adminId,
        },
        select: { id: true },
      });
      uploadId = upload.id;

      if (errors.length) {
        await prisma.resultUploadError.createMany({
          data: errors.slice(0, 500).map((e) => ({
            uploadId: upload.id,
            rowNumber: e.index + 1,
            message: e.message,
          })),
        });
      }
    }

    if (saved > 0) {
      await resultCache.bumpVersion();
    }

    return {
      submitted: rows.length,
      saved,
      inserted,
      updated,
      skippedInvalid: errors.length,
      errors: errors.slice(0, 50),
      uploadId,
    };
  },

  async listMeta() {
    const version = await resultCache.getVersion();
    const cacheKey = resultCache.metaKey(version);
    const cached = await resultCache.get<{
      olympiads: unknown;
      years: unknown;
    }>(cacheKey);
    if (cached) return cached;

    const olympiads = await olympiadRepository.list();
    const payload = { olympiads, years: listOlympiadYears() };
    await resultCache.set(cacheKey, payload, 300);
    return payload;
  },
};

export const authService = {
  async login(email: string, password: string) {
    const { compare } = await import("bcryptjs");
    const admin = await adminRepository.findByEmail(email);
    if (!admin) throw new AppError("Invalid email or password", 401);
    const ok = await compare(password, admin.passwordHash);
    if (!ok) throw new AppError("Invalid email or password", 401);
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };
  },

  async me(adminId: string) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) throw new AppError("Unauthorized", 401);
    return admin;
  },
};
