-- CreateTable
CREATE TABLE "ResultPublication" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultPublication_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ResultPublication" ("id", "published", "publishedAt", "updatedAt")
VALUES ('default', false, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
