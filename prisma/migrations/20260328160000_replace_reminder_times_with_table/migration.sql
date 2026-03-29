-- CreateTable
CREATE TABLE "reminder_times" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_times_pkey" PRIMARY KEY ("id")
);

-- Migrate data: split CSV reminderTimes into individual rows with default timezone
INSERT INTO "reminder_times" ("id", "userId", "time", "timezone", "createdAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    trim(t.time_val),
    'Europe/Berlin',
    NOW()
FROM "users" u,
     unnest(string_to_array(u."reminderTimes", ',')) AS t(time_val)
WHERE u."reminderTimes" IS NOT NULL
  AND u."reminderTimes" != '';

-- DropColumn
ALTER TABLE "users" DROP COLUMN "reminderTimes";

-- CreateIndex
CREATE INDEX "reminder_times_userId_idx" ON "reminder_times"("userId");

-- CreateUnique
CREATE UNIQUE INDEX "reminder_times_userId_time_timezone_key" ON "reminder_times"("userId", "time", "timezone");

-- AddForeignKey
ALTER TABLE "reminder_times" ADD CONSTRAINT "reminder_times_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
