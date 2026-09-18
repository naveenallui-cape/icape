import ExcelJS from "exceljs";
import { ResultStatus, UploadStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import {
  olympiadRepository,
  olympiadYearRepository,
} from "../repositories/result.repository";
import {
  computePercentage,
  examTotalMarksForGrade,
  isValidGrade,
  normalizePersonName,
  normalizeRegistrationNumber,
  normalizeSchoolCode,
  parseGradeValue,
} from "../utils/result.utils";
import { runBulkResultImport } from "./bulk-import.service";

type FieldKey =
  | "serialNo"
  | "registrationNumber"
  | "studentName"
  | "schoolCode"
  | "schoolName"
  | "place"
  | "state"
  | "grade"
  | "marksObtained"
  | "totalMarks"
  | "percentage"
  | "rank"
  | "schoolRank"
  | "status"
  | "olympiad"
  | "certificateNo"
  | "certificateUrl";

/** Flexible header aliases for real i-CAPE Excel sheets */
const FIELD_ALIASES: Record<FieldKey, string[]> = {
  serialNo: ["s_no", "sno", "sr_no", "serial_no", "sl_no", "s.no", "s.no."],
  registrationNumber: [
    "registration_number",
    "registration_no",
    "reg_no",
    "reg_number",
    "registrationnumber",
    "roll_no",
    "roll_number",
  ],
  studentName: [
    "name_of_the_student",
    "student_name",
    "name",
    "student",
    "candidate_name",
  ],
  schoolCode: ["school_id", "school_code", "schoolid", "schoolcode"],
  schoolName: ["school_name", "school", "name_of_the_school"],
  place: ["place", "city", "town", "location"],
  state: ["state", "state_ut", "province"],
  grade: ["grade", "class", "std", "standard"],
  // In many sheets "Total Marks" = marks scored by student
  marksObtained: [
    "total_marks",
    "marks",
    "marks_obtained",
    "marks_scored",
    "score",
    "obtained_marks",
    "total_mark",
  ],
  totalMarks: [
    "max_marks",
    "maximum_marks",
    "out_of",
    "total_marks_possible",
    "exam_total",
  ],
  percentage: ["percentage", "percent", "%", "pct"],
  rank: ["rank", "overall_rank", "national_rank", "all_india_rank"],
  schoolRank: ["school_rank", "schoolrank"],
  status: ["status", "result", "qualification"],
  olympiad: ["olympiad", "exam", "subject"],
  certificateNo: ["certificate_number", "certificate_no"],
  certificateUrl: ["certificate_url"],
};

type ParsedRow = {
  rowNumber: number;
  registrationNumber: string;
  studentName: string;
  schoolCode: string;
  schoolName: string;
  city?: string;
  state?: string;
  grade: number;
  olympiadCode: "IMO" | "ISO" | "IEO";
  marksObtained: number;
  totalMarks: number;
  percentage?: number;
  rank?: number | null;
  schoolRank?: number | null;
  status: ResultStatus;
  certificateNo?: string;
  certificateUrl?: string;
};

type RowError = {
  rowNumber: number;
  message: string;
  rawData?: string;
  isDuplicate?: boolean;
  sheet?: string;
  registrationNumber?: string;
  studentName?: string;
  schoolName?: string;
  place?: string;
  state?: string;
  grade?: number | null;
  marksObtained?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  rank?: number | null;
};

/** Admin-corrected rows sent on confirm import */
export type CorrectedUploadRow = {
  rowNumber?: number;
  registrationNumber: string;
  studentName: string;
  schoolName: string;
  place?: string;
  state?: string;
  grade: number;
  marksObtained: number;
  totalMarks?: number;
  percentage?: number;
  rank?: number | null;
};

type ColumnMapping = {
  field: FieldKey;
  excelHeader: string;
  columnIndex: number;
};

const BATCH_SIZE = Number(process.env.RESULT_IMPORT_BATCH_SIZE || 2000);

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/%/g, " percent ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cellStr(value: ExcelJS.CellValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) {
    return String(value.text ?? "").trim();
  }
  if (typeof value === "object" && "result" in value) {
    return String(value.result ?? "").trim();
  }
  return String(value).trim();
}

