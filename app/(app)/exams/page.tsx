import { examRepo, folderRepo } from "@/lib/repository";
import { auth } from "@/lib/auth";
import { ExamsFileExplorer } from "@/components/exams-file-explorer";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  const [folders, exams] = await Promise.all([
    folderRepo.list(session.user.id),
    examRepo.list(session.user.id),
  ]);
  
  return <ExamsFileExplorer folders={folders} exams={exams} />;
}
