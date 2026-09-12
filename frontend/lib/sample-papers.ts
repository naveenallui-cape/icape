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

export type PreviewLevel = 1 | 2;
export type PreviewSet = "A" | "B";

export type PreviewPaper = {
  olympiad: SampleOlympiadId;
  level: PreviewLevel;
  set: PreviewSet;
  /** Present when papers are grade-wise within a level/set */
  grade?: number;
  title: string;
  description: string;
  href: string;
  fileName: string;
  /** Set true once the PDF is placed in public/sample-papers/previews */
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
const previewLevels: PreviewLevel[] = [1, 2];
const previewSets: PreviewSet[] = ["A", "B"];

/** Grade-wise preview PDFs already uploaded (olympiad → level → set) */
const gradeWisePreviewAvailability: Partial<
  Record<
    SampleOlympiadId,
    Partial<Record<PreviewLevel, Partial<Record<PreviewSet, boolean>>>>
  >
> = {
  imo: {
    1: { A: true },
    2: { A: true, B: true },
  },
  iso: {
    1: { A: true },
    2: { A: true, B: true },
  },
  ieo: {
    1: { A: true },
  },
};

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
    description: `${code} model paper for Grade ${grade} — Olympiad Year 2026-27.`,
    href: `/sample-papers/${olympiad}/grade-${grade}.pdf`,
    fileName,
    available,
  };
}

function previewPaperFor(
  olympiad: SampleOlympiadId,
  level: PreviewLevel,
  set: PreviewSet,
  grade?: number,
  available = false,
): PreviewPaper {
  const code = olympiad.toUpperCase();
  if (grade != null) {
    const fileName = `${code}_Preview_L${level}_Set_${set}_Grade_${grade}.pdf`;
    return {
      olympiad,
      level,
      set,
      grade,
      title: `Level ${level} · Set ${set} · Grade ${grade}`,
      description: `${code} preview paper — Level ${level}, Set ${set}, Grade ${grade}.`,
      href: `/sample-papers/previews/${olympiad}/level-${level}-set-${set.toLowerCase()}/grade-${grade}.pdf`,
      fileName,
      available,
    };
  }

  const fileName = `${code}_Preview_Level_${level}_Set_${set}.pdf`;
  return {
    olympiad,
    level,
    set,
    title: `Level ${level} · Set ${set}`,
    description: `${code} preview paper — Level ${level}, Set ${set}.`,
    href: `/sample-papers/previews/${olympiad}/level-${level}-set-${set.toLowerCase()}.pdf`,
    fileName,
    available,
  };
}

/** IMO, ISO, and IEO model PDFs are live */
export const samplePapers: SamplePaper[] = sampleOlympiads.flatMap((olympiad) =>
  grades.map((grade) => paperFor(olympiad.id, grade, true)),
);

/**
 * Preview papers — Level 1/2 × Set A/B.
 * When a level/set has grade-wise PDFs (e.g. ISO Level 2 Set A), expand to Grades 3–10.
 */
export const previewPapers: PreviewPaper[] = sampleOlympiads.flatMap(
  (olympiad) =>
    previewLevels.flatMap((level) =>
      previewSets.flatMap((set) => {
        const gradeWise =
          gradeWisePreviewAvailability[olympiad.id]?.[level]?.[set] === true;
        if (gradeWise) {
          return grades.map((grade) =>
            previewPaperFor(olympiad.id, level, set, grade, true),
          );
        }
        return [previewPaperFor(olympiad.id, level, set, undefined, false)];
      }),
    ),
);

export function getPapersByOlympiad(olympiad: SampleOlympiadId): SamplePaper[] {
  return samplePapers.filter((paper) => paper.olympiad === olympiad);
}

export function getPreviewPapersByOlympiad(
  olympiad: SampleOlympiadId,
): PreviewPaper[] {
  return previewPapers.filter((paper) => paper.olympiad === olympiad);
}
