-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentReviewStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "SchoolAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "schoolAccountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolRegistration" (
    "id" TEXT NOT NULL,
    "schoolAccountId" TEXT NOT NULL,
    "olympiadYearId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "schoolName" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "pincode" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "principalName" TEXT NOT NULL DEFAULT '',
    "rejectionNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationStudent" (
    "id" TEXT NOT NULL,
    "schoolRegistrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "imo" BOOLEAN NOT NULL DEFAULT false,
    "iso" BOOLEAN NOT NULL DEFAULT false,
    "ieo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationPayment" (
    "id" TEXT NOT NULL,
    "schoolRegistrationId" TEXT NOT NULL,
    "amountExpected" DECIMAL(10,2) NOT NULL,
    "utr" TEXT NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "proofPublicId" TEXT,
    "status" "PaymentReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolAccount_email_key" ON "SchoolAccount"("email");

-- CreateIndex
CREATE INDEX "SchoolAccount_email_idx" ON "SchoolAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_schoolAccountId_idx" ON "PasswordResetToken"("schoolAccountId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "SchoolRegistration_olympiadYearId_idx" ON "SchoolRegistration"("olympiadYearId");

-- CreateIndex
CREATE INDEX "SchoolRegistration_status_idx" ON "SchoolRegistration"("status");

-- CreateIndex
CREATE INDEX "SchoolRegistration_schoolAccountId_idx" ON "SchoolRegistration"("schoolAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRegistration_schoolAccountId_olympiadYearId_key" ON "SchoolRegistration"("schoolAccountId", "olympiadYearId");

-- CreateIndex
CREATE INDEX "RegistrationStudent_schoolRegistrationId_idx" ON "RegistrationStudent"("schoolRegistrationId");

-- CreateIndex
CREATE INDEX "RegistrationStudent_grade_idx" ON "RegistrationStudent"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationPayment_schoolRegistrationId_key" ON "RegistrationPayment"("schoolRegistrationId");

-- CreateIndex
CREATE INDEX "RegistrationPayment_status_idx" ON "RegistrationPayment"("status");

-- CreateIndex
CREATE INDEX "RegistrationPayment_reviewedByAdminId_idx" ON "RegistrationPayment"("reviewedByAdminId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_schoolAccountId_fkey" FOREIGN KEY ("schoolAccountId") REFERENCES "SchoolAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRegistration" ADD CONSTRAINT "SchoolRegistration_schoolAccountId_fkey" FOREIGN KEY ("schoolAccountId") REFERENCES "SchoolAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRegistration" ADD CONSTRAINT "SchoolRegistration_olympiadYearId_fkey" FOREIGN KEY ("olympiadYearId") REFERENCES "OlympiadYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationStudent" ADD CONSTRAINT "RegistrationStudent_schoolRegistrationId_fkey" FOREIGN KEY ("schoolRegistrationId") REFERENCES "SchoolRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationPayment" ADD CONSTRAINT "RegistrationPayment_schoolRegistrationId_fkey" FOREIGN KEY ("schoolRegistrationId") REFERENCES "SchoolRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationPayment" ADD CONSTRAINT "RegistrationPayment_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
