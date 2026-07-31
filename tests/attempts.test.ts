import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardAnalytics, type DashboardAttemptInput, type DashboardExamInput } from "../lib/analytics";
import { formatDuration } from "../lib/attempt-format";
import { gradeAttempt } from "../lib/grading";
import { submitAttemptSchema, type Exam } from "../lib/types";

const exam: Exam = {
  id: "exam-1",
  title: "Test exam",
  topic: "Testing",
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

test("builds weighted weekly, monthly, exam, and topic accuracy", () => {
  const attempts: DashboardAttemptInput[] = [
    analyticsAttempt("current-large", "exam-1", "Algebra I", "Mathematics", 8, 10, "2026-07-30T10:00:00.000Z"),
    analyticsAttempt("current-small", "exam-2", "Algebra II", "mathematics", 1, 2, "2026-07-29T10:00:00.000Z"),
    analyticsAttempt("previous-week", "exam-1", "Algebra I", "Mathematics", 5, 10, "2026-07-20T10:00:00.000Z"),
    analyticsAttempt("previous-month", "exam-3", "Biology", "Science", 8, 10, "2026-06-10T10:00:00.000Z"),
  ];
  const exams: DashboardExamInput[] = [
    {
      id: "exam-2",
      title: "Algebra II",
      topic: "Mathematics",
      source: "ai",
      questionCount: 2,
      createdAt: new Date("2026-07-29T09:00:00.000Z"),
    },
  ];

  const analytics = buildDashboardAnalytics(attempts, exams, new Date("2026-07-31T12:00:00.000Z"));

  assert.equal(analytics.week.accuracy, 75);
  assert.equal(analytics.week.attempts, 2);
  assert.equal(analytics.week.change, 25);
  assert.equal(analytics.month.accuracy, 64);
  assert.equal(analytics.month.change, -16);
  assert.equal(analytics.topicAccuracy[0]?.label, "Mathematics");
  assert.equal(analytics.topicAccuracy[0]?.accuracy, 64);
  assert.equal(analytics.topicAccuracy[0]?.attempts, 3);
  assert.equal(analytics.examAccuracy.find((group) => group.key === "exam-1")?.accuracy, 65);
  assert.equal(analytics.recentActivity[0]?.type, "attempt");
});

test("keeps empty trend buckets explicit", () => {
  const analytics = buildDashboardAnalytics([], [], new Date("2026-07-31T12:00:00.000Z"));

  assert.equal(analytics.dailyTrend.length, 7);
  assert.equal(analytics.monthlyTrend.length, 6);
  assert.equal(analytics.week.accuracy, 0);
  assert.equal(analytics.week.change, null);
  assert.deepEqual(analytics.recentActivity, []);
});

function analyticsAttempt(
  id: string,
  examId: string,
  examTitle: string,
  topic: string,
  correct: number,
  total: number,
  createdAt: string,
): DashboardAttemptInput {
  return {
    id,
    examId,
    examTitle,
    topic,
    correct,
    total,
    percentage: Math.round((correct / total) * 100),
    timeSpentSec: 60,
    createdAt: new Date(createdAt),
  };
}
