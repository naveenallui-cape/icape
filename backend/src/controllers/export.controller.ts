import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Request, Response, NextFunction } from "express";
import { resultService } from "../services/result.service";
import {
  schoolMineResultsQuerySchema,
  schoolResultsQuerySchema,
  studentResultQuerySchema,
} from "../validators/result.validators";
import { AppError } from "../middleware/error.middleware";
import { getRequestSchool } from "../middleware/auth.middleware";
import { formatResultStatus, normalizePersonName } from "../utils/result.utils";

function streamPdf(
  res: Response,
  filename: string,
  options?: { size?: "A4" | "LETTER"; layout?: "portrait" | "landscape" },
) {
  const doc = new PDFDocument({
    margin: 36,
    size: options?.size ?? "A4",
    layout: options?.layout ?? "portrait",
    autoFirstPage: true,
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  doc.pipe(res);
  return doc;
}

function fileSlug(parts: Array<string | number>) {
  return parts
    .map((part) =>
      String(part)
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("-");
}

/** Solid opaque text — resets leftover stroke/opacity from shapes */
function ink(
  doc: PDFKit.PDFDocument,
  color: string,
  size: number,
  bold = false,
) {
  doc
    .fillOpacity(1)
    .strokeOpacity(1)
    .fillColor(color)
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(size);
}

function box(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  border?: string,
) {
  doc.save();
  doc.rect(x, y, w, h).fill(fill);
  if (border) {
    doc.lineWidth(1.25).strokeColor(border).rect(x, y, w, h).stroke();
  }
  doc.restore();
  doc.fillOpacity(1).strokeOpacity(1);
}

export const exportController = {
  async studentPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const query = studentResultQuerySchema.parse(req.query);
      const data = await resultService.getStudentResults(query);

      const studentName = normalizePersonName(data.student.name);
      const schoolName = normalizePersonName(data.school.name);
      const olympiadCodes = data.results.map((r) => r.olympiad.code).join("-");
      const filename = `${fileSlug([
        studentName,
        olympiadCodes || "Result",
        `Grade-${data.student.grade}`,
      ])}.pdf`;

      const NAVY = "#0D173B";
      const GOLD = "#D4AF37";
      const INK = "#000000";
      const MUTED = "#333333";
      const LINE = "#94A3B8";
      const SOFT = "#EEF2F7";
      const WHITE = "#FFFFFF";

      const doc = streamPdf(res, filename);

      // Full white page background
      doc.save();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(WHITE);
      doc.restore();

      // Decorative frame
      const m = 24;
      doc.save();
      doc
        .lineWidth(2.5)
        .strokeColor(NAVY)
        .rect(m, m, doc.page.width - m * 2, doc.page.height - m * 2)
        .stroke();
      doc
        .lineWidth(1.2)
        .strokeColor(GOLD)
        .rect(
          m + 5,
          m + 5,
          doc.page.width - (m + 5) * 2,
          doc.page.height - (m + 5) * 2,
        )
        .stroke();
      doc.restore();
      doc.fillOpacity(1).strokeOpacity(1);

      const left = 48;
      const width = doc.page.width - left * 2;
      let y = 48;

      // Header — light background + DARK text (avoids invisible white text)
      box(doc, left - 6, y, width + 12, 88, SOFT, NAVY);
      doc.save();
      doc.rect(left - 6, y, width + 12, 6).fill(NAVY);
      doc.rect(left - 6, y + 82, width + 12, 6).fill(GOLD);
      doc.restore();
      doc.fillOpacity(1);

      ink(doc, NAVY, 10, true);
      doc.text("i-CAPE  |  OFFICIAL RESULT CARD", left, y + 16, {
        width,
        align: "center",
      });

      ink(doc, INK, 24, true);
      doc.text(studentName || "Student", left, y + 34, {
        width,
        align: "center",
      });

      ink(doc, MUTED, 11, false);
      doc.text(
        `Olympiad Year ${data.olympiadYear.label}  |  Grade ${data.student.grade}`,
        left,
        y + 62,
        { width, align: "center" },
      );

      y += 106;

      // Details
      box(doc, left, y, width, 72, WHITE, LINE);

      ink(doc, MUTED, 8, false);
      doc.text("REGISTRATION NO.", left + 14, y + 12);
      ink(doc, INK, 12, true);
      doc.text(String(data.student.registrationNumber), left + 14, y + 24);

      ink(doc, MUTED, 8, false);
      doc.text("SCHOOL ID", left + width / 2, y + 12);
      ink(doc, INK, 12, true);
      doc.text(String(data.school.schoolCode), left + width / 2, y + 24);

      ink(doc, MUTED, 8, false);
      doc.text("SCHOOL", left + 14, y + 44);
      ink(doc, INK, 11, true);
      doc.text(schoolName, left + 14, y + 54, { width: width - 28 });

      y += 88;

      // Summary row
      const gap = 10;
      const chipW = (width - gap * 2) / 3;
      const chips: Array<{ label: string; value: string }> = [
        {
          label: "OLYMPIADS",
          value: String(data.summary.olympiadsParticipated),
        },
        {
          label: "BEST RANK",
          value:
            data.summary.bestRank != null ? String(data.summary.bestRank) : "-",
        },
        {
          label: "AVERAGE",
          value:
            data.summary.averagePercentage != null
              ? `${data.summary.averagePercentage}%`
              : "-",
        },
      ];

      chips.forEach((chip, i) => {
        const x = left + i * (chipW + gap);
        box(doc, x, y, chipW, 56, SOFT, NAVY);
        ink(doc, INK, 18, true);
        doc.text(chip.value, x, y + 12, { width: chipW, align: "center" });
        ink(doc, MUTED, 8, false);
        doc.text(chip.label, x, y + 36, { width: chipW, align: "center" });
      });

      y += 72;

      ink(doc, INK, 13, true);
      doc.text("Olympiad Scores", left, y);
      doc.save();
      doc
        .moveTo(left, y + 18)
        .lineTo(left + 130, y + 18)
        .lineWidth(2)
        .strokeColor(GOLD)
        .stroke();
      doc.restore();
      doc.fillOpacity(1);

      y += 28;

      const cols = Math.min(Math.max(data.results.length, 1), 3);
      const cardW = (width - gap * (cols - 1)) / cols;
      const cardH = 132;

      data.results.forEach((result, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = left + col * (cardW + gap);
        const by = y + row * (cardH + gap);

        box(doc, x, by, cardW, cardH, WHITE, LINE);
        doc.save();
        doc.rect(x, by, cardW, 5).fill(GOLD);
        doc.restore();
        doc.fillOpacity(1);

        ink(doc, INK, 14, true);
        doc.text(String(result.olympiad.code), x + 12, by + 16, {
          width: cardW - 24,
        });

        ink(doc, MUTED, 8, false);
        doc.text(String(result.olympiad.fullName), x + 12, by + 34, {
          width: cardW - 24,
          height: 12,
          ellipsis: true,
        });

        ink(doc, INK, 20, true);
        doc.text(
          `${result.marksObtained ?? "-"} / ${result.totalMarks ?? "-"}`,
          x + 12,
          by + 52,
          { width: cardW - 24 },
        );

        ink(doc, INK, 11, false);
        doc.text(
          result.percentage != null ? `${result.percentage}%` : "-",
          x + 12,
          by + 78,
          { width: cardW - 24 },
        );

        ink(doc, MUTED, 9, false);
        doc.text(
          `Rank: ${result.rank ?? "-"}   School: ${result.schoolRank ?? "-"}`,
          x + 12,
          by + 96,
          { width: cardW - 24 },
        );

        ink(doc, INK, 9, true);
        doc.text(String(formatResultStatus(result.status)), x + 12, by + 112, {
          width: cardW - 24,
        });
      });

      const rows = Math.ceil(Math.max(data.results.length, 1) / cols);
      const footerY = Math.min(
        y + rows * (cardH + gap) + 12,
        doc.page.height - 58,
      );

      doc.save();
      doc
        .moveTo(left, footerY)
        .lineTo(left + width, footerY)
        .lineWidth(1)
        .strokeColor(LINE)
        .stroke();
      doc.restore();
      doc.fillOpacity(1);

      ink(doc, INK, 8, true);
      doc.text(
        "I-CAPE Pvt. Ltd  |  Innovative Talent Search Examination",
        left,
        footerY + 10,
        { width, align: "center" },
      );
      ink(doc, MUTED, 8, false);
      doc.text(
        `HIG-143, KPHB Colony, Hyderabad  |  Generated ${new Date().toLocaleString("en-IN")}`,
        left,
        footerY + 24,
        { width, align: "center" },
      );
      doc.text("This is a computer-generated result card.", left, footerY + 36, {
        width,
        align: "center",
      });

      doc.end();
    } catch (err) {
      next(err);
    }
  },

  async schoolPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const query = schoolResultsQuerySchema.parse({
        ...req.query,
        page: 1,
        limit: 100,
      });
      if (!query.schoolCode && !query.schoolId) {
        throw new AppError("School ID is required", 400);
      }

      const allRows: Array<{
        rank: number | null;
        schoolRank: number | null;
        registrationNumber: string;
        studentName: string;
        grade: number;
        olympiad: string;
        marks: string;
        percentage: string;
        status: string;
      }> = [];
      let page = 1;
      let totalPages = 1;
      let schoolName = "School";
      let schoolCode = "";
      let yearLabel = "";
      let city: string | null = null;

      do {
        const data = await resultService.getSchoolResults({
          ...query,
          page,
          limit: 100,
        });
        schoolName = normalizePersonName(data.school.name);
        schoolCode = data.school.schoolCode;
        city = data.school.city;
        yearLabel = data.olympiadYear.label;
        totalPages = data.pagination.totalPages;
        for (const row of data.results) {
          allRows.push({
            rank: row.rank,
            schoolRank: row.schoolRank,
            registrationNumber: row.registrationNumber,
            studentName: normalizePersonName(row.studentName),
            grade: row.grade,
            olympiad: row.olympiad.code,
            marks: `${row.marksObtained ?? "-"}/${row.totalMarks ?? "-"}`,
            percentage:
              row.percentage != null ? `${row.percentage}%` : "-",
            status: row.status,
          });
        }
        page += 1;
      } while (page <= totalPages && page <= 50);

      const filename = `${fileSlug([
        schoolName,
        schoolCode,
        yearLabel || "Results",
        query.olympiad || "All",
        query.grade ? `Grade-${query.grade}` : "All-Grades",
      ])}.pdf`;

      const NAVY = "#0D173B";
      const GOLD = "#D4AF37";
      const INK = "#000000";
      const MUTED = "#333333";
      const LINE = "#94A3B8";
      const SOFT = "#EEF2F7";
      const WHITE = "#FFFFFF";

      const doc = streamPdf(res, filename, { layout: "landscape" });
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const margin = 28;
      const width = pageW - margin * 2;
      let y = margin;

      const drawHeader = () => {
        doc.save();
        doc.rect(0, 0, pageW, pageH).fill(WHITE);
        doc
          .lineWidth(2)
          .strokeColor(NAVY)
          .rect(margin - 6, margin - 6, width + 12, pageH - (margin - 6) * 2)
          .stroke();
        doc
          .lineWidth(1)
          .strokeColor(GOLD)
          .rect(margin - 2, margin - 2, width + 4, pageH - (margin - 2) * 2)
          .stroke();
        doc.restore();
        doc.fillOpacity(1);

        y = margin + 4;
        box(doc, margin, y, width, 52, SOFT, NAVY);
        doc.save();
        doc.rect(margin, y, width, 4).fill(NAVY);
        doc.rect(margin, y + 48, width, 4).fill(GOLD);
        doc.restore();

        ink(doc, NAVY, 9, true);
        doc.text("i-CAPE  |  SCHOOL RESULT LIST", margin, y + 10, {
          width,
          align: "center",
        });
        ink(doc, INK, 14, true);
        doc.text(schoolName, margin, y + 24, { width, align: "center" });
        ink(doc, MUTED, 8, false);
        const filterBits = [
          `School ID: ${schoolCode}`,
          `Olympiad Year ${yearLabel}`,
          query.olympiad ? `Olympiad: ${query.olympiad}` : "Olympiad: All",
          query.grade ? `Grade: ${query.grade}` : "Grade: All",
          city ? normalizePersonName(city) : "",
        ].filter(Boolean);
        doc.text(filterBits.join("  |  "), margin, y + 40, {
          width,
          align: "center",
        });
        y += 64;
      };

      // Fixed pixel widths — empty "gap" column keeps Student and Grade apart
      const table = [
        { key: "rank", label: "Rank", w: 42 },
        { key: "reg", label: "Reg. No.", w: 78 },
        { key: "name", label: "Student", w: 150 },
        { key: "gap", label: "", w: 40 },
        { key: "grade", label: "Grade", w: 42 },
        { key: "oly", label: "Exam", w: 40 },
        { key: "marks", label: "Marks", w: 58 },
        { key: "pct", label: "%", w: 36 },
        { key: "srank", label: "Sch.", w: 36 },
        { key: "status", label: "Status", w: 0 },
      ];
      {
        const used = table.reduce((s, c) => s + c.w, 0);
        table[table.length - 1].w = Math.max(70, width - used);
      }

      const rowH = 18;
      const headerH = 18;

      const xForCol = (index: number) => {
        let x = margin;
        for (let j = 0; j < index; j++) x += table[j].w;
        return x;
      };

      const drawClippedText = (
        text: string,
        x: number,
        cellY: number,
        cellW: number,
        cellH: number,
        color: string,
        size: number,
        bold = false,
      ) => {
        if (!text || cellW < 8) return;
        doc.save();
        doc.rect(x, cellY, cellW, cellH).clip();
        ink(doc, color, size, bold);
        doc.text(text, x + 3, cellY + 4, {
          width: cellW - 6,
          height: cellH - 4,
          ellipsis: true,
          lineBreak: false,
        });
        doc.restore();
        doc.fillOpacity(1).strokeOpacity(1);
      };

      const drawTableHeader = () => {
        doc.save();
        doc.rect(margin, y, width, headerH).fill(NAVY);
        doc.restore();
        table.forEach((col, i) => {
          if (col.key === "gap") return;
          drawClippedText(
            col.label,
            xForCol(i),
            y,
            col.w,
            headerH,
            WHITE,
            8,
            true,
          );
        });
        y += headerH;
      };

      drawHeader();
      drawTableHeader();

      if (!allRows.length) {
        ink(doc, MUTED, 10, false);
        doc.text("No results for the selected filters.", margin, y + 12, {
          width,
          align: "center",
        });
        doc.end();
        return;
      }

      allRows.forEach((row, index) => {
        if (y + rowH > pageH - margin - 24) {
          doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
          drawHeader();
          drawTableHeader();
        }

        if (index % 2 === 1) {
          doc.save();
          doc.rect(margin, y, width, rowH).fill(SOFT);
          doc.restore();
        }

        const cells: Array<{ key: string; value: string }> = [
          { key: "rank", value: row.rank != null ? String(row.rank) : "-" },
          { key: "reg", value: row.registrationNumber },
          { key: "name", value: row.studentName },
          { key: "gap", value: "" },
          { key: "grade", value: String(row.grade) },
          { key: "oly", value: row.olympiad },
          { key: "marks", value: row.marks },
          { key: "pct", value: row.percentage },
          {
            key: "srank",
            value: row.schoolRank != null ? String(row.schoolRank) : "-",
          },
          { key: "status", value: formatResultStatus(row.status) },
        ];

        cells.forEach((cell, i) => {
          if (cell.key === "gap") return;
          const col = table[i];
          drawClippedText(
            cell.value,
            xForCol(i),
            y,
            col.w,
            rowH,
            INK,
            cell.key === "status" ? 7.5 : 8,
            cell.key === "name" || cell.key === "oly",
          );
        });
        y += rowH;
      });

      ink(doc, MUTED, 7, false);
      doc.text(
        `Total ${allRows.length} records  |  Generated ${new Date().toLocaleString("en-IN")}  |  I-CAPE Pvt. Ltd`,
        margin,
        pageH - margin - 10,
        { width, align: "center" },
      );

      doc.end();
    } catch (err) {
      next(err);
    }
  },

  /** School portal PDF — school resolved from session */
  async mySchoolPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const school = getRequestSchool(req);
      const mine = schoolMineResultsQuerySchema.parse(req.query);
      const preview = await resultService.getMySchoolResults(school.sub, {
        ...mine,
        page: 1,
        limit: 1,
      });
      if (preview.pagination.total === 0) {
        throw new AppError("No published results for your school yet", 404);
      }
      req.query = {
        ...req.query,
        schoolCode: preview.school.schoolCode,
        olympiad: mine.olympiad,
        grade: mine.grade != null ? String(mine.grade) : undefined,
        student: mine.student,
        olympiadYear: mine.olympiadYear,
      };
      return exportController.schoolPdf(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  async schoolExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const query = schoolResultsQuerySchema.parse({
        ...req.query,
        page: 1,
        limit: 100,
      });
      if (!query.schoolCode && !query.schoolId) {
        throw new AppError("School ID is required", 400);
      }

      const allRows: Array<Record<string, string | number | null>> = [];
      let page = 1;
      let totalPages = 1;
      let schoolName = "School";
      let yearLabel = "";

      do {
        const data = await resultService.getSchoolResults({
          ...query,
          page,
          limit: 100,
        });
        schoolName = data.school.name;
        yearLabel = data.olympiadYear.label;
        totalPages = data.pagination.totalPages;
        for (const row of data.results) {
          allRows.push({
            Rank: row.rank,
            "School Rank": row.schoolRank,
            "Registration Number": row.registrationNumber,
            "Student Name": row.studentName,
            Grade: row.grade,
            Olympiad: row.olympiad.code,
            Marks: `${row.marksObtained}/${row.totalMarks}`,
            Percentage: row.percentage,
            Status: formatResultStatus(String(row.status)),
          });
        }
        page += 1;
      } while (page <= totalPages && page <= 200);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Results");
      if (allRows.length) {
        sheet.columns = Object.keys(allRows[0]).map((key) => ({
          header: key,
          key,
          width: 18,
        }));
        sheet.addRows(allRows);
      }

      const filename = `i-CAPE-${schoolName.replace(/\s+/g, "-")}-${yearLabel}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  },

  /** School portal Excel — school resolved from session */
  async mySchoolExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const school = getRequestSchool(req);
      const mine = schoolMineResultsQuerySchema.parse(req.query);
      const preview = await resultService.getMySchoolResults(school.sub, {
        ...mine,
        page: 1,
        limit: 1,
      });
      if (preview.pagination.total === 0) {
        throw new AppError("No published results for your school yet", 404);
      }
      req.query = {
        ...req.query,
        schoolCode: preview.school.schoolCode,
        olympiad: mine.olympiad,
        grade: mine.grade != null ? String(mine.grade) : undefined,
        student: mine.student,
        olympiadYear: mine.olympiadYear,
      };
      return exportController.schoolExcel(req, res, next);
    } catch (err) {
      next(err);
    }
  },
};
