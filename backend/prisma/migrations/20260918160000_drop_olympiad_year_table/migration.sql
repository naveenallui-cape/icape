-- Drop OlympiadYear table; store year label strings on related rows.
-- Fresh DB: no data migration needed beyond copying labels where rows exist.

-- Drop FKs
ALTER TABLE "School" DROP CONSTRAINT IF EXISTS "School_olympiadYearId_fkey";
ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_olympiadYearId_fkey";
ALTER TABLE "Result" DROP CONSTRAINT IF EXISTS "Result_olympiadYearId_fkey";
ALTER TABLE "ResultUpload" DROP CONSTRAINT IF EXISTS "ResultUpload_olympiadYearId_fkey";
ALTER TABLE "SchoolRegistration" DROP CONSTRAINT IF EXISTS "SchoolRegistration_olympiadYearId_fkey";

-- School
DROP INDEX IF EXISTS "School_olympiadYearId_idx";
DROP INDEX IF EXISTS "School_olympiadYearId_name_idx";
DROP INDEX IF EXISTS "School_schoolCode_olympiadYearId_key";
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "olympiadYear" TEXT;
UPDATE "School" s
SET "olympiadYear" = COALESCE(
  (SELECT y."label" FROM "OlympiadYear" y WHERE y."id" = s."olympiadYearId"),
  '2026-2027'
)
WHERE "olympiadYear" IS NULL OR "olympiadYear" = '';
ALTER TABLE "School" ALTER COLUMN "olympiadYear" SET NOT NULL;
ALTER TABLE "School" DROP COLUMN IF EXISTS "olympiadYearId";
CREATE UNIQUE INDEX "School_schoolCode_olympiadYear_key" ON "School"("schoolCode", "olympiadYear");
CREATE INDEX "School_olympiadYear_idx" ON "School"("olympiadYear");
CREATE INDEX "School_olympiadYear_name_idx" ON "School"("olympiadYear", "name");

-- Student
DROP INDEX IF EXISTS "Student_olympiadYearId_idx";
DROP INDEX IF EXISTS "Student_olympiadYearId_grade_idx";
DROP INDEX IF EXISTS "Student_registrationNumber_olympiadYearId_key";
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "olympiadYear" TEXT;
UPDATE "Student" s
SET "olympiadYear" = COALESCE(
  (SELECT y."label" FROM "OlympiadYear" y WHERE y."id" = s."olympiadYearId"),
  '2026-2027'
)
WHERE "olympiadYear" IS NULL OR "olympiadYear" = '';
ALTER TABLE "Student" ALTER COLUMN "olympiadYear" SET NOT NULL;
ALTER TABLE "Student" DROP COLUMN IF EXISTS "olympiadYearId";
CREATE UNIQUE INDEX "Student_registrationNumber_olympiadYear_key" ON "Student"("registrationNumber", "olympiadYear");
CREATE INDEX "Student_olympiadYear_idx" ON "Student"("olympiadYear");
CREATE INDEX "Student_olympiadYear_grade_idx" ON "Student"("olympiadYear", "grade");

