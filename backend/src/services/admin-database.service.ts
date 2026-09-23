import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { resultCache } from "../lib/cache";

/** Prisma client delegate keys (camelCase) for every schema model. */
const MODEL_DELEGATES = {
  Admin: "admin",
  ResultPublication: "resultPublication",
  Olympiad: "olympiad",
  School: "school",
  Student: "student",
  Result: "result",
  ResultUpload: "resultUpload",
  ResultUploadError: "resultUploadError",
  SchoolAccount: "schoolAccount",
  PasswordResetToken: "passwordResetToken",
  SchoolRegistration: "schoolRegistration",
  RegistrationStudent: "registrationStudent",
  RegistrationPayment: "registrationPayment",
  StudentExportJob: "studentExportJob",
  SequenceCounter: "sequenceCounter",
} as const;

type ModelName = keyof typeof MODEL_DELEGATES;

const REDACTED_FIELDS: Partial<Record<ModelName, string[]>> = {
  Admin: ["passwordHash"],
};

const MAX_LIMIT = 100;

type FieldMeta = {
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

function isModelName(value: string): value is ModelName {
  return Object.prototype.hasOwnProperty.call(MODEL_DELEGATES, value);
}

function getDmmfModel(name: ModelName) {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === name);
  if (!model) throw new AppError(`Unknown model: ${name}`, 404);
  return model;
}

function getDelegate(name: ModelName) {
  const key = MODEL_DELEGATES[name];
  const delegate = (prisma as unknown as Record<string, unknown>)[key] as {
    count: (args?: object) => Promise<number>;
    findMany: (args?: object) => Promise<unknown[]>;
    findUnique: (args: object) => Promise<unknown | null>;
    create: (args: object) => Promise<unknown>;
    update: (args: object) => Promise<unknown>;
    delete: (args: object) => Promise<unknown>;
  };
  if (!delegate) throw new AppError(`Model delegate missing: ${name}`, 500);
  return delegate;
}

function fieldMeta(modelName: ModelName): FieldMeta[] {
  const model = getDmmfModel(modelName);
  const redacted = new Set(REDACTED_FIELDS[modelName] || []);
  return model.fields
    .filter((f) => f.kind !== "object")
    .map((f) => ({
      name: f.name,
      kind: f.kind,
      type: f.type,
      isId: Boolean(f.isId),
      isRequired: f.isRequired,
      isUnique: Boolean(f.isUnique),
      isUpdatedAt: Boolean(f.isUpdatedAt),
      isList: Boolean(f.isList),
      hasDefaultValue: Boolean(f.hasDefaultValue),
      isReadOnly: redacted.has(f.name) || Boolean(f.isUpdatedAt),
    }));
}

function idFieldName(modelName: ModelName): string {
  const id = fieldMeta(modelName).find((f) => f.isId);
  if (!id) throw new AppError(`Model ${modelName} has no id field`, 500);
  return id.name;
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return value;
}

function redactRow(
  modelName: ModelName,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const redacted = REDACTED_FIELDS[modelName] || [];
  const out = { ...row };
  for (const key of redacted) {
    if (key in out && out[key] != null) {
      out[key] = "••••••••";
    }
  }
  return out;
}

function sanitizeWritePayload(
  modelName: ModelName,
  body: Record<string, unknown>,
  mode: "create" | "update",
): Record<string, unknown> {
  const fields = fieldMeta(modelName);
  const allowed = new Set(fields.map((f) => f.name));
  const redacted = new Set(REDACTED_FIELDS[modelName] || []);
  const idName = idFieldName(modelName);
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!allowed.has(key)) continue;
    if (redacted.has(key)) continue;
    if (mode === "update" && key === idName) continue;
    const meta = fields.find((f) => f.name === key);
    if (!meta || meta.isList) continue;
    if (meta.isUpdatedAt) continue;
    if (mode === "create" && meta.hasDefaultValue && (value === "" || value == null)) {
      continue;
    }
    if (value === "") {
      data[key] = meta.isRequired ? value : null;
      continue;
    }
    if (meta.type === "Int" || meta.type === "Float") {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        throw new AppError(`Invalid number for ${key}`, 400);
      }
      data[key] = meta.type === "Int" ? Math.trunc(n) : n;
      continue;
    }
    if (meta.type === "Boolean") {
      if (typeof value === "boolean") data[key] = value;
      else if (value === "true" || value === "1") data[key] = true;
      else if (value === "false" || value === "0") data[key] = false;
      else throw new AppError(`Invalid boolean for ${key}`, 400);
      continue;
    }
    if (meta.type === "DateTime") {
      const d = new Date(String(value));
      if (Number.isNaN(d.getTime())) {
        throw new AppError(`Invalid date for ${key}`, 400);
      }
      data[key] = d;
      continue;
    }
    if (meta.type === "Decimal") {
      data[key] = new Prisma.Decimal(String(value));
      continue;
    }
    if (meta.type === "Json") {
      if (typeof value === "string") {
        try {
          data[key] = JSON.parse(value);
        } catch {
          throw new AppError(`Invalid JSON for ${key}`, 400);
        }
      } else {
        data[key] = value;
      }
      continue;
    }
    data[key] = value;
  }

  return data;
}

