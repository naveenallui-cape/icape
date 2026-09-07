export type SampleOlympiadId = "imo" | "iso" | "ieo";

export type SamplePaper = {
  olympiad: SampleOlympiadId;
  grade: number;
  title: string;
  description: string;
  /** Path under /public */
  href: string;
  fileName: string;
  /** Set true once the PDF is placed in public/sample-papers */
  available: boolean;
};

export const sampleOlympiads = [
  {
    id: "imo" as const,
    shortName: "IMO",
    fullName: "Innovative Maths Olympiad",
  },
  {
    id: "iso" as const,
    shortName: "ISO",
    fullName: "Innovative Science Olympiad",
  },
  {
    id: "ieo" as const,
    shortName: "IEO",
    fullName: "Innovative English Olympiad",
  },
] as const;

const grades = [3, 4, 5, 6, 7, 8, 9, 10] as const;

function paperFor(
  olympiad: SampleOlympiadId,
  grade: number,
  available = false,
): SamplePaper {
  const code = olympiad.toUpperCase();
  const fileName = `${code}_Grade_${grade}_Model_Paper.pdf`;
  return {
    olympiad,
    grade,
    title: `Grade ${grade} Model Paper`,
    description: `${code} model paper for Grade ${grade} — Olympiad Year 2025-26.`,
    href: `/sample-papers/${olympiad}/grade-${grade}.pdf`,
    fileName,
    available,
  };
}

/** IMO, ISO, and IEO PDFs are live */
export const samplePapers: SamplePaper[] = sampleOlympiads.flatMap((olympiad) =>
  grades.map((grade) => paperFor(olympiad.id, grade, true)),
);

export function getPapersByOlympiad(olympiad: SampleOlympiadId): SamplePaper[] {
  return samplePapers.filter((paper) => paper.olympiad === olympiad);
}