function cellNum(value: ExcelJS.CellValue | undefined): number | null {
  const raw = cellStr(value).replace(/%/g, "").replace(/,/g, "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseStatus(value: string): ResultStatus {
  const v = value.trim().toUpperCase().replace(/\s+/g, "_");
  if (v.includes("QUALIF")) return "QUALIFIED";
  if (v === "PASSED" || v === "PASS") return "PASSED";
  if (v === "ABSENT") return "ABSENT";
  return "PARTICIPATED";
}

function schoolCodeFromName(name: string) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return normalizeSchoolCode(base || "UNKNOWN-SCHOOL");
}

function detectSheetTotalMarks(sheet: ExcelJS.Worksheet, scanRows = 8) {
  const patterns = [
    /total\s*marks\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
    /max(?:imum)?\s*marks\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
    /out\s*of\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
  ];
  for (let r = 1; r <= Math.min(scanRows, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    let line = "";
    row.eachCell((cell) => {
      line += ` ${cellStr(cell.value)}`;
    });
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const n = Number(match[1]);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
  }
  return null;
}

function findHeaderRow(sheet: ExcelJS.Worksheet) {
  const maxScan = Math.min(20, Math.max(sheet.rowCount || 0, 1));
  let best = { row: 1, score: -1, headers: {} as Record<number, string> };

  for (let r = 1; r <= maxScan; r++) {
    const row = sheet.getRow(r);
    const headers: Record<number, string> = {};
    let score = 0;
    row.eachCell((cell, col) => {
      const raw = cellStr(cell.value);
      if (!raw) return;
      const key = normalizeHeader(raw);
      headers[col] = raw;
      for (const aliases of Object.values(FIELD_ALIASES)) {
        if (aliases.includes(key)) {
          score += 1;
          break;
        }
      }
    });
    if (score > best.score) best = { row: r, score, headers };
  }

  if (best.score < 3) return null;
  return best;
}

function isRepeatedHeaderRow(
  row: ExcelJS.Row,
  mapping: Partial<Record<FieldKey, ColumnMapping>>,
) {
  const reg = normalizeHeader(
    cellStr(getCell(row, mapping, "registrationNumber")),
  );
  const name = normalizeHeader(cellStr(getCell(row, mapping, "studentName")));
  return (
    reg.includes("registration") ||
    name.includes("name_of_the_student") ||
    name === "student_name" ||
    name === "name"
  );
}

function resolveColumnMap(headers: Record<number, string>) {
  const mapping: Partial<Record<FieldKey, ColumnMapping>> = {};
  const detectedHeaders: Array<{ excelHeader: string; mappedTo: FieldKey | null }> =
    [];

  for (const [colStr, excelHeader] of Object.entries(headers)) {
    const col = Number(colStr);
    const key = normalizeHeader(excelHeader);
    let matched: FieldKey | null = null;
    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as Array<
      [FieldKey, string[]]
    >) {
      if (aliases.includes(key)) {
        // Prefer first match; don't overwrite marksObtained if totalMarks already taken from same alias conflict
        if (!mapping[field]) {
          mapping[field] = { field, excelHeader, columnIndex: col };
          matched = field;
        }
        break;
      }
    }
    detectedHeaders.push({ excelHeader, mappedTo: matched });
  }

  return { mapping, detectedHeaders };
}

function getCell(
  row: ExcelJS.Row,
  mapping: Partial<Record<FieldKey, ColumnMapping>>,
  field: FieldKey,
) {
  const col = mapping[field]?.columnIndex;
  if (!col) return undefined;
  return row.getCell(col).value;
}

function defaultTotalForGrade(grade: number) {
  return examTotalMarksForGrade(grade);
}

function parseGradeCell(value: ExcelJS.CellValue | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return parseGradeValue(value);
  return parseGradeValue(cellStr(value));
}

