import { Prisma, ResultStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  listOlympiadYears,
  olympiadYearMeta,
  resolveOlympiadYear,
} from "../lib/olympiad-year";
import {
  normalizeRegistrationNumber,
  normalizeSchoolCode,
} from "../utils/result.utils";

/** Year helpers — no OlympiadYear table. */
export const olympiadYearRepository = {
  findPublishedByLabel(label?: string) {
    // Results are always available for resolved years (no published flag in DB).
    const year = resolveOlympiadYear(label);
    return Promise.resolve(olympiadYearMeta(year));
  },
  findByLabelOrCode(label?: string) {
    const year = resolveOlympiadYear(label);
    return Promise.resolve(olympiadYearMeta(year));
  },
  list() {
    return Promise.resolve(listOlympiadYears());
  },
};

export const olympiadRepository = {
  list() {
    return prisma.olympiad.findMany({ orderBy: { code: "asc" } });
  },
  findByCode(code: "IMO" | "ISO" | "IEO") {
    return prisma.olympiad.findUnique({ where: { code } });
  },
};

export const studentRepository = {
  findByRegistrationAndGrade(params: {
    registrationNumber: string;
    grade: number;
    olympiadYear: string;
  }) {
    return prisma.student.findFirst({
      where: {
        registrationNumber: normalizeRegistrationNumber(
          params.registrationNumber,
        ),
        grade: params.grade,
        olympiadYear: params.olympiadYear,
      },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        grade: true,
        olympiadYear: true,
        school: {
          select: {
            id: true,
            schoolCode: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });
  },
};

export const schoolRepository = {
  search(params: { q: string; olympiadYear: string; limit: number }) {
    const q = params.q.trim();
    const code = normalizeSchoolCode(q);
    return prisma.school.findMany({
      where: {
        olympiadYear: params.olympiadYear,
        OR: [
          { schoolCode: { equals: code, mode: "insensitive" } },
          { schoolCode: { contains: code, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        schoolCode: true,
        name: true,
        city: true,
        state: true,
      },
      take: params.limit,
      orderBy: [{ name: "asc" }],
    });
  },
  findByCode(schoolCode: string, olympiadYear: string) {
    return prisma.school.findUnique({
      where: {
        schoolCode_olympiadYear: {
          schoolCode: normalizeSchoolCode(schoolCode),
          olympiadYear,
        },
      },
      select: {
        id: true,
        schoolCode: true,
        name: true,
        city: true,
        state: true,
      },
    });
  },
  findById(id: string) {
    return prisma.school.findUnique({
      where: { id },
      select: {
        id: true,
        schoolCode: true,
        name: true,
        city: true,
        state: true,
        olympiadYear: true,
      },
    });
  },
};

export const resultRepository = {
  findByStudentYear(studentId: string, olympiadYear: string) {
    return prisma.result.findMany({
      where: { studentId, olympiadYear },
      select: {
        id: true,
        grade: true,
        marksObtained: true,
        totalMarks: true,
        percentage: true,
        rank: true,
        schoolRank: true,
        status: true,
        certificateUrl: true,
        certificateNo: true,
        examDate: true,
        olympiad: {
          select: { code: true, name: true, fullName: true },
        },
      },
      orderBy: { olympiad: { code: "asc" } },
    });
  },

  findSchoolResults(params: {
    schoolId: string;
    olympiadYear: string;
    olympiadId?: string;
    grade?: number;
    student?: string;
    skip: number;
    take: number;
  }) {
    const studentQ = params.student?.trim();
    const where: Prisma.ResultWhereInput = {
      schoolId: params.schoolId,
      olympiadYear: params.olympiadYear,
      ...(params.olympiadId ? { olympiadId: params.olympiadId } : {}),
      ...(params.grade ? { grade: params.grade } : {}),
      ...(studentQ
        ? {
            student: {
              OR: [
                {
                  name: { contains: studentQ, mode: "insensitive" },
                },
                {
                  registrationNumber: {
                    contains: normalizeRegistrationNumber(studentQ),
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),
    };

    return Promise.all([
      prisma.result.findMany({
        where,
        select: {
          id: true,
          grade: true,
          marksObtained: true,
          totalMarks: true,
          percentage: true,
          rank: true,
          schoolRank: true,
          status: true,
          student: {
            select: {
              registrationNumber: true,
              name: true,
              grade: true,
            },
          },
          olympiad: {
            select: { code: true, name: true, fullName: true },
          },
        },
        orderBy: [
          { schoolRank: "asc" },
          { percentage: "desc" },
          { student: { name: "asc" } },
        ],
        skip: params.skip,
        take: params.take,
      }),
      prisma.result.count({ where }),
    ]);
  },

  adminSearch(params: {
    where: Prisma.ResultWhereInput;
    skip: number;
    take: number;
  }) {
    return Promise.all([
      prisma.result.findMany({
        where: params.where,
        select: {
          id: true,
          grade: true,
          marksObtained: true,
          totalMarks: true,
          percentage: true,
          rank: true,
          schoolRank: true,
          status: true,
          olympiadYear: true,
          student: {
            select: { registrationNumber: true, name: true },
          },
          school: {
            select: { schoolCode: true, name: true },
          },
          olympiad: {
            select: { code: true, name: true },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.result.count({ where: params.where }),
    ]);
  },

  deleteById(id: string) {
    return prisma.result.delete({ where: { id } });
  },

  updateById(
    id: string,
    data: {
      marksObtained?: number;
      totalMarks?: number;
      percentage?: number;
      rank?: number | null;
      schoolRank?: number | null;
      status?: ResultStatus;
    },
  ) {
    return prisma.result.update({
      where: { id },
      data,
    });
  },
};

export const adminRepository = {
  findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  },
  findById(id: string) {
    return prisma.admin.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  },
};
