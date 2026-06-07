import { examRepo } from "@/lib/repository";
import { uploadInputSchema } from "@/lib/types";
import { parseMcqText } from "@/lib/parser";
import { extractPdfText } from "@/lib/pdf";
import { structureExam } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const limited = guard(req, "upload");
  if (limited) return limited;

  const contentType = req.headers.get("content-type") ?? "";

  // ---- PDF / file upload (multipart/form-data) ----
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file provided");
    if (file.size > MAX_BYTES) return fail("File too large (max 10 MB)", 413);

    const title = (form.get("title") as string)?.trim() || file.name.replace(/\.[^.]+$/, "");
    const bytes = new Uint8Array(await file.arrayBuffer());

    let text: string;
    try {
      text = file.name.toLowerCase().endsWith(".pdf") ? await extractPdfText(bytes) : new TextDecoder().decode(bytes);
    } catch (error) {
      console.error("PDF extraction error:", error);
      return fail(`PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`, 422);
    }
    
    if (text.trim().length < 20) {
      return fail("No extractable text found in PDF.", 422);
    }

    // Try regex parser first (fast, no AI cost)
    let questions = parseMcqText(text);
    
    // If regex parser found less than 10 questions or failed, use AI
    if (questions.length < 10) {
      console.log(`Regex parser found only ${questions.length} questions, falling back to AI...`);
      try {
        const structured = await structureExam(text, title);
        questions = structured.questions;
      } catch (err) {
        console.error("AI structuring failed:", err);
        // If AI also fails, return what regex found (or error if nothing)
        if (questions.length === 0) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          if (errorMsg.includes("503")) {
            return fail("AI service temporarily unavailable (Google 503). Please try again in 1-2 minutes, or use a standard MCQ format PDF.", 503);
          }
          return fail(`Could not parse PDF. Format not recognized by regex parser. AI error: ${errorMsg}`, 422);
        }
      }
    }

    if (questions.length === 0) {
      return fail("No MCQ questions detected in PDF.", 422);
    }

    const exam = await examRepo.create({
      title,
      description: `Imported from PDF • ${questions.length} questions`,
      source: "pdf",
      questions,
    });
    return ok(exam, 201);
  }

  // ---- Pasted text / .txt (application/json) ----
  const parsed = await parseBody(req, uploadInputSchema);
  if ("res" in parsed) return parsed.res;
  const questions = parseMcqText(parsed.data.content);
  if (questions.length === 0) {
    return fail(
      "No questions detected. Use a numbered question followed by options (A) ... and an optional 'Answer: B' line.",
    );
  }
  const exam = await examRepo.create({
    title: parsed.data.title,
    description: `Imported from ${parsed.data.source} • ${questions.length} questions`,
    source: parsed.data.source,
    questions,
  });
  return ok(exam, 201);
}