function buildBalancedPreviewRows(
  valid: ParsedRow[],
  maxTotal: number,
): Array<Record<string, string | number | null>> {
  const byGrade = new Map<number, ParsedRow[]>();
  for (const row of valid) {
    const list = byGrade.get(row.grade) ?? [];
    list.push(row);
    byGrade.set(row.grade, list);
  }

  const grades = [...byGrade.keys()].sort((a, b) => a - b);
  if (grades.length === 0) return [];

  const perGrade = Math.max(25, Math.floor(maxTotal / grades.length));
  const out: Array<Record<string, string | number | null>> = [];

  for (const grade of grades) {
    const rows = byGrade.get(grade) ?? [];
    for (const row of rows.slice(0, perGrade)) {
      out.push({
        rowNumber: row.rowNumber,
        registrationNumber: row.registrationNumber,
        studentName: row.studentName,
        schoolName: row.schoolName,
        place: row.city ?? null,
        state: row.state ?? null,
        grade: row.grade,
        marksObtained: row.marksObtained,
        totalMarks: row.totalMarks,
        percentage: row.percentage ?? null,
        rank: row.rank ?? null,
      });
    }
  }

  return out;
}

function toEditableInvalidRows(errors: RowError[]) {
  return errors
    .filter((e) => !e.isDuplicate)
    .slice(0, 500)
    .map((e) => ({
      rowNumber: e.rowNumber,
      sheet: e.sheet ?? null,
      message: e.message,
      registrationNumber: e.registrationNumber ?? "",
      studentName: e.studentName ?? "",
      schoolName: e.schoolName ?? "",
      place: e.place ?? "",
      state: e.state ?? "",
      grade: e.grade ?? "",
      marksObtained: e.marksObtained ?? "",
      totalMarks: e.totalMarks ?? "",
      percentage: e.percentage ?? "",
      rank: e.rank ?? "",
    }));
}

function tryBuildParsedRow(params: {
  rowNumber: number;
  olympiadCode: "IMO" | "ISO" | "IEO";
  registrationNumber: string;
  studentName: string;
  schoolName: string;
  place?: string;
  state?: string;
  grade: number | null;
  marksObtained: number | null;
  totalMarks: number | null;
  percentage?: number | null;
  rank?: number | null;
  seenKeys: Set<string>;
}): { ok: true; row: ParsedRow } | { ok: false; message: string; isDuplicate?: boolean } {
  const registrationNumber = normalizeRegistrationNumber(
    params.registrationNumber,
  );
  const studentName = normalizePersonName(params.studentName);
  const schoolName = normalizePersonName(params.schoolName);
  const grade = params.grade;
  const marksObtained = params.marksObtained;
  const totalMarks =
    params.totalMarks ??
    (grade !== null ? defaultTotalForGrade(grade) : null);

  if (!registrationNumber) return { ok: false, message: "Registration number missing" };
  if (!studentName) return { ok: false, message: "Student name missing" };
  if (!schoolName) return { ok: false, message: "School name missing" };
  if (grade === null || !isValidGrade(grade)) {
    return { ok: false, message: "Invalid grade (must be 3–10)" };
  }
  if (marksObtained === null || Number.isNaN(marksObtained)) {
    return { ok: false, message: "Marks missing" };
  }
  if (totalMarks === null || totalMarks <= 0) {
    return { ok: false, message: `Could not determine total marks for grade ${grade}` };
  }
  if (marksObtained < 0 || marksObtained > totalMarks) {
    return {
      ok: false,
      message: `Marks (${marksObtained}) greater than total marks (${totalMarks})`,
    };
  }

  const dedupeKey = `${registrationNumber}|${params.olympiadCode}`;
  if (params.seenKeys.has(dedupeKey)) {
    return {
      ok: false,
      message: "Duplicate registration + olympiad in this file",
      isDuplicate: true,
    };
  }
  params.seenKeys.add(dedupeKey);

  const percentage =
    params.percentage ?? computePercentage(marksObtained, totalMarks);

  return {
    ok: true,
    row: {
      rowNumber: params.rowNumber,
      registrationNumber,
      studentName,
      schoolCode: schoolCodeFromName(schoolName),
      schoolName,
      city: params.place?.trim() || undefined,
      state: params.state?.trim() || undefined,
      grade,
      olympiadCode: params.olympiadCode,
      marksObtained,
      totalMarks,
      percentage,
      rank: params.rank ?? null,
      schoolRank: null,
      status: "PARTICIPATED",
    },
  };
}

