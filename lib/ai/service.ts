import type { ExplainInput, GenerateInput, Question, SolveInput } from "../types";
import { uid, letter } from "../utils";
import { parseMcqText } from "../parser";
import { explainPrompt, generatePrompt, solvePrompt, structurePrompt } from "./prompts";

export interface SolveResult {
  answerIndex: number;
  confidence: number;
  explanation: string;
}
export interface GeneratedExam {
  title: string;
  questions: Question[];
}

type Provider = "gemini" | "openai" | "mock";

function activeProvider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock";
}

// ---- Low-level text completion per provider ----

async function geminiComplete(prompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Gemini API error ${res.status}:`, errorText.substring(0, 500));
    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a minute and try again, or upgrade your API key for higher limits.");
    }
    throw new Error(`Gemini error ${res.status}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function openaiComplete(prompt: string): Promise<string> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function complete(prompt: string): Promise<string> {
  switch (activeProvider()) {
    case "gemini":
      return geminiComplete(prompt);
    case "openai":
      return openaiComplete(prompt);
    default:
      return "";
  }
}

/** Extract a JSON object from a model response that may be wrapped in prose/markdown. */
function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// ---- Public operations (with mock fallback so the app always works) ----

export async function explain(input: ExplainInput): Promise<string> {
  if (activeProvider() === "mock") {
    const correct = `${letter(input.correctIndex)}) ${input.options[input.correctIndex]}`;
    const others = input.options
      .map((o, i) => (i === input.correctIndex ? null : `- ${letter(i)}) ${o}: not the best fit for this question.`))
      .filter(Boolean)
      .join("\n");
    return `**Correct answer: ${correct}**\n\nThis option directly satisfies what the question asks.\n\nWhy the others are wrong:\n${others}\n\n_(Demo explanation — add GEMINI_API_KEY or OPENAI_API_KEY in .env for full AI reasoning.)_`;
  }
  return (await complete(explainPrompt(input))).trim();
}

export async function solve(input: SolveInput): Promise<SolveResult> {
  if (activeProvider() === "mock") {
    return {
      answerIndex: 0,
      confidence: 0.5,
      explanation: "Demo solver picked option A. Add an AI API key in .env for real solving.",
    };
  }
  const parsed = extractJson<SolveResult>(await complete(solvePrompt(input)));
  if (!parsed || typeof parsed.answerIndex !== "number") {
    return { answerIndex: 0, confidence: 0, explanation: "Could not parse AI response." };
  }
  return {
    answerIndex: Math.max(0, Math.min(parsed.answerIndex, input.options.length - 1)),
    confidence: Math.max(0, Math.min(parsed.confidence ?? 0, 1)),
    explanation: parsed.explanation ?? "",
  };
}

export async function generate(input: GenerateInput): Promise<GeneratedExam> {
  if (activeProvider() === "mock") {
    const questions: Question[] = Array.from({ length: input.count }, (_, i) => ({
      id: uid("q"),
      prompt: `[Demo] ${input.topic} — question ${i + 1} (${input.difficulty})?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: i % 4,
      explanation: "Demo question. Add an AI API key in .env to generate real questions.",
    }));
    return { title: `${input.topic} (${input.difficulty})`, questions };
  }

  const parsed = extractJson<{ title?: string; questions?: Array<Partial<Question>> }>(
    await complete(generatePrompt(input)),
  );
  const questions = mapQuestions(parsed?.questions);
  if (questions.length === 0) throw new Error("AI returned no usable questions.");
  return { title: parsed?.title?.trim() || `${input.topic} (${input.difficulty})`, questions };
}

/** Normalize loosely-typed AI question objects into valid Questions. */
function mapQuestions(raw: Array<Partial<Question>> | undefined): Question[] {
  return (raw ?? [])
    .filter((q): q is Question => Array.isArray(q.options) && q.options.length >= 2 && typeof q.prompt === "string")
    .map((q) => ({
      id: uid("q"),
      prompt: q.prompt,
      options: q.options,
      correctIndex: typeof q.correctIndex === "number" && q.correctIndex < q.options.length ? q.correctIndex : 0,
      explanation: q.explanation,
    }));
}

/**
 * Turn raw text extracted from a PDF into a structured exam.
 * With an AI key: AI parses messy text and fills in correct answers.
 * Without a key: falls back to the strict regex parser (needs A/B/C/D + Answer lines).
 */
export async function structureExam(rawText: string, fallbackTitle: string): Promise<GeneratedExam> {
  if (activeProvider() === "mock") {
    const questions = parseMcqText(rawText);
    if (questions.length === 0) {
      throw new Error(
        "No questions detected. Add GEMINI_API_KEY/OPENAI_API_KEY in .env for AI parsing of arbitrary PDFs, or use the 'numbered question + A) options + Answer:' format.",
      );
    }
    return { title: fallbackTitle, questions };
  }

  const parsed = extractJson<{ title?: string; questions?: Array<Partial<Question>> }>(
    await complete(structurePrompt(rawText)),
  );
  const questions = mapQuestions(parsed?.questions);
  if (questions.length === 0) throw new Error("AI could not extract questions from this PDF.");
  return { title: parsed?.title?.trim() || fallbackTitle, questions };
}

export function providerName(): Provider {
  return activeProvider();
}