function errorText(err: unknown): string {
  if (!err || typeof err !== "object") return String(err ?? "");
  const parts: string[] = [];
  const e = err as {
    message?: string;
    code?: string;
    meta?: unknown;
    cause?: unknown;
  };
  if (e.message) parts.push(e.message);
  if (e.code) parts.push(String(e.code));
  if (e.meta) parts.push(JSON.stringify(e.meta));
  if (e.cause) parts.push(errorText(e.cause));
  return parts.join(" ");
}

function isForeignKeyRestrictError(err: unknown): boolean {
  const text = errorText(err);
  return (
    /23001|23503|P2003|foreign key|RESTRICT|referenced from table|violates.*constraint/i.test(
      text,
    )
  );
}

function mapPrismaError(err: unknown): never {
  if (err instanceof AppError) throw err;

  if (isForeignKeyRestrictError(err)) {
    throw new AppError(
      "Cannot delete: related records still reference this row even after cascade cleanup.",
      409,
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      throw new AppError("Unique constraint failed — duplicate value", 409);
    }
    if (err.code === "P2003") {
      throw new AppError(
        "Foreign key constraint failed — related record missing or in use",
        409,
      );
    }
    if (err.code === "P2025") {
      throw new AppError("Record not found", 404);
    }
    throw new AppError(err.message || "Database error", 400);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    throw new AppError(err.message || "Invalid data for this model", 400);
  }

  if (err instanceof Error && err.message) {
    throw new AppError(err.message, 400);
  }

  throw new AppError("Database error", 500);
}

/**
 * Admin Database is supreme: wipe dependents first so FK Restrict never blocks
 * an intentional admin delete.
 */
async function wipeResultsSchoolsByCodes(
  tx: Prisma.TransactionClient,
  schoolCodes: string[],
) {
  const codes = [
    ...new Set(
      schoolCodes.map((c) => c.trim()).filter((c) => c.length > 0),
    ),
  ];
  if (!codes.length) return;

  const schools = await tx.school.findMany({
    where: { schoolCode: { in: codes } },
    select: { id: true },
  });
  const schoolIds = schools.map((s) => s.id);
  if (!schoolIds.length) return;

  await tx.result.deleteMany({ where: { schoolId: { in: schoolIds } } });
  await tx.student.deleteMany({ where: { schoolId: { in: schoolIds } } });
  await tx.school.deleteMany({ where: { id: { in: schoolIds } } });
}

async function wipeSchoolAccountFully(
  tx: Prisma.TransactionClient,
  accountId: string,
) {
  const regs = await tx.schoolRegistration.findMany({
    where: { schoolAccountId: accountId },
    select: { id: true, schoolCode: true },
  });
  const regIds = regs.map((r) => r.id);
  const schoolCodes = regs.map((r) => r.schoolCode);

  if (regIds.length) {
    await tx.registrationPayment.deleteMany({
      where: { schoolRegistrationId: { in: regIds } },
    });
    await tx.registrationStudent.deleteMany({
      where: { schoolRegistrationId: { in: regIds } },
    });
    await tx.schoolRegistration.deleteMany({
      where: { id: { in: regIds } },
    });
  }

  await wipeResultsSchoolsByCodes(tx, schoolCodes);

  await tx.passwordResetToken.deleteMany({
    where: { schoolAccountId: accountId },
  });
  await tx.schoolAccount.delete({ where: { id: accountId } });
}

