import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  { icon: "📄", title: "PDF Extraction", desc: "Paste or import exam text and we parse questions, options, and answers automatically." },
  { icon: "🧠", title: "AI Tutor", desc: "Ask AI to explain any question — why the right answer is right and the others wrong." },
  { icon: "✨", title: "AI Exam Generator", desc: "Type a topic like “Spanish entrance exam” and get a full MCQ test instantly." },
  { icon: "🤖", title: "AI Solver", desc: "Let AI solve a single question or the entire exam with confidence scores." },
  { icon: "⏱️", title: "Exam Engine", desc: "Timer, question palette, mark-for-review, and instant scoring on submit." },
  { icon: "📊", title: "Analytics", desc: "Track attempts, scores, and performance over time on your dashboard." },
];

const FAQ = [
  { q: "Do I need an API key to try it?", a: "No. Examora ships with a demo AI fallback so everything works offline. Add a free Gemini or OpenAI key in .env for real AI." },
  { q: "What exam formats are supported?", a: "Numbered questions with A/B/C/D options and an optional 'Answer:' line. Binary PDF extraction is a documented drop-in." },
  { q: "Is it free?", a: "The MVP is open and self-hostable via Docker. You bring your own free-tier AI key." },
];

export default function Landing() {
  return (
    <div className="bg-grid">
      <nav className="glass sticky top-0 z-10 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">E</span>
            Examora
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link href="/ai-generator" className="hover:text-foreground">AI Exams</Link>
            <Link href="/upload" className="hover:text-foreground">PDF Exams</Link>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <header className="mx-auto max-w-6xl px-4 py-24 text-center">
        <Badge className="mb-6">⚡ AI-powered exam platform</Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Turn Any PDF Into an Interactive AI Exam
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Upload PDFs, generate AI exams, solve questions, get instant explanations, and track your performance.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/upload"><Button size="lg">📄 Upload PDF</Button></Link>
          <Link href="/ai-generator"><Button size="lg" variant="secondary">✨ Generate Exam</Button></Link>
        </div>

        <Card className="mx-auto mt-16 max-w-2xl p-6 text-left">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Question 1 of 3</span>
            <Badge>⏱️ 04:58</Badge>
          </div>
          <p className="mb-4 font-medium">What is the capital of France?</p>
          <div className="space-y-2">
            {["Berlin", "Madrid", "Paris", "Rome"].map((o, i) => (
              <div key={o} className={`rounded-lg border px-4 py-2.5 text-sm ${i === 2 ? "border-primary bg-muted" : ""}`}>
                {String.fromCharCode(65 + i)}. {o}
              </div>
            ))}
          </div>
        </Card>
      </header>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Everything you need to study smarter</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">FAQ</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((item) => (
            <Card key={item.q} className="p-5">
              <h3 className="font-medium">{item.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Examora. Built with Next.js.</span>
          <Link href="/dashboard" className="hover:text-foreground">Open the app →</Link>
        </div>
      </footer>
    </div>
  );
}
