-- Denormalized counters + indexes for ~700k RegistrationStudent scale

ALTER TABLE "SchoolRegistration"
ADD COLUMN IF NOT EXISTS "studentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "imoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ieoCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "SchoolRegistration_olympiadYearId_status_idx"
ON "SchoolRegistration"("olympiadYearId", "status");

CREATE INDEX IF NOT EXISTS "RegistrationStudent_schoolRegistrationId_grade_idx"
ON "RegistrationStudent"("schoolRegistrationId", "grade");

CREATE INDEX IF NOT EXISTS "RegistrationStudent_schoolRegistrationId_name_idx"
ON "RegistrationStudent"("schoolRegistrationId", "name");

CREATE INDEX IF NOT EXISTS "RegistrationStudent_imo_idx"
ON "RegistrationStudent"("imo");

CREATE INDEX IF NOT EXISTS "RegistrationStudent_iso_idx"
ON "RegistrationStudent"("iso");

CREATE INDEX IF NOT EXISTS "RegistrationStudent_ieo_idx"
ON "RegistrationStudent"("ieo");

-- Backfill from existing named students
UPDATE "SchoolRegistration" AS sr
SET
  "studentCount" = agg.student_count,
  "imoCount" = agg.imo_count,
  "isoCount" = agg.iso_count,
  "ieoCount" = agg.ieo_count
FROM (
  SELECT
    "schoolRegistrationId",
    COUNT(*)::int AS student_count,
    COUNT(*) FILTER (WHERE imo)::int AS imo_count,
    COUNT(*) FILTER (WHERE iso)::int AS iso_count,
    COUNT(*) FILTER (WHERE ieo)::int AS ieo_count
  FROM "RegistrationStudent"
  WHERE BTRIM("name") <> ''
  GROUP BY "schoolRegistrationId"
) AS agg
WHERE sr.id = agg."schoolRegistrationId";
