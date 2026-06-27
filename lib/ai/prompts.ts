import type { ExplainInput, GenerateInput, SolveInput } from "../types";
import { letter } from "../utils";

function renderOptions(options: string[]): string {
  return options.map((o, i) => `${letter(i)}) ${o}`).join("\n");
}

export function explainPrompt(input: ExplainInput): string {
  return [
    "You are an expert tutor. Explain the following multiple-choice question.",
    "",
    `Question: ${input.prompt}`,
    renderOptions(input.options),
    `Correct answer: ${letter(input.correctIndex)}) ${input.options[input.correctIndex]}`,
    "",
    "Provide: (1) why the correct answer is right, (2) why each other option is wrong,",
    "(3) a short step-by-step reasoning. Keep it concise and clear.",
  ].join("\n");
}

export function solvePrompt(input: SolveInput): string {
  return [
    "Solve this multiple-choice question. Respond as strict JSON only:",
    '{"answerIndex": number, "confidence": number (0-1), "explanation": string}',
    "",
    `Question: ${input.prompt}`,
    renderOptions(input.options),
  ].join("\n");
}

export function generatePrompt(input: GenerateInput): string {
  return [
    `Generate ${input.count} realistic, detailed ${input.difficulty} multiple-choice questions about: ${input.topic}.`,
    "",
    "CRITICAL REQUIREMENTS:",
    "- Generate SPECIFIC, REALISTIC questions with concrete subject matter - NOT generic placeholders",
    "- Each question must test actual knowledge about the topic",
    "- Use proper terminology, facts, and examples related to the topic",
    "- Make distractors (wrong answers) plausible but clearly incorrect",
    "- Each question must have exactly 4 options (A, B, C, D)",
    "- Include a brief explanation for the correct answer",
    "",
    "BAD (generic): 'What is the main concept of ${input.topic}? A) Option A, B) Option B'",
    "GOOD (specific): Use real facts, code examples, dates, formulas, or scenarios",
    "",
    "Respond as strict JSON only, no markdown, in this exact shape:",
    '{"title": string, "questions": [{"prompt": string, "options": [string,string,string,string], "correctIndex": number, "explanation": string}]}',
  ].join("\n");
}

export function structurePrompt(rawText: string): string {
  return [
    "The following text was extracted from an exam/quiz PDF. Convert it into structured",
    "multiple-choice questions.",
    "",
    "IMPORTANT:",
    "- Look for an answer key section (usually at the end) with answers like '1. B, 2. A, 3. C...'",
    "- If you find answer keys, use them EXACTLY as given",
    "- If NO answer key exists, analyze each question carefully and set correctIndex based on factual knowledge",
    "- Be VERY careful with factual questions (history, science, geography) - get them right",
    "- Ignore page numbers, headers, watermarks, and instructions",
    "",
    "Respond as strict JSON only, no markdown, in this exact shape:",
    '{"title": string, "questions": [{"prompt": string, "options": string[], "correctIndex": number}]}',
    "",
    "--- BEGIN EXTRACTED TEXT ---",
    rawText.slice(0, 15000), // Increased to catch answer keys at the end
    "--- END EXTRACTED TEXT ---",
  ].join("\n");
}
