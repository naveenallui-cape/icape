-- Store school portal passwords in plaintext (admin can view with registration details).
ALTER TABLE "SchoolAccount" RENAME COLUMN "passwordHash" TO "password";
