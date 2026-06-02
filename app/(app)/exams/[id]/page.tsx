import { notFound } from "next/navigation";
import { examRepo } from "@/lib/repository";
import { ExamEngine } from "@/components/exam/exam-engine";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await examRepo.get(id);
  if (!exam) notFound();
  return <ExamEngine exam={exam} />;
}
