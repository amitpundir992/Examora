import { explainInputSchema } from "@/lib/types";
import { explain } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  // Check authentication first
  const { error, user } = await requireAuth();
  if (error) return error;

  const limited = guard(req, "ai:explain", 30);
  if (limited) return limited;
  const parsed = await parseBody(req, explainInputSchema);
  if ("res" in parsed) return parsed.res;
  try {
    return ok({ explanation: await explain(parsed.data) });
  } catch {
    return fail("AI explanation failed. Check your API key or try again.", 502);
  }
}
