import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, CircleMinus, Clock3, RotateCcw, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatAttemptDate, formatDuration } from "@/lib/attempt-format";
import { attemptRepo } from "@/lib/repository";
import { Badge, Card } from "@/components/ui";
import { cn, letter } from "@/lib/utils";
import { ExportPdfButton } from "@/components/export-pdf-button";

export const dynamic = "force-dynamic";

function scoreClass(percentage: number) {
  if (percentage >= 75) return "border-success text-success";
  if (percentage >= 50) return "border-warning text-warning";
  return "border-danger text-danger";
}

export default async function AttemptReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id } = await params;
  const attempt = await attemptRepo.getReview(id, session.user.id);
  if (!attempt) notFound();

  const stats = [
    { label: "Score", value: `${attempt.percentage}%`, className: scoreClass(attempt.percentage) },
    { label: "Correct", value: attempt.correct, className: "text-success" },
    { label: "Wrong", value: attempt.wrong, className: "text-danger" },
    { label: "Skipped", value: attempt.unanswered, className: "text-warning" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/attempts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Attempt history
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-2xl font-bold">{attempt.examTitle}</h1>
            <Badge>Attempt review</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <time dateTime={attempt.createdAt} className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatAttemptDate(attempt.createdAt)}
            </time>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {formatDuration(attempt.timeSpentSec)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ExportPdfButton attempt={attempt} />
          <Link
            href={`/exams/${attempt.examId}`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retake exam
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className={cn("mt-1 text-2xl font-bold", stat.className)}>{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <section aria-labelledby="answer-review-heading">
        <div className="mb-3">
          <h2 id="answer-review-heading" className="text-lg font-semibold">Answer breakdown</h2>
          <p className="text-sm text-muted-foreground">
            Your selected answer is shown alongside the correct answer.
          </p>
        </div>

        <div className="space-y-4">
          {attempt.questions.map((question, questionIndex) => {
            const skipped = question.selectedIndex == null;
            const StatusIcon = skipped ? CircleMinus : question.isCorrect ? CheckCircle2 : XCircle;
            const status = skipped ? "Skipped" : question.isCorrect ? "Correct" : "Wrong";
            const statusClass = skipped ? "text-warning" : question.isCorrect ? "text-success" : "text-danger";

            return (
              <Card key={question.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 font-medium">
                    {questionIndex + 1}. {question.prompt}
                  </h3>
                  <Badge className={cn("shrink-0", statusClass)}>
                    <StatusIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrectAnswer = optionIndex === question.correctIndex;
                    const isSelected = optionIndex === question.selectedIndex;
                    return (
                      <div
                        key={`${question.id}-${optionIndex}`}
                        className={cn(
                          "flex items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-sm",
                          isCorrectAnswer &&
                            "border-success bg-[color-mix(in_srgb,var(--success)_10%,transparent)]",
                          isSelected &&
                            !isCorrectAnswer &&
                            "border-danger bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]",
                        )}
                      >
                        <span className="min-w-0 break-words">
                          <span className="mr-2 font-medium">{letter(optionIndex)}.</span>
                          {option}
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs font-medium">
                          {isSelected ? (
                            <span className={isCorrectAnswer ? "text-success" : "text-danger"}>Your answer</span>
                          ) : null}
                          {isCorrectAnswer ? <span className="text-success">Correct answer</span> : null}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {question.explanation ? (
                  <div className="mt-3 rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Explanation: </span>
                    {question.explanation}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
