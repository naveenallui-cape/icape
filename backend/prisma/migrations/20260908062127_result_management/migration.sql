-- CreateEnum
CREATE TYPE "OlympiadCode" AS ENUM ('IMO', 'ISO', 'IEO');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('QUALIFIED', 'PASSED', 'PARTICIPATED', 'ABSENT');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OlympiadYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OlympiadYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Olympiad" (
    "id" TEXT NOT NULL,
    "code" "OlympiadCode" NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Olympiad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "olympiadYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "schoolId" TEXT NOT NULL,
    "olympiadYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "olympiadId" TEXT NOT NULL,
    "olympiadYearId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "marksObtained" DECIMAL(8,2) NOT NULL,
    "totalMarks" DECIMAL(8,2) NOT NULL,
    "percentage" DECIMAL(6,2) NOT NULL,
    "rank" INTEGER,
    "schoolRank" INTEGER,
    "status" "ResultStatus" NOT NULL DEFAULT 'PARTICIPATED',
    "certificateUrl" TEXT,
    "certificateNo" TEXT,
    "examDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultUpload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "olympiadId" TEXT NOT NULL,
    "olympiadYearId" TEXT NOT NULL,
    "grade" INTEGER,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "status" "UploadStatus" NOT NULL DEFAULT 'PROCESSING',
    "uploadedById" TEXT NOT NULL,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultUploadError" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "rawData" TEXT,

    CONSTRAINT "ResultUploadError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OlympiadYear_label_key" ON "OlympiadYear"("label");

-- CreateIndex
CREATE UNIQUE INDEX "OlympiadYear_code_key" ON "OlympiadYear"("code");

-- CreateIndex
CREATE INDEX "OlympiadYear_published_idx" ON "OlympiadYear"("published");

-- CreateIndex
CREATE INDEX "OlympiadYear_isActive_idx" ON "OlympiadYear"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Olympiad_code_key" ON "Olympiad"("code");

-- CreateIndex
CREATE INDEX "School_olympiadYearId_idx" ON "School"("olympiadYearId");

-- CreateIndex
CREATE INDEX "School_name_idx" ON "School"("name");

-- CreateIndex
CREATE INDEX "School_schoolCode_idx" ON "School"("schoolCode");

-- CreateIndex
CREATE INDEX "School_olympiadYearId_name_idx" ON "School"("olympiadYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolCode_olympiadYearId_key" ON "School"("schoolCode", "olympiadYearId");

-- CreateIndex
CREATE INDEX "Student_registrationNumber_idx" ON "Student"("registrationNumber");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- CreateIndex
CREATE INDEX "Student_grade_idx" ON "Student"("grade");

-- CreateIndex
CREATE INDEX "Student_olympiadYearId_idx" ON "Student"("olympiadYearId");

-- CreateIndex
CREATE INDEX "Student_olympiadYearId_grade_idx" ON "Student"("olympiadYearId", "grade");

-- CreateIndex
CREATE INDEX "Student_schoolId_grade_idx" ON "Student"("schoolId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "Student_registrationNumber_olympiadYearId_key" ON "Student"("registrationNumber", "olympiadYearId");

-- CreateIndex
CREATE INDEX "Result_studentId_idx" ON "Result"("studentId");

-- CreateIndex
CREATE INDEX "Result_olympiadId_idx" ON "Result"("olympiadId");

-- CreateIndex
CREATE INDEX "Result_olympiadYearId_idx" ON "Result"("olympiadYearId");

-- CreateIndex
CREATE INDEX "Result_schoolId_idx" ON "Result"("schoolId");

-- CreateIndex
CREATE INDEX "Result_grade_idx" ON "Result"("grade");

-- CreateIndex
CREATE INDEX "Result_status_idx" ON "Result"("status");

-- CreateIndex
CREATE INDEX "Result_studentId_olympiadYearId_idx" ON "Result"("studentId", "olympiadYearId");

-- CreateIndex
CREATE INDEX "Result_olympiadId_olympiadYearId_grade_idx" ON "Result"("olympiadId", "olympiadYearId", "grade");

-- CreateIndex
CREATE INDEX "Result_schoolId_olympiadId_grade_olympiadYearId_idx" ON "Result"("schoolId", "olympiadId", "grade", "olympiadYearId");

-- CreateIndex
CREATE INDEX "Result_schoolId_olympiadYearId_olympiadId_idx" ON "Result"("schoolId", "olympiadYearId", "olympiadId");

-- CreateIndex
CREATE INDEX "Result_olympiadYearId_schoolId_grade_idx" ON "Result"("olympiadYearId", "schoolId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_olympiadId_olympiadYearId_key" ON "Result"("studentId", "olympiadId", "olympiadYearId");

-- CreateIndex
CREATE INDEX "ResultUpload_olympiadYearId_idx" ON "ResultUpload"("olympiadYearId");

-- CreateIndex
CREATE INDEX "ResultUpload_olympiadId_idx" ON "ResultUpload"("olympiadId");

-- CreateIndex
CREATE INDEX "ResultUpload_status_idx" ON "ResultUpload"("status");

-- CreateIndex
CREATE INDEX "ResultUpload_uploadedById_idx" ON "ResultUpload"("uploadedById");

-- CreateIndex
CREATE INDEX "ResultUpload_createdAt_idx" ON "ResultUpload"("createdAt");

-- CreateIndex
CREATE INDEX "ResultUploadError_uploadId_idx" ON "ResultUploadError"("uploadId");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_olympiadYearId_fkey" FOREIGN KEY ("olympiadYearId") REFERENCES "OlympiadYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_olympiadYearId_fkey" FOREIGN KEY ("olympiadYearId") REFERENCES "OlympiadYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_olympiadId_fkey" FOREIGN KEY ("olympiadId") REFERENCES "Olympiad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_olympiadYearId_fkey" FOREIGN KEY ("olympiadYearId") REFERENCES "OlympiadYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultUpload" ADD CONSTRAINT "ResultUpload_olympiadId_fkey" FOREIGN KEY ("olympiadId") REFERENCES "Olympiad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultUpload" ADD CONSTRAINT "ResultUpload_olympiadYearId_fkey" FOREIGN KEY ("olympiadYearId") REFERENCES "OlympiadYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultUpload" ADD CONSTRAINT "ResultUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultUploadError" ADD CONSTRAINT "ResultUploadError_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ResultUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
