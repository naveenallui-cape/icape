"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  adminQueryKeys,
  ADMIN_LIST_REFETCH_MS,
  fetchAdminStudents,
} from "@/lib/admin-queries";
import { AdminTableShell, AdminTableSkeletonRows } from "@/components/admin/admin-table-shell";
import { AdminSearchField } from "@/components/admin/admin-search-field";
import { RESULT_GRADES, RESULT_OLYMPIADS } from "@/lib/results";
import { useAdminStudentExport } from "@/providers/admin-export-provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type StudentRow = {
  id: string;
  registrationNumber: string;
  name: string;
  grade: number;
  section: string;
  mobile: string;
  imo: boolean;
  iso: boolean;
  ieo: boolean;
  schoolCode: string;
  schoolName: string;
  city: string;
  state: string;
  status: string;
  registrationId: string;
};

const PAGE_SIZE = 50;

function OlympiadFlags({ row }: { row: StudentRow }) {
  const flags = [
    row.imo ? "IMO" : null,
    row.iso ? "ISO" : null,
    row.ieo ? "IEO" : null,
  ].filter(Boolean);
  if (flags.length === 0) {
    return <span className="text-muted">—</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {flags.map((code) => (
        <span
          key={code}
          className="rounded border border-border bg-brand-soft/50 px-1.5 py-0.5 text-[11px] font-semibold text-brand"
        >
          {code}
        </span>
      ))}
    </span>
  );
}

type AppliedFilters = {
  q: string;
  schoolCode: string;
  schoolName: string;
  olympiad: string;
  grade: string;
};

function buildStudentsHeading(applied: AppliedFilters) {
  const parts: string[] = [];

  if (applied.schoolName) {
    parts.push(applied.schoolName);
  } else if (applied.schoolCode) {
    parts.push(applied.schoolCode);
  }

  if (applied.olympiad) parts.push(applied.olympiad);
  if (applied.grade) parts.push(`Grade ${applied.grade}`);

  if (parts.length === 0) {
    return {
      title: "All Students",
      subtitle: applied.q
        ? `Showing matches for “${applied.q}”`
        : "Approved students for Olympiad Year 2026-2027",
    };
  }

  return {
    title: `${parts.join(" · ")} Students`,
    subtitle: applied.q
      ? `Showing matches for “${applied.q}”`
      : "Filtered approved students",
  };
}

