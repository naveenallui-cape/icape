/**
 * High-performance bulk result import.
 * Replaces per-row Prisma upserts with batched findMany + createMany +
 * PostgreSQL INSERT … ON CONFLICT (upsert) for results.
 */
import { randomUUID } from "crypto";
import { ResultStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { computePercentage, normalizePersonName } from "../utils/result.utils";
import { resultCache } from "../lib/cache";

export type BulkImportRow = {
  rowNumber: number;
  registrationNumber: string;
  studentName: string;
  schoolCode: string;
  schoolName: string;
  city?: string;
  state?: string;
  grade: number;
  marksObtained: number;
  totalMarks: number;
  percentage?: number;
  rank?: number | null;
  schoolRank?: number | null;
  status: ResultStatus;
  certificateNo?: string;
  certificateUrl?: string;
};

export type BulkImportProgress = {
  importedRows: number;
  newRows: number;
  updatedRows: number;
  phase: string;
};

const DEFAULT_BATCH = 2000;

export function getImportBatchSize() {
  const n = Number(process.env.RESULT_IMPORT_BATCH_SIZE || DEFAULT_BATCH);
  return Number.isFinite(n) && n >= 100 ? Math.min(n, 10_000) : DEFAULT_BATCH;
}

async function upsertSchoolsForBatch(
  rows: BulkImportRow[],
  yearId: string,
): Promise<Map<string, string>> {
  const unique = new Map<
    string,
    { schoolCode: string; name: string; city?: string; state?: string }
  >();
  for (const row of rows) {
    if (!unique.has(row.schoolCode)) {
      unique.set(row.schoolCode, {
        schoolCode: row.schoolCode,
        name: normalizePersonName(row.schoolName),
        city: row.city,
        state: row.state,
      });
    }
  }

  const codes = [...unique.keys()];
  const existing = await prisma.school.findMany({
    where: { olympiadYear: yearId, schoolCode: { in: codes } },
    select: { id: true, schoolCode: true },
  });
  const map = new Map(existing.map((s) => [s.schoolCode, s.id]));

  const missing = codes
    .filter((c) => !map.has(c))
    .map((c) => {
      const s = unique.get(c)!;
      return {
        id: randomUUID(),
        schoolCode: s.schoolCode,
        name: s.name,
        city: s.city ?? null,
        state: s.state ?? null,
        olympiadYear: yearId,
      };
    });

  if (missing.length) {
    await prisma.school.createMany({ data: missing, skipDuplicates: true });
    const created = await prisma.school.findMany({
      where: {
        olympiadYear: yearId,
        schoolCode: { in: missing.map((m) => m.schoolCode) },
      },
      select: { id: true, schoolCode: true },
    });
    for (const s of created) map.set(s.schoolCode, s.id);
  }

  // Refresh names for schools that already existed (single bulk UPDATE)
  const toRefresh = codes.filter((c) => existing.some((e) => e.schoolCode === c));
  if (toRefresh.length) {
    const names = toRefresh.map((c) => unique.get(c)!.name);
    const cities = toRefresh.map((c) => unique.get(c)!.city ?? null);
    const states = toRefresh.map((c) => unique.get(c)!.state ?? null);
    await prisma.$executeRaw`
      UPDATE "School" AS s
      SET
        name = v.name,
        city = COALESCE(v.city, s.city),
        state = COALESCE(v.state, s.state),
        "updatedAt" = NOW()
      FROM UNNEST(
        ${toRefresh}::text[],
        ${names}::text[],
        ${cities}::text[],
        ${states}::text[]
      ) AS v(school_code, name, city, state)
      WHERE s."schoolCode" = v.school_code
        AND s."olympiadYear" = ${yearId}
    `;
  }

  return map;
}

async function upsertStudentsForBatch(
  rows: BulkImportRow[],
  yearId: string,
  schoolIdByCode: Map<string, string>,
): Promise<Map<string, string>> {
  const regs = [...new Set(rows.map((r) => r.registrationNumber))];

  const existing = await prisma.student.findMany({
    where: {
      olympiadYear: yearId,
      registrationNumber: { in: regs },
    },
    select: { id: true, registrationNumber: true },
  });
  const map = new Map(existing.map((s) => [s.registrationNumber, s.id]));

  // Prefer first row's demographics when creating
  const byReg = new Map<string, BulkImportRow>();
  for (const row of rows) {
    if (!byReg.has(row.registrationNumber)) byReg.set(row.registrationNumber, row);
  }

  const missing = regs
    .filter((r) => !map.has(r))
    .map((reg) => {
      const row = byReg.get(reg)!;
      const schoolId = schoolIdByCode.get(row.schoolCode);
      if (!schoolId) {
        throw new Error(`School not resolved for ${row.schoolCode}`);
      }
      return {
        id: randomUUID(),
        registrationNumber: reg,
        name: normalizePersonName(row.studentName),
        grade: row.grade,
        schoolId,
        olympiadYear: yearId,
      };
    });

  if (missing.length) {
    await prisma.student.createMany({ data: missing, skipDuplicates: true });
    const created = await prisma.student.findMany({
      where: {
        olympiadYear: yearId,
        registrationNumber: { in: missing.map((m) => m.registrationNumber) },
      },
      select: { id: true, registrationNumber: true },
    });
    for (const s of created) map.set(s.registrationNumber, s.id);
  }

  // Bulk-update demographics for students that already existed
  const existingRegs = regs.filter((r) => existing.some((e) => e.registrationNumber === r));
  if (existingRegs.length) {
    const names = existingRegs.map((r) =>
      normalizePersonName(byReg.get(r)!.studentName),
    );
    const grades = existingRegs.map((r) => byReg.get(r)!.grade);
    const schoolIds = existingRegs.map((r) => {
      const id = schoolIdByCode.get(byReg.get(r)!.schoolCode);
      if (!id) throw new Error(`School not resolved for student ${r}`);
      return id;
    });
    await prisma.$executeRaw`
      UPDATE "Student" AS s
      SET
        name = v.name,
        grade = v.grade,
        "schoolId" = v.school_id,
        "updatedAt" = NOW()
      FROM UNNEST(
        ${existingRegs}::text[],
        ${names}::text[],
        ${grades}::int[],
        ${schoolIds}::text[]
      ) AS v(reg, name, grade, school_id)
      WHERE s."registrationNumber" = v.reg
        AND s."olympiadYear" = ${yearId}
    `;
  }

  return map;
}

async function upsertResultsForBatch(
  rows: BulkImportRow[],
  yearId: string,
  olympiadId: string,
  studentIdByReg: Map<string, string>,
  schoolIdByCode: Map<string, string>,
): Promise<{ inserted: number; updated: number }> {
  const studentIds = rows
    .map((r) => studentIdByReg.get(r.registrationNumber))
    .filter((id): id is string => Boolean(id));

  const existing = await prisma.result.findMany({
    where: {
      olympiadId,
      olympiadYear: yearId,
      studentId: { in: studentIds },
    },
    select: { studentId: true },
  });
  const existingSet = new Set(existing.map((r) => r.studentId));

  const ids: string[] = [];
  const sIds: string[] = [];
  const schoolIds: string[] = [];
  const grades: number[] = [];
  const marks: number[] = [];
  const totals: number[] = [];
  const pcts: number[] = [];
  const ranks: Array<number | null> = [];
  const schoolRanks: Array<number | null> = [];
  const statuses: string[] = [];
  const certNos: Array<string | null> = [];
  const certUrls: Array<string | null> = [];

  let inserted = 0;
  let updated = 0;

  // One result per student in this olympiad+year (file-level dedupe already done)
  const seen = new Set<string>();
  for (const row of rows) {
    const studentId = studentIdByReg.get(row.registrationNumber);
    const schoolId = schoolIdByCode.get(row.schoolCode);
    if (!studentId || !schoolId) continue;
    if (seen.has(studentId)) continue;
    seen.add(studentId);

    if (existingSet.has(studentId)) updated += 1;
    else inserted += 1;

    ids.push(randomUUID());
    sIds.push(studentId);
    schoolIds.push(schoolId);
    grades.push(row.grade);
    marks.push(row.marksObtained);
    totals.push(row.totalMarks);
    pcts.push(
      row.percentage ?? computePercentage(row.marksObtained, row.totalMarks),
    );
    ranks.push(row.rank ?? null);
    schoolRanks.push(row.schoolRank ?? null);
    statuses.push(row.status);
    certNos.push(row.certificateNo ?? null);
    certUrls.push(row.certificateUrl ?? null);
  }

  if (ids.length === 0) return { inserted: 0, updated: 0 };

  await prisma.$executeRaw`
    INSERT INTO "Result" (
      id, "studentId", "schoolId", "olympiadId", "olympiadYear",
      grade, "marksObtained", "totalMarks", percentage,
      rank, "schoolRank", status, "certificateNo", "certificateUrl",
      "createdAt", "updatedAt"
    )
    SELECT
      v.id,
      v.student_id,
      v.school_id,
      ${olympiadId},
      ${yearId},
      v.grade,
      v.marks,
      v.total,
      v.pct,
      v.rank,
      v.school_rank,
      v.status::"ResultStatus",
      v.cert_no,
      v.cert_url,
      NOW(),
      NOW()
    FROM UNNEST(
      ${ids}::text[],
      ${sIds}::text[],
      ${schoolIds}::text[],
      ${grades}::int[],
      ${marks}::float8[],
      ${totals}::float8[],
      ${pcts}::float8[],
      ${ranks}::int[],
      ${schoolRanks}::int[],
      ${statuses}::text[],
      ${certNos}::text[],
      ${certUrls}::text[]
    ) AS v(
      id, student_id, school_id, grade, marks, total, pct,
      rank, school_rank, status, cert_no, cert_url
    )
    ON CONFLICT ("studentId", "olympiadId", "olympiadYear")
    DO UPDATE SET
      "schoolId" = EXCLUDED."schoolId",
      grade = EXCLUDED.grade,
      "marksObtained" = EXCLUDED."marksObtained",
      "totalMarks" = EXCLUDED."totalMarks",
      percentage = EXCLUDED.percentage,
      rank = EXCLUDED.rank,
      "schoolRank" = EXCLUDED."schoolRank",
      status = EXCLUDED.status,
      "certificateNo" = EXCLUDED."certificateNo",
      "certificateUrl" = EXCLUDED."certificateUrl",
      "updatedAt" = NOW()
  `;

  return { inserted, updated };
}

/** Public entry for admin manual create (one or many rows, same olympiad+year). */
export async function upsertManualResultRows(params: {
  rows: BulkImportRow[];
  yearId: string;
  olympiadId: string;
}) {
  const { rows, yearId, olympiadId } = params;
  if (!rows.length) return { inserted: 0, updated: 0 };

  const schoolMap = await upsertSchoolsForBatch(rows, yearId);
  const studentMap = await upsertStudentsForBatch(rows, yearId, schoolMap);
  return upsertResultsForBatch(
    rows,
    yearId,
    olympiadId,
    studentMap,
    schoolMap,
  );
}

export async function runBulkResultImport(params: {
  uploadId: string;
  valid: BulkImportRow[];
  yearId: string;
  olympiadId: string;
  errorCount: number;
  onProgress?: (p: BulkImportProgress) => Promise<void>;
}) {
  const { uploadId, valid, yearId, olympiadId, errorCount, onProgress } = params;
  const batchSize = getImportBatchSize();
  const t0 = Date.now();
  let importedRows = 0;
  let newRows = 0;
  let updatedRows = 0;
  let studentQueries = 0;
  let schoolQueries = 0;
  let resultQueries = 0;

  console.log(
    `[RESULT_IMPORT] start upload=${uploadId} rows=${valid.length} batchSize=${batchSize}`,
  );

  try {
    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize);
      const phase = `Importing results ${Math.min(i + batch.length, valid.length)}/${valid.length}…`;

      await onProgress?.({
        importedRows,
        newRows,
        updatedRows,
        phase: `Resolving schools/students for batch ${Math.floor(i / batchSize) + 1}…`,
      });

      const schoolMap = await upsertSchoolsForBatch(batch, yearId);
      schoolQueries += 2;

      const studentMap = await upsertStudentsForBatch(batch, yearId, schoolMap);
      studentQueries += 2;

      const { inserted, updated } = await upsertResultsForBatch(
        batch,
        yearId,
        olympiadId,
        studentMap,
        schoolMap,
      );
      resultQueries += 2;

      importedRows += inserted + updated;
      newRows += inserted;
      updatedRows += updated;

      await onProgress?.({
        importedRows,
        newRows,
        updatedRows,
        phase,
      });
    }

    const status = errorCount > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
    const totalMs = Date.now() - t0;

    await prisma.resultUpload.update({
      where: { id: uploadId },
      data: {
        importedRows,
        status,
        errorSummary:
          errorCount > 0
            ? `Saved ${importedRows} (${newRows} new · ${updatedRows} updated) · ${errorCount} invalid skipped · ${totalMs}ms`
            : `Saved ${importedRows} (${newRows} new · ${updatedRows} updated) · ${totalMs}ms`,
      },
    });

    await resultCache.bumpVersion();

    console.log(
      `[RESULT_IMPORT] done upload=${uploadId} rows=${valid.length} new=${newRows} updated=${updatedRows} totalMs=${totalMs} approxQueries schools≈${schoolQueries} students≈${studentQueries} results≈${resultQueries} batches=${Math.ceil(valid.length / batchSize)}`,
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Import failed";
    console.error(`[RESULT_IMPORT] failed upload=${uploadId}:`, detail);
    await prisma.resultUpload.update({
      where: { id: uploadId },
      data: {
        status: "FAILED",
        importedRows,
        errorSummary: detail,
      },
    });
    throw err;
  }
}
