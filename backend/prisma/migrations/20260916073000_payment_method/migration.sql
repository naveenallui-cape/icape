-- Payment method for registration payments (UPI / NEFT / RTGS / IMPS)

CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'NEFT', 'RTGS', 'IMPS');

ALTER TABLE "RegistrationPayment"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'UPI';
