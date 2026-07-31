import "server-only";

import { UsageMetric } from "@prisma/client";
import { buildDashboardAnalytics } from "@/lib/analytics";
import { metricLimit } from "@/lib/billing/plans";
import { prisma } from "@/lib/prisma";

const USAGE_METRICS = [
  { metric: UsageMetric.UPLOAD, label: "Exam imports" },
  { metric: UsageMetric.AI_GENERATE, label: "AI generations" },
  { metric: UsageMetric.AI_EXPLAIN, label: "AI explanations" },
  { metric: UsageMetric.AI_SOLVE, label: "AI solutions" },
] as const;

const MAX_ANALYTICS_ATTEMPTS = 5_000;

export async function getDashboardData(userId: string, now = new Date()) {
  const analyticsStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      _count: { select: { exams: true, attempts: true } },
      usageRecords: {
        where: { periodStart },
        select: { metric: true, count: true },
      },
      exams: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          topic: true,
          source: true,
          createdAt: true,
          _count: { select: { questions: true } },
        },
      },
      attempts: {
        where: { createdAt: { gte: analyticsStart } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: MAX_ANALYTICS_ATTEMPTS + 1,
        select: {
          id: true,
          examId: true,
          correct: true,
          total: true,
          percentage: true,
          timeSpentSec: true,
          createdAt: true,
          exam: { select: { title: true, topic: true } },
        },
      },
    },
  });
  if (!user) throw new Error("User not found");

  const analyticsTruncated = user.attempts.length > MAX_ANALYTICS_ATTEMPTS;
  const attempts = user.attempts.slice(0, MAX_ANALYTICS_ATTEMPTS).map((attempt) => ({
    id: attempt.id,
    examId: attempt.examId,
    examTitle: attempt.exam.title,
    topic: attempt.exam.topic,
    correct: attempt.correct,
    total: attempt.total,
    percentage: attempt.percentage,
    timeSpentSec: attempt.timeSpentSec,
    createdAt: attempt.createdAt,
  }));
  const exams = user.exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    topic: exam.topic,
    source: exam.source.toLowerCase() as "pdf" | "text" | "ai",
    questionCount: exam._count.questions,
    createdAt: exam.createdAt,
  }));
  const usedByMetric = new Map(user.usageRecords.map((record) => [record.metric, record.count]));

  return {
    plan: user.plan,
    totalExams: user._count.exams,
    totalAttempts: user._count.attempts,
    analyticsTruncated,
    analytics: buildDashboardAnalytics(attempts, exams, now),
    usagePeriodEnd: periodEnd.toISOString(),
    usage: USAGE_METRICS.map(({ metric, label }) => {
      const used = usedByMetric.get(metric) ?? 0;
      const limit = metricLimit(user.plan, metric);
      return {
        metric,
        label,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        percentage: Math.min(100, Math.round((used / limit) * 100)),
      };
    }),
  };
}
