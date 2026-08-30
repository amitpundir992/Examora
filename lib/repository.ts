import { Exam as PrismaExam, Question as PrismaQuestion, Folder as PrismaFolder } from "@prisma/client";
import type { AttemptResult, AttemptReview, AttemptSummary, Exam, ExamCreateInput, Folder, FolderWithExamCount, FolderCreateInput, FolderUpdateInput } from "./types";
import { prisma } from "./prisma";

export const examRepo = {
  async list(userId: string, folderId?: string | null): Promise<Exam[]> {
    const where = folderId === undefined 
      ? { ownerId: userId }
      : { ownerId: userId, folderId: folderId };
    
    const exams = await prisma.exam.findMany({
      where,
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return exams.map(formatExam);
  },

  async get(id: string, userId: string): Promise<Exam | undefined> {
    const exam = await prisma.exam.findUnique({
      where: { id, ownerId: userId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    return exam ? formatExam(exam) : undefined;
  },

  async create(data: ExamCreateInput, userId: string): Promise<Exam> {
    const topic = (data.topic?.trim() || data.title.trim() || "General").slice(0, 200);
    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        topic,
        description: data.description,
        source: data.source.toUpperCase() as "PDF" | "TEXT" | "AI",
        ownerId: userId,
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

  async move(id: string, userId: string, folderId: string | null): Promise<boolean> {
    try {
      const result = await prisma.exam.updateMany({
        where: { id, ownerId: userId },
        data: { folderId },
      });
      return result.count === 1;
    } catch {
      return false;
    }
  },

  async updateTitle(id: string, userId: string, title: string): Promise<boolean> {
    try {
      const result = await prisma.exam.updateMany({
        where: { id, ownerId: userId },
        data: { title },
      });
      return result.count === 1;
    } catch {
      return false;
    }
  },

  async remove(id: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.exam.deleteMany({ where: { id, ownerId: userId } });
      return result.count === 1;
    } catch {
      return false;
    }
  },
};

export const attemptRepo = {
  async listPage(userId: string, page: number, pageSize = 10) {
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.min(50, Math.max(1, Math.floor(pageSize)));
    const where = { userId };
    const total = await prisma.attempt.count({ where });
    const attempts =
      total === 0
        ? []
        : await prisma.attempt.findMany({
            where,
            select: {
              id: true,
              examId: true,
              total: true,
              correct: true,
              wrong: true,
              unanswered: true,
              percentage: true,
              timeSpentSec: true,
              createdAt: true,
              exam: { select: { title: true } },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (safePage - 1) * safePageSize,
            take: safePageSize,
          });

    return {
      attempts: attempts.map(formatAttemptSummary),
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  },

  async getReview(id: string, userId: string): Promise<AttemptReview | undefined> {
    const attempt = await prisma.attempt.findFirst({
      where: { id, userId },
      select: {
        id: true,
        examId: true,
        total: true,
        correct: true,
        wrong: true,
        unanswered: true,
        percentage: true,
        timeSpentSec: true,
        createdAt: true,
        answers: {
          select: {
            questionId: true,
            selectedIndex: true,
            isCorrect: true,
          },
        },
        exam: {
          select: {
            title: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                prompt: true,
                options: true,
                correctIndex: true,
                explanation: true,
              },
            },
          },
        },
      },
    });
    if (!attempt) return undefined;

    const answers = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
    return {
      id: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.exam.title,
      total: attempt.total,
      correct: attempt.correct,
      wrong: attempt.wrong,
      unanswered: attempt.unanswered,
      percentage: attempt.percentage,
      timeSpentSec: attempt.timeSpentSec,
      createdAt: attempt.createdAt.toISOString(),
      questions: attempt.exam.questions.map((question) => {
        const answer = answers.get(question.id);
        return {
          id: question.id,
          prompt: question.prompt,
          options: question.options as string[],
          correctIndex: question.correctIndex,
          explanation: question.explanation ?? undefined,
          selectedIndex: answer?.selectedIndex ?? null,
          isCorrect: answer?.isCorrect ?? false,
        };
      }),
    };
  },

  async create(result: AttemptResult, userId: string) {
    return prisma.attempt.create({
      data: {
        examId: result.examId,
        userId,
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
      select: { id: true },
    });
  },
};

function formatAttemptSummary(attempt: {
  id: string;
  examId: string;
  exam: { title: string };
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percentage: number;
  timeSpentSec: number;
  createdAt: Date;
}): AttemptSummary {
  return {
    id: attempt.id,
    examId: attempt.examId,
    examTitle: attempt.exam.title,
    total: attempt.total,
    correct: attempt.correct,
    wrong: attempt.wrong,
    unanswered: attempt.unanswered,
    percentage: attempt.percentage,
    timeSpentSec: attempt.timeSpentSec,
    createdAt: attempt.createdAt.toISOString(),
  };
}

function formatExam(exam: PrismaExam & { questions: PrismaQuestion[] }): Exam {
  return {
    id: exam.id,
    title: exam.title,
    topic: exam.topic,
    description: exam.description,
    source: exam.source.toLowerCase() as "pdf" | "text" | "ai",
    folderId: exam.folderId,
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

// ---- Folder repository ----

function formatFolder(folder: PrismaFolder & { _count?: { exams: number } }): FolderWithExamCount {
  return {
    id: folder.id,
    name: folder.name,
    color: folder.color,
    ownerId: folder.ownerId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    examCount: folder._count?.exams ?? 0,
  };
}

export const folderRepo = {
  async list(userId: string): Promise<FolderWithExamCount[]> {
    const folders = await prisma.folder.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { exams: true } } },
      orderBy: { createdAt: "asc" },
    });
    return folders.map(formatFolder);
  },

  async get(id: string, userId: string): Promise<FolderWithExamCount | undefined> {
    const folder = await prisma.folder.findUnique({
      where: { id, ownerId: userId },
      include: { _count: { select: { exams: true } } },
    });
    return folder ? formatFolder(folder) : undefined;
  },

  async create(data: FolderCreateInput, userId: string): Promise<Folder> {
    const count = await prisma.folder.count({ where: { ownerId: userId } });
    const name = data.name?.trim() || `Folder${String(count + 1).padStart(2, "0")}`;
    const folder = await prisma.folder.create({
      data: {
        name,
        color: data.color,
        ownerId: userId,
      },
    });
    return {
      id: folder.id,
      name: folder.name,
      color: folder.color,
      ownerId: folder.ownerId,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  },

  async update(id: string, userId: string, data: FolderUpdateInput): Promise<boolean> {
    try {
      await prisma.folder.updateMany({
        where: { id, ownerId: userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.color && { color: data.color }),
        },
      });
      return true;
    } catch {
      return false;
    }
  },

  async remove(id: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.folder.deleteMany({
        where: { id, ownerId: userId },
      });
      return result.count === 1;
    } catch {
      return false;
    }
  },
};
