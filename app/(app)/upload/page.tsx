"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, Textarea, Spinner, Badge } from "@/components/ui";
import { ProtectedRoute } from "@/components/protected-route";

const SAMPLE = `1. Which keyword declares a constant in JavaScript?
A) var
B) let
C) const
D) static
Answer: C

2. What is the output of typeof null?
A) "null"
B) "object"
C) "undefined"
D) "number"
Answer: B`;

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submit() {
    setError("");
    setLoading(true);
    try {
      let res: Response;
      if (file) {
        // PDF / file → multipart; server extracts text + structures with AI.
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title);
        res = await fetch("/api/upload", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title || "Imported Exam", content, source: "text" }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.push(`/exams/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = file ? true : content.trim().length >= 10;

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload an Exam</h1>
        <p className="text-sm text-muted-foreground">
          Upload a <b>PDF</b> and AI turns it into an interactive exam — or paste text / import a <code>.txt</code>.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spanish Entrance Exam" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">PDF or text file</label>
          <input
            type="file"
            accept=".pdf,.txt,.md,.csv"
            onChange={onFile}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              Selected: {file.name} <Badge>{(file.size / 1024).toFixed(0)} KB</Badge> — text box ignored.
            </p>
          )}
        </div>

        {!file && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">…or paste exam text</label>
              <Button variant="ghost" size="sm" onClick={() => setContent(SAMPLE)}>Load sample</Button>
            </div>
            <Textarea rows={12} value={content} onChange={(e) => setContent(e.target.value)} placeholder={SAMPLE} className="font-mono text-xs" />
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button onClick={submit} disabled={loading || !canSubmit}>
          {loading ? <><Spinner /> Processing…</> : file ? "Convert PDF → Exam" : "Parse & Start Exam"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Text-based PDFs work out of the box. For best results extracting questions + correct answers from arbitrary
          PDFs, add a free <code>GEMINI_API_KEY</code> in <code>.env</code>. Scanned/image-only PDFs need OCR (see ROADMAP).
        </p>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
