-- Drop active-year flag: product uses fixed Olympiad Year 2026-2027.
DROP INDEX IF EXISTS "OlympiadYear_isActive_idx";
ALTER TABLE "OlympiadYear" DROP COLUMN IF EXISTS "isActive";
