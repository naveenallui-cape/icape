"use client";

import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSearchField } from "@/components/admin/admin-search-field";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  createDbRow,
  deleteDbRow,
  fetchDbModels,
  fetchDbRows,
  updateDbRow,
  type DbFieldMeta,
} from "@/lib/admin-database";

const PAGE_SIZE = 50;

function cellDisplay(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function idOfRow(
  row: Record<string, unknown>,
  fields: DbFieldMeta[],
): string {
  const idField = fields.find((f) => f.isId)?.name || "id";
  return String(row[idField] ?? "");
}

function editableFields(fields: DbFieldMeta[], mode: "create" | "edit") {
  return fields.filter((f) => {
    if (f.isReadOnly) return false;
    if (mode === "edit" && f.isId) return false;
    if (mode === "create" && f.isId && f.hasDefaultValue) return false;
    return true;
  });
}

function RecordForm({
  fields,
  mode,
  initial,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  fields: DbFieldMeta[];
  mode: "create" | "edit";
  initial: Record<string, unknown>;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const formFields = editableFields(fields, mode);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const f of formFields) {
      const v = initial[f.name];
      if (v === null || v === undefined) next[f.name] = "";
      else if (typeof v === "object") next[f.name] = JSON.stringify(v);
      else next[f.name] = String(v);
    }
    return next;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-bold text-brand">
            {mode === "create" ? "Add record" : "Edit record"}
          </h2>
          <button
            type="button"
            className="rounded-md p-1 text-muted hover:bg-brand-soft hover:text-brand"
            onClick={onCancel}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto px-4 py-4">
          {formFields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-semibold text-brand">
                {f.name}
                {f.isRequired && !f.hasDefaultValue ? " *" : ""}
                <span className="ml-1 font-normal text-muted">({f.type})</span>
              </label>
              {f.type === "Boolean" ? (
                <select
                  className="flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-brand"
                  value={values[f.name] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : f.type === "Json" ? (
                <textarea
                  className="min-h-20 w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-xs text-brand"
                  value={values[f.name] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                  }
                />
              ) : (
                <Input
                  value={values[f.name] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={busy}
            onClick={() => {
              const payload: Record<string, unknown> = {};
              for (const f of formFields) {
                const raw = values[f.name];
                if (raw === undefined) continue;
                if (raw === "" && !f.isRequired) {
                  payload[f.name] = null;
                  continue;
                }
                if (f.type === "Boolean") {
                  if (raw === "") continue;
                  payload[f.name] = raw === "true";
                  continue;
                }
                payload[f.name] = raw;
              }
              onSubmit(payload);
            }}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDatabasePage() {
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [editor, setEditor] = useState<
    | { mode: "create" }
    | { mode: "edit"; row: Record<string, unknown> }
    | null
  >(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Record<
    string,
    unknown
  > | null>(null);

  const modelsQuery = useQuery({
    queryKey: ["admin-database", "models"],
    queryFn: fetchDbModels,
    staleTime: 0,
  });

  useEffect(() => {
    if (!selectedModel && modelsQuery.data?.length) {
      setSelectedModel(modelsQuery.data[0].name);
    }
  }, [modelsQuery.data, selectedModel]);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setEditor(null);
    setDeleteTarget(null);
  }, [selectedModel]);

  const rowsQuery = useQuery({
    queryKey: [
      "admin-database",
      "rows",
      selectedModel,
      page,
      debouncedSearch,
    ],
    queryFn: () =>
      fetchDbRows(selectedModel!, {
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
      }),
    enabled: Boolean(selectedModel),
    // Always treat list data as stale so post-delete refetches are trusted.
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const fields = rowsQuery.data?.fields || [];
  const rows = rowsQuery.data?.rows || [];
  const pagination = rowsQuery.data?.pagination;

  const selectedMeta = useMemo(
    () => modelsQuery.data?.find((m) => m.name === selectedModel) || null,
    [modelsQuery.data, selectedModel],
  );

  async function refreshAdminDatabase() {
    await queryClient.invalidateQueries({
      queryKey: ["admin-database"],
      refetchType: "active",
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!selectedModel) throw new Error("No model selected");
      // Drop in-flight list fetches so a slow GET cannot overwrite this write.
      await queryClient.cancelQueries({ queryKey: ["admin-database"] });
      if (editor?.mode === "edit") {
        const id = idOfRow(editor.row, fields);
        return updateDbRow(selectedModel, id, payload);
      }
      return createDbRow(selectedModel, payload);
    },
    onSuccess: async () => {
      setEditor(null);
      setFormError("");
      await refreshAdminDatabase();
    },
    onError: (err: Error) => {
      setFormError(err.message || "Save failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      if (!selectedModel) throw new Error("No model selected");
      const id = idOfRow(row, fields);
      if (!id) throw new Error("Missing record id");
      // Cancel in-flight GETs first — a late response can put the deleted
      // row back into the cache and make it look like the delete failed.
      await queryClient.cancelQueries({ queryKey: ["admin-database"] });
      return deleteDbRow(selectedModel, id);
    },
    onSuccess: async (_data, row) => {
      const deletedId = idOfRow(row, fields);
      const model = selectedModel;

      // Optimistically remove from every cached page for this model.
      queryClient.setQueriesData<Awaited<ReturnType<typeof fetchDbRows>>>(
        { queryKey: ["admin-database", "rows", model] },
        (prev) => {
          if (!prev) return prev;
          const nextRows = prev.rows.filter(
            (r) => idOfRow(r, prev.fields) !== deletedId,
          );
          if (nextRows.length === prev.rows.length) return prev;
          return {
            ...prev,
            rows: nextRows,
            pagination: {
              ...prev.pagination,
              total: Math.max(0, prev.pagination.total - 1),
              totalPages: Math.max(
                1,
                Math.ceil(
                  Math.max(0, prev.pagination.total - 1) / prev.pagination.limit,
                ),
              ),
            },
          };
        },
      );

      queryClient.setQueryData<Awaited<ReturnType<typeof fetchDbModels>>>(
        ["admin-database", "models"],
        (prev) => {
          if (!prev || !model) return prev;
          return prev.map((m) =>
            m.name === model
              ? { ...m, count: Math.max(0, m.count - 1) }
              : m,
          );
        },
      );

      setDeleteTarget(null);
      await refreshAdminDatabase();
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-brand">
          <Database className="size-5" aria-hidden />
          Database
        </h1>
        <p className="mt-1 text-sm text-muted">
          Supreme admin console — browse, edit, and force-delete any record
          (related rows cascade). Changes are permanent.
        </p>
      </div>

      <div className="flex min-h-[70vh] overflow-hidden rounded-2xl border border-border bg-white">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-border bg-brand-soft/30">
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Models
          </p>
          {modelsQuery.isLoading ? (
            <p className="px-3 py-2 text-sm text-muted">Loading…</p>
          ) : modelsQuery.isError ? (
            <p className="px-3 py-2 text-sm text-red-600">
              {(modelsQuery.error as Error).message}
            </p>
          ) : (
            <ul className="pb-2">
              {(modelsQuery.data || []).map((m) => (
                <li key={m.name}>
                  <button
                    type="button"
                    onClick={() => setSelectedModel(m.name)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium transition",
                      selectedModel === m.name
                        ? "bg-brand text-white"
                        : "text-brand hover:bg-brand-soft",
                    )}
                  >
                    <span className="truncate">{m.name}</span>
                    <span
                      className={cn(
                        "tabular-nums text-xs",
                        selectedModel === m.name
                          ? "text-white/80"
                          : "text-muted",
                      )}
                    >
                      {m.count.toLocaleString("en-IN")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand">
                {selectedModel || "Select a model"}
              </p>
              {selectedMeta ? (
                <p className="text-xs text-muted">
                  {selectedMeta.count.toLocaleString("en-IN")} records ·{" "}
                  {selectedMeta.fields.length} fields
                </p>
              ) : null}
            </div>
            <AdminSearchField
              value={search}
              onChange={setSearch}
              placeholder="Search…"
              className="w-full sm:w-56"
            />
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={!selectedModel}
              onClick={() => {
                setFormError("");
                setEditor({ mode: "create" });
              }}
            >
              <Plus className="size-4" aria-hidden />
              Add
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {rowsQuery.isLoading ? (
              <p className="p-4 text-sm text-muted">Loading rows…</p>
            ) : rowsQuery.isError ? (
              <p className="p-4 text-sm text-red-600">
                {(rowsQuery.error as Error).message}
              </p>
            ) : !selectedModel ? (
              <p className="p-4 text-sm text-muted">Select a model</p>
            ) : rows.length === 0 ? (
              <p className="p-4 text-sm text-muted">No rows</p>
            ) : (
              <table className="w-full min-w-max border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-brand text-white">
                  <tr>
                    <th className="px-2 py-2 font-semibold">Actions</th>
                    {fields.map((f) => (
                      <th
                        key={f.name}
                        className="whitespace-nowrap px-2 py-2 font-semibold"
                      >
                        {f.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const id = idOfRow(row, fields);
                    return (
                      <tr
                        key={id || idx}
                        className={cn(
                          "border-t border-border",
                          idx % 2 === 0 ? "bg-white" : "bg-brand-soft/20",
                        )}
                      >
                        <td className="whitespace-nowrap px-2 py-1.5">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => {
                                setFormError("");
                                setEditor({ mode: "edit", row });
                              }}
                            >
                              <Pencil className="size-3.5" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-red-700"
                              onClick={() => setDeleteTarget(row)}
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </Button>
                          </div>
                        </td>
                        {fields.map((f) => (
                          <td
                            key={f.name}
                            className="max-w-[16rem] truncate px-2 py-1.5 font-mono text-[11px] text-brand"
                            title={cellDisplay(row[f.name])}
                          >
                            {cellDisplay(row[f.name])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
              <p className="text-muted">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total.toLocaleString("en-IN")} rows
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {editor && selectedModel ? (
        <RecordForm
          fields={fields.length ? fields : selectedMeta?.fields || []}
          mode={editor.mode}
          initial={editor.mode === "edit" ? editor.row : {}}
          busy={saveMutation.isPending}
          error={formError}
          onCancel={() => {
            setEditor(null);
            setFormError("");
          }}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      ) : null}

      {deleteTarget && selectedModel ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-lg">
            <h2 className="text-base font-bold text-brand">
              Force delete record?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Admin Database is supreme. This permanently deletes{" "}
              <span className="font-mono font-semibold text-brand">
                {selectedModel}/{idOfRow(deleteTarget, fields)}
              </span>
              {selectedModel === "SchoolRegistration" ||
              selectedModel === "SchoolAccount"
                ? " and wipes that school completely (login, all registrations, students, payments, and matching results schools)."
                : " and any related child records."}{" "}
              This cannot be undone.
            </p>
            {deleteMutation.isError ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {(deleteMutation.error as Error).message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="accent"
                disabled={deleteMutation.isPending}
                className="bg-red-700 hover:bg-red-800"
                onClick={() => deleteMutation.mutate(deleteTarget)}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
