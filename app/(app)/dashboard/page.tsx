import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { examRepo, attemptRepo } from "@/lib/repository";
import { providerName } from "@/lib/ai/service";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const exams = await examRepo.list();
  const attempts = await attemptRepo.list();
  const avg = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
    : 0;
  const provider = providerName();

  const stats = [
    { label: "Total Exams", value: exams.length },
    { label: "Total Attempts", value: attempts.length },
    { label: "Average Score", value: `${avg}%` },
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
    </div>
  );
}
