"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Award,
  Download,
  Printer,
  Users,
} from "lucide-react";
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
} from "@/lib/results";

export function SchoolResultsPanel() {
  const [olympiad, setOlympiad] = useState<"" | OlympiadCode>("");
  const [grade, setGrade] = useState("");
  const [student, setStudent] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [data, setData] = useState<SchoolResultsPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = "school-portal-results-print-page";
    const style = document.createElement("style");
    style.id = id;
    style.textContent =
      "@media print { @page { size: A4 landscape; margin: 8mm; } }";
    document.head.appendChild(style);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  async function loadResults(opts?: {
    olympiad?: string;
    grade?: string;
    student?: string;
    page?: number;
    limit?: number;
  }) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(opts?.page ?? page),
      limit: String(opts?.limit ?? limit),
    });
    const oly = opts?.olympiad ?? olympiad;
    const gr = opts?.grade ?? grade;
    const st = (opts?.student ?? student).trim();
    if (oly) params.set("olympiad", oly);
    if (gr) params.set("grade", gr);
    if (st) params.set("student", st);

    const res = await apiRequest<SchoolResultsPayload>(
      `/results/school/mine?${params.toString()}`,
    );
    setLoading(false);
    if (!res.success || !res.data) {
      setData(null);
      setError(
        !res.success && res.status === 403
          ? res.message ||
              "Results are not published yet. Please check back after i-CAPE releases them."
          : res.message || "No results found",
      );
      return;
    }
    setData(res.data);
  }

  useEffect(() => {
    void loadResults({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFilter(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    await loadResults({ page: 1 });
  }

  const exportParams = useMemo(() => {
    const params = new URLSearchParams();
    if (olympiad) params.set("olympiad", olympiad);
    if (grade) params.set("grade", grade);
    if (student.trim()) params.set("student", student.trim());
    return params.toString();
  }, [olympiad, grade, student]);

  const exportUrl = `${getApiUrl()}/results/school/mine/export${exportParams ? `?${exportParams}` : ""}`;
  const pdfUrl = `${getApiUrl()}/results/school/mine/pdf${exportParams ? `?${exportParams}` : ""}`;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Results</h1>
        <p className="mt-1 text-sm text-muted">
          View your school&apos;s olympiad results. Search by olympiad, grade, or
          student.
        </p>
      </div>

      <form
        onSubmit={onFilter}
        className="no-print rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand">
              Student
            </label>
            <Input
              value={student}
              onChange={(e) => setStudent(e.target.value)}
              placeholder="Name or reg. no."
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" variant="accent">
              Search results
            </Button>
          </div>
        </div>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
          {error}
        </p>
      ) : null}

      {loading && !data ? (
        <div className="h-40 animate-pulse rounded-2xl bg-brand-soft/60" />
      ) : null}

      {data ? (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border-2 border-brand bg-white shadow-sm print:shadow-none">
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
                  School code:{" "}
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
                {(olympiad || grade || student.trim()) && (
                  <p className="sm:col-span-2">
                    Filters:{" "}
                    <span className="font-semibold text-brand">
                      {olympiad || "All olympiads"}
                      {grade ? ` · Grade ${grade}` : " · All grades"}
                      {student.trim() ? ` · Student “${student.trim()}”` : ""}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="no-print flex flex-wrap gap-3 px-6 py-4 sm:px-8">
              <a href={pdfUrl} download>
                <Button
                  type="button"
                  variant="accent"
                  disabled={data.pagination.total === 0}
                >
                  <Download className="size-4" />
                  Download PDF
                </Button>
              </a>
              <a href={exportUrl} download>
                <Button
                  type="button"
                  variant="outline"
                  disabled={data.pagination.total === 0}
                >
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
            </div>
          </div>

          {summary && data.results.length > 0 ? (
            <div className="no-print grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-5">
                <Users className="size-5 text-accent" aria-hidden />
                <p className="mt-3 text-2xl font-bold text-brand">
                  {summary.records}
                </p>
                <p className="text-sm text-muted">Total records</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <Award className="size-5 text-accent" aria-hidden />
                <p className="mt-3 text-2xl font-bold text-brand">
                  {summary.olympiads}
                </p>
                <p className="text-sm text-muted">Olympiads on this page</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
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
            <p className="rounded-xl border border-border bg-white p-6 text-muted">
              No results for the selected filters
              {data.pagination.total === 0 && !olympiad && !grade && !student
                ? ". Results appear here after they are published for your school."
                : "."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
                <table className="w-full min-w-[720px] text-left text-sm print:min-w-0">
                  <thead className="bg-brand-stats text-white">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Rank</th>
                      <th className="px-3 py-3 font-semibold">Reg. No.</th>
                      <th className="min-w-[10rem] px-3 py-3 font-semibold">
                        Student
                      </th>
                      <th className="px-3 py-3 font-semibold">Grade</th>
                      <th className="px-3 py-3 font-semibold">Olympiad</th>
                      <th className="px-3 py-3 font-semibold">Marks</th>
                      <th className="px-3 py-3 font-semibold">%</th>
                      <th className="px-3 py-3 font-semibold">School Rank</th>
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
                        <td className="min-w-[10rem] px-3 py-3 font-medium text-brand">
                          {formatPersonName(row.studentName)}
                        </td>
                        <td className="px-3 py-3 text-muted">{row.grade}</td>
                        <td className="px-3 py-3 font-semibold text-brand">
                          {row.olympiad.code}
                        </td>
                        <td className="px-3 py-3 text-brand">
                          {row.marksObtained ?? "—"}/{row.totalMarks ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-muted">
                          {row.percentage != null
                            ? `${row.percentage}%`
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-center text-muted">
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
  );
}
