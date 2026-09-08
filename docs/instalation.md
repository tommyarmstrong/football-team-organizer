# Installation

Run Football Team Organizer on your machine against a Supabase project.

- [Configuration](configuration.md) — full environment variable reference
- [Development](development.md) — running tests, linting, branching, PRs

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

## Access model

The app does **not** offer public registration. Sign-in only. A signed-in Auth
user can use the app only when:

1. They are linked to a `people` row with `account_status` of `invited` or
   `active`, and
2. That person has app access — a club manager row, a `team_members` row, a
   guardian role, or a player role. See [Roles](roles.md).

New logins come from the invite flow (`person_invitations` → `/onboarding/accept`,
or Supabase Auth invite → `/auth/invite`). Creating an Auth user alone is not
enough.

The first club manager cannot be bootstrapped from the empty `/no-access` UI —
use the seed or SQL as described below.

---

## Local database

Apply **all** migrations under `supabase/migrations/` in timestamp order, then
seed.

### Option A — Supabase CLI (preferred)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then seed (bootstrap — club + first manager only):

```bash
npx supabase db query --linked -f supabase/seed.sql
```

For the England demo dataset (venues, squads, matches, FA branding), load
`supabase/england.sql` alone or after `seed.sql`:

```bash
npx supabase db query --linked -f supabase/england.sql
```

If a project already applied an older migration history, don't re-run recorded
files. Use `npx supabase migration list` / `npx supabase migration repair` to
align the CLI state.

### Option B — SQL Editor

1. Open Supabase Dashboard → **SQL** → New query
2. Run every file in `supabase/migrations/` in filename order
3. Run `supabase/seed.sql` (bootstrap). Optionally run `supabase/england.sql`.

### Option C — local Supabase via Docker

Requires Docker.

```bash
npx supabase start
```

This applies all files under `supabase/migrations/` automatically. Auto-seed is
disabled — load seeds manually:

```bash
npx supabase db query -f supabase/seed.sql
# optional demo data:
npx supabase db query -f supabase/england.sql
```

Read the local URL and keys into `.env.local`:

```bash
npx supabase status
```

Local `config.toml` may allow Auth signup; the app still gates uninvited users.
Prefer invite flows that match production.

### After seeding — link the first manager

Both `seed.sql` and `england.sql` create club manager **John Hall**
(`people.id` = `b0000000-0000-4000-8000-000000000001`) with `account_status =
'none'` and no `auth_user_id`.

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

This creates a new timestamped file in `supabase/migrations/`. Keep migrations
idempotent where possible. Push with:

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

## Scripts

| Command                        | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `npm run dev`                  | Local development server                                 |
| `npm run build`                | Production build                                         |
| `npm run start`                | Serve production build                                   |
| `npm run lint`                 | ESLint                                                   |
| `npm run format`               | Prettier write                                           |
| `npm run format:check`         | Prettier check                                           |
| `npm test`                     | Vitest unit tests                                        |
| `npm run test:watch`           | Vitest watch mode                                        |
| `npm run check:client-secrets` | Assert service-role key is not in the client bundle (CI) |

`next build` compiles without a real backend using placeholder env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
npm run build
```
