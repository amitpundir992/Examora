import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { examRepo, folderRepo } from "@/lib/repository";
import { auth } from "@/lib/auth";
import { Folder as FolderIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  const [folders, exams] = await Promise.all([
    folderRepo.list(session.user.id),
    examRepo.list(session.user.id),
  ]);

  const rootExams = exams.filter((e) => !e.folderId);
  
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exams</h1>
          <p className="text-sm text-muted-foreground">
            {folders.length} folder{folders.length !== 1 ? "s" : ""} · {exams.length} exam{exams.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/upload"><Button variant="secondary" size="sm">📄 Upload</Button></Link>
          <Link href="/ai-generator"><Button size="sm">✨ Generate</Button></Link>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Folders</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {folders.map((folder) => (
              <Card key={folder.id} className="p-4">
                <div className="flex items-center gap-3">
                  <FolderIcon className="h-6 w-6" style={{ color: folder.color }} />
                  <div className="flex-1">
                    <h3 className="font-semibold">{folder.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {folder.examCount} exam{folder.examCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Root Exams */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          {folders.length > 0 ? "Exams (Unfiled)" : "All Exams"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {rootExams.map((e) => (
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
          {rootExams.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {folders.length > 0 ? "All exams are in folders." : "No exams yet. Upload or generate one."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
