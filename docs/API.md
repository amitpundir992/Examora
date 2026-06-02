# API Reference

All endpoints accept/return JSON. Errors use `{ "error": string }` with an
appropriate status. AI and mutating endpoints are rate-limited per IP.

## Exams

### `GET /api/exams`
List all exams.

### `POST /api/exams`
Create an exam directly. Body must match the exam schema (minus `id`/`createdAt`).

### `GET /api/exams/:id`
Fetch one exam. `404` if missing.

### `DELETE /api/exams/:id`
Delete an exam. `404` if missing.

### `POST /api/exams/:id/attempts`
Grade and store an attempt.
```json
{ "answers": { "q1": 2, "q2": 0 }, "timeSpentSec": 120 }
```
Returns `AttemptResult` (`total`, `correct`, `wrong`, `unanswered`, `percentage`,
`timeSpentSec`, `perQuestion[]`).

## Upload

### `POST /api/upload`
Parse pasted/`.txt` exam text into a stored exam.
```json
{ "title": "Node.js Interview", "content": "1. ...\nA) ...\nAnswer: B", "source": "text" }
```
Returns the created exam (`201`). `400` if no questions detected.

## AI

### `POST /api/ai/explain`
```json
{ "prompt": "...", "options": ["A","B","C","D"], "correctIndex": 2 }
```
Returns `{ "explanation": string }`.

### `POST /api/ai/solve`
```json
{ "prompt": "...", "options": ["A","B","C","D"] }
```
Returns `{ "answerIndex": number, "confidence": number, "explanation": string }`.

### `POST /api/ai/generate`
```json
{ "topic": "Spanish Entrance Exam", "difficulty": "medium", "count": 10 }
```
Returns the created exam (`201`). `502` if the AI provider fails.

## Rate limits (defaults)

| Endpoint | Max / minute |
|---|---|
| `/api/upload` | 20 |
| `/api/ai/explain`, `/api/ai/solve` | 30 |
| `/api/ai/generate` | 10 |
