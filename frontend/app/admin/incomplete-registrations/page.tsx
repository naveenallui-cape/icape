"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  PlayCircle,
  Printer,
} from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  adminQueryKeys,
  ADMIN_LIST_REFETCH_MS,
  fetchAdminAccounts,
} from "@/lib/admin-queries";
import {
  AdminTableShell,
  AdminTableSkeletonRows,
} from "@/components/admin/admin-table-shell";
import { AdminSearchField } from "@/components/admin/admin-search-field";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getApiUrl } from "@/lib/api";

type IncompleteSchool = {
  id: string;
  email: string;
  name: string | null;
  schoolName: string;
  schoolCode: string;
  status: string | null;
  currentStep: number;
  studentCount: number;
  city: string;
  state: string;
  contactName?: string;
  phone?: string;
  olympiadYear: { label: string; code: string } | null;
  updatedAt: string;
};

const PAGE_SIZE = 20;

function statusLabel(status: string | null) {
  if (!status) return "Not started";
  return status.replaceAll("_", " ");
}

function stepLabel(status: string | null, currentStep: number) {
  if (!status) return "Account only";
  if (status === "REJECTED") return "Rejected — resubmit";
  if (currentStep <= 1) return "School details";
  if (currentStep === 2) return "Students";
  return "Payment";
}

export default function IncompleteRegistrationsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "print" | null>(null);
  const [exportError, setExportError] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const search = debouncedQ.trim();

  useEffect(() => {
    setPage(1);
  }, [search]);

  const incompleteQuery = useQuery({
    queryKey: adminQueryKeys.incomplete(page, search),
    queryFn: () =>
      fetchAdminAccounts({
        page,
        limit: PAGE_SIZE,
        q: search,
        incomplete: true,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: ADMIN_LIST_REFETCH_MS,
  });

  const rows = (incompleteQuery.data?.accounts || []) as IncompleteSchool[];
  const totalPages = incompleteQuery.data?.pagination.totalPages || 1;
  const total = incompleteQuery.data?.pagination.total || 0;
  const showInitialLoading = incompleteQuery.isPending && !incompleteQuery.data;
  const error = incompleteQuery.isError
    ? incompleteQuery.error instanceof Error
      ? incompleteQuery.error.message
      : "Failed to load incomplete registrations"
    : "";

  const showingFrom = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = total > 0 ? Math.min(page * PAGE_SIZE, total) : 0;

  async function openExport(format: "pdf" | "print") {
    setExporting(format);
    setExportError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const path =
        format === "pdf"
          ? `/admin/school-registrations/accounts/export.incomplete.pdf?${params}`
          : `/admin/school-registrations/accounts/export.incomplete.print?${params}`;
      const res = await fetch(`${getApiUrl()}${path}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setExportError(
          format === "print"
            ? "Could not open print view"
            : "Could not download PDF",
        );
        return;
      }
      if (format === "print") {
        const html = await res.text();
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          setExportError("Allow pop-ups to print");
          return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "i-cape-incomplete-registrations.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(
        format === "print"
          ? "Could not open print view"
          : "Could not download PDF",
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">
            Incomplete registrations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Draft, rejected, or not-started school accounts — for marketing
            follow-up to complete registration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(exporting) || showInitialLoading}
            onClick={() => void openExport("pdf")}
          >
            <Download className="size-4" aria-hidden />
            {exporting === "pdf" ? "Preparing…" : "Download PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(exporting) || showInitialLoading}
            onClick={() => void openExport("print")}
          >
            <Printer className="size-4" aria-hidden />
            {exporting === "print" ? "Preparing…" : "Print"}
          </Button>
          <Link href="/admin/schools/register">
            <Button variant="accent">Register school</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-3">
        <AdminSearchField
          value={q}
          onChange={setQ}
          placeholder="School, code, email…"
        />
      </div>

      {error || exportError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || exportError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <AdminTableShell
          loading={showInitialLoading}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-brand-stats text-white">
              <tr>
                <th className="px-3 py-2.5 font-semibold">School</th>
                <th className="px-3 py-2.5 font-semibold">Code</th>
                <th className="px-3 py-2.5 font-semibold">Login email</th>
                <th className="px-3 py-2.5 font-semibold">Contact</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Progress</th>
                <th className="px-3 py-2.5 font-semibold">Students</th>
                <th className="px-3 py-2.5 text-center font-semibold">
                  Continue
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-brand">
                      {row.schoolName || row.name || "Unnamed school"}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs font-bold text-brand">
                    {row.schoolCode || "—"}
                  </td>
                  <td className="px-3 py-3 text-muted">{row.email}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-brand">
                      {row.contactName || "—"}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {row.phone || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-full border border-border bg-brand-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-brand">
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {stepLabel(row.status, row.currentStep)}
                  </td>
                  <td className="px-3 py-3">{row.studentCount}</td>
                  <td className="px-3 py-3 text-center">
                    <Link
                      href={`/admin/schools/register?accountId=${encodeURIComponent(row.id)}`}
                    >
                      <Button type="button" size="sm" variant="accent">
                        <PlayCircle className="size-3.5" aria-hidden />
                        Continue
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!showInitialLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    No incomplete registrations.
                  </td>
                </tr>
              ) : null}
              {showInitialLoading ? (
                <AdminTableSkeletonRows columns={8} rows={8} />
              ) : null}
            </tbody>
          </table>
        </AdminTableShell>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-sm text-muted">
            Page {page} of {totalPages}
            {total > 0
              ? ` · ${showingFrom.toLocaleString("en-IN")}–${showingTo.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")}`
              : null}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || incompleteQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || incompleteQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
