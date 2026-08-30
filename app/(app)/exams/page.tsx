import { examRepo, folderRepo } from "@/lib/repository";
import { auth } from "@/lib/auth";
import { ExamsFileExplorer } from "@/components/exams-file-explorer";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  let folders, exams;
  let error: Error | null = null;

  try {
    [folders, exams] = await Promise.all([
      folderRepo.list(session.user.id),
      examRepo.list(session.user.id),
    ]);
  } catch (err) {
    console.error("Failed to load exams:", err);
    error = err instanceof Error ? err : new Error("Database connection error");
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold">Exams</h1>
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load exams. Please refresh the page or try again later.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return <ExamsFileExplorer folders={folders!} exams={exams!} />;
}
