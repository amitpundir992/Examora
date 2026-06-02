# Roadmap & Implementation Flow

This is the step-by-step path from the current MVP to the full enterprise
platform described in the original spec. Each phase is independently shippable.

## ✅ Phase 0 — MVP (this repo)

- Next.js 16 + TypeScript (strict) + Tailwind v4
- Exam engine: timer, palette, mark-for-review, scoring
- Text/`.txt` upload → MCQ parser
- AI explain / solve / generate (Gemini / OpenAI / demo fallback)
- Dashboard, light/dark mode, responsive UI
- Zod validation, per-IP rate limiting, security headers
- In-memory repository + seed data
- Prisma schema, Dockerfile, docker-compose, CI — scaffolded

## Phase 1 — Persistence (PostgreSQL + Prisma)

1. `npm i -D prisma && npm i @prisma/client`
2. `npx prisma migrate dev --name init` (schema already in `prisma/schema.prisma`)
3. Create `lib/db.ts` exporting a singleton `PrismaClient`.
4. Reimplement `lib/repository.ts` methods with Prisma queries — **no caller changes**.
5. Remove `export const dynamic = "force-dynamic"` where ISR/caching is desired.

## Phase 2 — Authentication & RBAC (Clerk)

1. `npm i @clerk/nextjs`; wrap the root layout in `<ClerkProvider>`.
2. Add `proxy.ts` (Next 16 renamed `middleware` → `proxy`) to protect `/(app)` routes.
3. Add `(auth)/sign-in` and `(auth)/sign-up` route groups.
4. Add a `role` claim (USER / ADMIN / SUPER_ADMIN); gate the admin panel.
5. Stamp `ownerId` on exams/attempts from the authenticated user.

## Phase 3 — Real PDF & OCR

1. `npm i pdf-parse` for text-based PDFs; `npm i tesseract.js` for scanned docs.
2. In `/api/upload`, accept `multipart/form-data`, extract text, then `parseMcqText()`.
3. Store the original file in R2 (Phase 5) and record an `Upload` row.

## Phase 4 — Redis caching & durable rate limiting (Upstash)

1. `npm i @upstash/redis @upstash/ratelimit`.
2. Replace `lib/ai/rate-limit.ts` internals with `@upstash/ratelimit` (same signature).
3. Cache AI responses (hash of prompt → result) and exam-progress autosave.

## Phase 5 — Storage (Cloudflare R2)

1. `npm i @aws-sdk/client-s3` (R2 is S3-compatible).
2. Add `lib/r2.ts` with `putObject` / `getSignedUrl` helpers using the `R2_*` env vars.
3. Upload originals on import; serve via signed URLs.

## Phase 6 — Admin panel & analytics

1. `(app)/admin` route group, gated to ADMIN/SUPER_ADMIN.
2. Manage users, exams, uploads, AI requests; view audit logs.
3. Charts for attempts/scores over time (add a charting lib when needed).

## Phase 7 — Observability & tests

1. `npm i @sentry/nextjs`; wire `SENTRY_DSN`.
2. `npm i -D vitest @testing-library/react`; unit-test `parseMcqText` and
   `gradeAttempt` first (already pure functions), then components.
3. Add structured logging (Pino) at the API boundary.

## Suggested build order (greenfield)

```
1  Folder structure + tooling
2  Prisma schema + DB
3  Auth (Clerk) + RBAC
4  Landing page
5  Dashboard shell
6  Upload + PDF/OCR module
7  Exam engine
8  AI tutor (explain) + solver
9  AI generator
10 Admin panel
11 Docker + CI/CD
12 Tests + monitoring + docs
```
