# PULL-IA

> AI-powered tech news aggregator for software engineers and tech professionals.

PULL-IA automatically fetches, classifies, and summarizes the most relevant tech news from 12+ trusted global sources — covering AI, Software Engineering, Programming, and Tech Employability — and delivers them in Spanish with bilingual (ES/EN) support.

## Features

- 🤖 **AI-powered curation** — Google Gemini classifies and scores every article by relevance
- 🌐 **12+ sources** — HackerNews, TechCrunch, The Verge, Wired, arXiv, OpenAI/Anthropic/Google blogs and more
- 🔍 **Source traceability** — every summary links back to its original sources
- 📧 **Weekly newsletter** — top 10 articles delivered to subscribers every week
- 🌍 **Bilingual** — Spanish UI with English toggle
- 🔄 **Fully automated** — ingestion pipeline runs every 2 hours via cron
- 🔒 **Secure** — rate limiting, double opt-in, Zod validation, CRON_SECRET protection

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| AI | Google Gemini 1.5 Flash/Pro |
| Email | Resend |
| Auth | NextAuth.js v5 (Google + GitHub) |
| Rate Limiting | Upstash Redis |
| Deployment | Vercel |

## Architecture

```
Sources (RSS/APIs) → Fetch → Dedupe → Classify (AI) → Summarize (AI) → Publish → Newsletter
```

See [docs/architecture.md](docs/architecture.md) for the full system diagram.

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free)
- A [Google AI Studio](https://aistudio.google.com) API key (free)
- A [Resend](https://resend.com) account (free tier)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/andresZam12/Pull-IA.git
cd Pull-IA

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in your API keys in .env.local

# 4. Push database schema
npx prisma db push

# 5. Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/              # Next.js App Router (pages + API routes)
├── components/       # React components
├── lib/
│   ├── ai/           # Gemini classifier & summarizer
│   ├── fetchers/     # OOP source fetchers (base + implementations)
│   ├── pipeline/     # Ingestion pipeline orchestrator
│   ├── email/        # Email sender (Resend)
│   ├── db/           # Prisma client singleton
│   └── security/     # Rate limiting + Zod validators
├── types/            # Shared TypeScript interfaces
└── i18n/             # ES/EN translations
```

## Adding a New News Source

```typescript
// src/lib/fetchers/source-registry.ts
new RssFetcher({
  name: "My New Source",
  slug: "my-new-source",
  url: "https://example.com",
  feedUrl: "https://example.com/rss",
  type: SourceType.RSS,
  categories: [Category.AI],
  language: "en",
  reputationScore: 0.8,
})
```

That's it. The pipeline handles the rest.

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

## License

MIT — built as an academic project for POWeb, Ingeniería de Software VII.
