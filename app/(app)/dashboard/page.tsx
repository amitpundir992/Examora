import Link from "next/link";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  CirclePlus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { formatAttemptDate } from "@/lib/attempt-format";
import { getDashboardData } from "@/lib/dashboard-data";
import { providerName } from "@/lib/ai/service";
import type { AccuracyGroup, DashboardActivity, PerformanceSummary, TrendPoint } from "@/lib/analytics";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dashboard = await getDashboardData(session.user.id);
  const provider = providerName();
  const stats = [
    { label: "Total Exams", value: dashboard.totalExams, detail: "Created and imported" },
    { label: "Total Attempts", value: dashboard.totalAttempts, detail: "All completed exams" },
    {
      label: "This Week",
      value: `${dashboard.analytics.week.accuracy}%`,
      detail: `${dashboard.analytics.week.attempts} attempts`,
      performance: dashboard.analytics.week,
    },
    {
      label: "This Month",
      value: `${dashboard.analytics.month.accuracy}%`,
      detail: `${dashboard.analytics.month.attempts} attempts`,
      performance: dashboard.analytics.month,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance, activity, and plan usage at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={dashboard.plan === "PRO" ? "border-success text-success" : ""}>
            {dashboard.plan === "PRO" ? "Pro" : "Free"} plan
          </Badge>
          <Badge>{provider === "mock" ? "Demo AI" : provider}</Badge>
          <Link
            href="/ai-generator"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            New AI Exam
          </Link>
        </div>
      </div>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">Performance overview</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-3xl font-bold">{stat.value}</p>
                {stat.performance ? <ChangeIndicator performance={stat.performance} /> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="usage-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="usage-heading" className="text-lg font-semibold">Usage remaining</h2>
            <p className="text-sm text-muted-foreground">
              Current {dashboard.plan === "PRO" ? "Pro" : "Free"} plan allowance.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Resets <time dateTime={dashboard.usagePeriodEnd}>{formatResetDate(dashboard.usagePeriodEnd)}</time>
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dashboard.usage.map((item) => (
            <Card key={item.metric} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <span className="text-xs text-muted-foreground">{item.used}/{item.limit}</span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {item.remaining}
                <span className="ml-1 text-sm font-normal text-muted-foreground">left</span>
              </p>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`${item.label} usage`}
                aria-valuemin={0}
                aria-valuemax={item.limit}
                aria-valuenow={item.used}
              >
                <div
                  className={cn("h-full bg-primary", item.percentage >= 90 && "bg-danger")}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="performance-heading">
        <div className="mb-3">
          <h2 id="performance-heading" className="text-lg font-semibold">Performance trends</h2>
          <p className="text-sm text-muted-foreground">Accuracy is weighted by questions answered.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendChart
            title="Last 7 days"
            description="Daily accuracy"
            points={dashboard.analytics.dailyTrend}
          />
          <TrendChart
            title="Last 6 months"
            description="Monthly accuracy"
            points={dashboard.analytics.monthlyTrend}
          />
        </div>
        {dashboard.analyticsTruncated ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Trend and accuracy views use your latest 5,000 attempts.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="accuracy-heading">
        <div className="mb-3">
          <h2 id="accuracy-heading" className="text-lg font-semibold">Accuracy breakdown</h2>
          <p className="text-sm text-muted-foreground">Results from the last six months.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <AccuracyList
            title="By exam"
            emptyText="Complete an exam to compare performance."
            groups={dashboard.analytics.examAccuracy}
            linkToExam
          />
          <AccuracyList
            title="By topic"
            emptyText="Topic accuracy appears after your first attempt."
            groups={dashboard.analytics.topicAccuracy}
          />
        </div>
      </section>

      <section aria-labelledby="activity-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="activity-heading" className="text-lg font-semibold">Recent activity</h2>
            <p className="text-sm text-muted-foreground">Your latest exams and completed attempts.</p>
          </div>
          {dashboard.totalAttempts > 0 ? (
            <Link href="/attempts" className="text-sm font-medium text-primary hover:underline">
              View history
            </Link>
          ) : null}
        </div>
        <ActivityFeed activities={dashboard.analytics.recentActivity} />
      </section>
    </div>
  );
}

function ChangeIndicator({ performance }: { performance: PerformanceSummary }) {
  if (performance.change == null) {
    return <span className="text-xs text-muted-foreground">No prior data</span>;
  }
  const improved = performance.change >= 0;
  const Icon = improved ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", improved ? "text-success" : "text-danger")}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {improved ? "+" : ""}{performance.change}%
    </span>
  );
}

function TrendChart({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: TrendPoint[];
}) {
  const hasData = points.some((point) => point.attempts > 0);
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mt-5 grid h-44 grid-cols-6 items-end gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
        {points.map((point) => (
          <div
            key={point.key}
            className="flex h-full min-w-0 flex-col items-center justify-end gap-1"
            aria-label={`${point.label}: ${point.accuracy}% accuracy across ${point.attempts} attempts`}
          >
            <span className="text-xs font-medium">{point.attempts > 0 ? `${point.accuracy}%` : "–"}</span>
            <div className="flex h-28 w-full max-w-10 items-end overflow-hidden rounded-sm bg-muted">
              <div
                className={cn("w-full bg-primary", point.attempts === 0 && "bg-border")}
                style={{ height: point.attempts > 0 ? `${Math.max(4, point.accuracy)}%` : "4%" }}
              />
            </div>
            <span className="truncate text-xs text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
      {!hasData ? <p className="mt-2 text-center text-xs text-muted-foreground">No attempts in this period.</p> : null}
    </Card>
  );
}

function AccuracyList({
  title,
  emptyText,
  groups,
  linkToExam = false,
}: {
  title: string;
  emptyText: string;
  groups: AccuracyGroup[];
  linkToExam?: boolean;
}) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold">{title}</h3>
      {groups.length > 0 ? (
        <ol className="mt-4 space-y-4">
          {groups.map((group) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{group.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.attempts} {group.attempts === 1 ? "attempt" : "attempts"} · {group.correct}/{group.total} correct
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{group.accuracy}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${group.accuracy}%` }} />
                </div>
              </>
            );
            return (
              <li key={group.key}>
                {linkToExam ? (
                  <Link href={`/exams/${group.key}`} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {content}
                  </Link>
                ) : content}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </Card>
  );
}

function ActivityFeed({ activities }: { activities: DashboardActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center">
        <Activity className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 font-medium">No activity yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create or complete an exam to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {activities.map((activity) => {
        const Icon =
          activity.type === "attempt"
            ? CheckCircle2
            : activity.action === "generated"
              ? Sparkles
              : CirclePlus;
        return (
          <Link
            key={activity.id}
            href={activity.href}
            className="flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{activity.title}</span>
              <span className="block text-xs text-muted-foreground">{activity.detail}</span>
            </span>
            <time dateTime={activity.createdAt} className="hidden shrink-0 text-xs text-muted-foreground sm:block">
              {formatAttemptDate(activity.createdAt)}
            </time>
          </Link>
        );
      })}
    </div>
  );
}

function formatResetDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
