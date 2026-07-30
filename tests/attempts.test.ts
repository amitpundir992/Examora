import assert from "node:assert/strict";
import test from "node:test";
import { formatDuration } from "../lib/attempt-format";
import { gradeAttempt } from "../lib/grading";
import { submitAttemptSchema, type Exam } from "../lib/types";

const exam: Exam = {
  id: "exam-1",
  title: "Test exam",
  description: "",
  source: "text",
  createdAt: "2026-07-30T00:00:00.000Z",
  questions: [
    {
      id: "question-1",
      prompt: "First question",
      options: ["A", "B"],
      correctIndex: 1,
    },
    {
      id: "question-2",
      prompt: "Second question",
      options: ["A", "B"],
      correctIndex: 0,
    },
  ],
};

test("grades correct, wrong, and unanswered questions", () => {
  const result = gradeAttempt(exam, { "question-1": 1 }, 65);

  assert.equal(result.correct, 1);
  assert.equal(result.wrong, 0);
  assert.equal(result.unanswered, 1);
  assert.equal(result.percentage, 50);
  assert.equal(result.timeSpentSec, 65);
  assert.deepEqual(
    result.perQuestion.map(({ selectedIndex, isCorrect }) => ({ selectedIndex, isCorrect })),
    [
      { selectedIndex: 1, isCorrect: true },
      { selectedIndex: null, isCorrect: false },
    ],
  );
});

test("counts an answered incorrect option as wrong", () => {
  const result = gradeAttempt(exam, { "question-1": 0, "question-2": 0 }, 10);

  assert.equal(result.correct, 1);
  assert.equal(result.wrong, 1);
  assert.equal(result.unanswered, 0);
  assert.equal(result.percentage, 50);
});

test("formats attempt durations for history screens", () => {
  assert.equal(formatDuration(0), "0s");
  assert.equal(formatDuration(65), "1m 5s");
  assert.equal(formatDuration(3_661), "1h 1m 1s");
});

test("rejects attempt durations beyond the supported limit", () => {
  assert.equal(
    submitAttemptSchema.safeParse({ answers: { "question-1": 1 }, timeSpentSec: 86_401 }).success,
    false,
  );
});
