-- Add a first-class topic for topic-level performance analytics.
ALTER TABLE "Exam" ADD COLUMN "topic" TEXT;

-- Existing titles are the most accurate topic label available for historical exams.
UPDATE "Exam"
SET "topic" = LEFT(COALESCE(NULLIF(BTRIM("title"), ''), 'General'), 200);

ALTER TABLE "Exam" ALTER COLUMN "topic" SET DEFAULT 'General';
ALTER TABLE "Exam" ALTER COLUMN "topic" SET NOT NULL;