export default function AdminStudentsPage() {
  const {
    job: exportJob,
    starting: startingExport,
    error: exportError,
    isBusy: exportBusy,
    startExport: queueExport,
    clearError: clearExportError,
  } = useAdminStudentExport();
  const [q, setQ] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [olympiad, setOlympiad] = useState("");
  const [grade, setGrade] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebouncedValue(q, 300);
  const appliedQ = debouncedQ.trim();

  useEffect(() => {
    setPage(1);
  }, [appliedQ, schoolCode, olympiad, grade]);

  const filters = {
    page,
    q: appliedQ,
    schoolCode,
    olympiad,
    grade,
  };

  const studentsQuery = useQuery({
    queryKey: adminQueryKeys.students(filters),
    queryFn: () =>
      fetchAdminStudents({
        page: filters.page,
        limit: PAGE_SIZE,
        q: filters.q,
        schoolCode: filters.schoolCode,
        olympiad: filters.olympiad,
        grade: filters.grade,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: ADMIN_LIST_REFETCH_MS,
  });

  const rows = (studentsQuery.data?.students || []) as StudentRow[];
  const schools = studentsQuery.data?.filters.schools || [];
  const totalPages = studentsQuery.data?.pagination.totalPages || 1;
  const showInitialLoading = studentsQuery.isPending && !studentsQuery.data;
  const error =
    exportError ||
    (studentsQuery.isError
      ? studentsQuery.error instanceof Error
        ? studentsQuery.error.message
        : "Failed to load students"
      : "");

  const applied = useMemo<AppliedFilters>(() => {
    const matchedSchool = schools.find((s) => s.schoolCode === schoolCode);
    return {
      q: appliedQ,
      schoolCode,
      schoolName: matchedSchool?.schoolName || "",
      olympiad,
      grade,
    };
  }, [appliedQ, schoolCode, olympiad, grade, schools]);

  async function startExport(format: "pdf" | "xlsx") {
    clearExportError();
    await queueExport({
      q: applied.q || undefined,
      schoolCode: applied.schoolCode || undefined,
      olympiad: applied.olympiad || undefined,
      grade: applied.grade ? Number(applied.grade) : undefined,
      format,
    });
  }

  const heading = useMemo(() => buildStudentsHeading(applied), [applied]);
  const loading = studentsQuery.isFetching;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand">{heading.title}</h1>
        <p className="text-muted">{heading.subtitle}</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AdminSearchField
          value={q}
          onChange={setQ}
          placeholder="Reg no / student / school"
          className="sm:col-span-2"
        />
        <select
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          className="h-9 rounded-md border border-border px-3 text-sm"
        >
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.schoolCode} value={s.schoolCode}>
              {s.schoolName} ({s.schoolCode})
            </option>
          ))}
        </select>
        <select
          value={olympiad}
          onChange={(e) => setOlympiad(e.target.value)}
          className="h-9 rounded-md border border-border px-3 text-sm"
        >
          <option value="">All olympiads</option>
          {RESULT_OLYMPIADS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="h-9 rounded-md border border-border px-3 text-sm"
        >
          <option value="">All grades</option>
          {RESULT_GRADES.map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="accent"
          size="sm"
          disabled={exportBusy}
          onClick={() => void startExport("pdf")}
        >
          <Download className="size-4" aria-hidden />
          {startingExport === "pdf" ||
          ((exportJob?.status === "PENDING" ||
            exportJob?.status === "PROCESSING") &&
            exportJob.format !== "xlsx")
            ? "Preparing PDF…"
            : "Download PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={exportBusy}
          onClick={() => void startExport("xlsx")}
        >
          <FileSpreadsheet className="size-4" aria-hidden />
          {startingExport === "xlsx" ||
          ((exportJob?.status === "PENDING" ||
            exportJob?.status === "PROCESSING") &&
            exportJob.format === "xlsx")
            ? "Preparing Excel…"
            : "Download Excel"}
        </Button>
      </div>

      {exportJob?.status === "FAILED" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {exportJob.errorMessage || "Export failed"}
        </div>
      ) : null}

      {error && exportJob?.status !== "FAILED" ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <AdminTableShell
        loading={showInitialLoading}
        className="overflow-x-auto rounded-xl border border-border bg-white"
      >
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-brand-stats text-white">
            <tr>
              <th className="px-3 py-3">School code</th>
              <th className="px-3 py-3">School name</th>
              <th className="px-3 py-3">Reg. No.</th>
              <th className="px-3 py-3">Student</th>
              <th className="px-3 py-3">Grade</th>
              <th className="px-3 py-3">Section</th>
              <th className="px-3 py-3">Olympiads</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-3 font-mono text-xs font-medium">
                  {row.schoolCode || "—"}
                </td>
                <td className="px-3 py-3 font-semibold text-brand">
                  {row.schoolName || "—"}
                </td>
                <td className="px-3 py-3 font-mono text-xs font-medium">
                  {row.registrationNumber}
                </td>
                <td className="px-3 py-3">{row.name}</td>
                <td className="px-3 py-3">{row.grade}</td>
                <td className="px-3 py-3">{row.section || "—"}</td>
                <td className="px-3 py-3">
                  <OlympiadFlags row={row} />
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                    Approved
                  </span>
                </td>
              </tr>
            ))}
            {!showInitialLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-muted">
                  No students found
                </td>
              </tr>
            ) : null}
            {showInitialLoading ? (
              <AdminTableSkeletonRows columns={8} rows={10} />
            ) : null}
          </tbody>
        </table>
      </AdminTableShell>

      <div className="flex items-center justify-end gap-2 text-sm text-muted">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </Button>
        <span>
          Page {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
