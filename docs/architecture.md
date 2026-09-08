# Architecture

Football Team Organizer is a server-rendered Next.js application backed by
Supabase (PostgreSQL + Auth). This document records the system's components,
boundaries, and the decisions that shape them — not every class or function.
Read it before introducing a new pattern so the codebase stays internally
consistent.

---

## System diagram

```
Browser (React / Next.js RSC + Client Components)
   │
   ▼
Vercel (Next.js App Router — SSR + edge middleware)
   │
   ├── Supabase Auth   (email/password + Google OAuth, invite-only)
   ├── PostgreSQL       (all application data, RLS-protected)
   └── Supabase Storage (club crest / team photo uploads)

External
   ├── Email relay (SMTP)     — invite / Auth emails (tested with Resend)
   ├── DNS domain             — public app origin and Auth redirect URLs
   ├── Google Cloud Platform  — Google OAuth client; optional Maps Embed
   └── GitHub                 — CI/CD (Actions) and source control
```

No separate API server. The Next.js app is the only server-side process; all
database access goes through the Supabase JavaScript client (`@supabase/ssr` for
SSR/server, `@supabase/supabase-js` for the browser client).

---

## Major components

### Next.js App Router (`src/app/`)

All routes use the App Router. The file-system hierarchy is:

```
src/app/
  (auth)/           — unauthenticated pages: /login, /no-access, /onboarding/*
  (app)/            — authenticated shell with header and team switcher
    dashboard/
    team/
    players/[id]/
    matches/[id]/
    ...
  api/              — route handlers for server-side mutations (invites, etc.)
```

**Server Components** are the default. They fetch data directly from Supabase
using the SSR client (no extra round-trip). **Client Components** (`"use client"`)
are only used when interactivity is needed: forms, charts, the team switcher,
and real-time UI.

**Server Actions** handle mutations (form submits, CRUD). They run on the server,
perform an auth check, then call Supabase. Prefer Server Actions over route
handlers for in-page mutations.

### Middleware (`src/middleware.ts`)

Runs on every request at the edge. Responsibilities:

1. Refresh the Supabase Auth session cookie (`updateSession`).
2. Redirect unauthenticated visitors to `/login`.
3. Call the `has_app_access` RPC — reject sessions where the linked `people`
   row is missing, disabled, or has no club/team role (sends them to `/no-access`).

The middleware is the first gate; RLS is the second. Both must hold.

### Supabase clients

| Client               | File                         | Used in                                                                |
| -------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| SSR (server)         | `src/lib/supabase/server.ts` | Server Components, Server Actions, middleware                          |
| Browser              | `src/lib/supabase/client.ts` | Client Components                                                      |
| Admin (service role) | `src/lib/supabase/admin.ts`  | Server Actions / route handlers that need to bypass RLS (invites only) |

**Rule:** `admin.ts` (service role) must never be imported from a Client
Component or a file reachable from one. CI runs `npm run check:client-secrets`
to catch any accidental leakage of `SUPABASE_SERVICE_ROLE_KEY` into the browser
bundle.

### Data-access layer (`src/lib/`)

Thin helpers and typed query functions live under `src/lib/`. They accept the
appropriate Supabase client as a parameter so they work in both server and client
contexts. Generated TypeScript types from `src/lib/supabase/database.types.ts`
provide end-to-end type safety. Regenerate after schema changes:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

### UI components (`src/components/`)

Built on **shadcn/ui** primitives (Radix UI + Tailwind). Icons from **Lucide
React**. Charts from **Recharts** (lazy-loaded on `/stats` to keep the initial
bundle small). Custom shared components (skeletons, `EmptyState`, `ErrorBanner`,
`FormStrip`) live here.

---

## Authentication and authorisation

### Authentication

Supabase Auth handles sessions. The app uses **email/password** and **Google OAuth** only. Magic
links and OAuth providers (with the exception of Google) are out of scope for the current
version.

Access is **invite-only**. There is no public registration UI. A signed-in user
is only allowed into the app when:

1. Their `auth.users` UUID is linked to a `people` row (`people.auth_user_id`).
2. That person's `account_status` is `invited` or `active`.
3. That person holds at least one role: club manager, `team_members` row,
   guardian, or player.

The `has_app_access(uuid)` RPC (SECURITY DEFINER) checks all three conditions.
Middleware calls it on every authenticated request.

### Authorisation

Row Level Security (RLS) is enabled on every table. Policies never reference
another RLS-protected table directly (that causes recursion); instead they call
**SECURITY DEFINER helper functions** that accept the relevant columns as
arguments:

