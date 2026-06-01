CREATE TABLE IF NOT EXISTS "AdminScheduledTask" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "taskType" TEXT NOT NULL,
  "frequency" TEXT NOT NULL DEFAULT 'daily',
  "timeOfDay" TEXT NOT NULL DEFAULT '02:00',
  "dayOfWeek" INTEGER,
  "dayOfMonth" INTEGER,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "deepMode" BOOLEAN NOT NULL DEFAULT false,
  "maxPages" INTEGER NOT NULL DEFAULT 12,
  "categoryId" INTEGER,
  "categoryIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "notes" TEXT,
  "lastRunAt" TIMESTAMP(3),
  "nextRunAt" TIMESTAMP(3),
  "lastRunStatus" TEXT,
  "lastRunMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdminScheduledTask_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdminScheduledTask"
ADD COLUMN IF NOT EXISTS "categoryIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

CREATE INDEX IF NOT EXISTS "AdminScheduledTask_taskType_enabled_idx" ON "AdminScheduledTask"("taskType", "enabled");
CREATE INDEX IF NOT EXISTS "AdminScheduledTask_nextRunAt_idx" ON "AdminScheduledTask"("nextRunAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AdminScheduledTask_categoryId_fkey'
  ) THEN
    ALTER TABLE "AdminScheduledTask"
    ADD CONSTRAINT "AdminScheduledTask_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
