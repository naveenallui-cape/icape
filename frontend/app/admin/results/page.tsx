"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { AdminSearchField } from "@/components/admin/admin-search-field";
import {
  CURRENT_OLYMPIAD_YEAR,
  RESULT_GRADES,
  RESULT_OLYMPIADS,
} from "@/lib/results";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type AdminResultRow = {
  id: string;
  registrationNumber: string;
  studentName: string;
  schoolCode: string;
  schoolName: string;
  olympiad: string;
  grade: number;
  marksObtained: number | null;
  totalMarks: number | null;
  percentage: number | null;
  rank: number | null;
  schoolRank: number | null;
  status: string;
};

export default function AdminResultsPage() {
  const [q, setQ] = useState("");
  const [olympiad, setOlympiad] = useState("");
  const [grade, setGrade] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminResultRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebouncedValue(q, 300);
  const appliedQ = debouncedQ.trim();

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [appliedQ, olympiad, grade]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        olympiadYear: CURRENT_OLYMPIAD_YEAR,
      });
      if (appliedQ) params.set("q", appliedQ);
      if (olympiad) params.set("olympiad", olympiad);
      if (grade) params.set("grade", grade);
      const res = await apiRequest<{
        results: AdminResultRow[];
        pagination: { totalPages: number; total: number; page: number };
      }>(`/results/admin/list?${params.toString()}`);
      if (cancelled) return;
      setLoading(false);
      if (!res.success || !res.data) {
        setError(res.message);
        setRows([]);
        return;
      }
      setRows(res.data.results);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, appliedQ, olympiad, grade, reloadToken]);

  async function onDelete(id: string) {
    if (!window.confirm("Delete this result record?")) return;
    const res = await apiRequest(`/results/admin/${id}`, { method: "DELETE" });
    if (!res.success) {
      setError(res.message);
      return;
    }
    setReloadToken((n) => n + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand">Results</h1>
        <p className="text-muted">Filter and manage olympiad result records.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminSearchField
          value={q}
          onChange={setQ}
          placeholder="Reg no / student name"
        />
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-brand-stats text-white">
            <tr>
              <th className="px-3 py-3">Reg. No.</th>
              <th className="px-3 py-3">Student</th>
              <th className="px-3 py-3">School</th>
              <th className="px-3 py-3">Olympiad</th>
              <th className="px-3 py-3">Grade</th>
              <th className="px-3 py-3">Marks</th>
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  No results found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-3 font-medium">
                    {row.registrationNumber}
                  </td>
                  <td className="px-3 py-3">{row.studentName}</td>
                  <td className="px-3 py-3">
                    {row.schoolCode}
                    <span className="block text-xs text-muted">
                      {row.schoolName}
                    </span>
                  </td>
                  <td className="px-3 py-3">{row.olympiad}</td>
                  <td className="px-3 py-3">{row.grade}</td>
                  <td className="px-3 py-3">
                    {row.marksObtained}/{row.totalMarks} ({row.percentage}%)
                  </td>
                  <td className="px-3 py-3">{row.rank ?? "—"}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => void onDelete(row.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {total} records · page {page}/{totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
