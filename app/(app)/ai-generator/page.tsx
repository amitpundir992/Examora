"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, Spinner, Badge } from "@/components/ui";
import { ProtectedRoute } from "@/components/protected-route";

const EXAMPLES = ["Doon University Spanish Entrance Exam", "Node.js Developer Interview", "GRE Quantitative", "World History 101"];

export default function AiGeneratorPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      router.push(`/exams/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI Exam Generator</h1>
          <p className="text-sm text-muted-foreground">
            Describe a topic and let AI build a full multiple-choice exam.
          </p>
        </div>

        <Card className="space-y-5 p-6">
          <div className="space-y-1">
            <label className="text-sm font-medium">Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Doon University Spanish Entrance Exam" />
            <div className="flex flex-wrap gap-2 pt-1">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => setTopic(ex)} type="button">
                  <Badge className="cursor-pointer hover:border-primary">{ex}</Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Questions ({count})</label>
              <input type="range" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button onClick={submit} disabled={loading || topic.trim().length < 2}>
            {loading ? <><Spinner /> Generating…</> : "✨ Generate Exam"}
          </Button>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
