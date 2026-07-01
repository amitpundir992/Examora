import { solveInputSchema } from "@/lib/types";
import { solve } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  // Check authentication first
  const { error, user } = await requireAuth();
  if (error) return error;

  const limited = guard(req, "ai:solve", 30);
  if (limited) return limited;
  const parsed = await parseBody(req, solveInputSchema);
  if ("res" in parsed) return parsed.res;
  try {
    return ok(await solve(parsed.data));
  } catch {
    return fail("AI solve failed. Check your API key or try again.", 502);
  }
}
