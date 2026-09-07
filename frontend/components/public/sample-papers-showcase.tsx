"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Eye, FileText } from "lucide-react";
import {
  getPapersByOlympiad,
  sampleOlympiads,
  type SampleOlympiadId,
  type SamplePaper,
} from "@/lib/sample-papers";
import { cn } from "@/lib/utils";

function resolveOlympiad(value: string | null): SampleOlympiadId {
  if (value === "imo" || value === "iso" || value === "ieo") return value;
  return "imo";
}

export function SamplePapersShowcase() {
  const searchParams = useSearchParams();
  const [activeOlympiad, setActiveOlympiad] = useState<SampleOlympiadId>(() =>
    resolveOlympiad(searchParams.get("olympiad")),
  );
  const [preview, setPreview] = useState<SamplePaper | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveOlympiad(resolveOlympiad(searchParams.get("olympiad")));
    setPreview(null);
  }, [searchParams]);

  const papers = useMemo(
    () => getPapersByOlympiad(activeOlympiad),
    [activeOlympiad],
  );

  const activeMeta = sampleOlympiads.find((item) => item.id === activeOlympiad);

  useEffect(() => {
    if (!preview) return;
    previewRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [preview]);

  return (
    <div className="space-y-8">
      <nav
        aria-label="Olympiad sample papers"
        className="flex flex-wrap gap-3"
      >
        {sampleOlympiads.map((olympiad) => (
          <button
            key={olympiad.id}
            type="button"
            onClick={() => {
              setActiveOlympiad(olympiad.id);
              setPreview(null);
            }}
            className={cn(
              "rounded-full border px-5 py-2.5 text-base font-bold transition",
              activeOlympiad === olympiad.id
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-brand hover:border-accent hover:bg-accent-soft",
            )}
          >
            {olympiad.shortName}
          </button>
        ))}
      </nav>

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          {activeMeta?.shortName}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-brand sm:text-3xl">
          {activeMeta?.fullName}
        </h2>
        <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
        <p className="mt-3 max-w-3xl text-base text-muted sm:text-lg">
          View or download Grade 3–10 model papers. Open a paper to preview it
          on this page, or download the PDF to practise offline.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {papers.map((paper) => {
          const isActive = preview?.href === paper.href;

          return (
            <article
              key={paper.href}
              className={cn(
                "flex flex-col rounded-2xl border border-accent/50 bg-surface p-5 shadow-[0_1px_2px_rgba(13,23,59,0.04)]",
                isActive && "border-accent shadow-[0_8px_24px_rgba(13,23,59,0.1)]",
              )}
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                <FileText className="size-6" aria-hidden />
              </div>
              <h3 className="text-lg font-bold text-brand">{paper.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted sm:text-base">
                {paper.description}
              </p>

              {paper.available ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(paper)}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
                  >
                    <Eye className="size-4" aria-hidden />
                    View
                  </button>
                  <a
                    href={paper.href}
                    download={paper.fileName}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-brand hover:border-accent hover:bg-accent-soft"
                  >
                    <Download className="size-4" aria-hidden />
                    Download
                  </a>
                </div>
              ) : (
                <p className="mt-5 rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-brand">
                  PDF coming soon
                </p>
              )}
            </article>
          );
        })}
      </div>

      {preview?.available ? (
        <div
          ref={previewRef}
          id="sample-paper-preview"
          className="scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgba(13,23,59,0.08)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-brand-soft px-4 py-3 sm:px-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                Preview
              </p>
              <h3 className="text-lg font-bold text-brand">
                {activeMeta?.shortName} · {preview.title}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={preview.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-brand hover:border-accent"
              >
                <Eye className="size-4" aria-hidden />
                Open in new tab
              </a>
              <a
                href={preview.href}
                download={preview.fileName}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                <Download className="size-4" aria-hidden />
                Download PDF
              </a>
            </div>
          </div>
          <iframe
            title={`${preview.title} PDF preview`}
            src={`${preview.href}#toolbar=1&navpanes=0`}
            className="h-[70vh] w-full bg-white"
          />
        </div>
      ) : null}
    </div>
  );
}
