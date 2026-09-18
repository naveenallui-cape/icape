import PDFDocument from "pdfkit";
import type { Response } from "express";
import { exportFilename } from "./student-list-documents";

export type IncompleteRegistrationExportRow = {
  schoolName: string;
  schoolCode: string;
  email: string;
  contactName: string;
  phone: string;
  city: string;
  state: string;
  status: string;
  progress: string;
  studentCount: number;
  updatedAt: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function buildIncompleteRegistrationsPrintHtml(
  rows: IncompleteRegistrationExportRow[],
  search?: string,
) {
  const title = "Incomplete registrations — marketing follow-up";
  const body = rows
    .map(
      (row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          <strong>${escapeHtml(row.schoolName || "—")}</strong><br/>
          <span class="muted">${escapeHtml(row.city || "")}${row.city && row.state ? ", " : ""}${escapeHtml(row.state || "")}</span>
        </td>
        <td class="mono">${escapeHtml(row.schoolCode || "—")}</td>
        <td>${escapeHtml(row.email || "—")}</td>
        <td>
          ${escapeHtml(row.contactName || "—")}<br/>
          <span class="mono">${escapeHtml(row.phone || "—")}</span>
        </td>
        <td>${escapeHtml(row.progress)}</td>
        <td class="center">${row.studentCount}</td>
        <td>${escapeHtml(row.status)}</td>
        <td>${escapeHtml(formatDate(row.updatedAt))}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0d173b; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { color: #5b6785; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #d7deea; padding: 7px; vertical-align: top; }
    th { background: #0d173b; color: #fff; text-align: left; }
    .center { text-align: center; }
    .mono { font-family: ui-monospace, monospace; font-weight: 700; }
    .muted { color: #5b6785; font-size: 10px; }
    @media print {
      body { margin: 12px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <button onclick="window.print()" style="margin-bottom:12px;padding:8px 12px;">Print</button>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${rows.length} school${rows.length === 1 ? "" : "s"}${search ? ` · Filter: ${escapeHtml(search)}` : ""} · Generated ${new Date().toLocaleString("en-IN")}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>School</th>
        <th>Code</th>
        <th>Login email</th>
        <th>Contact</th>
        <th>Progress</th>
        <th>Students</th>
        <th>Status</th>
        <th>Updated</th>
      </tr>
    </thead>
    <tbody>${body || `<tr><td colspan="9">No incomplete registrations</td></tr>`}</tbody>
  </table>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
}

export function writeIncompleteRegistrationsPdf(
  res: Response,
  rows: IncompleteRegistrationExportRow[],
  search?: string,
) {
  const filename = exportFilename("i-cape-incomplete-registrations", "pdf", {
    olympiadYear: search ? "filtered" : "all",
  });
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 24,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  doc.pipe(res);

  doc
    .fontSize(16)
    .fillColor("#0d173b")
    .text("Incomplete registrations — marketing follow-up");
  doc
    .moveDown(0.3)
    .fontSize(10)
    .fillColor("#5b6785")
    .text(
      `${rows.length} school${rows.length === 1 ? "" : "s"}${search ? ` · Filter: ${search}` : ""} · Generated ${new Date().toLocaleString("en-IN")}`,
    );
  doc.moveDown(0.5);

  const headers = [
    "#",
    "School",
    "Code",
    "Email",
    "Contact",
    "Phone",
    "Progress",
    "Students",
    "Status",
  ];
  const widths = [28, 130, 70, 130, 90, 85, 85, 55, 75];
  const startX = doc.page.margins.left;
  let y = doc.y;
  const rowHeight = 22;

  function drawHeader() {
    let x = startX;
    doc
      .rect(
        startX,
        y,
        widths.reduce((a, b) => a + b, 0),
        rowHeight,
      )
      .fill("#0d173b");
    doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
    headers.forEach((header, i) => {
      doc.text(header, x + 3, y + 7, { width: widths[i] - 6, ellipsis: true });
      x += widths[i];
    });
    y += rowHeight;
    doc.font("Helvetica").fillColor("#0d173b");
  }

  drawHeader();

  rows.forEach((row, index) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
    if (index % 2 === 1) {
      doc
        .rect(
          startX,
          y,
          widths.reduce((a, b) => a + b, 0),
          rowHeight,
        )
        .fill("#f4f7fb");
      doc.fillColor("#0d173b");
    }
    const cells = [
      String(index + 1),
      row.schoolName || "—",
      row.schoolCode || "—",
      row.email || "—",
      row.contactName || "—",
      row.phone || "—",
      row.progress,
      String(row.studentCount),
      row.status,
    ];
    let x = startX;
    cells.forEach((cell, i) => {
      doc.fontSize(7).text(cell, x + 3, y + 7, {
        width: widths[i] - 6,
        ellipsis: true,
        lineBreak: false,
      });
      x += widths[i];
    });
    y += rowHeight;
  });

  doc.end();
}