-- Result
DROP INDEX IF EXISTS "Result_olympiadYearId_idx";
DROP INDEX IF EXISTS "Result_studentId_olympiadYearId_idx";
DROP INDEX IF EXISTS "Result_olympiadId_olympiadYearId_grade_idx";
DROP INDEX IF EXISTS "Result_schoolId_olympiadId_grade_olympiadYearId_idx";
DROP INDEX IF EXISTS "Result_schoolId_olympiadYearId_olympiadId_idx";
DROP INDEX IF EXISTS "Result_olympiadYearId_schoolId_grade_idx";
DROP INDEX IF EXISTS "Result_studentId_olympiadId_olympiadYearId_key";
ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "olympiadYear" TEXT;
UPDATE "Result" r
SET "olympiadYear" = COALESCE(
  (SELECT y."label" FROM "OlympiadYear" y WHERE y."id" = r."olympiadYearId"),
  '2026-2027'
)
WHERE "olympiadYear" IS NULL OR "olympiadYear" = '';
ALTER TABLE "Result" ALTER COLUMN "olympiadYear" SET NOT NULL;
ALTER TABLE "Result" DROP COLUMN IF EXISTS "olympiadYearId";
CREATE UNIQUE INDEX "Result_studentId_olympiadId_olympiadYear_key" ON "Result"("studentId", "olympiadId", "olympiadYear");
CREATE INDEX "Result_olympiadYear_idx" ON "Result"("olympiadYear");
CREATE INDEX "Result_studentId_olympiadYear_idx" ON "Result"("studentId", "olympiadYear");
CREATE INDEX "Result_olympiadId_olympiadYear_grade_idx" ON "Result"("olympiadId", "olympiadYear", "grade");
CREATE INDEX "Result_schoolId_olympiadId_grade_olympiadYear_idx" ON "Result"("schoolId", "olympiadId", "grade", "olympiadYear");
CREATE INDEX "Result_schoolId_olympiadYear_olympiadId_idx" ON "Result"("schoolId", "olympiadYear", "olympiadId");
CREATE INDEX "Result_olympiadYear_schoolId_grade_idx" ON "Result"("olympiadYear", "schoolId", "grade");

-- ResultUpload
DROP INDEX IF EXISTS "ResultUpload_olympiadYearId_idx";
ALTER TABLE "ResultUpload" ADD COLUMN IF NOT EXISTS "olympiadYear" TEXT;
UPDATE "ResultUpload" u
SET "olympiadYear" = COALESCE(
  (SELECT y."label" FROM "OlympiadYear" y WHERE y."id" = u."olympiadYearId"),
  '2026-2027'
)
WHERE "olympiadYear" IS NULL OR "olympiadYear" = '';
ALTER TABLE "ResultUpload" ALTER COLUMN "olympiadYear" SET NOT NULL;
ALTER TABLE "ResultUpload" DROP COLUMN IF EXISTS "olympiadYearId";
CREATE INDEX "ResultUpload_olympiadYear_idx" ON "ResultUpload"("olympiadYear");

-- SchoolRegistration
DROP INDEX IF EXISTS "SchoolRegistration_olympiadYearId_idx";
DROP INDEX IF EXISTS "SchoolRegistration_olympiadYearId_status_idx";
DROP INDEX IF EXISTS "SchoolRegistration_schoolAccountId_olympiadYearId_key";
DROP INDEX IF EXISTS "SchoolRegistration_schoolCode_olympiadYearId_key";
ALTER TABLE "SchoolRegistration" ADD COLUMN IF NOT EXISTS "olympiadYear" TEXT;
UPDATE "SchoolRegistration" r
SET "olympiadYear" = COALESCE(
  (SELECT y."label" FROM "OlympiadYear" y WHERE y."id" = r."olympiadYearId"),
  '2026-2027'
)
WHERE "olympiadYear" IS NULL OR "olympiadYear" = '';
ALTER TABLE "SchoolRegistration" ALTER COLUMN "olympiadYear" SET NOT NULL;
ALTER TABLE "SchoolRegistration" DROP COLUMN IF EXISTS "olympiadYearId";
CREATE UNIQUE INDEX "SchoolRegistration_schoolAccountId_olympiadYear_key" ON "SchoolRegistration"("schoolAccountId", "olympiadYear");
CREATE UNIQUE INDEX "SchoolRegistration_schoolCode_olympiadYear_key" ON "SchoolRegistration"("schoolCode", "olympiadYear");
CREATE INDEX "SchoolRegistration_olympiadYear_idx" ON "SchoolRegistration"("olympiadYear");
CREATE INDEX "SchoolRegistration_olympiadYear_status_idx" ON "SchoolRegistration"("olympiadYear", "status");

-- Drop OlympiadYear table
DROP TABLE IF EXISTS "OlympiadYear";
