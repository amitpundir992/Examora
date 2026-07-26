import { notFound } from "next/navigation";
import { examRepo } from "@/lib/repository";
import { ExamEngine } from "@/components/exam/exam-engine";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { id } = await params;
  const exam = await examRepo.get(id, session.user.id);
  if (!exam) notFound();
  return <ExamEngine exam={exam} />;
}
