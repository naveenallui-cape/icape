"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Download,
  Printer,
  Trophy,
} from "lucide-react";
import { PageShell } from "@/components/public/page-shell";
import { Button } from "@/components/ui/button";
import { apiRequest, getApiUrl } from "@/lib/api";
import type { StudentResultPayload } from "@/lib/results";
import { formatPersonName, formatResultStatus } from "@/lib/results";

const OLYMPIAD_ORDER = ["IMO", "ISO", "IEO"] as const;

function performanceDescription(codes: string[]) {
  const unique = [...new Set(codes.map((c) => c.toUpperCase()))];
  const ordered = [
    ...OLYMPIAD_ORDER.filter((code) => unique.includes(code)),
    ...unique.filter(
      (code) => !(OLYMPIAD_ORDER as readonly string[]).includes(code),
    ),
  ];

  if (ordered.length === 0) {
    return "Your olympiad performance.";
  }
  if (ordered.length === 1) {
    return `Your olympiad performance in ${ordered[0]}.`;
  }
  if (ordered.length === 2) {
    return `Your olympiad performance across ${ordered[0]} and ${ordered[1]}.`;
  }
  const last = ordered[ordered.length - 1];
  return `Your olympiad performance across ${ordered.slice(0, -1).join(", ")}, and ${last}.`;
}

export function StudentResultView() {
  const searchParams = useSearchParams();
  const registrationNumber = searchParams.get("registrationNumber") ?? "";
  const grade = searchParams.get("grade") ?? "";

  const [data, setData] = useState<StudentResultPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!registrationNumber || !grade) {
        setError("Registration number and grade are required.");
        setLoading(false);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams({ registrationNumber, grade });
      const res = await apiRequest<StudentResultPayload>(
        `/results/student?${params.toString()}`,
      );
      if (cancelled) return;
      if (!res.success || !res.data) {
        setError(res.message || "No results found");
        setData(null);
      } else {
        setData(res.data);
        setError("");
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [registrationNumber, grade]);

  const pdfUrl = useMemo(() => {
    if (!registrationNumber || !grade) return "";
    const params = new URLSearchParams({ registrationNumber, grade });
    return `${getApiUrl()}/results/student/pdf?${params.toString()}`;
  }, [registrationNumber, grade]);

  const description = useMemo(() => {
    if (!data) return "Looking up your olympiad results.";
    return performanceDescription(data.results.map((r) => r.olympiad.code));
  }, [data]);

  if (loading) {
    return (
      <PageShell title="Student Result" description={description}>
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-2xl bg-brand-soft/70" />
          <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/50" />
          <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/50" />
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell
        title="Student Result"
        description="We could not find matching olympiad results."
      >
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <h2 className="text-2xl font-bold text-brand">No results found</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            {error ||
              "We couldn't find a result matching the registration number and grade. Please verify your details and try again."}
          </p>
          <Link href="/results">
            <Button className="mt-6" variant="accent">
              Back to Results
            </Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Student Result" description={description}>
      <div className="space-y-8 print:space-y-4">
        <div className="result-sheet overflow-hidden rounded-2xl border-2 border-brand bg-surface shadow-[0_16px_40px_rgba(13,23,59,0.12)] print:shadow-none">
          <div className="border-b-4 border-accent bg-[#eef2f7] px-6 py-6 sm:px-8 sm:py-7">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
              i-CAPE · Official Result · Olympiad Year {data.olympiadYear.label}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-brand sm:text-4xl">
              {formatPersonName(data.student.name)}
            </h1>
            <div className="mt-4 grid gap-2 text-sm text-[#2c3e50] sm:grid-cols-2 sm:text-base">
              <p>
                Registration No:{" "}
                <span className="font-semibold text-brand">
                  {data.student.registrationNumber}
                </span>
              </p>
              <p>
                Grade:{" "}
                <span className="font-semibold text-brand">
                  {data.student.grade}
                </span>
              </p>
              <p className="sm:col-span-2">
                School:{" "}
                <span className="font-semibold text-brand">
                  {formatPersonName(data.school.name)} ({data.school.schoolCode})
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 print:grid-cols-3">
          {[
            {
              label: "Olympiads Participated",
              value: data.summary.olympiadsParticipated,
              icon: Award,
            },
            {
              label: "Best Rank",
              value: data.summary.bestRank ?? "—",
              icon: Trophy,
            },
            {
              label: "Average %",
              value:
                data.summary.averagePercentage != null
                  ? `${data.summary.averagePercentage}%`
                  : "—",
              icon: Award,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <item.icon className="size-5 text-accent" aria-hidden />
              <p className="mt-3 text-2xl font-bold text-brand">{item.value}</p>
              <p className="text-sm text-muted">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print Result
          </Button>
          <a href={pdfUrl} download>
            <Button type="button" variant="accent">
              <Download className="size-4" />
              Download Result
            </Button>
          </a>
          <Link href="/results">
            <Button type="button" variant="ghost">
              New Search
            </Button>
          </Link>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-brand">Your Olympiad Results</h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_10px_30px_rgba(13,23,59,0.06)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-brand-stats text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Exam</th>
                  <th className="px-4 py-3 font-semibold">Olympiad</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Grade</th>
                  <th className="px-4 py-3 font-semibold">Marks</th>
                  <th className="px-4 py-3 font-semibold">%</th>
                  <th className="px-4 py-3 font-semibold">Rank</th>
                  <th className="w-16 px-2 py-3 font-semibold">School Rank</th>
                  <th className="px-4 py-3 font-semibold">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((result, index) => (
                  <tr
                    key={result.olympiad.code}
                    className={
                      index % 2 === 0
                        ? "border-t border-border bg-white"
                        : "border-t border-border bg-brand-soft/30"
                    }
                  >
                    <td className="px-4 py-3 font-bold text-brand">
                      {result.olympiad.code}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {result.olympiad.fullName}
                    </td>
                    <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold tracking-wide text-brand">
                      {formatResultStatus(result.status)}
                    </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{result.grade}</td>
                    <td className="px-4 py-3 font-semibold text-brand">
                      {result.marksObtained ?? "—"}/{result.totalMarks ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {result.percentage != null
                        ? `${result.percentage}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand">
                      {result.rank ?? "—"}
                    </td>
                    <td className="w-16 px-2 py-3 text-center text-muted">
                      {result.schoolRank ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {result.certificateUrl ? (
                        <a
                          href={result.certificateUrl}
                          className="font-semibold text-brand underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                      ) : result.certificateNo ? (
                        `No. ${result.certificateNo}`
                      ) : (
                        "As per schedule"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
