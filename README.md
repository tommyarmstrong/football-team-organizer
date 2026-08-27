# Football Team Organizer

Record match fixtures and results, players, and goals for a youth football team.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (PostgreSQL + Auth) · Vercel

Product scope and staged plan: [`docs/requirements.md`](docs/requirements.md)

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project

## Setup

```bash
npm install
cp .env.example .env.local
```

In Supabase **Project Settings → API**, set:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL only, e.g. `https://xxxxx.supabase.co` (no `/rest/v1/` suffix)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **Publishable** key

In Supabase **Authentication → Providers**, ensure **Email** is enabled (password).

Create a coach user under **Authentication → Users** (Add user), or sign up once if you enable public sign-up. For local MVP, creating the user in the dashboard and disabling “Confirm email” under Auth settings avoids confirmation friction.

### Database (Stage 4)

Apply the baseline schema (`supabase/migrations/20260825000000_schema.sql`) once on an empty database, then seed one team + membership.

**Option A — Supabase CLI (linked project)**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B — SQL Editor**

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

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should be redirected to `/login`.

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

Pre-commit hooks run `lint-staged` (ESLint + Prettier on staged files) via Husky. They do **not** run the full test suite.

## CI / CD

| Stage                                                                   | When                        | What runs                                                          |
| ----------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| Pre-commit                                                              | Local `git commit`          | ESLint + Prettier on staged files only                             |
| GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) | Every PR and push to `main` | `lint`, `format:check`, `test`, `build`, client-bundle secret scan |
| Vercel                                                                  | After push / PR             | Next.js deploy (preview or production)                             |

**Gate:** `main` requires a pull request and a green **Lint, test, and build** check before merge. That keeps failed CI from landing on `main` and triggering a production deploy. Preview deploys still build on the PR in parallel with Actions.

## Development stages

1. **Requirements** — living brief in `docs/requirements.md`
2. **Scaffolding** — complete
3. **Wiring** — Supabase auth + protected shell (complete; connect Vercel with env vars)
4. **Schema** — migrations, RLS, membership gate, types, seed (complete; apply SQL to your Supabase project)
5. **Features** — team → players → matches → goals → dashboard → stats
6. **Polish** — empty/loading/error states, a11y, branding

## Deploy (Vercel)

The GitHub repo is linked to the Vercel project **football-team-organizer**. Deploys:

- **`main`** (after merge) → production
- **PR branches** → preview

Repo config: [`vercel.json`](vercel.json) (Next.js + Git deployments enabled). Production changes should go through a PR so GitHub Actions can block a bad merge.

### One-time setup (already done for this project)

1. Create/link the Vercel project and connect GitHub:
   ```bash
   npx vercel project add football-team-organizer
   npx vercel link --yes --project football-team-organizer
   npx vercel git connect https://github.com/tommyarmstrong/football-team-organizer --yes
   ```
2. Set env vars for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — **SERVER-ONLY**. Do not prefix with `NEXT_PUBLIC_`. In the Vercel dashboard, add it as a Sensitive secret, limit which team members can access Environment Variables, and set it for Production and Preview (invites need it on both). Never commit the real value.
   - `NEXT_PUBLIC_APP_URL` — public origin used in invitation links (production domain)
   ```bash
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development
   npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production,preview,development
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY production,preview
   npx vercel env add NEXT_PUBLIC_APP_URL production,preview
   ```
3. Push to `main` (or open a PR) to trigger a deployment.

Dashboard: [vercel.com/tommyarmstrongs-projects/football-team-organizer](https://vercel.com/tommyarmstrongs-projects/football-team-organizer)

In Supabase **Authentication → URL Configuration**:

- **Site URL** — your public origin only (e.g. `https://your-domain.com`), not `/login`. Invite and reset emails fall back to this URL when `redirectTo` is not allow-listed.
- **Redirect URLs** — include:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/auth/confirm`
  - `https://your-domain.com/auth/invite`
  - `https://your-domain.com/auth/reset-password`
  - or a wildcard such as `https://your-domain.com/auth/**`

**Email templates (required for reliable invite/reset):** single source of truth is `supabase/templates/`. Local `supabase start` loads them via `config.toml`. For **hosted** Supabase, paste each file into **Authentication → Email Templates** (and enable security notifications where noted):

| Dashboard template    | File in repo                                                 | Notes                                                       |
| --------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Invite user           | `supabase/templates/invite.html`                             | Uses `{{ .ConfirmationURL }}`; club/user from `{{ .Data }}` |
| Reset password        | `supabase/templates/recovery.html`                           | `token_hash` → `/auth/confirm` → `/auth/reset-password`     |
| Confirm signup        | `supabase/templates/confirmation.html`                       |                                                             |
| Magic link            | `supabase/templates/magic_link.html`                         |                                                             |
| Change email address  | `supabase/templates/email_change.html`                       |                                                             |
| Reauthentication      | `supabase/templates/reauthentication.html`                   | OTP via `{{ .Token }}`                                      |
| Password changed      | `supabase/templates/password_changed_notification.html`      | Enable security notification                                |
| Email address changed | `supabase/templates/email_changed_notification.html`         | Enable security notification                                |
| Phone number changed  | `supabase/templates/phone_changed_notification.html`         | Enable security notification                                |
| Identity linked       | `supabase/templates/identity_linked_notification.html`       | Enable security notification                                |
| Identity unlinked     | `supabase/templates/identity_unlinked_notification.html`     | Enable security notification                                |
| MFA method added      | `supabase/templates/mfa_factor_enrolled_notification.html`   | Enable security notification                                |
| MFA method removed    | `supabase/templates/mfa_factor_unenrolled_notification.html` | Enable security notification                                |

Templates personalize with `{{ .Data.first_name }}` and `{{ .Data.club_name }}` from Auth user metadata (set on invite). Do not hardcode a club name in the HTML.

Also configure hosted Auth:

- **Password**: minimum length 8; requirements lowercase + uppercase + digits (matches `supabase/config.toml`).
- **Sessions**: timebox `24h` so sessions expire after 24 hours.

The recovery template uses `token_hash` + `/auth/confirm` (`verifyOtp`) so reset links work on any device. The default `{{ .ConfirmationURL }}` PKCE recovery links need a same-browser code verifier and often fail with “PKCE code verifier not found in storage.” Until the hosted Recovery template is updated, the app requests reset emails with the implicit Auth flow so Supabase’s default ConfirmationURL returns hash tokens instead of a PKCE `code`.

The app also handles Site URL `/login` fallbacks: it forwards invite tokens to `/auth/invite` and recovery tokens to `/auth/reset-password`.
