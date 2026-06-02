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
  description: z.string().default(""),
  source: z.enum(["pdf", "text", "ai"]),
  createdAt: z.string(),
  questions: z.array(questionSchema).min(1),
});

export type Question = z.infer<typeof questionSchema>;
export type Exam = z.infer<typeof examSchema>;

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
  timeSpentSec: z.number().int().min(0).default(0),
});
