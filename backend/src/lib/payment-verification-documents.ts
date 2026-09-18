import PDFDocument from "pdfkit";
import type { Response } from "express";
import { exportFilename } from "./student-list-documents";

export type PaymentVerificationExportRow = {
  schoolCode: string;
  schoolName: string;
  city: string;
  state: string;
  status: string;
  studentCount: number;
  imoCount: number;
  isoCount: number;
  ieoCount: number;
  olympiadTotal: number;
  email: string;
  paymentMethod: string;
  utr: string;
  amountExpected: number;
  submittedAt: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatMoney(amount: number) {
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export function buildPaymentVerificationPrintHtml(
  rows: PaymentVerificationExportRow[],
  statusFilter?: string,
) {
  const title = statusFilter
    ? `Payment verification — ${formatStatus(statusFilter)}`
    : "Payment verification — All submitted";
  const body = rows
    .map(
      (row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          <strong>${escapeHtml(row.schoolName || "—")}</strong><br/>
          <span class="muted">${escapeHtml(row.schoolCode || "—")} · ${escapeHtml(row.city || "")}, ${escapeHtml(row.state || "")}</span>
        </td>
        <td class="center">${row.studentCount}</td>
        <td class="center">${row.olympiadTotal}</td>
        <td>${escapeHtml(formatMoney(row.amountExpected))}</td>
        <td>${escapeHtml(row.paymentMethod || "—")}</td>
        <td class="mono">${escapeHtml(row.utr || "—")}</td>
        <td>${escapeHtml(formatStatus(row.status))}</td>
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
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d7deea; padding: 8px; vertical-align: top; }
    th { background: #0d173b; color: #fff; text-align: left; }
    .center { text-align: center; }
    .mono { font-family: ui-monospace, monospace; font-weight: 700; }
    .muted { color: #5b6785; font-size: 11px; }
    @media print {
      body { margin: 12px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <button onclick="window.print()" style="margin-bottom:12px;padding:8px 12px;">Print</button>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${rows.length} school${rows.length === 1 ? "" : "s"} · Generated ${new Date().toLocaleString("en-IN")}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>School</th>
        <th>Students</th>
        <th>Entries</th>
        <th>Amount</th>
        <th>Method</th>
        <th>Reference</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${body || `<tr><td colspan="8">No registrations</td></tr>`}</tbody>
  </table>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
}

export function writePaymentVerificationPdf(
  res: Response,
  rows: PaymentVerificationExportRow[],
  statusFilter?: string,
) {
  const filename = exportFilename(
    "i-cape-payment-verification",
    "pdf",
    { olympiadYear: statusFilter || "all" },
  );
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 28,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  doc.pipe(res);

  const title = statusFilter
    ? `Payment verification — ${formatStatus(statusFilter)}`
    : "Payment verification — All submitted";

  doc.fontSize(16).fillColor("#0d173b").text(title, { continued: false });
  doc
    .moveDown(0.3)
    .fontSize(10)
    .fillColor("#5b6785")
    .text(
      `${rows.length} school${rows.length === 1 ? "" : "s"} · Generated ${new Date().toLocaleString("en-IN")}`,
    );
  doc.moveDown(0.6);

  const headers = [
    "#",
    "School",
    "Code",
    "Students",
    "Entries",
    "Amount",
    "Method",
    "Reference",
    "Status",
  ];
  const widths = [28, 150, 70, 55, 50, 80, 55, 120, 80];
  const startX = doc.page.margins.left;
  let y = doc.y;
  const rowHeight = 22;

  function drawHeader() {
    let x = startX;
    doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowHeight).fill("#0d173b");
    doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
    headers.forEach((header, i) => {
      doc.text(header, x + 4, y + 6, { width: widths[i] - 8, ellipsis: true });
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
        .rect(startX, y, widths.reduce((a, b) => a + b, 0), rowHeight)
        .fill("#f4f7fb");
      doc.fillColor("#0d173b");
    }
    const cells = [
      String(index + 1),
      row.schoolName || "—",
      row.schoolCode || "—",
      String(row.studentCount),
      String(row.olympiadTotal),
      formatMoney(row.amountExpected),
      row.paymentMethod || "—",
      row.utr || "—",
      formatStatus(row.status),
    ];
    let x = startX;
    cells.forEach((cell, i) => {
      doc.fontSize(8).text(cell, x + 4, y + 6, {
        width: widths[i] - 8,
        ellipsis: true,
        lineBreak: false,
      });
      x += widths[i];
    });
    y += rowHeight;
  });

  doc.end();
}
