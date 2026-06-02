import { examRepo } from "@/lib/repository";
import { examSchema } from "@/lib/types";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  return ok(await examRepo.list());
}

const createSchema = examSchema.omit({ id: true, createdAt: true });

export async function POST(req: Request) {
  const limited = guard(req, "exams:create");
  if (limited) return limited;
  const parsed = await parseBody(req, createSchema as unknown as z.ZodType<z.infer<typeof createSchema>>);
  if ("res" in parsed) return parsed.res;
  try {
    return ok(await examRepo.create(parsed.data), 201);
  } catch {
    return fail("Failed to create exam", 500);
  }
}
