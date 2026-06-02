"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnswerMap, AttemptResult, Exam } from "@/lib/types";
import { Button, Card, Badge, Spinner } from "@/components/ui";
import { cn, letter } from "@/lib/utils";

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ExamEngine({ exam }: { exam: Exam }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const q = exam.questions[current];

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [result]);

  const answeredCount = Object.keys(answers).length;

  function select(idx: number) {
    setAnswers((a) => ({ ...a, [q.id]: idx }));
  }
  function toggleMark() {
    setMarked((m) => {
      const next = new Set(m);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${exam.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timeSpentSec: elapsed }),
      });
      setResult(await res.json());
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <Results exam={exam} result={result} answers={answers} />;

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{exam.title}</h1>
          <Badge>⏱️ {fmt(elapsed)}</Badge>
        </div>

        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Question {current + 1} of {exam.questions.length}</span>
            <Button variant="ghost" size="sm" onClick={toggleMark}>
              {marked.has(q.id) ? "★ Marked" : "☆ Mark for review"}
            </Button>
          </div>

          <p className="text-lg font-medium">{q.prompt}</p>

          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => select(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted",
                  answers[q.id] === i && "border-primary bg-muted",
                )}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-medium">{letter(i)}</span>
                {opt}
              </button>
            ))}
          </div>

          <AskAi question={q} />

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" size="sm" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              ← Previous
            </Button>
            {current < exam.questions.length - 1 ? (
              <Button size="sm" onClick={() => setCurrent((c) => c + 1)}>Next →</Button>
            ) : (
              <Button size="sm" onClick={submit} disabled={submitting}>
                {submitting ? <Spinner /> : "Submit Exam"}
              </Button>
            )}
          </div>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium">Question palette</p>
          <div className="grid grid-cols-5 gap-2">
            {exam.questions.map((qq, i) => {
              const isAnswered = qq.id in answers;
              const isMarked = marked.has(qq.id);
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "grid h-9 place-items-center rounded-md border text-xs font-medium",
                    i === current && "ring-2 ring-ring",
                    isMarked ? "bg-warning text-white" : isAnswered ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{answeredCount}/{exam.questions.length} answered</p>
        </Card>
        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? <Spinner /> : "Submit Exam"}
        </Button>
      </aside>
    </div>
  );
}

function AskAi({ question }: { question: Exam["questions"][number] }) {
  const [explanation, setExplanation] = useState("");
  const [solving, setSolving] = useState(false);
  const [explaining, setExplaining] = useState(false);

  async function explain() {
    setExplaining(true);
    setExplanation("");
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question.prompt, options: question.options, correctIndex: question.correctIndex }),
      });
      const data = await res.json();
      setExplanation(res.ok ? data.explanation : data.error);
    } finally {
      setExplaining(false);
    }
  }

  async function solve() {
    setSolving(true);
    setExplanation("");
    try {
      const res = await fetch("/api/ai/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question.prompt, options: question.options }),
      });
      const data = await res.json();
      setExplanation(
        res.ok
          ? `AI answer: ${letter(data.answerIndex)}) ${question.options[data.answerIndex]} — confidence ${Math.round(data.confidence * 100)}%\n\n${data.explanation}`
          : data.error,
      );
    } finally {
      setSolving(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed p-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={explain} disabled={explaining || solving}>
          {explaining ? <Spinner /> : "🧠 Explain"}
        </Button>
        <Button variant="secondary" size="sm" onClick={solve} disabled={solving || explaining}>
          {solving ? <Spinner /> : "🤖 Solve with AI"}
        </Button>
      </div>
      {explanation && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{explanation}</p>}
    </div>
  );
}

function Results({ exam, result, answers }: { exam: Exam; result: AttemptResult; answers: AnswerMap }) {
  const stats = [
    { label: "Score", value: `${result.percentage}%` },
    { label: "Correct", value: result.correct },
    { label: "Wrong", value: result.wrong },
    { label: "Time", value: fmt(result.timeSpentSec) },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Results — {exam.title}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {exam.questions.map((q, i) => {
          const sel = answers[q.id];
          const correct = sel === q.correctIndex;
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{i + 1}. {q.prompt}</p>
                <Badge className={correct ? "text-success" : "text-danger"}>
                  {sel == null ? "Skipped" : correct ? "Correct" : "Wrong"}
                </Badge>
              </div>
              <div className="mt-3 space-y-1.5">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      oi === q.correctIndex && "border-success bg-[color-mix(in_srgb,var(--success)_12%,transparent)]",
                      oi === sel && oi !== q.correctIndex && "border-danger bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]",
                    )}
                  >
                    {letter(oi)}. {opt}
                    {oi === q.correctIndex && " ✓"}
                  </div>
                ))}
              </div>
              {q.explanation && <p className="mt-2 text-sm text-muted-foreground">💡 {q.explanation}</p>}
            </Card>
          );
        })}
      </div>

      <Link href="/exams"><Button variant="secondary">← Back to exams</Button></Link>
    </div>
  );
}
