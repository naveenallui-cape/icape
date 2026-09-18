import { Prisma, ResultStatus } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  adminRepository,
  olympiadRepository,
  olympiadYearRepository,
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
    id: string;
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
    const year = await olympiadYearRepository.findPublishedByLabel(
      input.olympiadYear,
    );
    if (!year) {
      throw new AppError("Results are not published for this Olympiad Year", 404);
    }

    const reg = normalizeRegistrationNumber(input.registrationNumber);
    const version = await resultCache.getVersion();
    const cacheKey = resultCache.studentKey(
      version,
      year.label,
      reg,
      input.grade,
    );
    const cached = await resultCache.get<StudentResultsPayload>(cacheKey);
    if (cached) return cached;

    const student = await studentRepository.findByRegistrationAndGrade({
      registrationNumber: reg,
      grade: input.grade,
      olympiadYearId: year.id,
    });

    if (!student) {
      throw new AppError(
        "We couldn't find a result matching the registration number and grade. Please verify your details and try again.",
        404,
      );
    }

    const results = await resultRepository.findByStudentYear(
      student.id,
      year.id,
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
      olympiadYear: student.olympiadYear,
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
    const year = await olympiadYearRepository.findPublishedByLabel(
      input.olympiadYear,
    );
    if (!year) {
      throw new AppError("Results are not published for this Olympiad Year", 404);
    }

    const version = await resultCache.getVersion();
    const cacheKey = resultCache.schoolSearchKey(
      version,
      year.label,
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
      olympiadYearId: year.id,
      limit: input.limit,
    });
    const payload = {
      olympiadYear: { label: year.label, code: year.code },
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
    const year = await olympiadYearRepository.findPublishedByLabel(
      input.olympiadYear,
    );
    if (!year) {
      throw new AppError("Results are not published for this Olympiad Year", 404);
    }

    const studentKey = (input.student || "").trim().toLowerCase() || "ALL";
    const schoolKey = input.schoolId || input.schoolCode || "";
    const version = await resultCache.getVersion();
    const cacheKey = resultCache.schoolResultsKey(
      version,
      year.label,
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
      if (school && school.olympiadYearId !== year.id) school = null;
    } else if (input.schoolCode) {
      school = await schoolRepository.findByCode(input.schoolCode, year.id);
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
      olympiadYearId: year.id,
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
      olympiadYear: { label: year.label, code: year.code },
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
    const year = await olympiadYearRepository.findPublishedByLabel(
      input.olympiadYear,
    );
    if (!year) {
      throw new AppError("Results are not published for this Olympiad Year", 404);
    }

    const regForYear = await prisma.schoolRegistration.findFirst({
      where: {
        schoolAccountId: accountId,
        olympiadYearId: year.id,
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
          olympiadYear: { label: year.label, code: year.code },
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
    const where: Prisma.ResultWhereInput = {};
    // Only filter by year when the admin explicitly passes one.
    // Defaulting to "active" year hid manual saves from other years (e.g. 2025-26).
    if (input.olympiadYear?.trim()) {
      const year = await olympiadYearRepository.findByLabelOrCode(
        input.olympiadYear.trim(),
      );
      if (!year) {
        return {
          pagination: {
            page: input.page,
            limit: input.limit,
            total: 0,
            totalPages: 1,
          },
          results: [],
        };
      }
      where.olympiadYearId = year.id;
    }
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
        olympiadYear: row.olympiadYear.label,
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
      olympiadYear: string;
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

    // Resolve history olympiad/year from the first row (even if later rows fail)
    let historyOlympiadId: string | null = null;
    let historyYearId: string | null = null;
    if (rows[0]) {
      const y = await olympiadYearRepository.findByLabelOrCode(
        rows[0].olympiadYear,
      );
      const o = await olympiadRepository.findByCode(rows[0].olympiadCode);
      if (y) historyYearId = y.id;
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

        const year = await olympiadYearRepository.findByLabelOrCode(
          raw.olympiadYear,
        );
        if (!year) {
          throw new Error(
            `Olympiad Year "${raw.olympiadYear}" not found. Use 2025-26 or 2026-27.`,
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
            schoolCode_olympiadYearId: {
              schoolCode,
              olympiadYearId: year.id,
            },
          },
          create: {
            schoolCode,
            name: schoolName,
            city: raw.place?.trim() || null,
            state: raw.state?.trim() || null,
            olympiadYearId: year.id,
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
            registrationNumber_olympiadYearId: {
              registrationNumber,
              olympiadYearId: year.id,
            },
          },
          create: {
            registrationNumber,
            name: studentName,
            grade: raw.grade,
            schoolId: school.id,
            olympiadYearId: year.id,
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
            studentId_olympiadId_olympiadYearId: {
              studentId: student.id,
              olympiadId: olympiad.id,
              olympiadYearId: year.id,
            },
          },
          select: { id: true },
        });

        const percentage = computePercentage(raw.marksObtained, totalMarks);
        await prisma.result.upsert({
          where: {
            studentId_olympiadId_olympiadYearId: {
              studentId: student.id,
              olympiadId: olympiad.id,
              olympiadYearId: year.id,
            },
          },
          create: {
            studentId: student.id,
            schoolId: school.id,
            olympiadId: olympiad.id,
            olympiadYearId: year.id,
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

    if (historyOlympiadId && historyYearId && (saved > 0 || rows.length > 0)) {
      const upload = await prisma.resultUpload.create({
        data: {
          fileName: `Manual entry (${rows.length} row${rows.length === 1 ? "" : "s"})`,
          olympiadId: historyOlympiadId,
          olympiadYearId: historyYearId,
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

    const [olympiads, years] = await Promise.all([
      olympiadRepository.list(),
      olympiadYearRepository.list(),
    ]);
    const payload = { olympiads, years };
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
