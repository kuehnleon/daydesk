-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark all existing users as onboarding completed
UPDATE "users" SET "onboardingCompleted" = true;
