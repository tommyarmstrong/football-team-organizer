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

### Services

- **Web app** — Next.js (App Router). Standard scripts live in `package.json`: `npm run dev` (http://localhost:3000), `npm run build`, `npm run lint`, `npm run format:check`, `npm test`. CI (`.github/workflows/ci.yml`) runs `lint` → `format:check` → `test` → `build`.
- **Supabase** (Postgres + Auth) — required for anything past `/login`. The repo targets a hosted Supabase project by default (see `README.md`), but for local end‑to‑end work run the Supabase CLI stack (`npx supabase start`), which needs Docker.

### `npm run build` without a real backend

`next build` only needs placeholder Supabase env to compile: `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`.

### Running the app end-to-end against local Supabase (non-obvious gotchas)

`npx supabase start` applies `supabase/migrations/` but there are three gotchas that block a working login unless handled:

1. **Table grants (permission denied).** Migrations only `grant execute` on functions — they never grant table privileges, relying on the hosted project's legacy default privileges. Newer local Supabase CLI does NOT grant DML on `postgres`-owned tables to `anon`/`authenticated`, so PostgREST returns `permission denied for table ...` and the app shows "No team found". After `supabase start`, grant them (RLS still enforces row access):
   ```sql
   grant all on all tables in schema public to anon, authenticated, service_role;
   grant all on all sequences in schema public to anon, authenticated, service_role;
   alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
   alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
   ```
2. **Seed needs a matching Auth user.** `supabase/seed.sql` hardcodes an Auth user UUID and inserts `team_members` for it; without that Auth user the seed fails FK checks and a logged-in user has no team. Create an Auth user first (e.g. via `POST /auth/v1/admin/users` with the service role key), then substitute its id for the placeholder `05b5a111-…397b` when loading the seed. Auto-seed is disabled in `supabase/config.toml` for this reason.
3. **Seed row ordering.** `seed.sql` inserts `team_members` for the England team (`bbbb…`) before that team is created later in the same transaction, so a straight load fails on `team_members_team_id_fkey`. Load it with FK triggers off: prepend `set session_replication_role = replica;` and append `reset session_replication_role;` around the seed when applying it locally.

`.env.local` (gitignored) needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` — read the values from `npx supabase status`. Test login used during setup: `coach@example.com` / `Password123!`.
