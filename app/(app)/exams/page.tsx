import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { examRepo } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const exams = await examRepo.list();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exams</h1>
        <div className="flex gap-2">
          <Link href="/upload"><Button variant="secondary" size="sm">📄 Upload</Button></Link>
          <Link href="/ai-generator"><Button size="sm">✨ Generate</Button></Link>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {exams.map((e) => (
          <Card key={e.id} className="flex flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{e.title}</h2>
                <Badge>{e.source}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{e.questions.length} questions</span>
              <Link href={`/exams/${e.id}`}><Button size="sm">Start →</Button></Link>
            </div>
          </Card>
        ))}
        {exams.length === 0 && <p className="text-sm text-muted-foreground">No exams yet. Upload or generate one.</p>}
      </div>
    </div>
  );
}
