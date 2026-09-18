import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import {
  olympiadPatterns,
  formatGradeLabel,
  type OlympiadPattern,
  type GradePattern,
} from "../../frontend/lib/exam-pattern";

const outDir = path.resolve(__dirname, "../../frontend/public/pattern");

function writePdf(
  fileName: string,
  build: (doc: PDFKit.PDFDocument) => void,
): Promise<void> {
  const out = path.join(outDir, fileName);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const stream = fs.createWriteStream(out);
  doc.pipe(stream);
  build(doc);
  doc.end();
  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      console.log("Wrote", fileName, Math.round(fs.statSync(out).size / 1024), "KB");
      resolve();
    });
    stream.on("error", reject);
  });
}

function drawPattern(doc: PDFKit.PDFDocument, pattern: GradePattern) {
  if (doc.y > 680) doc.addPage();
  doc.fontSize(13).fillColor("#0D173B").text(formatGradeLabel(pattern.grades));
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#2C3E50");
  doc.text(`Total Questions: ${pattern.totalQuestions}`);
  doc.text(`Time: ${pattern.time}`);
  doc.text(`Total Marks: ${pattern.totalMarks}`);
  doc.text(`Marks per Question: ${pattern.marksPerQuestion}`);
  doc.text(
    `Negative Marking: ${
      pattern.negativeMarking ? "Yes" : "No negative marks for wrong answers"
    }`,
  );
  doc.moveDown(0.4);
  for (const section of pattern.sections) {
    doc.fontSize(10).fillColor("#0D173B").text(section.title);
    doc.fontSize(9).fillColor("#5A6A7A").text(section.topics.join(" · "));
    doc.moveDown(0.25);
  }
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#0D173B").text("Instructions");
  pattern.instructions.forEach((item, i) => {
    doc.fontSize(9).fillColor("#2C3E50").text(`${i + 1}. ${item}`);
  });
  doc.moveDown(0.8);
}

function drawOlympiadHeader(doc: PDFKit.PDFDocument, olympiad: OlympiadPattern) {
  doc
    .fontSize(16)
    .fillColor("#0D173B")
    .text(`${olympiad.shortName} — ${olympiad.fullName}`);
  const y = doc.y + 4;
  doc
    .moveTo(50, y)
    .lineTo(545, y)
    .strokeColor("#D4AF37")
    .lineWidth(2)
    .stroke();
  doc.moveDown();
}

function gradeFileSlug(pattern: GradePattern) {
  return pattern.grades.length === 1
    ? `Grade-${pattern.grades[0]}`
    : `Grades-${pattern.grades.join("-")}`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  // Combined PDF
  await writePdf(
    "i-CAPE-Pattern-of-Questions-and-Marking-Scheme.pdf",
    (doc) => {
      doc
        .fontSize(18)
        .fillColor("#0D173B")
        .text("i-CAPE — Pattern of Questions, Syllabus and Marking Scheme", {
          align: "center",
        });
      doc.moveDown(0.3);
      doc
        .fontSize(11)
        .fillColor("#5A6A7A")
        .text("IMO · ISO · IEO · Grades 3 to 10", { align: "center" });
      doc.moveDown();

      for (const olympiad of olympiadPatterns) {
        doc.addPage();
        drawOlympiadHeader(doc, olympiad);
        for (const pattern of olympiad.patterns) {
          drawPattern(doc, pattern);
        }
      }
    },
  );

  // Per olympiad + per grade pattern
  for (const olympiad of olympiadPatterns) {
    await writePdf(`i-CAPE-${olympiad.shortName}-Pattern.pdf`, (doc) => {
      drawOlympiadHeader(doc, olympiad);
      doc
        .fontSize(10)
        .fillColor("#5A6A7A")
        .text(
          "Pattern of Questions, Syllabus and Marking Scheme · Grades 3 to 10",
        );
      doc.moveDown();
      for (const pattern of olympiad.patterns) {
        drawPattern(doc, pattern);
      }
    });

    for (const pattern of olympiad.patterns) {
      const slug = gradeFileSlug(pattern);
      await writePdf(
        `i-CAPE-${olympiad.shortName}-${slug}-Pattern.pdf`,
        (doc) => {
          drawOlympiadHeader(doc, olympiad);
          doc
            .fontSize(10)
            .fillColor("#5A6A7A")
            .text("Pattern of Questions, Syllabus and Marking Scheme");
          doc.moveDown();
          drawPattern(doc, pattern);
        },
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
