"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Award,
  Download,
  Printer,
  Search,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/public/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, getApiUrl } from "@/lib/api";
import {
  RESULT_GRADES,
  RESULT_OLYMPIADS,
  formatPersonName,
  formatResultStatus,
  type OlympiadCode,
  type SchoolResultsPayload,
  type SchoolSearchItem,
} from "@/lib/results";

const OLYMPIAD_ORDER = ["IMO", "ISO", "IEO"] as const;

function formatOlympiadList(codes: string[]) {
  const unique = [...new Set(codes.map((c) => c.toUpperCase()))];
  const ordered = [
    ...OLYMPIAD_ORDER.filter((code) => unique.includes(code)),
    ...unique.filter(
      (code) => !(OLYMPIAD_ORDER as readonly string[]).includes(code),
    ),
  ];
  if (ordered.length === 0) return "";
  if (ordered.length === 1) return ordered[0];
  if (ordered.length === 2) return `${ordered[0]} and ${ordered[1]}`;
  return `${ordered.slice(0, -1).join(", ")}, and ${ordered[ordered.length - 1]}`;
}

function schoolDescription(opts: {
  hasSchool: boolean;
  olympiad: string;
  grade: string;
  resultCodes: string[];
}) {
  if (!opts.hasSchool) {
    return "Search school-wide olympiad results by School ID or name.";
  }

  const gradePart = opts.grade ? ` for Grade ${opts.grade}` : "";

  if (opts.olympiad) {
    return `School-wide ${opts.olympiad} performance${gradePart}.`;
  }

  const list = formatOlympiadList(
    opts.resultCodes.length ? opts.resultCodes : [...RESULT_OLYMPIADS],
  );
  if (!list) {
    return `School-wide olympiad performance${gradePart}.`;
  }
  if (opts.resultCodes.length === 1) {
    return `School-wide performance in ${list}${gradePart}.`;
  }
  return `School-wide performance across ${list}${gradePart}.`;
}

