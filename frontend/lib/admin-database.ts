import { apiRequest } from "@/lib/api";

export type DbFieldMeta = {
  name: string;
  kind: string;
  type: string;
  isId: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isUpdatedAt: boolean;
  isList: boolean;
  hasDefaultValue: boolean;
  isReadOnly: boolean;
};

export type DbModelSummary = {
  name: string;
  count: number;
  fields: DbFieldMeta[];
};

export type DbRowsResponse = {
  model: string;
  fields: DbFieldMeta[];
  rows: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchDbModels() {
  const res = await apiRequest<{ models: DbModelSummary[] }>(
    "/admin/database/models",
  );
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load models");
  }
  return res.data.models;
}

export async function fetchDbRows(
  model: string,
  params: {
    page?: number;
    limit?: number;
    q?: string;
    orderBy?: string;
    order?: "asc" | "desc";
  },
) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  if (params.orderBy) search.set("orderBy", params.orderBy);
  if (params.order) search.set("order", params.order);
  const qs = search.toString();
  const res = await apiRequest<DbRowsResponse>(
    `/admin/database/${encodeURIComponent(model)}${qs ? `?${qs}` : ""}`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load rows");
  }
  return res.data;
}

export async function createDbRow(
  model: string,
  body: Record<string, unknown>,
) {
  const res = await apiRequest<{
    model: string;
    row: Record<string, unknown>;
  }>(`/admin/database/${encodeURIComponent(model)}`, {
    method: "POST",
    body,
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Create failed");
  }
  return res.data;
}

export async function updateDbRow(
  model: string,
  id: string,
  body: Record<string, unknown>,
) {
  const res = await apiRequest<{
    model: string;
    row: Record<string, unknown>;
  }>(`/admin/database/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Update failed");
  }
  return res.data;
}

export async function deleteDbRow(model: string, id: string) {
  const res = await apiRequest<{
    model: string;
    id: string;
    deleted: boolean;
  }>(`/admin/database/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.success) {
    throw new Error(res.message || "Delete failed");
  }
  return res.data;
}
