import { UsageMetric } from "@prisma/client";
import { generateInputSchema } from "@/lib/types";
import { generate } from "@/lib/ai/service";
import { examRepo } from "@/lib/repository";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";
import { QuotaExceededError, withUsage } from "@/lib/billing/usage";

export async function POST(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const limited = guard(req, "ai:generate", 10);
  if (limited) return limited;

  const parsed = await parseBody(req, generateInputSchema);
  if ("res" in parsed) return parsed.res;

  try {
    const exam = await withUsage(user.id, UsageMetric.AI_GENERATE, async () => {
      const generated = await generate(parsed.data);
      return examRepo.create(
        {
          title: generated.title,
          description: `AI-generated - ${parsed.data.difficulty} - ${generated.questions.length} questions`,
          source: "ai",
          questions: generated.questions,
        },
        user.id,
      );
    });
    return ok(exam, 201);
  } catch (error) {
    if (error instanceof QuotaExceededError) return fail(error.message, 429);
    console.error("AI generation error:", error);
    return fail(
      `AI generation failed. ${error instanceof Error ? error.message : "Check your API key or try again."}`,
      502,
    );
  }
}
