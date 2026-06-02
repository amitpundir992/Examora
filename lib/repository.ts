import { PrismaClient, Exam as PrismaExam, Question as PrismaQuestion } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { AnswerMap, AttemptResult, Exam } from "./types";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export const examRepo = {
  async list(): Promise<Exam[]> {
    const exams = await prisma.exam.findMany({
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return exams.map(formatExam);
  },

  async get(id: string): Promise<Exam | undefined> {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    return exam ? formatExam(exam) : undefined;
  },

  async create(data: Omit<Exam, "id" | "createdAt">): Promise<Exam> {
    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        source: data.source.toUpperCase() as "PDF" | "TEXT" | "AI",
        questions: {
          create: data.questions.map((q, i) => ({
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    return formatExam(exam);
  },

  async remove(id: string): Promise<boolean> {
    try {
      await prisma.exam.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};

export const attemptRepo = {
  async list() {
    return prisma.attempt.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async create(result: AttemptResult) {
    return prisma.attempt.create({
      data: {
        examId: result.examId,
        total: result.total,
        correct: result.correct,
        wrong: result.wrong,
        unanswered: result.unanswered,
        percentage: result.percentage,
        timeSpentSec: result.timeSpentSec,
        answers: {
          create: result.perQuestion.map((pq) => ({
            questionId: pq.questionId,
            selectedIndex: pq.selectedIndex,
            isCorrect: pq.isCorrect,
          })),
        },
      },
    });
  },
};

function formatExam(exam: PrismaExam & { questions: PrismaQuestion[] }): Exam {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    source: exam.source.toLowerCase() as "pdf" | "text" | "ai",
    createdAt: exam.createdAt.toISOString(),
    questions: exam.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options as string[],
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? undefined,
    })),
  };
}

/** Pure scoring function — also unit-testable in isolation. */
export function gradeAttempt(exam: Exam, answers: AnswerMap, timeSpentSec: number): AttemptResult {
  const perQuestion = exam.questions.map((q) => {
    const selectedIndex = q.id in answers ? answers[q.id] : null;
    return {
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect: selectedIndex === q.correctIndex,
    };
  });
  const correct = perQuestion.filter((p) => p.isCorrect).length;
  const answered = perQuestion.filter((p) => p.selectedIndex != null).length;
  const total = exam.questions.length;
  return {
    examId: exam.id,
    total,
    correct,
    wrong: answered - correct,
    unanswered: total - answered,
    percentage: total ? Math.round((correct / total) * 100) : 0,
    timeSpentSec,
    perQuestion,
  };
}
