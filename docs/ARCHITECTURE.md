# Architecture

Examora is a Next.js 16 App Router application organized in clean layers so the
working MVP can grow into the full enterprise platform without rewrites.

## Layered design

```
┌─────────────────────────────────────────────────────────┐
│  UI layer        app/ pages + components/ (server+client)│
├─────────────────────────────────────────────────────────┤
│  API layer       app/api/**/route.ts (HTTP boundary)     │
│                  lib/api.ts (responses, rate-limit guard) │
├─────────────────────────────────────────────────────────┤
│  Validation      lib/types.ts (Zod schemas)              │
├─────────────────────────────────────────────────────────┤
│  Service layer   lib/ai/* (provider abstraction, prompts)│
├─────────────────────────────────────────────────────────┤
│  Repository      lib/repository.ts (in-memory → Prisma)  │
└─────────────────────────────────────────────────────────┘
```

The key principle: **callers depend on interfaces, not implementations.** UI
calls API routes; routes validate with Zod, then call the repository or AI
service. Swapping the in-memory store for Prisma/PostgreSQL, or the demo AI for
a real provider, touches only one layer.

## Request flows

**Take an exam**
1. `app/(app)/exams/[id]/page.tsx` (server) loads the exam via `examRepo.get()`.
2. `ExamEngine` (client) tracks answers, timer, palette state.
3. Submit → `POST /api/exams/[id]/attempts` → `gradeAttempt()` (pure function) → result.

**AI generate**
1. `ai-generator` page → `POST /api/ai/generate` (Zod-validated).
2. `lib/ai/service.generate()` picks Gemini/OpenAI/mock, builds a prompt, parses JSON.
3. Result stored via `examRepo.create()`, user redirected to the engine.

**AI explain / solve** follow the same path through `/api/ai/explain` and `/api/ai/solve`.

## AI provider abstraction

`lib/ai/service.ts` exposes `explain`, `solve`, `generate`. Internally it selects:

1. **Gemini** if `GEMINI_API_KEY` is set (`generativelanguage.googleapis.com`).
2. **OpenAI** if `OPENAI_API_KEY` is set (`/v1/chat/completions`).
3. **Mock** otherwise — deterministic, usable output so the app never breaks.

`extractJson()` tolerates model responses wrapped in prose or ```json fences.

## Security

- **Validation:** every request body is parsed with Zod before use.
- **Rate limiting:** `lib/ai/rate-limit.ts` sliding window, per-IP, per-endpoint.
- **Headers:** `next.config.ts` sets `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`.
- **Injection:** SQL injection is moot with the in-memory store; the Prisma layer
  uses parameterized queries by construction. JSON-only API surface limits XSS.
- See [ROADMAP](ROADMAP.md) for Clerk auth, RBAC, and CSRF wiring.

## State & persistence

The MVP keeps state in a module-global `Map` (resets on restart, not shared
across serverless instances). Production swaps `lib/repository.ts` for Prisma —
the function signatures are designed to match. See [DATABASE](DATABASE.md).
