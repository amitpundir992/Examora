import { examRepo, folderRepo } from "@/lib/repository";
import { auth } from "@/lib/auth";
import { ExamsFileExplorer } from "@/components/exams-file-explorer";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  try {
    const [folders, exams] = await Promise.all([
      folderRepo.list(session.user.id),
      examRepo.list(session.user.id),
    ]);
    
    return <ExamsFileExplorer folders={folders} exams={exams} />;
  } catch (error) {
    console.error("Failed to load exams:", error);
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold">Exams</h1>
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load exams. Please refresh the page or try again later.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Database connection error"}
          </p>
        </div>
      </div>
    );
  }
}
