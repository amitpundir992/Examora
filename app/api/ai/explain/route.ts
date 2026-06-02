import { explainInputSchema } from "@/lib/types";
import { explain } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";

export async function POST(req: Request) {
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
