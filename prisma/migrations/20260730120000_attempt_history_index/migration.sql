-- Replace the user-only index with one that also serves paginated attempt history.
DROP INDEX "Attempt_userId_idx";

CREATE INDEX "Attempt_userId_createdAt_idx" ON "Attempt"("userId", "createdAt" DESC);
