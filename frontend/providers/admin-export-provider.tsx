"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Download } from "lucide-react";
import { apiRequest, getApiUrl } from "@/lib/api";

export type StudentExportJob = {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  format?: "pdf" | "xlsx";
  totalRows: number;
  processedRows: number;
  percent: number;
  fileName: string | null;
  errorMessage: string | null;
  downloadReady: boolean;
};

type StartExportInput = {
  q?: string;
  schoolCode?: string;
  olympiad?: string;
  grade?: number;
  format: "pdf" | "xlsx";
};

type AdminStudentExportContextValue = {
  job: StudentExportJob | null;
  starting: "pdf" | "xlsx" | null;
  error: string;
  isBusy: boolean;
  startExport: (input: StartExportInput) => Promise<void>;
  clearError: () => void;
  dismissJob: () => void;
};

const AUTO_DOWNLOAD_KEY = "icape-admin-export-autodownload";
const AdminStudentExportContext =
  createContext<AdminStudentExportContextValue | null>(null);

async function fetchAndSaveJobFile(job: StudentExportJob) {
  const kind = job.format === "xlsx" ? "Excel" : "PDF";
  const res = await fetch(
    `${getApiUrl()}/admin/school-registrations/students/export-jobs/${job.id}/download`,
    { credentials: "include" },
  );
  if (!res.ok) {
    let message = `Could not download ${kind} file`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    job.fileName ||
    (job.format === "xlsx" ? "i-cape-students.xlsx" : "i-cape-students.pdf");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function readAutoDownloadId() {
  try {
    return sessionStorage.getItem(AUTO_DOWNLOAD_KEY);
  } catch {
    return null;
  }
}

function writeAutoDownloadId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(AUTO_DOWNLOAD_KEY, id);
    else sessionStorage.removeItem(AUTO_DOWNLOAD_KEY);
  } catch {
    /* ignore */
  }
}

export function AdminStudentExportProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [job, setJob] = useState<StudentExportJob | null>(null);
  const [starting, setStarting] = useState<"pdf" | "xlsx" | null>(null);
  const [error, setError] = useState("");
  const downloadedIdsRef = useRef<Set<string>>(new Set());

  const clearError = useCallback(() => setError(""), []);
  const dismissJob = useCallback(() => {
    setJob(null);
    writeAutoDownloadId(null);
  }, []);

  // Resume in-progress background export after navigation / refresh
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await apiRequest<StudentExportJob | null>(
        "/admin/school-registrations/students/export-jobs/latest",
      );
      if (cancelled || !res.success || !res.data) return;
      if (
        res.data.status === "PENDING" ||
        res.data.status === "PROCESSING"
      ) {
        if (!readAutoDownloadId()) writeAutoDownloadId(res.data.id);
        setJob(res.data);
      } else if (
        res.data.status === "COMPLETED" &&
        readAutoDownloadId() === res.data.id
      ) {
        setJob(res.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll while job runs — survives leaving the Students page
  useEffect(() => {
    if (
      !job ||
      (job.status !== "PENDING" && job.status !== "PROCESSING")
    ) {
      return;
    }
    const timer = setInterval(() => {
      void (async () => {
        const res = await apiRequest<StudentExportJob>(
          `/admin/school-registrations/students/export-jobs/${job.id}`,
        );
        if (res.success && res.data) setJob(res.data);
      })();
    }, 2000);
    return () => clearInterval(timer);
  }, [job?.id, job?.status]);

  // Auto-download in browser when background job finishes
  useEffect(() => {
    if (!job || job.status !== "COMPLETED" || !job.downloadReady) return;
    if (readAutoDownloadId() !== job.id) return;
    if (downloadedIdsRef.current.has(job.id)) return;
    downloadedIdsRef.current.add(job.id);
    writeAutoDownloadId(null);
    void (async () => {
      try {
        await fetchAndSaveJobFile(job);
        setJob(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not download file",
        );
      }
    })();
  }, [job]);

  const startExport = useCallback(async (input: StartExportInput) => {
    setStarting(input.format);
    setError("");
    const res = await apiRequest<StudentExportJob>(
      "/admin/school-registrations/students/export-jobs",
      {
        method: "POST",
        body: {
          q: input.q || undefined,
          schoolCode: input.schoolCode || undefined,
          olympiad: input.olympiad || undefined,
          grade: input.grade,
          status: "APPROVED",
          format: input.format,
        },
      },
    );
    setStarting(null);
    if (!res.success || !res.data) {
      setError(res.message || "Could not start export");
      return;
    }
    writeAutoDownloadId(res.data.id);
    setJob(res.data);
  }, []);

  const isBusy =
    starting !== null ||
    job?.status === "PENDING" ||
    job?.status === "PROCESSING";

  const value = useMemo(
    () => ({
      job,
      starting,
      error,
      isBusy,
      startExport,
      clearError,
      dismissJob,
    }),
    [job, starting, error, isBusy, startExport, clearError, dismissJob],
  );

  const label = job?.format === "xlsx" ? "Excel" : "PDF";

  return (
    <AdminStudentExportContext.Provider value={value}>
      {children}
      {job &&
      (job.status === "PENDING" || job.status === "PROCESSING") ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(100%-2rem,22rem)] rounded-xl border border-border bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-brand-soft p-2 text-brand">
              <Download className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand">
                Preparing {label} in background…
              </p>
              <p className="mt-0.5 text-xs text-muted">
                You can keep using admin. The file will download when ready.
              </p>
              <p className="mt-2 text-xs font-medium text-brand">
                {job.totalRows > 0
                  ? `${job.processedRows.toLocaleString("en-IN")} / ${job.totalRows.toLocaleString("en-IN")} rows (${job.percent}%)`
                  : "Starting…"}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${Math.max(4, job.percent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {job?.status === "FAILED" || error ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(100%-2rem,22rem)] rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg">
          <p className="font-semibold">Export failed</p>
          <p className="mt-1">
            {job?.errorMessage || error || "Something went wrong"}
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold underline"
            onClick={() => {
              clearError();
              dismissJob();
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </AdminStudentExportContext.Provider>
  );
}

export function useAdminStudentExport() {
  const ctx = useContext(AdminStudentExportContext);
  if (!ctx) {
    throw new Error(
      "useAdminStudentExport must be used within AdminStudentExportProvider",
    );
  }
  return ctx;
}
