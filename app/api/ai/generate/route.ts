import { generateInputSchema } from "@/lib/types";
import { generate } from "@/lib/ai/service";
import { examRepo } from "@/lib/repository";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  // Check authentication first
  const { error, user } = await requireAuth();
  if (error) return error;

  const limited = guard(req, "ai:generate", 10);
  if (limited) return limited;
  const parsed = await parseBody(req, generateInputSchema);
  if ("res" in parsed) return parsed.res;
  try {
    const generated = await generate(parsed.data);
    const exam = await examRepo.create({
      title: generated.title,
      description: `AI-generated • ${parsed.data.difficulty} • ${generated.questions.length} questions`,
      source: "ai",
      questions: generated.questions,
    });
    return ok(exam, 201);
  } catch (err) {
    console.error("AI generation error:", err);
    return fail(`AI generation failed. ${err instanceof Error ? err.message : 'Check your API key or try again.'}`, 502);
  }
}
