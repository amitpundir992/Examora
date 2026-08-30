import { examRepo } from "@/lib/repository";
import { ok, fail, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const examUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const exam = await examRepo.get(id, user.id);
  return exam ? ok(exam) : fail("Exam not found", 404);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  
  const { id } = await ctx.params;
  const parsed = await parseBody(req, examUpdateSchema);
  if ("res" in parsed) return parsed.res;

  const success = await examRepo.updateTitle(id, user.id, parsed.data.title.trim());
  if (!success) return fail("Exam not found or update failed", 404);

  return ok({ success: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  const { id } = await ctx.params;
  return (await examRepo.remove(id, user.id)) ? ok({ deleted: true }) : fail("Exam not found", 404);
}