| Helper                               | Guards                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `is_club_management(club_id)`        | Club-level manager check                                              |
| `is_club_staff(club_id)`             | Manager or coach on any team in the club                              |
| `can_read_club(club_id)`             | Any member of the club                                                |
| `can_read_team(team_id)`             | Any member on that team                                               |
| `can_edit_team(team_id)`             | Coach or management on that team                                      |
| `can_edit_match_day(team_id)`        | Coach, management, or guardian assistant                              |
| `can_read_player(player_id)`         | Any member of the player's club                                       |
| `can_view_player_contact(player_id)` | Management, the player's coaches, guardians, or the player themselves |
| `can_edit_player(player_id)`         | Management or the player's coaches                                    |

The admin (service role) client bypasses RLS. It is used only in controlled
server-side paths (invite and onboarding). Keep that list short.

### Role model

Roles are additive and scoped. A single login can be:

- Club **management** (full club read/write via `managers` table)
- Team **coach** (write own teams, read all club teams)
- **Guardian** (read their player's teams; write linked player contact)
- **Guardian assistant** (coach read/write for match-day data, minus POTM)
- **Player** (read own teams; write own contact) - although Players do not currently have ability to login

Team roles live in `team_members` (one row per `(team, user, role)`). Coach
write access keys off `team_members.role = 'coach'`, not the `coaches` profile
table alone. See [`docs/roles.md`](roles.md) for full permission tables.

---

## Data flow

```
Browser
  │
  ├─ Server Components / Server Actions ──► Supabase SSR client
  │                                             │
  └─ Client Components (forms, charts)  ──► Supabase browser client
                                              │
                                              ▼
                                    Supabase Auth + PostgreSQL
                                    (RLS enforced on every query)
```

- **Reads:** prefer Server Components — data is fetched server-side, no
  client-side waterfall.
- **Writes:** Server Actions or API route handlers. Always run server-side,
  always check session.
- **Real-time / optimistic updates:** not used in the current version. The
  browser client is available for future use.

---

## External dependencies

| Dependency            | Purpose                                                                                                                                      | Required                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Supabase (hosted)     | Auth, PostgreSQL, Storage                                                                                                                    | Yes                                                   |
| Vercel                | Hosting, edge middleware, preview deployments                                                                                                | Yes (for hosted)                                      |
| Email relay (SMTP)    | Invite and Auth emails via Supabase SMTP. Tested with [Resend](https://resend.com); other SMTP providers work if Auth is configured for them | Yes (for invites / Auth email)                        |
| DNS domain            | Public app origin (`NEXT_PUBLIC_APP_URL`), Auth Site URL, and redirect allow-list                                                            | Yes (for hosted)                                      |
| Google Cloud Platform | Google OAuth client credentials for Supabase Auth; optional Maps Embed API key for venue iframes                                             | OAuth yes if Google sign-in is enabled; Maps optional |
| GitHub                | Source control and CI/CD (lint / test / build, production-source gate, database backups)                                                     | Yes (for hosted workflow)                             |
| AWS S3                | Daily database backup destination                                                                                                            | No — only for the backup workflow                     |

Supabase remains the primary runtime dependency for data and auth. Email relay,
DNS, GCP (OAuth), and GitHub are required for a complete hosted setup; Maps and
S3 are optional or background-only.

---

## Key architectural decisions

### Single Supabase project per environment

Each environment (integration, production) has its own Supabase project with
its own database, Auth configuration, and set of env vars. There is no shared
schema or cross-environment data path.

### RLS as the primary data security boundary

The anon key is safe to expose in the browser because RLS policies enforce all
access rules. The service role key bypasses RLS and is treated as a server-side
secret — never shipped to the client bundle.

### No public registration

Bootstrap requires a seed + SQL step to create the first club manager. All
subsequent users arrive via the invite flow. This limits attack surface and
keeps the user list controlled.

### Server-first rendering

Server Components are the default. Client Components are opted into
(`"use client"`) only where browser APIs or interactivity require it. This keeps
the client bundle small and avoids unnecessarily re-fetching data the server
already has.

### Seasons via archive and migrate (no `seasons` table)

There is no separate `seasons` table. Each `teams` row carries a
`season_label` (e.g. `2025/26`) and an optional `archived_at`.

When a season ends, management **archives** the team and **starts a new season**
(`startNewTeamSeason`): create a successor team for the next label, optionally
migrate squad and coaching staff, always copy coach/management app access, then
archive the source. Match history stays on the archived team record.

Archived teams remain selectable and **read-only** (historical fixtures, results,
stats). Do not invent a global seasons entity without an explicit design change;
season progression is team-row archive + successor, not overwrite-in-place.

### No per-team URL prefixes

The app uses an **active-team switcher** in the header rather than
`/teams/[id]/…` routes. Team context is stored in a cookie/session. Do not
introduce team-prefixed routes without a design decision.
