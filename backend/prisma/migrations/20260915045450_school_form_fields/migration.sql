-- AlterTable
ALTER TABLE "RegistrationStudent" ADD COLUMN     "mobile" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "section" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SchoolRegistration" ADD COLUMN     "affiliation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "affiliationOther" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "countryOther" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "district" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "gradeCounts" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "inchargeEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "landline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "principalEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "principalMobile" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "schoolCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "schoolMobile" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "stdCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "trustName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "website" TEXT NOT NULL DEFAULT '';
