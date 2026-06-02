# Database

The MVP uses an in-memory repository (`lib/repository.ts`). Production uses
PostgreSQL via Prisma. The schema lives in `prisma/schema.prisma`.

## Models

| Model | Purpose |
|---|---|
| `User` | Account + `role` (USER / ADMIN / SUPER_ADMIN) |
| `Exam` | An exam; `source` = PDF / TEXT / AI |
| `Question` | MCQ with `options[]`, `correctIndex`, `explanation` |
| `Attempt` | A graded submission (score, counts, time) |
| `Answer` | Per-question selection within an attempt |
| `Upload` | Original uploaded file metadata (R2 key) |
| `AIRequest` | Audit of AI calls (kind, provider, tokens) |
| `AuditLog` | Admin/audit trail |
| `Session` | Server-side session records |

## Switching to Prisma

```bash
npm i -D prisma
npm i @prisma/client
npx prisma migrate dev --name init   # creates tables from schema.prisma
npx prisma generate
```

Create a client singleton:

```ts
// lib/db.ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

Then reimplement the repository against Prisma — the method names/shapes already
match, so **no route or page changes are required**:

```ts
// lib/repository.ts (Prisma version, sketch)
import { prisma } from "./db";

export const examRepo = {
  list: () => prisma.exam.findMany({ include: { questions: true }, orderBy: { createdAt: "desc" } }),
  get:  (id: string) => prisma.exam.findUnique({ where: { id }, include: { questions: true } }),
  create: (data) => prisma.exam.create({ data: { ...data, questions: { create: data.questions } } }),
  remove: (id: string) => prisma.exam.delete({ where: { id } }).then(() => true).catch(() => false),
};
```

## Local Postgres via Docker

```bash
docker compose up db          # postgres on :5432 (examora/examora)
# DATABASE_URL already points here in .env.example
```
