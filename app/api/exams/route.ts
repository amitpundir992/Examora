import { examRepo } from "@/lib/repository";
import { examSchema } from "@/lib/types";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helpers";
import { UsageMetric } from "@prisma/client";
import { QuotaExceededError, withUsage } from "@/lib/billing/usage";

export async function GET() {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  return ok(await examRepo.list(user.id));
}

const createSchema = examSchema
  .omit({ id: true, createdAt: true, topic: true })
  .extend({ topic: z.string().trim().min(1).max(200).optional() });

export async function POST(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const limited = guard(req, "exams:create");
  if (limited) return limited;
  const parsed = await parseBody(req, createSchema as unknown as z.ZodType<z.infer<typeof createSchema>>);
  if ("res" in parsed) return parsed.res;
  try {
    const exam = await withUsage(user.id, UsageMetric.UPLOAD, () => examRepo.create(parsed.data, user.id));
    return ok(exam, 201);
  } catch (error) {
    if (error instanceof QuotaExceededError) return fail(error.message, 429);
    return fail("Failed to create exam", 500);
  }
}
