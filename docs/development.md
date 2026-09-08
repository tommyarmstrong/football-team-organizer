# Development

Everything you need to work on Football Team Organizer locally.

- [Architecture](architecture.md) — system design and decisions
- [Deployment](deployment.md) — Vercel and Supabase hosting
- [Configuration](configuration.md) — environment variables

---

## Prerequisites

- **Node.js 20+** and **npm**
- A [Supabase](https://supabase.com) project (hosted, or local CLI + Docker)
- Git

---

## Repository setup

```bash
git clone https://github.com/tommyarmstrong/football-team-organizer
cd football-team-organizer
npm install
cp .env.example .env.local
```

Fill in `.env.local` — see [Configuration](configuration.md).

---

## Environment variables

| Variable                                | Where to find it                                     |
| --------------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`              | Supabase → Project Settings → API → Project URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | Supabase → Project Settings → API → Publishable key  |
| `SUPABASE_SERVICE_ROLE_KEY`             | Supabase → Project Settings → API → Service role key |
| `NEXT_PUBLIC_APP_URL`                   | `http://localhost:3000` locally                      |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` | Google Cloud Console (optional)                      |
| `VERCEL_OIDC_TOKEN`                     | Written by `vercel env pull` into `.env.local`       |

Full variable reference and security notes: [Configuration](configuration.md).

### `VERCEL_OIDC_TOKEN` in `.env.local`

After linking the project to Vercel, pull Development env into `.env.local`:

```bash
npx vercel link
npx vercel env pull .env.local
```

That writes `VERCEL_OIDC_TOKEN` (and any other Development-scoped Vercel env
vars). The token is short-lived (about 12 hours); re-run `vercel env pull` if
local Vercel-authenticated calls start failing. Never commit the real token —
`.env.local` is gitignored; `.env.example` only documents the placeholder.

---

## Local database

### Option A — hosted Supabase project (simplest)

Point `.env.local` at a hosted Supabase project and push migrations:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then seed:

```bash
npx supabase db query --linked -f supabase/seed.sql
```

### Option B — local Supabase via Docker

Requires Docker.

```bash
npx supabase start
```

This applies all files under `supabase/migrations/` automatically.
Auto-seed is disabled — load the seed manually:

```bash
npx supabase db query -f supabase/seed.sql
```

Read the local URL and keys:

```bash
npx supabase status
```

Copy those values into `.env.local`.

### After seeding — link the first manager

The seed creates club manager **John Hall**
(`people.id` = `b0000000-0000-4000-8000-000000000001`) with no Auth user linked.

1. Create an Auth user in the Supabase dashboard (Authentication → Users → Add
   user). For local work, disable "Confirm email" under Auth settings to skip
   the confirmation step.
2. In Table Editor → `people`, set John Hall's `auth_user_id` to that UUID and
   `account_status` to `active`.

Without this step, every sign-in lands on `/no-access`.

### Creating migrations

```bash
npx supabase migration new <migration-name>
```

This creates a new timestamped file in `supabase/migrations/`. Write your SQL
there. Keep migrations idempotent where possible. Push with:

```bash
npx supabase db push
```

Migrations are the authoritative schema source — do not edit the database
directly in production.

### Regenerating TypeScript types

After a schema change, regenerate the checked-in types:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

---

## Starting the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app redirects to
`/login`.

---

## Running tests

```bash
npm test           # run once (CI uses this)
npm run test:watch # watch mode while developing
```

Tests use [Vitest](https://vitest.dev/) (`vitest.config.ts`). Suites live next to
source as `src/**/*.test.ts`. The suite mocks Supabase — it does not need a live
database.

### Coverage

Coverage uses the Vitest **v8** provider (`@vitest/coverage-v8`). Config lives
under `coverage` in `vitest.config.ts`: it includes `src/**/*.{ts,tsx}` and
excludes Supabase generated/client helpers, shadcn UI primitives, test helpers,
and `*.test.ts` files themselves.

```bash
npx vitest run --coverage
```

Open the HTML report under `coverage/` (gitignored) after a run. There is no
enforced coverage threshold in CI today — CI runs `npm test` without
`--coverage`. Treat coverage as a local / PR hygiene signal:

- Prefer a colocated `*.test.ts` for new logic under `src/lib/` (parsers,
  actions, data helpers, authz).
- When changing behaviour, extend the nearest existing test rather than only
  adding a manual check.
- Do not chase 100% on UI shells or generated types; focus on branching logic
  and security-sensitive paths (auth, invites, RLS-shaped helpers, archive /
  season migration).

---

## Linting

```bash
npm run lint
```

[ESLint](https://eslint.org/) with Next.js and TypeScript rules. Pre-commit hooks
run ESLint on staged files automatically (via Husky + lint-staged).

---

## Formatting

```bash
npm run format         # write
npm run format:check   # check only (used in CI)
```

[Prettier](https://prettier.io/) is the formatter. Pre-commit hooks also run
Prettier on staged files. The CI pipeline fails if `format:check` finds
unformatted files.

---

## Branching

Use the `feat/<description>` branch naming convention (or
`feat/<ticket-id>-<description>` when there is a ticket).

```bash
git checkout main
git pull origin main
git checkout -b feat/my-feature
```

### Environments and branches

| Branch       | Deploys to            | Supabase project |
| ------------ | --------------------- | ---------------- |
| `main`       | Integration (Vercel)  | Integration      |
| `production` | Production (Vercel)   | Production       |
| PR branches  | Vercel preview per PR | —                |

`main` is the integration environment. **Do not deploy directly to production**
— promote via PR from `main` into `production` (see [Deployment](deployment.md)).

---

## Pull requests

1. Open a PR from your feature branch into `main`.
2. GitHub Actions runs: `lint` → `format:check` → `test` → `build` → client
   bundle secret scan.
3. A Vercel preview deployment is created for the PR.
4. `main` is protected — a green **Lint, test, and build** check is required
   before merge.
5. To promote to production, open a PR from `main` into `production`. The
   `production-source` check enforces that the head branch is `main`.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(matches): add meet-up time to fixture
fix(rls): correct guardian assistant policy
docs(readme): update install steps
```
