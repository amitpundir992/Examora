import { z } from "zod";

export const questionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(8),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional(),
});

export const examSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  topic: z.string().min(1).max(200),
  description: z.string().default(""),
  source: z.enum(["pdf", "text", "ai"]),
  folderId: z.string().nullable().optional(),
  createdAt: z.string(),
  questions: z.array(questionSchema).min(1),
});

export type Question = z.infer<typeof questionSchema>;
export type Exam = z.infer<typeof examSchema>;
export type ExamCreateInput = Omit<Exam, "id" | "createdAt" | "topic"> & { topic?: string };

/** A user's selected option index per question id. */
export type AnswerMap = Record<string, number>;

export interface AttemptResult {
  examId: string;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percentage: number;
  timeSpentSec: number;
  perQuestion: {
    questionId: string;
    selectedIndex: number | null;
    correctIndex: number;
    isCorrect: boolean;
  }[];
}

export interface SubmittedAttemptResult extends AttemptResult {
  attemptId: string;
}

export interface AttemptSummary {
  id: string;
  examId: string;
  examTitle: string;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percentage: number;
  timeSpentSec: number;
  createdAt: string;
}

export interface AttemptReview extends AttemptSummary {
  questions: {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    selectedIndex: number | null;
    isCorrect: boolean;
  }[];
}

// ---- API input schemas ----

export const generateInputSchema = z.object({
  topic: z.string().min(2).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(50).default(10),
});
export type GenerateInput = z.infer<typeof generateInputSchema>;

export const uploadInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  source: z.enum(["pdf", "text"]).default("text"),
});
export type UploadInput = z.infer<typeof uploadInputSchema>;

export const explainInputSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
});
export type ExplainInput = z.infer<typeof explainInputSchema>;

export const solveInputSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2),
});
export type SolveInput = z.infer<typeof solveInputSchema>;

export const submitAttemptSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0)),
  timeSpentSec: z.number().int().min(0).max(86_400).default(0),
});

// ---- Folder types ----

export const folderSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Folder = z.infer<typeof folderSchema>;

export const folderCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
});

export type FolderCreateInput = z.infer<typeof folderCreateInputSchema>;

export const folderUpdateInputSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type FolderUpdateInput = z.infer<typeof folderUpdateInputSchema>;

export const moveExamInputSchema = z.object({
  folderId: z.string().nullable(),
});

export type MoveExamInput = z.infer<typeof moveExamInputSchema>;

export interface FolderWithExamCount extends Folder {
  examCount: number;
}
