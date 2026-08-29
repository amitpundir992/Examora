import { examRepo } from "@/lib/repository";
import { moveExamInputSchema } from "@/lib/types";
import { ok, fail, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const params = await context.params;
  const parsed = await parseBody(req, moveExamInputSchema);
  if ("res" in parsed) return parsed.res;

  const success = await examRepo.move(params.id, user.id, parsed.data.folderId);
  if (!success) return fail("Exam not found or move failed", 404);

  return ok({ success: true });
}
