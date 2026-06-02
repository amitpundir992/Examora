import { attemptRepo, examRepo, gradeAttempt } from "@/lib/repository";
import { submitAttemptSchema } from "@/lib/types";
import { ok, fail, parseBody } from "@/lib/api";

// POST /api/exams/:id/attempts — grade and store an attempt.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const exam = await examRepo.get(id);
  if (!exam) return fail("Exam not found", 404);

  const parsed = await parseBody(req, submitAttemptSchema);
  if ("res" in parsed) return parsed.res;

  const result = gradeAttempt(exam, parsed.data.answers, parsed.data.timeSpentSec);
  await attemptRepo.create(result);
  return ok(result, 201);
}