async function forceDeleteRow(modelName: ModelName, id: string) {
  await prisma.$transaction(async (tx) => {
    switch (modelName) {
      case "School": {
        await tx.result.deleteMany({ where: { schoolId: id } });
        await tx.student.deleteMany({ where: { schoolId: id } });
        await tx.school.delete({ where: { id } });
        break;
      }
      case "Student": {
        await tx.result.deleteMany({ where: { studentId: id } });
        await tx.student.delete({ where: { id } });
        break;
      }
      case "Olympiad": {
        await tx.result.deleteMany({ where: { olympiadId: id } });
        const uploads = await tx.resultUpload.findMany({
          where: { olympiadId: id },
          select: { id: true },
        });
        const uploadIds = uploads.map((u) => u.id);
        if (uploadIds.length) {
          await tx.resultUploadError.deleteMany({
            where: { uploadId: { in: uploadIds } },
          });
          await tx.resultUpload.deleteMany({ where: { id: { in: uploadIds } } });
        }
        await tx.olympiad.delete({ where: { id } });
        break;
      }
      case "Admin": {
        const adminCount = await tx.admin.count();
        if (adminCount <= 1) {
          throw new AppError("Cannot delete the last admin account", 409);
        }
        const uploads = await tx.resultUpload.findMany({
          where: { uploadedById: id },
          select: { id: true },
        });
        const uploadIds = uploads.map((u) => u.id);
        if (uploadIds.length) {
          await tx.resultUploadError.deleteMany({
            where: { uploadId: { in: uploadIds } },
          });
          await tx.resultUpload.deleteMany({ where: { id: { in: uploadIds } } });
        }
        await tx.registrationPayment.updateMany({
          where: { reviewedByAdminId: id },
          data: { reviewedByAdminId: null },
        });
        await tx.studentExportJob.deleteMany({ where: { createdById: id } });
        await tx.admin.delete({ where: { id } });
        break;
      }
      case "ResultUpload": {
        await tx.resultUploadError.deleteMany({ where: { uploadId: id } });
        await tx.resultUpload.delete({ where: { id } });
        break;
      }
      case "SchoolAccount": {
        await wipeSchoolAccountFully(tx, id);
        break;
      }
      case "SchoolRegistration": {
        const reg = await tx.schoolRegistration.findUnique({
          where: { id },
          select: { schoolAccountId: true },
        });
        if (!reg) throw new AppError("Record not found", 404);
        // Wipe the whole school: login, all year registrations, results schools.
        await wipeSchoolAccountFully(tx, reg.schoolAccountId);
        break;
      }
      case "ResultPublication": {
        throw new AppError(
          "ResultPublication is a system row — edit published instead of deleting",
          409,
        );
      }
      default: {
        const key = MODEL_DELEGATES[modelName];
        const delegate = (
          tx as unknown as Record<
            string,
            { delete: (args: object) => Promise<unknown> }
          >
        )[key];
        await delegate.delete({ where: { id } });
        break;
      }
    }
  });
}

const RESULT_CACHE_MODELS = new Set<ModelName>([
  "School",
  "Student",
  "Result",
  "Olympiad",
  "ResultPublication",
  "SchoolRegistration",
  "SchoolAccount",
]);

function buildSearchWhere(
  modelName: ModelName,
  q: string | undefined,
): object | undefined {
  const term = q?.trim();
  if (!term) return undefined;
  const fields = fieldMeta(modelName).filter(
    (f) =>
      f.kind === "scalar" &&
      (f.type === "String" || f.name.toLowerCase().includes("id")),
  );
  if (!fields.length) return undefined;
  return {
    OR: fields.map((f) =>
      f.type === "String"
        ? { [f.name]: { contains: term, mode: "insensitive" } }
        : { [f.name]: { equals: term } },
    ),
  };
}

