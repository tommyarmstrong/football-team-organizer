# Install locally

Run Football Team Organizer on your machine against a Supabase project.

The public overview is in the [README](../README.md). Production hosting is in
[Deploy](deploy.md).

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project (hosted, or local CLI + Docker)

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (PostgreSQL +
Auth)

## Setup

```bash
npm install
cp .env.example .env.local
```

In Supabase **Project Settings → API**, set:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL only, e.g. `https://xxxxx.supabase.co`
  (no `/rest/v1/` suffix)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **Publishable** key

`SUPABASE_SERVICE_ROLE_KEY` is **server-only**. Do not prefix it with
`NEXT_PUBLIC_`. It is required for invite and onboarding admin APIs (even for
local invite testing).

Optional:

- `NEXT_PUBLIC_APP_URL` — public origin used in invitation redirect links (local
  default `http://localhost:3000`)
- `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` — venue map iframes; without it, venue
  pages still embed via a maps search query

In Supabase **Authentication → Providers**, ensure **Email** is enabled
(password).

### Access model (invite-only)

The app does **not** offer public registration. Login is sign-in only. A signed-in
Auth user can use the app only when:

1. They are linked to a `people` row with `account_status` of `invited` or
   `active`, and
2. That person has app access (club manager, `team_members` row, guardian, or
   player — see [Roles](roles.md)).

New logins come from the People invite flow (`person_invitations` →
`/onboarding/accept`, or Supabase Auth invite → `/auth/invite`). Creating an Auth
user alone is not enough.

The first club manager cannot be created from the empty `/no-access` UI (club
create is restricted to existing managers). Bootstrap via seed or SQL as below.

## Database

Apply **all** migrations under `supabase/migrations/` in timestamp order (not
only the baseline file). Then seed.

### Option A — Supabase CLI (preferred)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then load the seed (SQL Editor, or):

```bash
npx supabase db query --linked -f supabase/seed.sql
```

### Option B — SQL Editor

1. Open Supabase Dashboard → **SQL** → New query
2. Run every file in `supabase/migrations/` in filename order
3. Run `supabase/seed.sql`

If a project already applied an older migration history, do not re-run files that
are already recorded; use `npx supabase migration list` /
`npx supabase migration repair` to align CLI history.

### After seeding — link the first manager

The seed creates club manager **John Hall**
(`people.id` `b0000000-0000-4000-8000-000000000001`) with
`account_status = 'none'` and **no** `auth_user_id`. It does not insert Auth
users or `team_members` for a login.

1. Create a user in Supabase **Authentication → Users** (Add user). For local
   MVP, disabling “Confirm email” under Auth settings avoids confirmation
   friction.
2. In **Table Editor → people**, set John Hall’s `auth_user_id` to that Auth
   user UUID and `account_status` to `active`.

Without that link (or an equivalent invited/active person with a role), sign-in
is rejected or the user lands on `/no-access`.

Regenerate TypeScript types after schema changes (optional; checked-in types live
at `src/lib/supabase/database.types.ts`):

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should be redirected to
`/login`.

## Local Supabase (optional)

```bash
npx supabase start
```

That applies `supabase/migrations/`. Auto-seed is disabled in
`supabase/config.toml` — load `supabase/seed.sql` yourself, then link John Hall
as above.

Read URL and keys from `npx supabase status` into `.env.local`.

Local `config.toml` may still allow Auth signup; the app still gates uninvited
users. Prefer invite flows that match production.

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

`next build` can compile without a real backend if you pass placeholder env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
npm run build
```

Pre-commit hooks run `lint-staged` (ESLint + Prettier on staged files) via Husky.
They do **not** run the full test suite.

## Further reading

- [Deploy](deploy.md) — Vercel, CI, Auth URLs, email templates
- [Roles](roles.md)
- [Product brief](requirements.md)
- [Data objects](data_objects.md)
- [People, auth, and onboarding](people_auth_onboarding_design.md)
- [Operations runbook](operations-runbook.md) — database backups
