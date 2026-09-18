-- Speed up duplicate UTR / RRN lookups for pending + verified payments
CREATE INDEX IF NOT EXISTS "RegistrationPayment_utr_idx"
ON "RegistrationPayment"("utr");