export const adminDatabaseService = {
  async listModels() {
    const names = Object.keys(MODEL_DELEGATES) as ModelName[];
    const models = await Promise.all(
      names.map(async (name) => {
        const delegate = getDelegate(name);
        let count = 0;
        try {
          count = await delegate.count();
        } catch {
          count = 0;
        }
        return {
          name,
          count,
          fields: fieldMeta(name),
        };
      }),
    );
    return { models };
  },

  async listRows(
    modelParam: string,
    input: {
      page?: number;
      limit?: number;
      q?: string;
      orderBy?: string;
      order?: "asc" | "desc";
    },
  ) {
    if (!isModelName(modelParam)) {
      throw new AppError(`Unknown model: ${modelParam}`, 404);
    }
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit || 50));
    const skip = (page - 1) * limit;
    const idName = idFieldName(modelParam);
    const orderField =
      input.orderBy &&
      fieldMeta(modelParam).some((f) => f.name === input.orderBy)
        ? input.orderBy
        : idName;
    const order = input.order === "asc" ? "asc" : "desc";
    const where = buildSearchWhere(modelParam, input.q);
    const delegate = getDelegate(modelParam);

    try {
      const [total, rows] = await Promise.all([
        delegate.count(where ? { where } : undefined),
        delegate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderField]: order },
        }),
      ]);

      return {
        model: modelParam,
        fields: fieldMeta(modelParam),
        rows: (rows as Record<string, unknown>[]).map((row) =>
          redactRow(modelParam, serializeValue(row) as Record<string, unknown>),
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    } catch (err) {
      mapPrismaError(err);
    }
  },

  async getRow(modelParam: string, id: string) {
    if (!isModelName(modelParam)) {
      throw new AppError(`Unknown model: ${modelParam}`, 404);
    }
    const idName = idFieldName(modelParam);
    const delegate = getDelegate(modelParam);
    try {
      const row = await delegate.findUnique({
        where: { [idName]: id },
      });
      if (!row) throw new AppError("Record not found", 404);
      return {
        model: modelParam,
        fields: fieldMeta(modelParam),
        row: redactRow(
          modelParam,
          serializeValue(row) as Record<string, unknown>,
        ),
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      mapPrismaError(err);
    }
  },

  async createRow(modelParam: string, body: Record<string, unknown>) {
    if (!isModelName(modelParam)) {
      throw new AppError(`Unknown model: ${modelParam}`, 404);
    }
    const data = sanitizeWritePayload(modelParam, body, "create");
    const delegate = getDelegate(modelParam);
    try {
      const row = await delegate.create({ data });
      return {
        model: modelParam,
        row: redactRow(
          modelParam,
          serializeValue(row) as Record<string, unknown>,
        ),
      };
    } catch (err) {
      mapPrismaError(err);
    }
  },

  async updateRow(
    modelParam: string,
    id: string,
    body: Record<string, unknown>,
  ) {
    if (!isModelName(modelParam)) {
      throw new AppError(`Unknown model: ${modelParam}`, 404);
    }
    const idName = idFieldName(modelParam);
    const data = sanitizeWritePayload(modelParam, body, "update");
    const delegate = getDelegate(modelParam);
    try {
      const row = await delegate.update({
        where: { [idName]: id },
        data,
      });
      return {
        model: modelParam,
        row: redactRow(
          modelParam,
          serializeValue(row) as Record<string, unknown>,
        ),
      };
    } catch (err) {
      mapPrismaError(err);
    }
  },

  async deleteRow(modelParam: string, id: string) {
    if (!isModelName(modelParam)) {
      throw new AppError(`Unknown model: ${modelParam}`, 404);
    }
    if (!id?.trim()) {
      throw new AppError("Record id is required", 400);
    }
    const idName = idFieldName(modelParam);
    const delegate = getDelegate(modelParam);
    try {
      const existing = await delegate.findUnique({
        where: { [idName]: id },
      });
      if (!existing) throw new AppError("Record not found", 404);

      // Supreme admin override: cascade dependents, ignore normal Restrict FKs.
      await forceDeleteRow(modelParam, id);

      const stillThere = await delegate.findUnique({
        where: { [idName]: id },
      });
      if (stillThere) {
        throw new AppError("Delete did not persist — record still exists", 500);
      }

      if (RESULT_CACHE_MODELS.has(modelParam)) {
        await resultCache.bumpVersion();
      }

      return {
        model: modelParam,
        id,
        deleted: true,
        cascaded: true,
      };
    } catch (err) {
      mapPrismaError(err);
    }
  },
};
