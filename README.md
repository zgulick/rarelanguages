# Rare Languages

A language-learning web app for languages that mainstream platforms ignore. The first course teaches **Gheg Albanian** — a dialect with roughly 4 million speakers and effectively no Duolingo-style learning material.

**Live:** [rarelanguages.vercel.app](https://rarelanguages.vercel.app)

---

## What it does

A learner picks a language, drills into a course level, expands a skill unit, and works through lessons built from real vocabulary, dialogue, and grammar content.

```
/                              language catalogue
└── /languages/gheg-al         course levels
    └── .../level/1            8 skill units, 34 lessons
        └── /learn/[lessonId]  the lesson itself
```

The interesting part is not the UI — it's where the content comes from. Building a course for a language with no textbook means generating the curriculum itself, so the repo includes an AI content pipeline (`scripts/`) that produces vocabulary, translations, verb conjugations, grammar rules, pronunciation guides, and exercises, then validates and loads them into Postgres.

Current content: **1 course, 8 skill units, 37 lessons, 377 content rows.**

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via `pg` |
| Content generation | OpenAI API (offline scripts, not request-time) |
| Hosting | Vercel |
| Tests | Jest |

## Architecture notes

**Content generation is offline, not request-time.** Every OpenAI call happens in `scripts/`, run manually against the database. No API route calls a model. This keeps request latency bounded, avoids serverless timeouts, and means a visitor can never trigger paid inference.

**The API surface is read-only.** The app has no user accounts, so rather than half-building authentication, every route under `src/app/api` is a `GET`. There are no `POST`, `PUT`, `PATCH`, or `DELETE` handlers, and a test enforces that:

```
__tests__/structure/api-surface.test.js
```

**Seven routes, each reachable from a page.** Anything not reachable from a rendered page was deleted rather than left orphaned.

| Route | Serves |
|---|---|
| `GET /api/languages/available` | catalogue, active languages only |
| `GET /api/courses` | course list, filterable by language |
| `GET /api/stats` | platform totals |
| `GET /api/languages/[code]/level/[level]/skills` | skills + lessons for a level |
| `GET /api/lessons/[id]` | a lesson and its content |
| `GET /api/lessons/[id]/textbook-content` | structured lesson view |
| `GET /api/skills/[id]/processed-lessons` | generated lessons for a skill |

**Skills relate to courses through a join table** (`course_skills`), not a foreign key on `skills`. This matters because a skill can appear in more than one course level.

## Running locally

Requires Node 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL
npm run dev               # http://localhost:3000
```

A local Postgres is available via `docker-compose up -d` if you'd rather not point at a hosted instance. Schema lives in `migrations/`, applied in numeric order.

```bash
npm run lint
npm test
npm run build
```

`OPENAI_API_KEY` is only needed to run the content-generation scripts — the app itself does not use it.

## Repository layout

```
src/app/          routes: pages and API handlers
components/       lesson player and lesson-section renderers
lib/              database access, OpenAI client, content models
migrations/       SQL schema, applied in numeric order
scripts/          offline content-generation and validation pipeline
__tests__/        API contract and structural tests
```

## Known limitations

- **One language has content.** Welsh and Croatian exist in the schema but have no lessons, so they are deactivated rather than shown as empty. `migrations/014` does this.
- **No user accounts.** Progress is not persisted between visits. This is deliberate — see the read-only API note above.
- **Some lesson content is templated.** `textbook-content` falls back to structured templates when a lesson has no generated dialogue.