export function SchoolResultView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(
    searchParams.get("q") ?? searchParams.get("schoolCode") ?? "",
  );
  const [schoolCode, setSchoolCode] = useState(
    searchParams.get("schoolCode") ?? "",
  );
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

  // School list is wide — default print to landscape A4
  useEffect(() => {
    const id = "school-results-print-page";
    const style = document.createElement("style");
    style.id = id;
    style.textContent =
      "@media print { @page { size: A4 landscape; margin: 8mm; } }";
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

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

  const pdfUrl = useMemo(() => {
    if (!schoolCode) return "";
    const params = new URLSearchParams({ schoolCode });
    if (olympiad) params.set("olympiad", olympiad);
    if (grade) params.set("grade", grade);
    return `${getApiUrl()}/results/school/pdf?${params.toString()}`;
  }, [schoolCode, olympiad, grade]);

  const resultCodes = useMemo(
    () => (data ? data.results.map((r) => r.olympiad.code) : []),
    [data],
  );

  const description = useMemo(
    () =>
      schoolDescription({
        hasSchool: Boolean(schoolCode),
        olympiad,
        grade,
        resultCodes,
      }),
    [schoolCode, olympiad, grade, resultCodes],
  );

  const summary = useMemo(() => {
    if (!data) return null;
    const students = new Set(data.results.map((r) => r.registrationNumber));
    const olympiads = new Set(data.results.map((r) => r.olympiad.code));
    const grades = new Set(data.results.map((r) => r.grade));
    return {
      records: data.pagination.total,
      students: students.size,
      olympiads: olympiads.size,
      grades: grades.size,
    };
  }, [data]);

  return (
    <PageShell title="School Results" description={description} hideHeroOnPrint>
      <div className="space-y-8">
        <form
          onSubmit={onFindSchool}
          className="no-print rounded-2xl border-2 border-brand/15 bg-surface p-5 shadow-[0_8px_24px_rgba(13,23,59,0.06)] sm:p-6"
        >
          <h2 className="text-xl font-bold text-brand">Find school</h2>
          <p className="mt-1 text-sm text-muted">
            Enter School ID or school name, then apply Olympiad / Grade filters.
          </p>
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
                      void loadResults({
                        schoolCode: school.schoolCode,
                        page: 1,
                      });
                    }}
                  >
                    <span className="font-semibold text-brand">
                      {school.schoolCode}
                    </span>{" "}
                    — {formatPersonName(school.name)}
                    {school.city ? ` · ${formatPersonName(school.city)}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>

        {schoolCode ? (
          <form
            onSubmit={onViewResults}
            className="no-print rounded-2xl border border-border bg-surface p-5 sm:p-6"
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
                  className="flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-brand"
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
                  className="flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-brand"
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
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
            {error}
          </p>
        ) : null}

        {data ? (
          <div className="space-y-5">
            <div className="result-sheet overflow-hidden rounded-2xl border-2 border-brand bg-surface shadow-[0_16px_40px_rgba(13,23,59,0.12)] print:shadow-none">
              <div className="border-b-4 border-accent bg-[#eef2f7] px-6 py-6 sm:px-8 sm:py-7">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                  i-CAPE · School Result · Olympiad Year{" "}
                  {data.olympiadYear.label}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-brand sm:text-3xl">
                  {formatPersonName(data.school.name)}
                </h2>
                <div className="mt-3 grid gap-1 text-sm text-[#2c3e50] sm:grid-cols-2 sm:text-base">
                  <p>
                    School ID:{" "}
                    <span className="font-semibold text-brand">
                      {data.school.schoolCode}
                    </span>
                  </p>
                  {(data.school.city || data.school.state) && (
                    <p>
                      Location:{" "}
                      <span className="font-semibold text-brand">
                        {[data.school.city, data.school.state]
                          .filter(Boolean)
                          .map((v) => formatPersonName(String(v)))
                          .join(", ")}
                      </span>
                    </p>
                  )}
                  {olympiad || grade ? (
                    <p className="sm:col-span-2">
                      Filters:{" "}
                      <span className="font-semibold text-brand">
                        {olympiad || "All olympiads"}
                        {grade ? ` · Grade ${grade}` : " · All grades"}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="no-print flex flex-wrap gap-3 px-6 py-4 sm:px-8">
                <a href={pdfUrl} download>
                  <Button type="button" variant="accent">
                    <Download className="size-4" />
                    Download PDF
                  </Button>
                </a>
                <a href={exportUrl} download>
                  <Button type="button" variant="outline">
                    <Download className="size-4" />
                    Download Excel
                  </Button>
                </a>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Printer className="size-4" />
                  Print
                </Button>
                <Link href="/results">
                  <Button type="button" variant="ghost">
                    Back
                  </Button>
                </Link>
              </div>
            </div>

            {summary && data.results.length > 0 ? (
              <div className="no-print grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface p-5">
                  <Users className="size-5 text-accent" aria-hidden />
                  <p className="mt-3 text-2xl font-bold text-brand">
                    {summary.records}
                  </p>
                  <p className="text-sm text-muted">Total records</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <Award className="size-5 text-accent" aria-hidden />
                  <p className="mt-3 text-2xl font-bold text-brand">
                    {summary.olympiads}
                  </p>
                  <p className="text-sm text-muted">Olympiads on this page</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <Award className="size-5 text-accent" aria-hidden />
                  <p className="mt-3 text-2xl font-bold text-brand">
                    {summary.grades}
                  </p>
                  <p className="text-sm text-muted">Grades on this page</p>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/60" />
            ) : data.results.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface p-6 text-muted">
                No results for the selected Olympiad / Grade.
              </p>
            ) : (
              <>
                <div className="school-results-table-wrap overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_10px_30px_rgba(13,23,59,0.06)]">
                  <table className="school-results-table w-full min-w-[720px] text-left text-sm print:min-w-0">
                    <thead className="bg-brand-stats text-white">
                      <tr>
                        <th className="px-3 py-3 font-semibold">Rank</th>
                        <th className="px-3 py-3 font-semibold">Reg. No.</th>
                        <th className="col-student min-w-[10rem] px-3 py-3 font-semibold">
                          Student
                        </th>
                        <th
                          className="col-student-grade-gap w-8 p-0"
                          aria-hidden
                        />
                        <th className="col-grade px-3 py-3 font-semibold">
                          Grade
                        </th>
                        <th className="px-3 py-3 font-semibold">Olympiad</th>
                        <th className="px-3 py-3 font-semibold">Marks</th>
                        <th className="col-print-optional px-3 py-3 font-semibold">
                          %
                        </th>
                        <th className="col-print-optional w-16 px-2 py-3 font-semibold">
                          School Rank
                        </th>
                        <th className="px-3 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.results.map((row, index) => (
                        <tr
                          key={`${row.registrationNumber}-${row.olympiad.code}-${index}`}
                          className={
                            index % 2 === 0
                              ? "border-t border-border bg-white"
                              : "border-t border-border bg-brand-soft/30"
                          }
                        >
                          <td className="px-3 py-3 font-semibold text-brand">
                            {row.rank ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-brand">
                            {row.registrationNumber}
                          </td>
                          <td className="col-student min-w-[10rem] px-3 py-3 font-medium text-brand">
                            {formatPersonName(row.studentName)}
                          </td>
                          <td
                            className="col-student-grade-gap w-8 p-0"
                            aria-hidden
                          />
                          <td className="col-grade px-3 py-3 text-muted">
                            {row.grade}
                          </td>
                          <td className="px-3 py-3 font-semibold text-brand">
                            {row.olympiad.code}
                          </td>
                          <td className="px-3 py-3 text-brand">
                            {row.marksObtained ?? "—"}/{row.totalMarks ?? "—"}
                          </td>
                          <td className="col-print-optional px-3 py-3 text-muted">
                            {row.percentage != null
                              ? `${row.percentage}%`
                              : "—"}
                          </td>
                          <td className="col-print-optional w-16 px-2 py-3 text-center text-muted">
                            {row.schoolRank ?? "—"}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand">
                              {formatResultStatus(row.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <p className="text-sm text-muted">
                    Page {data.pagination.page} of {data.pagination.totalPages}{" "}
                    · {data.pagination.total} records
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
                      className="h-9 rounded-md border border-border bg-white px-2 text-sm text-brand"
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
    </PageShell>
  );
}
