import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, History, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatAttemptDate, formatDuration } from "@/lib/attempt-format";
import { attemptRepo } from "@/lib/repository";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

function pageNumber(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function scoreClass(percentage: number) {
  if (percentage >= 75) return "border-success text-success";
  if (percentage >= 50) return "border-warning text-warning";
  return "border-danger text-danger";
}

export default async function AttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const requestedPage = pageNumber((await searchParams).page);
  const history = await attemptRepo.listPage(session.user.id, requestedPage);
  if (history.total > 0 && requestedPage > history.totalPages) {
    redirect(`/attempts?page=${history.totalPages}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attempt History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review previous results, inspect every answer, or retake an exam.
        </p>
      </div>

      {history.attempts.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          {history.attempts.map((attempt) => (
            <article key={attempt.id} className="border-b p-4 last:border-b-0 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-semibold">{attempt.examTitle}</h2>
                    <Badge className={scoreClass(attempt.percentage)}>{attempt.percentage}%</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <time dateTime={attempt.createdAt} className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatAttemptDate(attempt.createdAt)}
                    </time>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDuration(attempt.timeSpentSec)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/attempts/${attempt.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Review
                  </Link>
                  <Link
                    href={`/exams/${attempt.examId}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-muted px-3 text-sm font-medium transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retake
                  </Link>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-md bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Score</dt>
                  <dd className="mt-0.5 font-semibold">
                    {attempt.correct}/{attempt.total}
                  </dd>
                </div>
                <div className="rounded-md bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Correct</dt>
                  <dd className="mt-0.5 font-semibold text-success">{attempt.correct}</dd>
                </div>
                <div className="rounded-md bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Wrong</dt>
                  <dd className="mt-0.5 font-semibold text-danger">{attempt.wrong}</dd>
                </div>
                <div className="rounded-md bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Skipped</dt>
                  <dd className="mt-0.5 font-semibold text-warning">{attempt.unanswered}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center">
          <History className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">No attempts yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Complete an exam and its score and answer review will appear here.
          </p>
          <Link
            href="/exams"
            className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Browse exams
          </Link>
        </div>
      )}

      {history.totalPages > 1 ? (
        <nav aria-label="Attempt history pagination" className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {history.page} of {history.totalPages}
          </p>
          <div className="flex gap-2">
            {history.page > 1 ? (
              <Link
                href={`/attempts?page=${history.page - 1}`}
                className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Link>
            ) : null}
            {history.page < history.totalPages ? (
              <Link
                href={`/attempts?page=${history.page + 1}`}
                className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium hover:bg-muted"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
