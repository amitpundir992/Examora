import { examRepo } from "@/lib/repository";
import { ok, fail } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const exam = await examRepo.get(id, user.id);
  return exam ? ok(exam) : fail("Exam not found", 404);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  const { id } = await ctx.params;
  return (await examRepo.remove(id, user.id)) ? ok({ deleted: true }) : fail("Exam not found", 404);
}
