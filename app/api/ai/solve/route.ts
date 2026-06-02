import { solveInputSchema } from "@/lib/types";
import { solve } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";

export async function POST(req: Request) {
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
