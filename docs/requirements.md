# FOOTBALL TEAM ORGANIZER — Requirements

A modern web application for organizing a youth football team.

The application tracks **players**, **match fixtures and results**, and **goals**, and provides views on results and player performance.

This document is a living product brief. It is **not** intended as a single prompt to build the entire application. Development proceeds in stages (see [Development Plan](#development-plan)), with AI assistance used to research unknowns and propose details for human review before implementation.

---

## Product summary

| Item            | Detail                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Working name    | Football Team Organizer                                                 |
| Primary users   | Club management and coaches (authenticated, email/password)             |
| Secondary users | Guardians and players (authenticated, read-only, restricted fields)     |
| Core job        | Run a club of many teams: squads, fixtures, results, goals, and scoring |
| Hosting         | Vercel (Next.js)                                                        |
| Data & auth     | Supabase (PostgreSQL + Auth)                                            |
| Teams           | A club owns **many teams** (e.g. U10 Boys, U11 Girls A/B)               |
| Season in MVP   | One season only (label on each team; no `seasons` table yet)            |

### Decided scope

| Topic              | Decision                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Club & teams       | A first-class `clubs` entity owns many `teams`. Users switch the active team in the header                                                      |
| People             | `players` and `coaches` are **club-level people** assigned to zero/one/many teams via junction tables                                           |
| Roles              | Club **management** (see/edit everything), team **coach** (edit own teams, read other club teams), **guardian/player** (read-only, their teams) |
| Field-level access | Sensitive player contact details are readable only by management, the player's coaches, guardians, and the player                               |
| Player of match    | Coaches/management set it; guardians/players can view but not edit                                                                              |
| Appearances        | **Goals only**; player appearances / minutes deferred                                                                                           |
| Opposition scorers | **Not recorded** — store opponent aggregate score (`goals_against`) only                                                                        |
| Auth               | **Email / password** only (no magic link / OAuth in MVP)                                                                                        |
| Seasons            | **One season** (`season_label` on each team); multi-season later                                                                                |

### Out of scope (v1)

The following are **not** current requirements (may be revisited later):

- Multi-club tenancy / a platform super-admin across clubs
- URL-prefixed per-team routes (`/teams/[id]/…`); the app uses an active-team switcher instead
- Email-based invitations (guardians/players/coaches are linked by their Supabase Auth user id for now)
- Multi-season history and a dedicated `seasons` table
- Player appearances / minutes played
- Opposition goal scorers or opposition squad lists
- Guardian / player / public read-only access
- Magic link, Google, or other OAuth providers
- League tables across many clubs
- Live match scoring / real-time sync during play
- Payments, subscriptions, or commerce
- Native mobile apps (responsive web only)
- Push notifications / SMS
- Video, tactics boards, or training session plans
- Public marketing site beyond a simple app shell

---

## Architecture

### Technology stack

| Technology                                | Role                           | Category     |
| ----------------------------------------- | ------------------------------ | ------------ |
| Next.js (App Router)                      | Application framework          | Architecture |
| React                                     | UI components                  | Front end    |
| TypeScript                                | Type safety                    | Language     |
| Tailwind CSS                              | Styling                        | CSS          |
| shadcn/ui                                 | Ready-made UI primitives       | UI library   |
| Lucide React                              | Icons                          | Assets/UI    |
| Recharts                                  | Data visualisation             | Charts       |
| ESLint                                    | Lint                           | Quality      |
| Prettier                                  | Format                         | Quality      |
| Husky                                     | Pre-commit hooks               | Git workflow |
| lint-staged                               | Lint only staged files         | Performance  |
| Vercel                                    | Host & deploy                  | Deployment   |
| Supabase                                  | PostgreSQL datastore           | Database     |
| Supabase Auth                             | User authentication            | Auth         |
| `@supabase/ssr` + `@supabase/supabase-js` | Server/client Supabase clients | Integration  |

### Design principles

- **UI states:** Custom skeleton loading and explicit error handling
- **Motion:** CSS transitions and light micro-interactions (not heavy animation libraries in v1)
- **Config:** Centralized constants and utilities
- **Components:** Small, reusable modules
- **Visual identity:** Start with a clean, generic modern UI using the stack above; refine branding later
- **Data access:** Prefer server components / server actions for mutations; keep client components for interactive UI only

### Environments

| Env        | Purpose                                         |
| ---------- | ----------------------------------------------- |
| Local      | `next dev` + local or remote Supabase project   |
| Preview    | Vercel preview deployments per PR               |
| Production | Vercel production + Supabase production project |

Secrets (never commit): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and service role key only where server-only and justified.

---

## Domain model (conceptual)

Entities below drive schema design in Stage 4. Field lists reflect agreed MVP decisions; refine names/types in migrations as needed.

**Club platform:** a `clubs` row owns many `teams`. Team-owned rows (matches, competitions, goals) carry `team_id`. People (`players`, `coaches`) are club-level and linked to teams through `team_players` / `team_coaches`. Access is governed by RLS via club/team membership helpers. The header provides an active-team switcher for team-scoped screens.

### Roles & access

| Role                                                      | Scope                                      | Read                                                                                      | Write                                                                            |
| --------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Management (`managers` with linked login)                 | Whole club                                 | Everything in the club                                                                    | Everything in the club                                                           |
| Coach (`team_members.role = coach`)                       | Assigned teams edit; other club teams read | All club teams' squad/fixture/stats data                                                  | Own teams: squad, matches, goals, player of the match, competitions, team access |
| Guardian (`guardians` + `player_guardians`)               | Teams of their linked players              | Those teams' squad, fixtures, stats, player of the match; linked players' contact details | Own / linked player contact details only                                         |
| Player (`players.user_id` / `team_members.role = player`) | Their teams                                | Same read as guardian, for their own teams                                                | Own contact details only                                                         |

Sensitive contact details live in `player_contacts` with stricter RLS so guardians/players cannot see other players' contacts.

### Club

| Field                   | Notes                    |
| ----------------------- | ------------------------ |
| id                      | UUID                     |
| name                    | Club / organisation name |
| website / email / phone | Optional contact details |
| created_at / updated_at | Timestamps               |

Management is recorded in `managers` (club people with optional `user_id`). Linking a login grants club-wide permissions. The first manager is created via the `create_club_with_management` RPC to avoid a chicken-and-egg RLS problem.

### Team

| Field                   | Notes                                                   |
| ----------------------- | ------------------------------------------------------- |
| id                      | UUID                                                    |
| club_id                 | FK → clubs                                              |
| name                    | Team name (display)                                     |
| age_group               | e.g. `U9`, `U11`, `U13` (free text or constrained list) |
| gender                  | `boys` \| `girls` \| `mixed`                            |
| home_ground             | Home venue name / address text                          |
| head_coach_name         | Display name of head coach                              |
| season_label            | Current season only in MVP, e.g. `2025/26`              |
| created_at / updated_at | Timestamps                                              |

**Related (not columns on `teams`):**

| Relation       | How                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Squad          | `team_players` linking club `players` to the team, with per-team `shirt_number`/`active`                                                                     |
| Coaching staff | `team_coaches` linking club `coaches` to the team                                                                                                            |
| Competitions   | `competitions` where `competitions.team_id = teams.id`                                                                                                       |
| Access         | `team_members` linking auth users to the team; any combination of roles `management`, `coach`, `guardian`, `guardian_assistant`, `player` (one row per role) |

### Competition

Competitions the team enters this season (league, cup, tournament, etc.).

| Field      | Notes                                                  |
| ---------- | ------------------------------------------------------ |
| id         | UUID                                                   |
| team_id    | FK → teams                                             |
| name       | e.g. `County League`, `Cup`                            |
| kind       | Optional: `league` \| `cup` \| `tournament` \| `other` |
| created_at | Timestamp                                              |

### Player (club-level person)

| Field                   | Notes                                                 |
| ----------------------- | ----------------------------------------------------- |
| id                      | UUID                                                  |
| club_id                 | FK → clubs                                            |
| user_id                 | Optional FK → auth.users (player's own login)         |
| first_name, last_name   | Required                                              |
| position                | Optional enum/label (GK, DEF, MID, FWD, or free text) |
| school                  | Optional                                              |
| date_of_birth           | Optional date                                         |
| created_at / updated_at | Timestamps                                            |

Squad membership is per team via **`team_players`** (`team_id`, `player_id`, optional `shirt_number` unique per team, `active`). Match-day availability is per match via **`match_players`**. Sensitive details live in **`player_contacts`** (1:1 with player: phone, email, address, emergency contact, medical notes). Guardians are club-level people (`guardians`: name, phone, email, notes) linked to zero/many players via **`player_guardians`** (`guardian_id`, `player_id`, `relationship`, `legal_guardian`). Optional `guardians.user_id` links a login for guardian app access.

### Match (fixture / result)

A match is scheduled (fixture) and may later have a result.

| Field                     | Notes                                                                   |
| ------------------------- | ----------------------------------------------------------------------- |
| id                        | UUID                                                                    |
| team_id                   | FK → teams                                                              |
| opponent_name             | Free text                                                               |
| date                      | Match date                                                              |
| kickoff_time              | Optional time of day                                                    |
| home_away                 | `home` \| `away` \| `neutral`                                           |
| venue_id                  | Optional FK → venues (`null` = unknown)                                 |
| competition_id            | Optional FK → competitions                                              |
| is_friendly               | When true, fixture is a Friendly (not a competitions row)               |
| player_of_the_match_id    | Optional FK → players (set when played; editable by coaches/management) |
| status                    | `scheduled` \| `played` \| `postponed` \| `cancelled`                   |
| goals_for / goals_against | Null until played; `goals_against` is opponent **aggregate** only       |
| notes                     | Optional                                                                |
| created_at / updated_at   | Timestamps                                                              |

Match-day available players are stored in **`match_players`**. Periods (halves / quarters) live in **`match_periods`** with starting players in **`match_period_starters`**.

### Goal

Goals scored by **our** players in a played match. Do **not** record opposition scorers.

| Field            | Notes                                                       |
| ---------------- | ----------------------------------------------------------- |
| id               | UUID                                                        |
| match_id         | FK → matches                                                |
| player_id        | FK → players (our squad scorer)                             |
| assist_player_id | Optional FK → players                                       |
| period_id        | Optional FK → match_periods                                 |
| period           | Optional text label (auto-filled from period name when set) |
| minute           | Optional                                                    |
| is_penalty       | Boolean (default false)                                     |
| is_freekick      | Boolean (default false)                                     |
| from_setpiece    | Boolean (default false)                                     |
| created_at       | Timestamp                                                   |

Own goals credited to the opponent score only via `goals_against` — no opposition scorer rows. If we need “own goal” as a our-player event later, revisit; not required for MVP scoring tables.

### Appearance (post-MVP)

Track whether a player played in a match (apps / minutes). **Deferred** — MVP uses goals only for performance views.

### Auth user & memberships

Supabase Auth (email/password). Access is derived from membership tables and linked people records:

**`managers`** — club-level people; optional `user_id` grants club-wide management:

| Field                    | Notes                    |
| ------------------------ | ------------------------ |
| id                       | UUID                     |
| club_id                  | FK → clubs               |
| user_id                  | Optional FK → auth.users |
| first_name / second_name | Required                 |
| phone / email / notes    | Optional                 |
| created_at / updated_at  | Timestamps               |

**`team_members`** — team-scoped roles (additive; unique on team + user + role):

| Field      | Notes                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| id         | UUID                                                                      |
| team_id    | FK → teams                                                                |
| user_id    | FK → auth.users                                                           |
| role       | `management` \| `coach` \| `guardian` \| `guardian_assistant` \| `player` |
| created_at | Timestamp                                                                 |

A user may hold any combination of roles on one team and a different set on another.

**`player_guardians`** — guardian ↔ player links with relationship and legal-guardian flag (see Guardian). A user has app access if they appear in any of `managers.user_id`, `team_members`, `guardians.user_id`, or `players.user_id` (checked via the `has_app_access` RPC in middleware).

RLS uses SECURITY DEFINER helper functions (`is_club_management`, `is_club_staff`, `can_read_club`, `can_read_team`, `can_read_team_row`, `can_edit_team`, `can_edit_match_day`, `can_edit_match_goals`, `can_read_player`, `can_read_player_row`, `can_edit_player`, `can_view_player_contact`, `player_club_id`) to enforce these rules on every table. `can_edit_match_day` covers fixtures, squad, periods, goals/assists, and cards (including guardian assistants). Player of the match stays on `can_edit_team` (coach/management).

Policies must never reference another RLS-protected table directly: policy expressions run as the calling user, so `clubs`/`teams`/`players`/`player_guardians` would recurse into each other. The `*_row` helpers take the row's own columns as arguments, which also keeps `insert … returning` working (the new row is not yet visible to a self-lookup).

---

## Information architecture

Team-scoped screens act on the **active team** chosen in the header switcher. The switcher and nav adapt to the user's role (the Coaches area is hidden from guardians/players).

### Primary navigation (authenticated)

| Route             | Purpose                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `/`               | Redirect to dashboard                                                                             |
| `/login`          | Sign in (email/password)                                                                          |
| `/no-access`      | Create a new club (bootstrap management) or ask to be added                                       |
| `/dashboard`      | Active team snapshot: next fixture, recent results, top scorers                                   |
| `/team`           | Active team: profile, squad, coaching staff, competitions, team access; create teams (management) |
| `/players`        | Club player directory; add players (staff); per-player teams, contacts                            |
| `/players/[id]`   | Player detail: teams, contact details (permission-gated), goals                                   |
| `/guardians`      | Club guardian directory (management); add/edit people, link players                               |
| `/guardians/[id]` | Guardian detail: profile, player links (relationship + legal guardian)                            |
| `/coaches`        | Club coaching staff directory (staff only)                                                        |
| `/coaches/[id]`   | Coach detail: profile, qualifications, team assignments                                           |
| `/matches`        | Active team fixtures & results (read-only for guardians/players)                                  |
| `/matches/new`    | Create fixture (coaches/management)                                                               |
| `/matches/[id]`   | Match detail: result, our goals, player of the match (edit gated by role)                         |
| `/stats`          | Active team charts: results form, goals by player, etc.                                           |

### Unauthenticated

- `/login` only

### Acceptance criteria (IA)

- Coach/admin can complete the happy path: set up team → add squad → add fixture → enter result + our goals → see stats update
- Empty states exist for no players / no matches / no goals / no competitions
- Mobile: primary nav usable via bottom or compact header pattern (decide in UI stage)

---

## Functional requirements

### Auth

1. Users sign in with **email/password** only (Supabase Auth)
2. Protected routes require a session **and** club/team access (`has_app_access`); users without access see `/no-access`, where they can create a new club
3. Sign out from the app chrome
4. Guardians and players get authenticated, read-only access scoped to their teams

### Club & team

1. Create a club (bootstraps the creator as management)
2. Management creates teams within the club and switches the active team
3. View/edit the active team profile (coaches/management); guardians/players see it read-only
4. Manage the squad (`team_players`), coaching staff (`team_coaches`), competitions, and team access (`team_members`)

### Players

1. Players are club-level people, listed in a directory and assigned to teams
2. Create / edit player identity (staff); assign to teams with per-team shirt number and active status
3. Maintain sensitive contact details in `player_contacts`, visible only to management, the player's coaches, guardians, and the player
4. Link guardians to players
5. View player **goal** summary across their teams (no appearances in MVP)

### Matches

1. Create a fixture (opponent, kickoff, home/away, optional venue, optional competition or Friendly)
2. List upcoming fixtures and past results
3. Mark match played and set score (`goals_for` / `goals_against` aggregate only)
4. Postpone / cancel a fixture
5. Edit match metadata before/after kickoff (with sensible constraints)

### Goals

1. Add our-player goal(s) to a played match (player, optional minute, penalty flag)
2. Edit / remove a goal
3. Goals contribute to player totals and match display
4. Do not capture opposition scorers

### Dashboard & stats

1. Show next fixture and last result
2. Top scorers for the (single) season
3. Simple charts (Recharts): goals by player; results over time / form strip

### Non-functional

1. Responsive layout (see Device Compatibility)
2. Loading skeletons and error UI on data views
3. Type-safe DB access (generated types from Supabase preferred)
4. Migrations versioned in repo (`supabase/migrations`)

---

## Data flow

```text
Browser (React / Next.js)
    │
    ├─ Server Components / Server Actions  ──►  Supabase JS (SSR client)
    │                                              │
    └─ Client Components (forms, charts)  ──►  Supabase JS (browser client)
                                                   │
                                                   ▼
                                         Supabase Auth + PostgreSQL
                                         (RLS policies enforce access)
```

- **Reads:** Prefer server-side fetch in RSC where possible
- **Writes:** Server Actions (or route handlers) with auth check
- **Security:** Row Level Security (RLS) on all tables; anon key only with policies that match product rules

---

## Device compatibility

### Mobile

- Touch-friendly controls
- No horizontal overflow
- Responsive to orientation changes

### Desktop

- Use horizontal space for tables and charts
- Hover affordances where helpful
- Clean data visualisation

### Target browsers

- iPhone Safari
- Android Chrome
- Desktop Chrome

---

## Development plan

Proceed in order. Do not skip ahead to full UI/features without completing the prior stage’s exit criteria.

### Stage 1 — Requirements (this document)

- [x] Working requirements brief
- [x] MVP scope decisions recorded (multi-team-ready, goals-only, coach/admin, one season, etc.)
- **Exit:** Agreed MVP scope; open questions answered or deferred

### Stage 2 — Project scaffolding

- [x] Next.js App Router + TypeScript + Tailwind
- [x] ESLint, Prettier, Husky, lint-staged
- [x] shadcn/ui initialized; Lucide available
- [x] Env example file; README with local setup
- [x] Supabase client/middleware stubs (env optional until Stage 3)
- **Exit:** `npm run dev` runs; lint/format hooks work on commit

### Stage 3 — Basic wiring

- [x] Supabase project env filled (`.env.local` with URL + publishable key)
- [x] Auth middleware protecting app routes (email/password **session**; team membership in Stage 4)
- [x] Login / logout shell + authenticated placeholders
- [x] Vercel project connected (preview + env vars) — see README Deploy section
- **Exit:** Authenticated empty shell runs locally; deploy when Vercel is linked

### Stage 4 — Data schema and models

- [x] SQL migrations for teams, competitions, players, matches, goals, team_members (+ optional profiles)
- [x] RLS policies for coach/admin on their team only
- [x] Enforce team membership in middleware / data access (completes Stage 3 auth model)
- [x] Generated TypeScript types
- [x] Thin data-access helpers / repositories
- [x] Seed one team + one coach/admin for local/dev
- **Exit:** Schema applied; types compile; single-team seed works

### Stage 5 — Core functionality

Implement in vertical slices:

1. Team profile + competitions
2. Players (squad) CRUD
3. Matches (fixtures + aggregate results)
4. Our goals on match detail
5. Dashboard summary
6. Stats + Recharts

- [x] Team profile view/edit + competitions CRUD (`/team`)
- [x] Players list/create/edit/deactivate + goal summary (`/players`, `/players/[id]`)
- [x] Matches list/filters, create fixture, detail + result (`/matches`, `/matches/new`, `/matches/[id]`)
- [x] Our-player goals on played matches (add/edit/remove)
- [x] Dashboard: next fixture, last result, top scorers
- [x] Stats charts (Recharts): goals by player, results over time, form strip
- [x] Empty states + loading skeletons on data views
- [x] `npm run lint` and `npm run build` pass
- **Exit:** Coach/admin happy path works end-to-end on preview

### Stage 6 — Polish

- [x] Empty/loading/error states consistency (`EmptyState`, `ErrorBanner`, route skeletons; destructive actions surface errors)
- [x] Accessibility pass (landmarks, nav current page, form labels/required cues, chart text fallbacks, W/D/L not color-only, focus/touch targets)
- [x] Branding / visual identity pass (light shell polish: header blur, subtle page wash — no redesign)
- [x] Performance check on lists and charts (`cache()` for team lookup; FormStrip split; Recharts lazy-loaded on `/stats`)
- [x] `npm run lint` and `npm run build` pass
- **Exit:** Authenticated MVP feels consistent and production-ready without new domain features

---

## Open questions (remaining)

None blocking MVP. Defer to later phases:

- Team switcher / multi-team UI
- `seasons` table and historical seasons
- Appearances / minutes
- Guardian read-only access
- Additional auth providers

---

## Revision history

| Date       | Change                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| 2026-07-23 | Initial working brief: stack, domain, IA, FR, staged plan                                             |
| 2026-07-23 | Locked MVP decisions; expanded Team (age group, gender, home ground, head coach, squad, competitions) |
| 2026-07-24 | Stage 3 wiring: session auth middleware, login/logout, authenticated app shell                        |
| 2026-07-24 | Stage 4: SQL schema + RLS, membership middleware, DB types, seed SQL                                  |
| 2026-07-24 | Stage 5: team/competitions, players, matches, goals, dashboard, stats                                 |
| 2026-07-24 | Stage 6: empty/error consistency, a11y, light shell polish, chart/list performance                    |
