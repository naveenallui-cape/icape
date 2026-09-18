-- Sequence counters for 8-digit codes
CREATE TABLE IF NOT EXISTS "SequenceCounter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SequenceCounter_pkey" PRIMARY KEY ("id")
);

-- Backfill empty school codes with unique placeholders
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "SchoolRegistration"
  WHERE "schoolCode" IS NULL OR TRIM("schoolCode") = ''
)
UPDATE "SchoolRegistration" AS sr
SET "schoolCode" = '1' || LPAD(numbered.rn::text, 7, '0')
FROM numbered
WHERE sr.id = numbered.id;

-- Uniquify duplicate school codes within an olympiad year
WITH dups AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY "schoolCode", "olympiadYearId" ORDER BY "createdAt") AS rn
  FROM "SchoolRegistration"
)
UPDATE "SchoolRegistration" AS sr
SET "schoolCode" = LEFT(sr."schoolCode" || dups.rn::text, 40)
FROM dups
WHERE sr.id = dups.id AND dups.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "SchoolRegistration_schoolCode_olympiadYearId_key"
  ON "SchoolRegistration"("schoolCode", "olympiadYearId");

CREATE INDEX IF NOT EXISTS "SchoolRegistration_schoolCode_idx"
  ON "SchoolRegistration"("schoolCode");

-- Add student registration numbers
ALTER TABLE "RegistrationStudent" ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "RegistrationStudent"
  WHERE "registrationNumber" IS NULL OR TRIM("registrationNumber") = ''
)
UPDATE "RegistrationStudent" AS rs
SET "registrationNumber" = '2' || LPAD(numbered.rn::text, 7, '0')
FROM numbered
WHERE rs.id = numbered.id;

ALTER TABLE "RegistrationStudent" ALTER COLUMN "registrationNumber" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "RegistrationStudent_registrationNumber_key"
  ON "RegistrationStudent"("registrationNumber");

CREATE INDEX IF NOT EXISTS "RegistrationStudent_registrationNumber_idx"
  ON "RegistrationStudent"("registrationNumber");
