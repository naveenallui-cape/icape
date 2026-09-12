"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Eye } from "lucide-react";
import {
  getPapersByOlympiad,
  getPreviewPapersByOlympiad,
  sampleOlympiads,
  type PreviewPaper,
  type SampleOlympiadId,
  type SamplePaper,
} from "@/lib/sample-papers";
import { cn } from "@/lib/utils";

function resolveOlympiad(value: string | null): SampleOlympiadId {
  if (value === "imo" || value === "iso" || value === "ieo") return value;
  return "imo";
}

type ActivePaper = SamplePaper | PreviewPaper;

function OlympiadTabs({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SampleOlympiadId;
  onChange: (id: SampleOlympiadId) => void;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {sampleOlympiads.map((olympiad) => (
        <button
          key={olympiad.id}
          type="button"
          onClick={() => onChange(olympiad.id)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-bold transition sm:px-5 sm:text-base",
            value === olympiad.id
              ? "border-brand bg-brand text-white"
              : "border-border bg-surface text-brand hover:border-accent hover:bg-accent-soft",
          )}
        >
          {olympiad.shortName}
        </button>
      ))}
    </nav>
  );
}

function olympiadMeta(id: SampleOlympiadId) {
  return sampleOlympiads.find((item) => item.id === id);
}

function downloadAvailablePapers(
  papers: Array<{ available: boolean; href: string; fileName: string }>,
) {
  const available = papers.filter((paper) => paper.available);
  available.forEach((paper, index) => {
    window.setTimeout(() => {
      const link = document.createElement("a");
      link.href = paper.href;
      link.download = paper.fileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }, index * 250);
  });
}

function TableDownloadButton({
  papers,
  label,
}: {
  papers: Array<{ available: boolean; href: string; fileName: string }>;
  label: string;
}) {
  const availableCount = papers.filter((paper) => paper.available).length;
  if (availableCount === 0) return null;

  return (
    <button
      type="button"
      onClick={() => downloadAvailablePapers(papers)}
      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-brand shadow-sm transition hover:bg-accent-hover"
    >
      <Download className="size-4" aria-hidden />
      {label}
    </button>
  );
}

function actionsCell(paper: ActivePaper) {
  if (!paper.available) {
    return (
      <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
        PDF coming soon
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={paper.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
      >
        <Eye className="size-3.5" aria-hidden />
        View
      </a>
      <a
        href={paper.href}
        download={paper.fileName}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:border-accent hover:bg-accent-soft"
      >
        <Download className="size-3.5" aria-hidden />
        Download
      </a>
    </div>
  );
}

export function SamplePapersShowcase() {
  const searchParams = useSearchParams();
  const initial = resolveOlympiad(searchParams.get("olympiad"));

  const [modelOlympiad, setModelOlympiad] =
    useState<SampleOlympiadId>(initial);
  const [level1Olympiad, setLevel1Olympiad] =
    useState<SampleOlympiadId>(initial);
  const [level2Olympiad, setLevel2Olympiad] =
    useState<SampleOlympiadId>(initial);

  useEffect(() => {
    const next = resolveOlympiad(searchParams.get("olympiad"));
    setModelOlympiad(next);
    setLevel1Olympiad(next);
    setLevel2Olympiad(next);
  }, [searchParams]);

  const modelPapers = useMemo(
    () => getPapersByOlympiad(modelOlympiad),
    [modelOlympiad],
  );
  const level1Papers = useMemo(
    () =>
      getPreviewPapersByOlympiad(level1Olympiad).filter((p) => p.level === 1),
    [level1Olympiad],
  );
  const level2Papers = useMemo(
    () =>
      getPreviewPapersByOlympiad(level2Olympiad).filter((p) => p.level === 2),
    [level2Olympiad],
  );

  const modelMeta = olympiadMeta(modelOlympiad);
  const level1Meta = olympiadMeta(level1Olympiad);
  const level2Meta = olympiadMeta(level2Olympiad);

  return (
    <div className="space-y-10">
      <section id="model-papers" className="scroll-mt-28 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-brand sm:text-2xl">
              Model Papers
            </h3>
            <p className="mt-1 text-base text-muted">
              Grade 3–10 model papers for {modelMeta?.shortName}.
            </p>
          </div>
          <TableDownloadButton
            papers={modelPapers}
            label={`Download ${modelMeta?.shortName} model PDFs`}
          />
        </div>

        <OlympiadTabs
          label="Model papers olympiad"
          value={modelOlympiad}
          onChange={setModelOlympiad}
        />

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_10px_30px_rgba(13,23,59,0.06)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-brand-stats text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Paper</th>
                <th className="px-4 py-3 font-semibold">Olympiad</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {modelPapers.map((paper, index) => (
                <tr
                  key={paper.href}
                  className={
                    index % 2 === 0
                      ? "border-t border-border bg-white"
                      : "border-t border-border bg-brand-soft/30"
                  }
                >
                  <td className="px-4 py-3 text-muted">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-brand">
                    Grade {paper.grade}
                  </td>
                  <td className="px-4 py-3 text-brand">{paper.title}</td>
                  <td className="px-4 py-3 font-semibold text-brand">
                    {modelMeta?.shortName}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {paper.available ? "Available" : "Coming soon"}
                  </td>
                  <td className="px-4 py-3">{actionsCell(paper)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="previous-papers" className="scroll-mt-28 space-y-8">
        <div>
          <h3 className="text-xl font-bold text-brand sm:text-2xl">
            Previous Papers
          </h3>
          <p className="mt-1 text-base text-muted">
            Set A and Set B — choose olympiad for each level.
          </p>
        </div>

        {(
          [
            {
              level: 1 as const,
              papers: level1Papers,
              olympiad: level1Olympiad,
              meta: level1Meta,
              setOlympiad: setLevel1Olympiad,
              label: "Level 1 previous papers olympiad",
            },
            {
              level: 2 as const,
              papers: level2Papers,
              olympiad: level2Olympiad,
              meta: level2Meta,
              setOlympiad: setLevel2Olympiad,
              label: "Level 2 previous papers olympiad",
            },
          ] as const
        ).map(
          ({ level, papers, olympiad, meta, setOlympiad, label }) => (
            <div key={level} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-brand">Level {level}</h4>
                <TableDownloadButton
                  papers={papers}
                  label={`Download ${meta?.shortName} Level ${level} PDFs`}
                />
              </div>
              <OlympiadTabs
                label={label}
                value={olympiad}
                onChange={setOlympiad}
              />
              <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_10px_30px_rgba(13,23,59,0.06)]">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-brand-stats text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Set</th>
                      <th className="px-4 py-3 font-semibold">Grade</th>
                      <th className="px-4 py-3 font-semibold">Paper</th>
                      <th className="px-4 py-3 font-semibold">Olympiad</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper, index) => (
                      <tr
                        key={paper.href}
                        className={
                          index % 2 === 0
                            ? "border-t border-border bg-white"
                            : "border-t border-border bg-brand-soft/30"
                        }
                      >
                        <td className="px-4 py-3 text-muted">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-brand">
                          Set {paper.set}
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand">
                          {paper.grade != null ? `Grade ${paper.grade}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-brand">{paper.title}</td>
                        <td className="px-4 py-3 font-semibold text-brand">
                          {meta?.shortName}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {paper.available ? "Available" : "Coming soon"}
                        </td>
                        <td className="px-4 py-3">{actionsCell(paper)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ),
        )}
      </section>
    </div>
  );
}
