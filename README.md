# Examora — AI-Powered Exam Platform

Turn any exam (pasted text, `.txt`, or PDF) into an interactive test. Take it, get scored, ask AI to explain or solve questions, or generate a brand-new exam from a topic prompt.

**Working MVP** with production-ready authentication, database persistence, and enterprise-grade security. Built for students, educators, and organizations.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)

---

## ✨ What it does

| Feature | Status | Notes |
|---|---|---|
| Upload exam: **PDF** (text-based) → parsed MCQs | ✅ | `pdfjs-dist` + smart fallback |
| Upload exam: **PDF** (scanned/image) → OCR → parsed MCQs | ✅ | Tesseract.js auto-fallback |
| Upload exam (paste / `.txt`) → parsed MCQs | ✅ | Regex + AI parser |
| Interactive exam engine (timer, palette, mark-for-review) | ✅ | Full-featured exam interface |
| Submit → score, correct/wrong breakdown, time | ✅ | Instant grading |
| Ask AI to **explain** a question | ✅ | Detailed explanations |
| Ask AI to **solve** a question | ✅ | Step-by-step solutions |
| **Generate** an exam from a topic prompt | ✅ | "Node.js interview", "Calculus midterm" |
| Dashboard with stats | ✅ | Exams, attempts, avg score |
| Google OAuth authentication | ✅ | Secure sign-in |
| Light / dark mode | ✅ | No flash on load |
| Security headers & CSP | ✅ | Production-ready |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **npm**
- **PostgreSQL** (Docker recommended)
- **Google OAuth credentials** ([Get them here](https://console.cloud.google.com/))
- **Gemini API key** (optional, free) ([Get it here](https://aistudio.google.com/apikey))

### Step-by-step setup

#### 1️⃣ Clone and install

```bash
# Clone the repository
git clone https://github.com/yourusername/examora.git
cd examora

# Install dependencies
npm install
```

#### 2️⃣ Start PostgreSQL

**Option A: Docker (recommended)**
```bash
docker compose up -d
```
This starts PostgreSQL on port 5432 with credentials from `docker-compose.yml`.

**Option B: Local PostgreSQL**
Install PostgreSQL locally and create a database named `examora`.

#### 3️⃣ Configure environment variables

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` and add:

```bash
# Database (required)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/examora?schema=public"

# Authentication (required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_SECRET_HERE"  # Generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Provider (optional - uses demo fallback if not provided)
GEMINI_API_KEY="your-gemini-api-key"  # Free at https://aistudio.google.com/apikey
```

**🔑 Getting Google OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env.local`

#### 4️⃣ Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed demo data
npx prisma db seed
```

#### 5️⃣ Run the app

```bash
npm run dev
```

🎉 **Open [http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📦 Tech Stack

**Frontend**
- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui-style components

**Backend**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- NextAuth.js v5 (Better Auth)

**AI & Processing**
- Google Gemini API
- OpenAI API (fallback)
- pdfjs-dist (PDF text extraction)
- Tesseract.js (OCR)

**Security**
- Google OAuth authentication
- Secure cookies (httpOnly, sameSite)
- CSP, HSTS, X-Frame-Options headers
- Rate limiting on AI endpoints

---

## 📂 Project Structure

```
examora/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes (protected)
│   │   ├── dashboard/     # User stats & recent exams
│   │   ├── exams/         # Exam list & exam engine
│   │   ├── upload/        # Paste/import exam
│   │   └── ai-generator/  # Generate exams via AI prompt
│   ├── api/               # API endpoints
│   │   ├── auth/          # NextAuth routes
│   │   ├── exams/         # CRUD operations
│   │   └── ai/            # AI explain/solve/generate
│   ├── login/             # Sign-in page
│   └── page.tsx           # Landing page
│
├── components/            # React components
│   ├── ui/               # Base UI primitives
│   ├── exam/             # Exam engine, question palette
│   └── layout/           # App shell, sidebar, navbar
│
├── lib/                   # Shared utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── types.ts          # Domain types + Zod schemas
│   ├── parser.ts         # MCQ text → structured data
│   ├── pdf.ts            # PDF extraction & OCR
│   └── ai/               # AI service layer
│       ├── service.ts    # Provider abstraction
│       ├── prompts.ts    # System prompts
│       └── rate-limit.ts # In-memory rate limiter
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # DB migrations
│
├── public/               # Static assets
├── docs/                 # Architecture & deployment docs
├── proxy.ts              # Edge middleware (auth protection)
├── next.config.ts        # Next.js config + security headers
└── docker-compose.yml    # PostgreSQL for local dev
```

---

## 📄 PDF Parsing

Examora handles any PDF format with a **three-tier parsing strategy**:

1. **Text extraction** — `pdfjs-dist` extracts text from digital PDFs
2. **OCR fallback** — Tesseract.js handles scanned/image-based PDFs automatically
3. **Smart structuring**:
   - **Regex parser** (fast, free) tries standard MCQ formats first
   - **AI structuring** (Gemini) handles complex layouts, answer keys, and non-standard formats

**No configuration needed** — just upload any PDF! Add a `GEMINI_API_KEY` for best results on messy formats.

---

## 🔒 Security Features

✅ **Google OAuth** authentication with NextAuth.js  
✅ **Secure session cookies** (`httpOnly`, `sameSite: lax`, `secure` in production)  
✅ **Route protection** via Edge middleware (`proxy.ts`)  
✅ **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options  
✅ **Rate limiting** on AI endpoints (20 req/min per IP)  
✅ **SQL injection protection** via Prisma ORM  
✅ **No OAuth token storage** in JWT (minimal attack surface)  

---

## 🐳 Docker

Run the entire stack (app + PostgreSQL) with Docker:

```bash
docker compose up --build
```

- **App**: [http://localhost:3000](http://localhost:3000)
- **PostgreSQL**: `localhost:5432`

---

## 📊 NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma db seed` | Seed demo data |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |

---

## 🌐 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/examora)

**Setup steps:**
1. Import project from GitHub
2. Set environment variables in Vercel dashboard:
   ```
   DATABASE_URL
   NEXTAUTH_URL (e.g., https://yourdomain.com)
   NEXTAUTH_SECRET
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   GEMINI_API_KEY (optional)
   ```
3. Update Google OAuth redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Deploy!

**Database**: Use Vercel Postgres, Neon, or any PostgreSQL provider.

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

---

## 🧪 Design Notes

- **Authentication**: Google OAuth via NextAuth.js v5; sessions stored in JWT (30-day expiry)
- **Database**: Prisma ORM with PostgreSQL adapter for Prisma 7
- **AI Providers**: Automatic fallback chain: Gemini → OpenAI → demo responses
- **Edge Compatibility**: Middleware uses cookie-based auth checks (no Node.js APIs in Edge runtime)
- **Rate Limiting**: In-memory sliding window (20 req/min); swap with Upstash Redis for multi-instance deployments
- **PDF Processing**: Server-side rendering with `pdfjs-dist` + optional Canvas for complex layouts

---

## 📚 Documentation

- **[Architecture](docs/ARCHITECTURE.md)** — System design & patterns
- **[Roadmap](docs/ROADMAP.md)** — Feature backlog & implementation flow
- **[API Reference](docs/API.md)** — Endpoint specs
- **[Database](docs/DATABASE.md)** — Schema & migration guide
- **[AI Build Prompt](docs/AI_BUILD_PROMPT.md)** — Paste into AI to extend this app
- **[Auth Setup](docs/AUTH_SETUP.md)** — Detailed OAuth configuration

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

Private / Not specified in this repository.

---

**Built for students and educators who want smarter exam experiences.** 🎓
