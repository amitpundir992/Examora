export interface DashboardAttemptInput {
  id: string;
  examId: string;
  examTitle: string;
  topic: string;
  correct: number;
  total: number;
  percentage: number;
  timeSpentSec: number;
  createdAt: Date;
}

export interface DashboardExamInput {
  id: string;
  title: string;
  topic: string;
  source: "pdf" | "text" | "ai";
  questionCount: number;
  createdAt: Date;
}

export interface PerformanceSummary {
  accuracy: number;
  attempts: number;
  correct: number;
  total: number;
  change: number | null;
}

export interface TrendPoint {
  key: string;
  label: string;
  accuracy: number;
  attempts: number;
}

export interface AccuracyGroup {
  key: string;
  label: string;
  accuracy: number;
  attempts: number;
  correct: number;
  total: number;
}

export type DashboardActivity =
  | {
      id: string;
      type: "attempt";
      title: string;
      detail: string;
      href: string;
      createdAt: string;
    }
  | {
      id: string;
      type: "exam";
      action: "generated" | "imported";
      title: string;
      detail: string;
      href: string;
      createdAt: string;
    };

const DAY_MS = 86_400_000;

export function buildDashboardAnalytics(
  attempts: DashboardAttemptInput[],
  exams: DashboardExamInput[],
  now = new Date(),
) {
  const currentWeekStart = startOfUtcWeek(now);
  const previousWeekStart = addUtcDays(currentWeekStart, -7);
  const currentMonthStart = startOfUtcMonth(now);
  const previousMonthStart = addUtcMonths(currentMonthStart, -1);

  const currentWeek = summarize(attempts, currentWeekStart, addUtcDays(currentWeekStart, 7));
  const previousWeek = summarize(attempts, previousWeekStart, currentWeekStart);
  const currentMonth = summarize(attempts, currentMonthStart, addUtcMonths(currentMonthStart, 1));
  const previousMonth = summarize(attempts, previousMonthStart, currentMonthStart);

  const week: PerformanceSummary = {
    ...currentWeek,
    change:
      currentWeek.attempts > 0 && previousWeek.attempts > 0
        ? currentWeek.accuracy - previousWeek.accuracy
        : null,
  };
  const month: PerformanceSummary = {
    ...currentMonth,
    change:
      currentMonth.attempts > 0 && previousMonth.attempts > 0
        ? currentMonth.accuracy - previousMonth.accuracy
        : null,
  };

  const today = startOfUtcDay(now);
  const dailyTrend = Array.from({ length: 7 }, (_, index): TrendPoint => {
    const start = addUtcDays(today, index - 6);
    const end = addUtcDays(start, 1);
    const value = summarize(attempts, start, end);
    return {
      key: start.toISOString(),
      label: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(start),
      accuracy: value.accuracy,
      attempts: value.attempts,
    };
  });

  const monthlyTrend = Array.from({ length: 6 }, (_, index): TrendPoint => {
    const start = addUtcMonths(currentMonthStart, index - 5);
    const end = addUtcMonths(start, 1);
    const value = summarize(attempts, start, end);
    return {
      key: start.toISOString(),
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(start),
      accuracy: value.accuracy,
      attempts: value.attempts,
    };
  });

  return {
    week,
    month,
    dailyTrend,
    monthlyTrend,
    examAccuracy: groupAccuracy(
      attempts,
      (attempt) => attempt.examId,
      (attempt) => attempt.examTitle,
    ),
    topicAccuracy: groupAccuracy(
      attempts,
      (attempt) => attempt.topic.trim().toLocaleLowerCase() || "general",
      (attempt) => attempt.topic.trim() || "General",
    ),
    recentActivity: buildRecentActivity(attempts, exams),
  };
}

function summarize(attempts: DashboardAttemptInput[], start: Date, end: Date) {
  let correct = 0;
  let total = 0;
  let attemptCount = 0;

  for (const attempt of attempts) {
    if (attempt.createdAt < start || attempt.createdAt >= end) continue;
    correct += attempt.correct;
    total += attempt.total;
    attemptCount += 1;
  }

  return {
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    attempts: attemptCount,
    correct,
    total,
  };
}

function groupAccuracy(
  attempts: DashboardAttemptInput[],
  keyFor: (attempt: DashboardAttemptInput) => string,
  labelFor: (attempt: DashboardAttemptInput) => string,
): AccuracyGroup[] {
  const groups = new Map<string, AccuracyGroup>();

  for (const attempt of attempts) {
    const key = keyFor(attempt);
    const current = groups.get(key) ?? {
      key,
      label: labelFor(attempt),
      accuracy: 0,
      attempts: 0,
      correct: 0,
      total: 0,
    };
    current.attempts += 1;
    current.correct += attempt.correct;
    current.total += attempt.total;
    current.accuracy = current.total > 0 ? Math.round((current.correct / current.total) * 100) : 0;
    groups.set(key, current);
  }

  return [...groups.values()]
    .sort((left, right) => right.attempts - left.attempts || right.accuracy - left.accuracy)
    .slice(0, 6);
}

function buildRecentActivity(
  attempts: DashboardAttemptInput[],
  exams: DashboardExamInput[],
): DashboardActivity[] {
  const attemptActivity: DashboardActivity[] = attempts.slice(0, 6).map((attempt) => ({
    id: `attempt-${attempt.id}`,
    type: "attempt",
    title: attempt.examTitle,
    detail: `Completed with ${attempt.percentage}% accuracy`,
    href: `/attempts/${attempt.id}`,
    createdAt: attempt.createdAt.toISOString(),
  }));
  const examActivity: DashboardActivity[] = exams.map((exam) => ({
    id: `exam-${exam.id}`,
    type: "exam",
    action: exam.source === "ai" ? "generated" : "imported",
    title: exam.title,
    detail: `${exam.source === "ai" ? "Generated" : "Imported"} ${exam.questionCount} questions`,
    href: `/exams/${exam.id}`,
    createdAt: exam.createdAt.toISOString(),
  }));

  return [...attemptActivity, ...examActivity]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8);
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function startOfUtcWeek(value: Date) {
  const day = startOfUtcDay(value);
  const daysSinceMonday = (day.getUTCDay() + 6) % 7;
  return addUtcDays(day, -daysSinceMonday);
}

function startOfUtcMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function addUtcDays(value: Date, amount: number) {
  return new Date(value.getTime() + amount * DAY_MS);
}

function addUtcMonths(value: Date, amount: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1));
}
