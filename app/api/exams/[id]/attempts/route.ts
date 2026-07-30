import { attemptRepo, examRepo } from "@/lib/repository";
import { gradeAttempt } from "@/lib/grading";
import { submitAttemptSchema } from "@/lib/types";
import { ok, fail, guard, parseBody, requireSameOrigin } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

// POST /api/exams/:id/attempts — grade and store an attempt.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const limited = guard(req, "attempts:create", 30);
  if (limited) return limited;

  const { error, user } = await requireAuth();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const exam = await examRepo.get(id, user.id);
  if (!exam) return fail("Exam not found", 404);

  const parsed = await parseBody(req, submitAttemptSchema);
  if ("res" in parsed) return parsed.res;

  const questions = new Map(exam.questions.map((question) => [question.id, question]));
  const hasInvalidAnswer = Object.entries(parsed.data.answers).some(([questionId, selectedIndex]) => {
    const question = questions.get(questionId);
    return !question || selectedIndex >= question.options.length;
  });
  if (hasInvalidAnswer) return fail("Answers contain an invalid question or option", 400);

  const result = gradeAttempt(exam, parsed.data.answers, parsed.data.timeSpentSec);
  try {
    const savedAttempt = await attemptRepo.create(result, user.id);
    return ok({ ...result, attemptId: savedAttempt.id }, 201);
  } catch (error) {
    console.error("Attempt persistence failed", {
      examId: id,
      userId: user.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return fail("Unable to save this attempt. Please try again.", 500);
  }
}
