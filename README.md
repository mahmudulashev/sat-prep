# Satify — Digital SAT practice

Full-length digital SAT practice in a test interface modeled on the real exam, with
exam lockdown, daily test limits and score analytics.

## Features

- **Three tests** that follow the digital SAT structure
  - Math: 2 modules × 22 questions (35 min each)
  - Reading and Writing: 2 modules × 27 questions (32 min each)
  - Full-length: both sections (98 questions) with a 10-minute break, scored 400–1600
- **Test interface**: split passage view with a resizable divider, answer eliminator,
  mark for review, question navigator, Check Your Work page, highlighter, line reader,
  graphing and scientific calculator, math reference sheet, student-produced responses
  with answer preview, timers per module
- **Lockdown**: full-screen only, blocked developer-tools / view-source / copy-paste
  shortcuts and right-click, tab-switch and developer-tools detection, 3 warnings then
  automatic submission; every event is logged with the attempt
- **Daily limits** enforced in the database: guests 1 test/day (by cookie and hashed
  IP), signed-in users 3 tests/day (resets 00:00 UTC)
- **Server-side scoring**: answer keys never reach the browser; timing and grading
  are done in Postgres
- **Score report**: scaled scores, domain breakdown, skill radar, difficulty and
  timing charts, and a full question review with explanations

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres,
Auth, RLS) · Recharts · KaTeX · Zod

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

### Database

1. Create a Supabase project and run the files in `supabase/migrations` in order.
2. Generate a server secret and store its SHA-256 hash in the database:

   ```bash
   openssl rand -hex 32            # -> EXAM_SERVER_SECRET in .env.local
   printf %s "<secret>" | shasum -a 256
   ```

   ```sql
   insert into private.config (key, value) values ('server_secret_sha256', '<hash>');
   ```

3. Load the question bank and tests:

   ```bash
   npm run seed -- --push
   ```

Questions live in `content/questions/*.ts` and test forms in `content/tests.ts`.
`npm run seed` validates them and regenerates `supabase/seed.sql`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run seed` | Validate content and write `supabase/seed.sql` (`-- --push` uploads it) |

## Notes

- Browsers don't allow a website to fully disable developer tools or prevent leaving
  full screen. The lockdown detects and records these actions, warns the student and
  submits the test after repeated violations; answers are graded on the server so
  inspecting the page reveals nothing useful.
- Full screen is required in production builds; development builds continue without
  it when the browser refuses (for example inside embedded previews).

SAT is a trademark of the College Board, which is not affiliated with this project.
All questions are original.
