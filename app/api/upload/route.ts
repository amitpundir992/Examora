import { UsageMetric } from "@prisma/client";
import { examRepo } from "@/lib/repository";
import { uploadInputSchema } from "@/lib/types";
import { parseMcqText } from "@/lib/parser";
import { extractPdfText } from "@/lib/pdf";
import { structureExam } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { uploadPdf } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { QuotaExceededError, withUsageResponse } from "@/lib/billing/usage";

export async function POST(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const limited = guard(req, "upload");
  if (limited) return limited;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file provided");

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    if (!account) return fail("User not found", 404);

    const maxBytes = PLAN_LIMITS[account.plan].maxFileBytes;
    if (file.size > maxBytes) {
      return fail(
        `File too large (max ${Math.round(maxBytes / 1024 / 1024)} MB for ${account.plan.toLowerCase()})`,
        413,
      );
    }

    try {
      return await withUsageResponse(user.id, UsageMetric.UPLOAD, async () => {
        const title = (form.get("title") as string)?.trim() || file.name.replace(/\.[^.]+$/, "");
        const bytes = new Uint8Array(await file.arrayBuffer());
        let pdfUrl: string | null = null;

        if (file.name.toLowerCase().endsWith(".pdf")) {
          try {
            pdfUrl = await uploadPdf(Buffer.from(bytes), file.name);
            if (!pdfUrl) return fail("PDF storage is not configured.", 500);
          } catch (storageError) {
            console.error("Supabase upload failed:", storageError);
            return fail("Failed to store PDF. Please try again.", 500);
          }
        }

        let text: string;
        try {
          text = file.name.toLowerCase().endsWith(".pdf")
            ? await extractPdfText(bytes)
            : new TextDecoder().decode(bytes);
        } catch (extractionError) {
          console.error("PDF extraction error:", extractionError);
          return fail("PDF extraction failed. Please check the file and try again.", 422);
        }

        if (text.trim().length < 20) {
          return fail("No extractable text found in PDF.", 422);
        }

        let questions = parseMcqText(text);
        if (questions.length < 10) {
          try {
            const structured = await structureExam(text, title);
            questions = structured.questions;
          } catch (structureError) {
            console.error("AI structuring failed:", structureError);
            if (questions.length === 0) {
              return fail("Could not recognize MCQ questions in this file.", 422);
            }
          }
        }

        if (questions.length === 0) return fail("No MCQ questions detected in PDF.", 422);

        const exam = await examRepo.create(
          {
            title,
            description: `Imported from PDF - ${questions.length} questions`,
            source: "pdf",
            questions,
          },
          user.id,
        );
        return ok({ ...exam, pdfUrl }, 201);
      });
    } catch (usageError) {
      if (usageError instanceof QuotaExceededError) return fail(usageError.message, 429);
      throw usageError;
    }
  }

  const parsed = await parseBody(req, uploadInputSchema);
  if ("res" in parsed) return parsed.res;

  const questions = parseMcqText(parsed.data.content);
  if (questions.length === 0) {
    return fail(
      "No questions detected. Use a numbered question followed by options (A) and an optional 'Answer: B' line.",
    );
  }

  try {
    return await withUsageResponse(user.id, UsageMetric.UPLOAD, async () => {
      const exam = await examRepo.create(
        {
          title: parsed.data.title,
          description: `Imported from ${parsed.data.source} - ${questions.length} questions`,
          source: parsed.data.source,
          questions,
        },
        user.id,
      );
      return ok(exam, 201);
    });
  } catch (usageError) {
    if (usageError instanceof QuotaExceededError) return fail(usageError.message, 429);
    throw usageError;
  }
}
