# Examora — AI-Powered Exam Platform

Turn any exam (pasted text, `.txt`, or — via a documented drop-in — PDF) into an
interactive test. Take it, get scored, ask AI to explain or solve questions, or
generate a brand-new exam from a topic prompt.

This repository is a **working MVP** plus the **production scaffolding and
roadmap** to grow into the full enterprise platform (Clerk auth, PostgreSQL,
Redis, R2 storage, admin panel). It runs out of the box with **zero external
services** thanks to an in-memory store and a demo-AI fallback.

---

## ✨ What works right now

| Feature | Status | Notes |
|---|---|---|
| Upload exam: **PDF** (text-based) → parsed MCQs | ✅ | `lib/pdf.ts` + smart fallback |
| Upload exam: **PDF** (scanned/image) → OCR → parsed MCQs | ✅ | Tesseract.js auto-fallback |
| Upload exam (paste / `.txt`) → parsed MCQs | ✅ | `lib/parser.ts` |
| Interactive exam engine (timer, palette, mark-for-review) | ✅ | `components/exam/exam-engine.tsx` |
| Submit → score, correct/wrong breakdown, time | ✅ | `gradeAttempt()` |
| Ask AI to **explain** a question | ✅ | demo fallback or real key |
| Ask AI to **solve** a question | ✅ | confidence + reasoning |
| **Generate** an exam from a topic prompt | ✅ | e.g. "Node.js interview", "Spanish entrance exam" |
| Dashboard with stats | ✅ | exams, attempts, avg score |
| Light / dark mode | ✅ | no flash on load |
| PostgreSQL persistence, Clerk auth, R2, Redis, admin | 🟡 Scaffolded | see [ROADMAP](docs/ROADMAP.md) |

---

## 🚀 Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

There is a seeded demo exam, so you can click **Exams → Start** immediately.

### Enable real AI (optional, free)

The app works without keys (demo answers). For real AI, add **one** key to `.env`:

```bash
cp .env.example .env
# Free Gemini key: https://aistudio.google.com/apikey
GEMINI_API_KEY="your-key-here"
```

Provider selection is automatic: **Gemini → OpenAI → demo fallback**.

---

## 📂 Project structure

```
app/
  page.tsx                 Landing page
  (app)/                   Authenticated app (shared sidebar layout)
    dashboard/             Stats + recent exams
    exams/                 List + [id] exam engine
    upload/                Paste/import an exam
    ai-generator/          Generate an exam from a prompt
  api/
    upload/                POST  parse text → exam
    exams/                 GET/POST, [id] GET/DELETE, [id]/attempts POST
    ai/{explain,solve,generate}/   POST AI operations
lib/
  types.ts                 Domain types + Zod schemas (validation layer)
  repository.ts            Repository pattern (in-memory; swap for Prisma)
  parser.ts                MCQ text → structured questions
  api.ts                   Response/validation/rate-limit helpers
  ai/                       Service layer: provider abstraction, prompts, rate limit
components/                 UI primitives, app shell, exam engine
prisma/schema.prisma       Production database schema
docs/                       Architecture, roadmap, API, database, AI build prompt
```

## 📄 PDF parsing

**PDF upload works with smart parsing:**

1. **Text extraction** — Uses `pdfjs-dist` to extract text from digital PDFs
2. **OCR fallback** — Automatically runs Tesseract.js OCR for scanned/image PDFs
3. **Smart structuring:**
   - First tries **regex parser** (fast, no AI cost) for standard formats
   - Falls back to **AI structuring** if regex finds <10 questions
   - AI handles any format and extracts correct answers from answer keys

**No setup needed** — Tesseract.js is already installed. Just upload any PDF!

Add a `GEMINI_API_KEY` (free) for best results on complex/messy PDFs.

## 🐳 Docker

```bash
docker compose up --build   # app on :3000, postgres on :5432
```

## 📚 Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap & implementation flow](docs/ROADMAP.md)
- [API reference](docs/API.md)
- [Database](docs/DATABASE.md)
- [AI build prompt](docs/AI_BUILD_PROMPT.md) — paste into any AI to extend this app
