<!-- BEGIN:git-agent-rules -->

# Git Rules

Always follow these rules.

## Before editing

FIRST ACTION — run:

```
git rev-parse --abbrev-ref HEAD
git fetch origin
```

Then choose base for work:

1. **Depends on open feature branch / unmerged PR**  
   Stay on feature branch, or create child branch from it (`git checkout -b feat/<ticket-id>-<description>`). Do **not** branch from `main` if the new work needs those unmerged commits.

2. **Independent of open PRs**  
   Refresh and branch from up-to-date `main` (never from a stale local `main`):

```
git checkout main
git pull origin main
git checkout -b feat/<ticket-id>-<description>
```

3. **Already on `main`, `master`, or `develop`**  
   Create feature branch before editing (same commands as independent work above).

Only after the correct branch is checked out may you edit files.

Branch names use `feat/<ticket-id>-<description>` (or `feat/<description>` when there is no ticket). Prefer this over `feature/`.

## After completing feature

Commit using **Conventional Commits**:

Format: `<type>(<scope>): <short description>`

Examples:

- feat(auth): add invite-only registration
- fix(api): handle expired JWT tokens
- docs(readme): update installation steps
- refactor(db): simplify query builder
- test(auth): add login integration tests
- chore(ci): upgrade GitHub Actions

Push the feature branch and open a PR into `main`. Do not merge directly to `main` when branch protection requires a PR.

Further commits for the same open PR go on that same feature branch (or a stacked child branch if a separate review is needed).

<!-- END:git-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Dependencies are refreshed automatically by the startup script (`npm install`). Node 20+ is required.

Full local/hosted setup: `docs/install.md` and `docs/deploy.md`. Roles and
invite-only access: `docs/roles.md`.

### Services

- **Web app** — Next.js (App Router). Standard scripts live in `package.json`: `npm run dev` (http://localhost:3000), `npm run build`, `npm run lint`, `npm run format:check`, `npm test`, `npm run check:client-secrets`. CI (`.github/workflows/ci.yml`) runs `lint` → `format:check` → `test` → `build` → client-bundle secret scan.
- **Supabase** (Postgres + Auth) — required for anything past `/login`. The repo targets a hosted Supabase project by default, but for local end‑to‑end work run the Supabase CLI stack (`npx supabase start`), which needs Docker.

### `npm run build` without a real backend

`next build` only needs placeholder Supabase env to compile: `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`.

### Running the app end-to-end against local Supabase (non-obvious gotchas)

Access is **invite-only**. There is no public register UI. Sign-in requires a
`people` row with `account_status` of `invited` or `active`, plus app access
(manager / `team_members` / guardian / player). Club create requires an existing
manager — `/no-access` cannot bootstrap the first club.

`npx supabase start` applies **all** files under `supabase/migrations/` (not
only the baseline). Auto-seed is disabled in `supabase/config.toml`.

1. Load `supabase/seed.sql` (SQL Editor or `npx supabase db query -f supabase/seed.sql`). The seed does **not** create Auth users or set `auth_user_id`.
2. Create an Auth user (Dashboard → Authentication → Users, or Admin API with the service role key).
3. Link club manager **John Hall** (`people.id` `b0000000-0000-4000-8000-000000000001`): set `auth_user_id` to that Auth UUID and `account_status` to `active`.

`.env.local` (gitignored) needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (required for invites) — read the values from `npx supabase status`.
