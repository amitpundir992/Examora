import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { examRepo, attemptRepo } from "@/lib/repository";
import { providerName } from "@/lib/ai/service";
import { auth } from "@/lib/auth";
import { formatAttemptDate } from "@/lib/attempt-format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [exams, attemptSummary, recentAttempts] = await Promise.all([
    examRepo.list(session.user.id),
    attemptRepo.summary(session.user.id),
    attemptRepo.listRecent(session.user.id, 3),
  ]);
  const provider = providerName();

  const stats = [
    { label: "Total Exams", value: exams.length },
    { label: "Total Attempts", value: attemptSummary.total },
    { label: "Average Score", value: `${attemptSummary.averagePercentage}%` },
    { label: "AI Provider", value: provider === "mock" ? "Demo" : provider },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your exams and performance at a glance.</p>
        </div>
        <Link href="/ai-generator"><Button>✨ New AI Exam</Button></Link>
      </div>

      {provider === "mock" && (
        <Card className="border-warning p-4 text-sm">
          ⚠️ Running in <b>Demo AI mode</b>. Add <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code> to{" "}
          <code>.env</code> to enable real AI explanations, solving, and generation.
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold capitalize">{s.value}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Exams</h2>
        <div className="space-y-2">
          {exams.slice(0, 5).map((e) => (
            <Link key={e.id} href={`/exams/${e.id}`}>
              <Card className="flex items-center justify-between p-4 hover:border-primary">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.questions.length} questions</p>
                </div>
                <Badge>{e.source}</Badge>
              </Card>
            </Link>
          ))}
          {exams.length === 0 && <p className="text-sm text-muted-foreground">No exams yet.</p>}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent Attempts</h2>
          {recentAttempts.length > 0 ? (
            <Link href="/attempts" className="text-sm font-medium text-primary hover:underline">
              View history
            </Link>
          ) : null}
        </div>
        <div className="space-y-2">
          {recentAttempts.map((attempt) => (
            <Link key={attempt.id} href={`/attempts/${attempt.id}`}>
              <Card className="flex items-center justify-between gap-4 p-4 hover:border-primary">
                <div className="min-w-0">
                  <p className="truncate font-medium">{attempt.examTitle}</p>
                  <time dateTime={attempt.createdAt} className="text-xs text-muted-foreground">
                    {formatAttemptDate(attempt.createdAt)}
                  </time>
                </div>
                <Badge>{attempt.percentage}%</Badge>
              </Card>
            </Link>
          ))}
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete an exam to begin tracking your results.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
