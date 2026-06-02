import type { Question } from "./types";
import { uid } from "./utils";

const OPTION_RE = /^\s*\(?([A-Ha-h])[\).]\s*(.+)$/;
const QNUM_RE = /^\s*(\d+)\.\s*(.+)$/;

export function parseMcqText(raw: string): Question[] {
  // Split by question numbers to isolate each question block
  const questionBlocks = raw.split(/(?=\d+\.\s+)/).filter(b => b.trim());
  const questions: Question[] = [];

  for (const block of questionBlocks) {
    const lines = block.trim().split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // First line should be the question
    const firstLine = lines[0];
    const qMatch = firstLine.match(QNUM_RE);
    if (!qMatch) continue;

    let prompt = qMatch[2];
    const options: string[] = [];
    
    // Parse remaining lines for options
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(OPTION_RE);
      
      if (optMatch) {
        options.push(optMatch[2].trim());
      } else if (options.length === 0) {
        // Continue building the question prompt if no options yet
        prompt += " " + line;
      } else {
        // Stop when we hit non-option text after options started
        break;
      }
      
      // Stop after 4 options (A, B, C, D)
      if (options.length >= 4) break;
    }

    if (options.length >= 2) {
      questions.push({
        id: uid("q"),
        prompt: prompt.trim(),
        options,
        correctIndex: 0,
      });
    }
  }

  return questions;
}
