# Install locally

Run Football Team Organizer on your machine against a Supabase project.

The public overview is in the [README](../README.md). Production hosting is in [Deploy](deploy.md).

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project (hosted, or local CLI + Docker)

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (PostgreSQL + Auth)

## Setup

```bash
npm install
cp .env.example .env.local
```

In Supabase **Project Settings → API**, set:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL only, e.g. `https://xxxxx.supabase.co` (no `/rest/v1/` suffix)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **Publishable** key

`SUPABASE_SERVICE_ROLE_KEY` is **server-only**. Do not prefix it with `NEXT_PUBLIC_`. It is required for invite and onboarding admin APIs.

Optional:

- `NEXT_PUBLIC_APP_URL` — public origin used in invitation redirect links (local default `http://localhost:3000`)
- `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` — venue map iframes; without it, venue pages still embed via a maps search query

In Supabase **Authentication → Providers**, ensure **Email** is enabled (password).

Create a coach user under **Authentication → Users** (Add user), or sign up once if you enable public sign-up. For local MVP, creating the user in the dashboard and disabling “Confirm email” under Auth settings avoids confirmation friction.

## Database

Apply the baseline schema (`supabase/migrations/20260825000000_schema.sql`) once on an empty database, then seed one team + membership.

### Option A — Supabase CLI (linked project)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Option B — SQL Editor

1. Open Supabase Dashboard → **SQL** → New query
2. Paste and run `supabase/migrations/20260825000000_schema.sql`
3. Copy your Auth user UUID from **Authentication → Users**
4. Edit `supabase/seed.sql`: replace `00000000-0000-0000-0000-000000000000` with that UUID
5. Run the edited seed SQL in the SQL Editor

Without a `team_members` row, a signed-in user is redirected to `/no-access` and cannot use app routes.

The previous incremental migration chain is squashed into that one file. Use it only on an **empty** database. If a project already applied the old files, do not re-run the squash; align CLI history with `npx supabase migration list` / `npx supabase migration repair` instead.

Regenerate TypeScript types after schema changes (optional; checked-in types live at `src/lib/supabase/database.types.ts`):

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should be redirected to `/login`.

## Local Supabase (optional)

`npx supabase start` applies `supabase/migrations/` but two gotchas can still block a working login:

1. **Seed needs a matching Auth user.** `supabase/seed.sql` hardcodes an Auth user UUID and inserts `team_members` for it; without that Auth user the seed fails FK checks and a logged-in user has no team. Create an Auth user first (e.g. via `POST /auth/v1/admin/users` with the service role key), then substitute its id for the placeholder `05b5a111-…397b` when loading the seed. Auto-seed is disabled in `supabase/config.toml` for this reason.
2. **Seed row ordering.** `seed.sql` inserts `team_members` for the England team (`bbbb…`) before that team is created later in the same transaction, so a straight load fails on `team_members_team_id_fkey`. Load it with FK triggers off: prepend `set session_replication_role = replica;` and append `reset session_replication_role;` around the seed when applying it locally.

Read URL and keys from `npx supabase status` into `.env.local`.

## Scripts

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run dev`          | Local development server |
| `npm run build`        | Production build         |
| `npm run start`        | Serve production build   |
| `npm run lint`         | ESLint                   |
| `npm run format`       | Prettier write           |
| `npm run format:check` | Prettier check           |
| `npm test`             | Vitest unit tests        |
| `npm run test:watch`   | Vitest watch mode        |

`next build` can compile without a real backend if you pass placeholder env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
npm run build
```

Pre-commit hooks run `lint-staged` (ESLint + Prettier on staged files) via Husky. They do **not** run the full test suite.

## Further reading

- [Deploy](deploy.md) — Vercel, CI, Auth URLs, email templates
- [Roles](roles.md)
- [Product brief](requirements.md)
- [Data objects](data_objects.md)
- [People, auth, and onboarding](people_auth_onboarding_design.md)
