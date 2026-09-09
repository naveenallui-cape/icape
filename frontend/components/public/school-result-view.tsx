"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, getApiUrl } from "@/lib/api";
import {
  RESULT_GRADES,
  RESULT_OLYMPIADS,
  type OlympiadCode,
  type SchoolResultsPayload,
  type SchoolSearchItem,
} from "@/lib/results";

export function SchoolResultView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? searchParams.get("schoolCode") ?? "");
  const [schoolCode, setSchoolCode] = useState(searchParams.get("schoolCode") ?? "");
  const [olympiad, setOlympiad] = useState<"" | OlympiadCode>(
    (searchParams.get("olympiad") as OlympiadCode) || "",
  );
  const [grade, setGrade] = useState(searchParams.get("grade") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [limit, setLimit] = useState(Number(searchParams.get("limit") || 25));
  const [matches, setMatches] = useState<SchoolSearchItem[]>([]);
  const [data, setData] = useState<SchoolResultsPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchSchools(term: string) {
    const params = new URLSearchParams({ q: term });
    const res = await apiRequest<{ schools: SchoolSearchItem[] }>(
      `/results/school/search?${params.toString()}`,
    );
    if (!res.success) {
      setMatches([]);
      setError(res.message);
      return [];
    }
    setMatches(res.data?.schools ?? []);
    return res.data?.schools ?? [];
  }

  async function loadResults(opts?: {
    schoolCode?: string;
    olympiad?: string;
    grade?: string;
    page?: number;
    limit?: number;
  }) {
    const code = opts?.schoolCode ?? schoolCode;
    if (!code) {
      setError("Select a school first.");
      return;
    }
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      schoolCode: code,
      page: String(opts?.page ?? page),
      limit: String(opts?.limit ?? limit),
    });
    const oly = opts?.olympiad ?? olympiad;
    const gr = opts?.grade ?? grade;
    if (oly) params.set("olympiad", oly);
    if (gr) params.set("grade", gr);

    const res = await apiRequest<SchoolResultsPayload>(
      `/results/school?${params.toString()}`,
    );
    setLoading(false);
    if (!res.success || !res.data) {
      setData(null);
      setError(res.message || "No results found");
      return;
    }
    setData(res.data);
  }

  useEffect(() => {
    const initialCode = searchParams.get("schoolCode");
    const initialQ = searchParams.get("q") ?? initialCode;
    if (!initialCode && !initialQ) return;
    void (async () => {
      if (initialQ) {
        const schools = await searchSchools(initialQ);
        const selected =
          schools.find((s) => s.schoolCode === initialCode) ?? schools[0];
        if (selected) {
          setSchoolCode(selected.schoolCode);
          await loadResults({ schoolCode: selected.schoolCode });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFindSchool(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) {
      setError("Enter School ID or School Name.");
      return;
    }
    const schools = await searchSchools(q.trim());
    if (!schools.length) {
      setError("School not found.");
      setData(null);
      return;
    }
    setSchoolCode(schools[0].schoolCode);
    setPage(1);
    await loadResults({ schoolCode: schools[0].schoolCode, page: 1 });
    router.replace(
      `/results/school?schoolCode=${encodeURIComponent(schools[0].schoolCode)}&q=${encodeURIComponent(q.trim())}`,
    );
  }

  async function onViewResults(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    await loadResults({ page: 1 });
  }

  const exportUrl = useMemo(() => {
    if (!schoolCode) return "";
    const params = new URLSearchParams({ schoolCode });
    if (olympiad) params.set("olympiad", olympiad);
    if (grade) params.set("grade", grade);
    return `${getApiUrl()}/results/school/export?${params.toString()}`;
  }, [schoolCode, olympiad, grade]);

  return (
    <div className="space-y-8">
      <form
        onSubmit={onFindSchool}
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
      >
        <h2 className="text-xl font-bold text-brand">Find school</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="School ID or School Name"
            className="flex-1"
          />
          <Button type="submit" variant="accent">
            <Search className="size-4" />
            Search
          </Button>
        </div>
        {matches.length > 1 ? (
          <ul className="mt-3 space-y-1">
            {matches.map((school) => (
              <li key={school.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-soft"
                  onClick={() => {
                    setSchoolCode(school.schoolCode);
                    setQ(school.schoolCode);
                    void loadResults({ schoolCode: school.schoolCode, page: 1 });
                  }}
                >
                  <span className="font-semibold text-brand">
                    {school.schoolCode}
                  </span>{" "}
                  — {school.name}
                  {school.city ? ` · ${school.city}` : ""}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      {schoolCode ? (
        <form
          onSubmit={onViewResults}
          className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand">
                Olympiad
              </label>
              <select
                value={olympiad}
                onChange={(e) =>
                  setOlympiad(e.target.value as "" | OlympiadCode)
                }
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
              >
                <option value="">All</option>
                {RESULT_OLYMPIADS.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand">
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
              >
                <option value="">All Grades</option>
                {RESULT_GRADES.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" variant="accent">
                View Results
              </Button>
            </div>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Olympiad Year {data.olympiadYear.label}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-brand">
              {data.school.name}
            </h2>
            <p className="mt-1 text-muted">
              School ID: {data.school.schoolCode}
              {data.school.city ? ` · ${data.school.city}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 print:hidden">
              <Button type="button" variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" />
                Print
              </Button>
              <a href={exportUrl}>
                <Button type="button" variant="accent">
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </a>
              <Link href="/results">
                <Button type="button" variant="ghost">
                  Back
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/60" />
          ) : data.results.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-6 text-muted">
              No results for the selected Olympiad / Grade.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-brand-stats text-white">
                    <tr>
                      <th className="px-3 py-3">Rank</th>
                      <th className="px-3 py-3">Reg. No.</th>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Grade</th>
                      <th className="px-3 py-3">Olympiad</th>
                      <th className="px-3 py-3">Marks</th>
                      <th className="px-3 py-3">%</th>
                      <th className="px-3 py-3">School Rank</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((row, index) => (
                      <tr
                        key={`${row.registrationNumber}-${row.olympiad.code}-${index}`}
                        className={index % 2 === 0 ? "bg-surface" : "bg-background"}
                      >
                        <td className="px-3 py-3 font-semibold text-brand">
                          {row.rank ?? "—"}
                        </td>
                        <td className="px-3 py-3">{row.registrationNumber}</td>
                        <td className="px-3 py-3">{row.studentName}</td>
                        <td className="px-3 py-3">{row.grade}</td>
                        <td className="px-3 py-3">{row.olympiad.code}</td>
                        <td className="px-3 py-3">
                          {row.marksObtained}/{row.totalMarks}
                        </td>
                        <td className="px-3 py-3">{row.percentage}%</td>
                        <td className="px-3 py-3">{row.schoolRank ?? "—"}</td>
                        <td className="px-3 py-3">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  Page {data.pagination.page} of {data.pagination.totalPages} ·{" "}
                  {data.pagination.total} records
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={limit}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setLimit(next);
                      setPage(1);
                      void loadResults({ limit: next, page: 1 });
                    }}
                    className="h-9 rounded-md border border-border bg-white px-2 text-sm"
                  >
                    {[25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => {
                      const next = page - 1;
                      setPage(next);
                      void loadResults({ page: next });
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      void loadResults({ page: next });
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
