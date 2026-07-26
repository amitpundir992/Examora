import { attemptRepo, examRepo, gradeAttempt } from "@/lib/repository";
import { submitAttemptSchema } from "@/lib/types";
import { ok, fail, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

// POST /api/exams/:id/attempts — grade and store an attempt.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const exam = await examRepo.get(id, user.id);
  if (!exam) return fail("Exam not found", 404);

  const parsed = await parseBody(req, submitAttemptSchema);
  if ("res" in parsed) return parsed.res;

  const result = gradeAttempt(exam, parsed.data.answers, parsed.data.timeSpentSec);
  await attemptRepo.create(result, user.id);
  return ok(result, 201);
}
