import { prisma } from "./prisma";
import { AppError } from "../middleware/error.middleware";
import { resultCache } from "./cache";

const PUBLICATION_ID = "default";

export type ResultPublicationState = {
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

async function ensureRow() {
  return prisma.resultPublication.upsert({
    where: { id: PUBLICATION_ID },
    create: { id: PUBLICATION_ID, published: false },
    update: {},
  });
}

export async function getResultPublication(): Promise<ResultPublicationState> {
  const row = await ensureRow();
  return {
    published: row.published,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Block public + school portal result access until admin releases. */
export async function assertResultsPublished() {
  const state = await getResultPublication();
  if (!state.published) {
    throw new AppError(
      "Results are not published yet. Please check back after i-CAPE releases them.",
      403,
    );
  }
}

export async function setResultsPublished(published: boolean) {
  const row = await prisma.resultPublication.upsert({
    where: { id: PUBLICATION_ID },
    create: {
      id: PUBLICATION_ID,
      published,
      publishedAt: published ? new Date() : null,
    },
    update: {
      published,
      publishedAt: published ? new Date() : null,
    },
  });
  await resultCache.bumpVersion();
  return {
    published: row.published,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  } satisfies ResultPublicationState;
}