export const uploadService = {
  async previewAndImport(params: {
    buffer: Buffer;
    fileName: string;
    olympiadCode: "IMO" | "ISO" | "IEO";
    olympiadYearLabel: string;
    grade?: number;
    adminId: string;
    confirm: boolean;
    uploadId?: string;
    correctedRows?: CorrectedUploadRow[];
  }) {
    const year = await olympiadYearRepository.findByLabelOrCode(
      params.olympiadYearLabel,
    );
    if (!year) throw new AppError("Olympiad Year not found", 404);

    const olympiad = await olympiadRepository.findByCode(params.olympiadCode);
    if (!olympiad) throw new AppError("Olympiad not found", 404);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(params.buffer as unknown as ExcelJS.Buffer);
    if (!workbook.worksheets.length) {
      throw new AppError("Excel file has no worksheets", 400);
    }

    const valid: ParsedRow[] = [];
    const errors: RowError[] = [];
    const seenKeys = new Set<string>();
    let duplicateRows = 0;
    let skippedOtherGrades = 0;
    let emptyRowsSkipped = 0;
    const gradeBreakdown: Record<string, number> = {};
    const sheetsProcessed: Array<{
      name: string;
      headerRow: number;
      validRows: number;
      dataRows: number;
    }> = [];
    const MAX_PREVIEW_ROWS = 2000;

    let primaryMapping: Partial<Record<FieldKey, ColumnMapping>> | null = null;
    let primaryDetectedHeaders: Array<{
      excelHeader: string;
      mappedTo: FieldKey | null;
    }> = [];
    let sheetHeadingTotalMarks: number | null = null;

    // Process EVERY sheet (many files put each grade on a separate sheet)
    for (const sheet of workbook.worksheets) {
      const headerInfo = findHeaderRow(sheet);
      if (!headerInfo) continue;

      const { mapping, detectedHeaders } = resolveColumnMap(headerInfo.headers);
      if (
        !mapping.registrationNumber ||
        !mapping.studentName ||
        !mapping.schoolName ||
        !mapping.grade ||
        !mapping.marksObtained
      ) {
        continue;
      }

      if (!primaryMapping) {
        primaryMapping = mapping;
        primaryDetectedHeaders = detectedHeaders;
        sheetHeadingTotalMarks = detectSheetTotalMarks(sheet);
      }

      let sheetValid = 0;
      let sheetData = 0;

      sheet.eachRow({ includeEmpty: false }, (row, r) => {
        if (r <= headerInfo.row) return;
        if (isRepeatedHeaderRow(row, mapping)) return;

        const registrationNumber = normalizeRegistrationNumber(
          cellStr(getCell(row, mapping, "registrationNumber")),
        );
        const studentName = cellStr(getCell(row, mapping, "studentName"));
        const schoolName = cellStr(getCell(row, mapping, "schoolName"));
        const place = cellStr(getCell(row, mapping, "place")) || undefined;
        const state = cellStr(getCell(row, mapping, "state")) || undefined;
        const schoolCodeRaw = cellStr(getCell(row, mapping, "schoolCode"));
        const schoolCode = schoolCodeRaw
          ? normalizeSchoolCode(schoolCodeRaw)
          : schoolName
            ? schoolCodeFromName(schoolName)
            : "";
        const grade = parseGradeCell(getCell(row, mapping, "grade"));
        const marksObtained = cellNum(getCell(row, mapping, "marksObtained"));
        const totalMarksFromCol = cellNum(getCell(row, mapping, "totalMarks"));
        const percentage = cellNum(getCell(row, mapping, "percentage"));
        const rank = cellNum(getCell(row, mapping, "rank"));
        const schoolRank = cellNum(getCell(row, mapping, "schoolRank"));
        const statusRaw = cellStr(getCell(row, mapping, "status"));

        if (
          !registrationNumber &&
          !studentName &&
          !schoolName &&
          marksObtained === null
        ) {
          emptyRowsSkipped += 1;
          return;
        }

        sheetData += 1;

        if (params.grade != null && grade !== null && grade !== params.grade) {
          skippedOtherGrades += 1;
          return;
        }

        const totalMarks =
          totalMarksFromCol ??
          (grade !== null ? defaultTotalForGrade(grade) : null);

        const fieldSnapshot = {
          sheet: sheet.name,
          registrationNumber,
          studentName,
          schoolName,
          place: place ?? "",
          state: state ?? "",
          grade,
          marksObtained,
          totalMarks,
          percentage,
          rank,
        };
        const raw = JSON.stringify(fieldSnapshot);

        const built = tryBuildParsedRow({
          rowNumber: r,
          olympiadCode: params.olympiadCode,
          registrationNumber,
          studentName,
          schoolName,
          place,
          state,
          grade,
          marksObtained,
          totalMarks,
          percentage,
          rank,
          seenKeys,
        });

        if (!built.ok) {
          if (built.isDuplicate) duplicateRows += 1;
          errors.push({
            rowNumber: r,
            message: `[${sheet.name}] ${built.message}`,
            rawData: raw,
            isDuplicate: built.isDuplicate,
            ...fieldSnapshot,
          });
          return;
        }

        // Preserve school code from Excel when present
        if (schoolCode) built.row.schoolCode = schoolCode;
        if (schoolRank !== null) built.row.schoolRank = schoolRank;
        if (statusRaw) built.row.status = parseStatus(statusRaw);
        built.row.certificateNo =
          cellStr(getCell(row, mapping, "certificateNo")) || undefined;
        built.row.certificateUrl =
          cellStr(getCell(row, mapping, "certificateUrl")) || undefined;

        valid.push(built.row);
        gradeBreakdown[String(built.row.grade)] =
          (gradeBreakdown[String(built.row.grade)] ?? 0) + 1;
        sheetValid += 1;
      });

      sheetsProcessed.push({
        name: sheet.name,
        headerRow: headerInfo.row,
        validRows: sheetValid,
        dataRows: sheetData,
      });
    }

    if (!primaryMapping || sheetsProcessed.length === 0) {
      throw new AppError(
        "Could not detect Excel header row on any sheet. Expected columns like Registration Number, NAME OF THE STUDENT, SCHOOL NAME, GRADE, Total Marks, Percentage, Rank.",
        400,
      );
    }

    // Apply admin corrections from preview edits (confirm import)
    const remainingErrors: RowError[] = [];
    const correctedApplied: string[] = [];
    const correctedRowNumbers = new Set<number>();
    if (params.correctedRows?.length) {
      for (const correction of params.correctedRows) {
        const grade =
          typeof correction.grade === "number"
            ? correction.grade
            : parseGradeValue(correction.grade);
        const marksObtained = Number(correction.marksObtained);
        const totalMarksRaw =
          correction.totalMarks === undefined || correction.totalMarks === null
            ? null
            : Number(correction.totalMarks);
        const percentageRaw =
          correction.percentage === undefined || correction.percentage === null
            ? null
            : Number(correction.percentage);
        const rankRaw =
          correction.rank === undefined || correction.rank === null
            ? null
            : Number(correction.rank);

        const built = tryBuildParsedRow({
          rowNumber: correction.rowNumber ?? 0,
          olympiadCode: params.olympiadCode,
          registrationNumber: String(correction.registrationNumber ?? ""),
          studentName: String(correction.studentName ?? ""),
          schoolName: String(correction.schoolName ?? ""),
          place: correction.place ? String(correction.place) : undefined,
          state: correction.state ? String(correction.state) : undefined,
          grade,
          marksObtained: Number.isFinite(marksObtained) ? marksObtained : null,
          totalMarks:
            totalMarksRaw !== null && Number.isFinite(totalMarksRaw)
              ? totalMarksRaw
              : null,
          percentage:
            percentageRaw !== null && Number.isFinite(percentageRaw)
              ? percentageRaw
              : null,
          rank: rankRaw !== null && Number.isFinite(rankRaw) ? rankRaw : null,
          seenKeys,
        });

        if (!built.ok) {
          remainingErrors.push({
            rowNumber: correction.rowNumber ?? 0,
            message: `Corrected row: ${built.message}`,
            isDuplicate: built.isDuplicate,
            registrationNumber: String(correction.registrationNumber ?? ""),
            studentName: String(correction.studentName ?? ""),
            schoolName: String(correction.schoolName ?? ""),
            place: correction.place ? String(correction.place) : "",
            state: correction.state ? String(correction.state) : "",
            grade,
            marksObtained: Number.isFinite(marksObtained) ? marksObtained : null,
            totalMarks:
              totalMarksRaw !== null && Number.isFinite(totalMarksRaw)
                ? totalMarksRaw
                : null,
          });
          continue;
        }

        valid.push(built.row);
        gradeBreakdown[String(built.row.grade)] =
          (gradeBreakdown[String(built.row.grade)] ?? 0) + 1;
        correctedApplied.push(built.row.registrationNumber);
        if (correction.rowNumber != null) {
          correctedRowNumbers.add(correction.rowNumber);
        }
      }
    }

    // Drop original invalids that were successfully corrected
    const correctedSet = new Set(correctedApplied);
    for (const err of errors) {
      if (err.isDuplicate) {
        remainingErrors.push(err);
        continue;
      }
      const reg = normalizeRegistrationNumber(err.registrationNumber ?? "");
      if (reg && correctedSet.has(reg)) continue;
      if (correctedRowNumbers.has(err.rowNumber)) continue;
      remainingErrors.push(err);
    }
    errors.length = 0;
    errors.push(...remainingErrors);
    duplicateRows = errors.filter((e) => e.isDuplicate).length;

    // Balanced preview: include every grade (sheet often lists Grade 3 first with 4000+ rows)
    const previewRows = buildBalancedPreviewRows(valid, MAX_PREVIEW_ROWS);
    const editableInvalidRows = toEditableInvalidRows(errors);

    const dataRows = valid.length + errors.length;
    const preview = {
      fileName: params.fileName,
      sheetName: sheetsProcessed.map((s) => s.name).join(", "),
      headerRow: sheetsProcessed[0]?.headerRow,
      sheetsProcessed,
      sheetTotalMarks: sheetHeadingTotalMarks,
      inferredTotalMarksRule:
        "Per grade: Grades 3–5 = 70 marks, Grades 6–10 = 100 marks.",
      sheetHeadingNote: null,
      columnMapping: Object.values(primaryMapping).map((m) => ({
        field: m.field,
        excelHeader: m.excelHeader,
      })),
      detectedHeaders: primaryDetectedHeaders,
      /** Student/result data rows only (excludes blank Excel padding) */
      totalRows: dataRows,
      validRows: valid.length,
      invalidRows: Math.max(0, errors.length - duplicateRows),
      duplicateRows,
      skippedOtherGrades,
      emptyRowsSkipped,
      gradeFilter: params.grade ?? null,
      gradeBreakdown,
      sampleRows: previewRows,
      sampleTotal: valid.length,
      samplePreviewCap: MAX_PREVIEW_ROWS,
      sampleErrors: errors.slice(0, 50).map((e) => ({
        rowNumber: e.rowNumber,
        message: e.message,
      })),
      editableInvalidRows,
      correctedApplied: correctedApplied.length,
    };

    if (!params.confirm) {
      return { preview, imported: false };
    }

    const upload = params.uploadId
      ? await prisma.resultUpload.update({
          where: { id: params.uploadId },
          data: {
            status: "PROCESSING",
            totalRows: preview.totalRows,
            validRows: preview.validRows,
            invalidRows: preview.invalidRows,
            duplicateRows: preview.duplicateRows,
            importedRows: 0,
            errorSummary: `Preparing import of ${valid.length} rows…`,
          },
        })
      : await prisma.resultUpload.create({
          data: {
            fileName: params.fileName,
            olympiadId: olympiad.id,
            olympiadYearId: year.id,
            grade: params.grade ?? null,
            totalRows: preview.totalRows,
            validRows: preview.validRows,
            invalidRows: preview.invalidRows,
            duplicateRows: preview.duplicateRows,
            importedRows: 0,
            status: "PROCESSING",
            errorSummary: `Preparing import of ${valid.length} rows…`,
            uploadedById: params.adminId,
          },
        });

    const invalidOnly = errors.filter((e) => !e.isDuplicate);
    if (invalidOnly.length) {
      await prisma.resultUploadError.createMany({
        data: invalidOnly.slice(0, 5000).map((e) => ({
          uploadId: upload.id,
          rowNumber: e.rowNumber,
          message: e.message,
          rawData: e.rawData,
        })),
      });
    }

    // Return immediately so the admin UI can poll progress while import runs
    // Duplicates are skipped (ignored) — they do NOT mark the import as failed.
    void runBulkResultImport({
      uploadId: upload.id,
      valid,
      yearId: year.id,
      olympiadId: olympiad.id,
      errorCount: invalidOnly.length,
      onProgress: async (p) => {
        await prisma.resultUpload.update({
          where: { id: upload.id },
          data: {
            importedRows: p.importedRows,
            errorSummary: `${p.phase} · new ${p.newRows} · updated ${p.updatedRows}`,
          },
        });
      },
    }).catch(async (err) => {
      const detail = err instanceof Error ? err.message : "Import failed";
      console.error("Background import failed:", detail);
      await prisma.resultUpload.update({
        where: { id: upload.id },
        data: {
          status: "FAILED",
          errorSummary: detail,
        },
      });
    });

    return {
      preview,
      imported: false,
      async: true,
      uploadId: upload.id,
      importedRows: 0,
      targetRows: valid.length,
      status: "PROCESSING" as UploadStatus,
      batchSize: BATCH_SIZE,
    };
  },

  async getUploadStatus(uploadId: string) {
    const upload = await prisma.resultUpload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        fileName: true,
        status: true,
        totalRows: true,
        validRows: true,
        invalidRows: true,
        duplicateRows: true,
        importedRows: true,
        errorSummary: true,
        createdAt: true,
        updatedAt: true,
        olympiad: { select: { code: true } },
        olympiadYear: { select: { label: true } },
      },
    });
    if (!upload) throw new AppError("Upload not found", 404);
    const target = upload.validRows || upload.totalRows || 0;
    const percent =
      target > 0
        ? Math.min(100, Math.round((upload.importedRows / target) * 100))
        : upload.status === "COMPLETED" ||
            upload.status === "COMPLETED_WITH_ERRORS"
          ? 100
          : 0;
    return { ...upload, targetRows: target, percent };
  },

  async listUploads(limit = 50) {
    return prisma.resultUpload.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        totalRows: true,
        validRows: true,
        invalidRows: true,
        duplicateRows: true,
        importedRows: true,
        status: true,
        errorSummary: true,
        createdAt: true,
        olympiad: { select: { code: true, name: true } },
        olympiadYear: { select: { label: true } },
        uploadedBy: { select: { name: true, email: true } },
      },
    });
  },

  async getUploadErrors(uploadId: string) {
    return prisma.resultUploadError.findMany({
      where: { uploadId },
      orderBy: { rowNumber: "asc" },
      take: 500,
    });
  },

  async downloadUploadErrorsExcel(uploadId: string) {
    const upload = await prisma.resultUpload.findUnique({
      where: { id: uploadId },
      select: { id: true, fileName: true },
    });
    if (!upload) throw new AppError("Upload not found", 404);

    const errors = await prisma.resultUploadError.findMany({
      where: { uploadId },
      orderBy: { rowNumber: "asc" },
      take: 50_000,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Import Errors");
    sheet.columns = [
      { header: "row_number", key: "rowNumber", width: 12 },
      { header: "registration_number", key: "registrationNumber", width: 22 },
      { header: "student_name", key: "studentName", width: 28 },
      { header: "error_reason", key: "message", width: 60 },
    ];

    for (const err of errors) {
      let registrationNumber = "";
      let studentName = "";
      if (err.rawData) {
        try {
          const raw = JSON.parse(err.rawData) as {
            registrationNumber?: string;
            studentName?: string;
          };
          registrationNumber = raw.registrationNumber ?? "";
          studentName = raw.studentName ?? "";
        } catch {
          /* ignore */
        }
      }
      sheet.addRow({
        rowNumber: err.rowNumber,
        registrationNumber,
        studentName,
        message: err.message,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      fileName: `import-errors-${upload.fileName.replace(/\.[^.]+$/, "")}.xlsx`,
      buffer: Buffer.from(buffer),
    };
  },
};
