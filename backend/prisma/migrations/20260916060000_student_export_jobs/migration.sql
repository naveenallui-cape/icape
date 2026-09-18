-- CreateEnum
CREATE TYPE "StudentExportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "StudentExportJob" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "StudentExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "fileName" TEXT NOT NULL DEFAULT '',
    "filePath" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentExportJob_createdById_idx" ON "StudentExportJob"("createdById");

-- CreateIndex
CREATE INDEX "StudentExportJob_status_idx" ON "StudentExportJob"("status");

-- CreateIndex
CREATE INDEX "StudentExportJob_createdAt_idx" ON "StudentExportJob"("createdAt");

-- AddForeignKey
ALTER TABLE "StudentExportJob" ADD CONSTRAINT "StudentExportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
