# Performance Recommendations

## Executive Summary

The Football Team Organizer is a Next.js 16 App Router application backed by Supabase (Postgres + Auth). The codebase is well-structured and uses many good patterns — `React.cache()` for per-request deduplication, `Promise.all` for parallel fetches, `Suspense` boundaries on the dashboard, and `next/dynamic` for chart code-splitting. However, three user-reported symptoms point to concrete bottlenecks:

1. **Login is not particularly quick.** The post-login bootstrap endpoint (`/auth/session/bootstrap`) re-verifies access and resolves club colour after `signInWithPassword` already completed, adding 200–400 ms of serial latency.
2. **Default green header colours show for ~1 second before switching to club colours.** The colour pipeline relies on a client-side `ClubColourBinder` that fires only after the header Suspense boundary resolves, and the cookie hint is absent on the very first visit.
3. **Switching between venues, matches, and stats is intermittently slow.** Every navigation triggers middleware that calls both `supabase.auth.getUser()` and `rpc('has_app_access')`, and pages then re-fetch `getViewerContext()` (which itself calls `getUser()` again plus five more queries). No data is cached across requests.

The recommendations below are grouped by subsystem and tagged **High**, **Medium**, or **Low** impact.

---

## Table of Contents

1. [Login & Auth Flow](#1-login--auth-flow)
2. [Theming & Club Colour Pipeline](#2-theming--club-colour-pipeline)
3. [Middleware](#3-middleware)
4. [App Header & Layout Data Fetching](#4-app-header--layout-data-fetching)
5. [Page-Level Data Fetching & Caching](#5-page-level-data-fetching--caching)
6. [Database & Query Patterns](#6-database--query-patterns)
7. [Client Bundle & Code Splitting](#7-client-bundle--code-splitting)
8. [CSS & Rendering](#8-css--rendering)
9. [Summary Table](#9-summary-table)

---

## 1. Login & Auth Flow

### 1.1 Inline session access check instead of a separate bootstrap POST — **High**

**Current behaviour:** After `signInWithPassword` returns successfully on the client, the login form immediately fires `fetch("/auth/session/bootstrap", { method: "POST" })`. This endpoint creates a new Supabase server client, calls `supabase.auth.getUser()`, looks up the person by `auth_user_id` (and optionally by email as a fallback), checks account status, then races a club colour lookup against a 150 ms timeout — all sequentially.

**Why it's slow:** This is an extra round-trip from the browser to the server, which itself makes 2–4 Supabase calls. Combined with the `signInWithPassword` round-trip that preceded it, login has two sequential network waterfalls. The 150 ms colour timeout adds latency even when it wins the race.

**Proposed fix:**

- **Move access verification server-side.** Replace the client-initiated bootstrap fetch with a Server Action (or redirect to a server route that streams). After `signInWithPassword`, redirect to `/auth/session/verify` which performs the check server-side in a single hop, then redirects to `/dashboard`. This removes one browser↔server round-trip.
- **Alternatively, fire the bootstrap POST optimistically in parallel** with the `signInWithPassword` call's cookie propagation. Today the code awaits sign-in, then awaits bootstrap. If the bootstrap endpoint can detect an in-flight session, overlap both.
- **Decouple colour resolution from login entirely.** The colour cookie is a nice-to-have on first login. Set it via a middleware `Set-Cookie` on the _first navigation_ after login instead of blocking the login flow. This removes the 150 ms timeout from the critical path.

**Tradeoffs:** Moving to a redirect-based flow changes the login UX slightly (browser navigation instead of an SPA transition). The optimistic parallel approach is simpler but still has two round-trips.

### 1.2 Remove redundant `getUser()` calls in session access — **Medium**

**Current behaviour:** `verifySignedInPersonAccess()` in `session-access.ts` calls `supabase.auth.getUser()`. This is the same call the middleware _just made_ for the same request. The bootstrap route handler creates its own Supabase client, so the middleware's session refresh is not reused.

**Why it's slow:** `getUser()` makes a network call to Supabase Auth every time. Running it twice per request doubles auth latency.

**Proposed fix:** Pass the already-verified user from middleware context (e.g. via a request header or a `cookies()`-based signal) so downstream code can skip the second `getUser()` call. Alternatively, use React `cache()` on a `getUser` wrapper so it dedupes within the same request lifecycle — though this only works within a single RSC render, not across middleware + route handler.

**Tradeoffs:** Passing user info via headers requires care to avoid spoofing (only trust headers set by your own middleware).

### 1.3 `findPersonForAuthUserId` uses admin client unnecessarily — **Low**

**Current behaviour:** `findPersonForAuthUserId` in `invitations.ts` uses the service-role admin client, bypassing RLS.

**Why it's slow:** The admin client is constructed fresh each time (no connection pooling benefit from the anon client). More importantly, using the admin client for reads that would work fine under RLS adds a constructor overhead.

**Proposed fix:** Use the standard server client with RLS where possible. Reserve the admin client for writes that truly need service-role access (invitations, linking auth users).

**Tradeoffs:** Verify RLS policies allow the necessary reads before switching.

---

## 2. Theming & Club Colour Pipeline

### 2.1 Set colour cookie in middleware instead of client-side — **High**

**Current behaviour:** Club colour theming has three stages:
1. `layout.tsx` reads `club_colour_hint` cookie and applies `--club-colour` inline style (works only if the cookie exists).
2. `<AppHeader>` Suspense boundary resolves, rendering `<ClubColourBinder>` as a client component.
3. `ClubColourBinder` runs `useLayoutEffect`, reads the `colour` prop, and applies `--club-colour` via DOM manipulation + writes the cookie for next time.

The first visit after login has no cookie (the bootstrap endpoint's 150 ms race may or may not have set it), so the layout renders the default green. The header Suspense may take 300–800 ms to resolve (multiple DB calls). Only after the header streams and hydrates does the colour switch.

**Why it's slow:** The user sees default green for the entire duration of the header Suspense + hydration. This is the "flash of default colour" (FODC).

**Proposed fix:**

- **Set the `club_colour_hint` cookie in middleware** for authenticated users. The middleware already calls `getUser()` — add a lightweight club-colour lookup cached per-user (see §3.2). If the cookie is present, the layout applies colour on the _very first byte_ of HTML, eliminating the flash entirely.
- **Remove `ClubColourBinder` as the primary mechanism.** Keep it only as a fallback updater if the colour changes mid-session (e.g. the user edits their club colour).
- **Pre-populate the cookie during the OAuth callback / email auth flow**, not just the bootstrap endpoint.

**Tradeoffs:** Adding a DB call to middleware adds latency to every request (see §3 for how to mitigate). If the club colour changes after the cookie is set, the cookie is stale until ClubColourBinder updates it. This is already the case today and is acceptable for a colour preference.

### 2.2 Avoid `useLayoutEffect` for theming — **Low**

**Current behaviour:** `ClubColourBinder` uses `useLayoutEffect` to mutate the DOM (`root.style.setProperty`). This blocks paint until the effect completes.

**Why it's slow:** `useLayoutEffect` is synchronous and prevents the browser from painting until it returns. While the work is trivial (setting one CSS variable), it contributes to layout thrashing if other layout effects run nearby.

**Proposed fix:** Switch to `useEffect`. The visual difference is negligible since the server-rendered inline style from the layout already applies the correct colour when the cookie is present.

**Tradeoffs:** Switching to `useEffect` could cause a single-frame flash if the server-rendered colour differs from the client-resolved colour. In practice this should not happen because both read the same source.

---

## 3. Middleware

### 3.1 Skip `rpc('has_app_access')` for known-good sessions — **High**

**Current behaviour:** `src/lib/supabase/middleware.ts` calls `supabase.auth.getUser()` AND `rpc('has_app_access')` on every single request that matches the middleware config. The matcher excludes static assets but includes every page navigation, every Server Action, and every route handler.

**Why it's slow:** Two sequential Supabase calls on every request. `getUser()` validates the JWT against the Auth server (~50–100 ms). `rpc('has_app_access')` runs a custom Postgres function (~30–80 ms). Together they add 80–180 ms of overhead _before_ any page-level data fetching begins.

**Proposed fix:**

- **Cache the `has_app_access` result in a short-lived cookie** (e.g. `fto_access=1; Max-Age=300`). On subsequent requests, skip the RPC call if the cookie exists and the user JWT is still valid. Clear the cookie on sign-out.
- **Make the check conditional.** `has_app_access` is only needed for redirecting users without team membership to `/no-access`. For users who are already on an app page (i.e. the cookie-stored active team exists), the RPC is redundant — RLS will deny unauthorized queries at the data layer anyway.
- **Move the `has_app_access` check out of middleware** and into a layout-level guard. The `(app)/layout.tsx` already verifies the viewer context. If `getViewerContext()` returns null or has no visible teams, redirect. This avoids running the check on public paths, auth paths, and API routes.

**Tradeoffs:** A cached access cookie means a revoked user retains access for up to the cookie's TTL. A 5-minute TTL is a reasonable tradeoff for most use cases. For immediate revocation, pair with a webhook that clears the cookie.

### 3.2 Parallel middleware calls — **Medium**

**Current behaviour:** `getUser()` is awaited before `userHasAppAccess()` is called, creating a waterfall.

**Why it's slow:** These two calls are independent of each other (the RPC uses the same session token). Running them sequentially wastes time.

**Proposed fix:** Run `getUser()` and `rpc('has_app_access')` in parallel with `Promise.all`. Note: `has_app_access` relies on the Supabase session being present in the request cookies, which it is before middleware modifies them. The `getUser()` call is needed for the redirect logic, so start both simultaneously and await the user result only when needed for redirect decisions.

**Tradeoffs:** If the session is expired, the parallel RPC call will fail — but it would have failed anyway and the middleware handles the redirect based on `getUser()` alone.

### 3.3 Narrow the middleware matcher — **Low**

**Current behaviour:** The matcher `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)` matches everything except static files and images. This means middleware runs on Server Actions, API routes, and RSC data fetches — many of which already validate auth internally.

**Proposed fix:** Exclude paths that handle their own auth, such as `/auth/*` and `/api/*` (if any). This reduces unnecessary middleware execution.

**Tradeoffs:** Must ensure excluded paths still validate auth. Most already do.

---

## 4. App Header & Layout Data Fetching

### 4.1 Reduce the header's data waterfall — **High**

**Current behaviour:** `AppHeader` is an async server component that does:
1. `await getViewerContext()` — which itself does `getUser()` (1 call), then `people` query (1 call), then `Promise.all` of managers, teamMembers, guardianLinks, selfPlayers, and `loadVisibleTeams()` (5 parallel calls). Total: 7 DB calls, 2 sequential stages.
2. `await Promise.all([listVisibleTeams(), getActiveTeam(), getPrimaryClub()])` — These share `cache()` with `getViewerContext` where possible, but `getPrimaryClub()` calls `getViewerContext()` again (deduped via cache), then `listVisibleClubs()` (1 new call), then potentially `getClub(id)` (another call).

The header resolves after the longest chain completes. With cold connections, this can be 500–1000 ms.

**Why it's slow:** Even with `cache()` deduplication and `Promise.all`, the irreducible waterfall is: `getUser()` → `people` query → parallel fan-out of 5 queries → `listVisibleClubs()` for `getPrimaryClub`. That's 4 sequential stages.

**Proposed fix:**

- **Create a single composite Supabase RPC** (e.g. `get_viewer_dashboard_context`) that returns the user's person, teams, clubs, active team, roles, and club colour in one round-trip. This replaces 7+ individual queries with 1 database call. Postgres functions are fast at joining across tables.
- **If a composite RPC is too invasive,** at minimum run `getViewerContext()` and `listVisibleClubs()` in parallel by restructuring `getPrimaryClub()` to accept the viewer context as a parameter rather than awaiting it internally.
- **Consider caching viewer context in a short-lived per-user cookie or server-side KV store** (encrypted, keyed by user ID + a version counter that increments on writes). This avoids re-querying roles on every page load. Invalidate on team switch, role change, or club edit.

**Tradeoffs:** A composite RPC couples the server function to the header's data needs — any schema change requires updating the RPC. The cookie-based cache adds complexity around invalidation. Start with the RPC approach, which is simple and deterministic.

### 4.2 Stream the header colour without blocking on full context — **Medium**

**Current behaviour:** The entire header is wrapped in one `<Suspense>` boundary. The colour, club name, team switcher, and navigation all resolve together. The user sees the `AppHeaderFallback` skeleton until every query completes.

**Proposed fix:** Split the header into two Suspense boundaries:
1. **Brand bar** (club name, icon, colour): resolves from `getPrimaryClub()` alone — much faster.
2. **Navigation** (team switcher, nav links, user menu): resolves from `getViewerContext()`.

This lets the brand bar (and correct colour) appear immediately while the navigation streams in. The user sees the correct colour sooner.

**Tradeoffs:** More complex component structure. The brand bar and navigation must be independently renderable, which may require refactoring the header layout slightly.

### 4.3 `getPrimaryClub` calls `getViewerContext` creating a dependency chain — **Medium**

**Current behaviour:** `getPrimaryClub` is defined as `cache(async () => { const ctx = await getViewerContext(); const { data: clubs } = await listVisibleClubs(); ... })`. Because it awaits `getViewerContext()`, it cannot start until context resolves. The header does `const ctx = await getViewerContext()` and then `await Promise.all([..., getPrimaryClub()])`, but `getPrimaryClub` is blocked waiting for the same `getViewerContext` that just resolved.

While `React.cache()` deduplicates the actual call, the dependency structure still means `listVisibleClubs()` cannot start until `getViewerContext()` finishes.

**Proposed fix:** Restructure `getPrimaryClub` to accept a `ViewerContext` parameter and call `listVisibleClubs()` in parallel with `getViewerContext()` at the call site. For example:

```ts
// In AppHeader:
const [ctx, { data: clubs }] = await Promise.all([
  getViewerContext(),
  listVisibleClubs(),
]);
const club = resolvePrimaryClub(ctx, clubs);
```

This removes one sequential stage from the header waterfall.

**Tradeoffs:** Callers must pass context explicitly. A minor API change.

---

## 5. Page-Level Data Fetching & Caching

### 5.1 Stats page fetches are extremely heavy — **High**

**Current behaviour:** The stats page (`/stats`) calls `getActiveTeam()`, then in `StatsBody` runs 7 parallel functions:
- `getGoalsByPlayerStats()` — fetches all goals + all match appearances + all period starters (4 sequential Supabase calls)
- `getAssistsByPlayerStats()` — fetches all assists + appearances (3 calls)
- `getPlayerOfTheMatchByPlayerStats()` — fetches all POTM matches (1 call)
- `getMatchesPlayedByPlayerStats()` — fetches all match_players (1 call)
- `getResultsOverTime()` — fetches all matches with goals (1 call)
- `listCompetitions()` — 1 call

Each of these functions independently calls `getActiveTeam()` (cached) and `createClient()` (not cached — creates a new client each time, though the underlying session is shared).

**Why it's slow:** Although the 7 top-level calls are parallel, `getGoalsByPlayerStats` alone has 4 sequential database calls internally (goals → played matches → match_players → match_period_starters). The total database call count for the stats page is approximately **15–20 queries**. On a team with many matches, these queries return large result sets that are processed in-memory.

**Proposed fix:**

- **Create a dedicated stats RPC** that computes aggregates server-side in Postgres. A single `SELECT` with window functions and lateral joins can compute goals-by-player, assists-by-player, POTM counts, appearances, and results in one query. This replaces 15+ application-level queries with 1 database call.
- **If a single RPC is too complex, batch related queries.** For example, `getGoalsByPlayerStats` fetches goals, then played matches, then appearances, then period starters — these could be a single joined query or a Postgres function.
- **Cache stats at the team level.** Stats change only when match results are recorded. After recording a result, invalidate the cache (e.g. via `revalidateTag('stats')`). Use Next.js `unstable_cache` or the `fetch` cache with tags for this.

**Tradeoffs:** Postgres RPCs require SQL maintenance. The caching approach requires cache invalidation logic in server actions that modify matches/goals.

### 5.2 Team page fetches 10+ parallel queries — **Medium**

**Current behaviour:** `/team` page.tsx runs `Promise.all` with 10 data calls: `listVenues`, `listRosterForTeam`, `listPlayersNotOnTeam`, `listTeamCoaches`, `listCoachesNotOnTeam`, `listGuardianAssistants`, `listGuardianAssistantCandidates`, `listPlayerOfTheMonth`, `listCompetitions`. Each creates a separate Supabase client.

**Why it's slow:** While parallel, 10 simultaneous database connections can saturate connection pools and each has TCP/TLS overhead to Supabase.

**Proposed fix:**

- **Combine "primary" and "candidate" queries.** `listRosterForTeam` + `listPlayersNotOnTeam` could be a single query that fetches all club players with a flag indicating whether they're on the team. Same for coaches and guardian assistants.
- **Defer candidate data.** Player/coach candidate lists are only needed if the user has edit permissions. Lazy-load them via a Suspense boundary or a client-side fetch triggered when the user clicks "Add player."
- **Use a composite RPC** for team-page data.

**Tradeoffs:** Deferring candidate lists changes the UX slightly (a brief loading state when opening the "add" UI).

### 5.3 Person detail page has serial then parallel fetch stages — **Medium**

**Current behaviour:** `/people/[id]/page.tsx` first awaits `getViewerContext()`, `getPrimaryClub()`, and `getPerson(id)` in parallel. Then it runs a second `Promise.all` with 9 more queries (player teams, guardians, objectives, coach record, etc.). The second batch depends on the first batch's results (e.g. `player.id`, `coach.id`).

**Why it's slow:** Two sequential stages of parallel queries. The second stage cannot begin until the first completes. Total: ~12 database calls across 2 waterfall stages.

**Proposed fix:**

- **Merge the person query with related data.** `getPerson` could use deeper Supabase `select` to embed player teams, coach teams, guardian players, and objectives in one query using Supabase's nested select syntax.
- **Create a `get_person_detail` RPC** that returns the person with all related data in one call.

**Tradeoffs:** Deeper nested selects in Supabase can be harder to type correctly. An RPC is cleaner.

### 5.4 Match detail page runs 6 parallel queries after 2 initial ones — **Medium**

**Current behaviour:** `/matches/[id]/page.tsx` first awaits `getViewerContext()` and `getMatch(id)`, then runs 6 parallel queries for goals, cards, roster, match players, periods, and postcard data.

**Proposed fix:** Similar to above — a composite query or RPC for match detail data. At minimum, embed goals and cards in the match query using Supabase nested selects (goals and cards are already fetched with player joins).

### 5.5 Dashboard makes 4 Suspense sections with overlapping data needs — **Low**

**Current behaviour:** The dashboard uses 4 `Suspense` boundaries, each of which independently resolves `getActiveTeam()` (cached) and then fetches its own data. This is a good pattern — it allows progressive rendering. However, `DashboardFixtures` and `DashboardLeaderboards` both query match/goal data that partially overlaps.

**Proposed fix:** No urgent change needed — the current Suspense pattern is correct. For further optimization, share a single "dashboard data" RPC across sections using React `cache()`, then render all 4 sections from the same cached result. The Suspense boundaries can still wrap individual sections for progressive rendering.

### 5.6 No cross-request caching — **Medium**

**Current behaviour:** Every page load re-fetches all data from Supabase. `React.cache()` only deduplicates within a single server render (i.e. within one request). There is no `unstable_cache`, `fetch` cache, or external cache layer.

**Why it's slow:** Data that rarely changes (club info, venue list, team roster, competition list) is re-queried on every single page load.

**Proposed fix:**

- Use Next.js `unstable_cache` (or the stable equivalent in v16) with appropriate tags for read-heavy, rarely-changing data:
  - Club details: cache per club ID, invalidate on club edit
  - Venue list: cache per club ID, invalidate on venue create/edit/delete
  - Team roster: cache per team ID, invalidate on roster changes
  - Competition list: cache per team ID, invalidate on competition CRUD
- Pair with `revalidateTag()` in the corresponding server actions.
- For viewer context (which contains auth state), short-lived caching (30–60 seconds) with a version cookie is appropriate.

**Tradeoffs:** Cache invalidation is the hardest problem in CS. Start with long-lived caches for slow-changing data (clubs, venues) and leave frequently-changing data (match scores, goals) uncached.

---

## 6. Database & Query Patterns

### 6.1 `createClient()` is called many times per request — **Medium**

**Current behaviour:** Every data module calls `await createClient()` which calls `await cookies()` and constructs a new `createServerClient`. Within a single page render, this can happen 10–20+ times.

**Why it's slow:** While `cookies()` is cheap in Next.js (it reads from the request context), constructing a Supabase client involves setting up cookie handlers and the PostgREST client. This adds up.

**Proposed fix:** Wrap `createClient()` in `React.cache()` so it returns the same client instance within a single request:

```ts
import { cache } from "react";

export const createClient = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(/* ... */);
});
```

This is safe because the server client is scoped to the request via `cookies()`.

**Tradeoffs:** The Supabase SSR library recommends creating a fresh client per operation for cookie sync. In practice, within a single RSC render, cookies don't change, so sharing is safe. Verify that `setAll` callbacks still work correctly.

### 6.2 `getViewerContext` makes 7 sequential/parallel DB calls — **High**

**Current behaviour (recap):** `getUser()` → `people` by `auth_user_id` → `Promise.all([managers, teamMembers, guardianLinks, selfPlayers, loadVisibleTeams()])`. This is 7 total calls (2 sequential, then 5 parallel).

**Proposed fix:** A single Postgres function `get_viewer_context(p_user_id uuid)` that returns all needed data as a JSON object. This reduces 7 calls to 1 database round-trip. The function can be optimized with indexes and avoid the overhead of multiple HTTP requests to Supabase.

**Tradeoffs:** More SQL to maintain. Worth it for something called on literally every page load.

### 6.3 `listVisibleClubs` fetches all clubs — **Low**

**Current behaviour:** `listVisibleClubs` does `supabase.from('clubs').select('*')`. With RLS, this returns only clubs the user can see — but `select('*')` returns all columns.

**Proposed fix:** Select only the columns needed for the primary club resolution (id, name, colour, icon_url). This reduces payload size.

### 6.4 Stats queries process data in JavaScript rather than SQL — **Medium**

**Current behaviour:** Stats functions like `getGoalsByPlayerStats` fetch raw goal rows and then aggregate (group-by, count, sort) in JavaScript. For a team with 100 matches and 500 goals, this means transferring 500 rows and processing them in the Node.js runtime.

**Proposed fix:** Push aggregation into Postgres. For example:

```sql
SELECT player_id, COUNT(*) as goals
FROM goals
JOIN matches ON goals.match_id = matches.id
WHERE matches.team_id = $1 AND matches.status = 'played' AND NOT goals.is_opposition
GROUP BY player_id
ORDER BY goals DESC
```

This returns ~20 rows instead of ~500 and eliminates JavaScript processing.

**Tradeoffs:** More complex SQL. The benefit scales with data volume.

### 6.5 `getNextFixture` makes up to 2 sequential queries — **Low**

**Current behaviour:** `getNextFixture` first queries for upcoming matches >= today. If none found, it falls back to any scheduled match. This is two sequential queries.

**Proposed fix:** Combine into a single query using a broader `WHERE` clause and `ORDER BY date >= $today DESC, date ASC` with `LIMIT 1`. This prioritizes future dates but falls back to past scheduled matches in one query.

---

## 7. Client Bundle & Code Splitting

### 7.1 Recharts is the largest client dependency — **Medium**

**Current behaviour:** The stats page uses `next/dynamic` to lazy-load chart components from `recharts`. This is the correct approach. However, `recharts` itself is large (~200 KB gzipped) and imports all of `d3-scale`, `d3-shape`, etc.

**Why it matters:** Even with code splitting, the charts bundle is downloaded when the stats page is visited. On slow mobile connections, this adds 1–3 seconds of load time.

**Proposed fix:**

- **Verify tree-shaking is working.** Import only the specific Recharts components used (already done: `Bar`, `BarChart`, `Line`, etc. from `recharts`). Ensure the bundler is not pulling in unused chart types.
- **Consider lighter alternatives** for simple charts. The pie charts and bar charts could be implemented with CSS or a lightweight library like `chart.css` or server-rendered SVGs. Only the complex line charts truly need a charting library.
- **Preload the stats bundle** when the user navigates to a nearby page (e.g. add `<link rel="prefetch">` for the stats chunk when the user is on `/matches`).

**Tradeoffs:** Replacing Recharts is significant work. Prefetching is the lowest-effort improvement.

### 7.2 `lucide-react` icons — **Low**

**Current behaviour:** `lucide-react` is imported in multiple client components (`app-nav.tsx`, etc.). Lucide supports tree-shaking via named imports, which the code already uses.

**Proposed fix:** No action needed. Verify the production bundle only includes the specific icons imported (about 10–15 icons). If bundle analysis shows otherwise, switch to direct SVG imports.

### 7.3 `@base-ui/react` and `shadcn` — **Low**

**Current behaviour:** UI components from `@base-ui/react` are used for popover, select, dialog, and checkbox. These are headless and relatively lightweight.

**Proposed fix:** No urgent action. Monitor bundle size. `@base-ui/react` is tree-shakeable and the current usage is targeted.

---

## 8. CSS & Rendering

### 8.1 `body` background uses `background-attachment: fixed` — **Low**

**Current behaviour:** `globals.css` sets `background-attachment: fixed` on `body` with a multi-layer background (SVG pattern, radial gradient, linear gradient).

**Why it matters:** `background-attachment: fixed` forces the browser to repaint the entire background on every scroll frame on some mobile browsers, causing jank.

**Proposed fix:** Replace `background-attachment: fixed` with a pseudo-element positioned `fixed` behind the content, or apply the pattern to a fixed-position `<div>` that does not participate in the scroll paint. Alternatively, test if removing `fixed` (using `scroll` attachment) provides an acceptable visual result.

**Tradeoffs:** Visual change to the background scrolling behaviour. May be imperceptible to users.

### 8.2 `color-mix()` used extensively for club theming — **Low**

**Current behaviour:** `[data-club-colour="true"]` overrides use `color-mix(in srgb, ...)` for most themed elements. This is a modern CSS feature with good browser support.

**Proposed fix:** No action needed for performance — `color-mix()` is computed once during style resolution. This is well-implemented.

### 8.3 Three Google Fonts loaded in root layout — **Low**

**Current behaviour:** `layout.tsx` loads Outfit, Barlow Condensed (3 weights), and Geist Mono via `next/font/google`. These are subset to Latin.

**Why it matters:** Each font weight is a separate file download. Barlow Condensed with 3 weights means 3 font files that block text rendering until loaded (or show FOIT/FOUT depending on `font-display`).

**Proposed fix:**

- Verify `next/font/google` is using `font-display: swap` (the default). This shows text immediately with a fallback font, reducing perceived load time.
- Consider whether Geist Mono is used often enough to justify loading it globally. If it's only used in a few code-related UI elements, load it only on pages that need it.

**Tradeoffs:** Removing a font changes the visual identity. `font-display: swap` causes FOUT but is better for performance.

---

## 9. Summary Table

| # | Recommendation | Area | Impact | Effort |
|---|---|---|---|---|
| 1.1 | Inline session access check; remove bootstrap POST | Login | High | Medium |
| 1.2 | Deduplicate `getUser()` calls | Login | Medium | Low |
| 1.3 | Use RLS client instead of admin for reads | Auth | Low | Low |
| 2.1 | Set colour cookie in middleware | Theming | High | Medium |
| 2.2 | Switch `useLayoutEffect` to `useEffect` | Theming | Low | Low |
| 3.1 | Cache `has_app_access` in a cookie | Middleware | High | Low |
| 3.2 | Parallel `getUser()` + `has_app_access` | Middleware | Medium | Low |
| 3.3 | Narrow middleware matcher | Middleware | Low | Low |
| 4.1 | Composite RPC for header data | Header | High | High |
| 4.2 | Split header into multiple Suspense zones | Header | Medium | Medium |
| 4.3 | Restructure `getPrimaryClub` to avoid chained awaits | Header | Medium | Low |
| 5.1 | Composite RPC or SQL aggregation for stats | Stats page | High | High |
| 5.2 | Combine or defer team page candidate queries | Team page | Medium | Medium |
| 5.3 | Composite person-detail query or RPC | People page | Medium | Medium |
| 5.4 | Composite match-detail query | Matches page | Medium | Medium |
| 5.5 | Share dashboard data via single cached fetch | Dashboard | Low | Low |
| 5.6 | Cross-request caching with `unstable_cache` + tags | All pages | Medium | Medium |
| 6.1 | Wrap `createClient()` in `React.cache()` | DB layer | Medium | Low |
| 6.2 | Single RPC for viewer context | DB layer | High | High |
| 6.3 | Select only needed columns from clubs | DB layer | Low | Low |
| 6.4 | Push stats aggregation into Postgres | DB layer | Medium | Medium |
| 6.5 | Combine `getNextFixture` fallback into one query | DB layer | Low | Low |
| 7.1 | Verify Recharts tree-shaking; prefetch stats bundle | Bundle | Medium | Low |
| 7.2 | Verify Lucide tree-shaking | Bundle | Low | Low |
| 7.3 | Monitor @base-ui bundle size | Bundle | Low | Low |
| 8.1 | Remove `background-attachment: fixed` | CSS | Low | Low |
| 8.2 | No action needed for `color-mix()` | CSS | — | — |
| 8.3 | Verify font-display; consider lazy-loading Geist Mono | CSS | Low | Low |

### Recommended priority order (highest impact first)

1. **§3.1** — Cache `has_app_access` result (immediate win, every page load benefits)
2. **§2.1** — Set club colour cookie in middleware (eliminates FODC)
3. **§1.1** — Streamline login flow (removes one network round-trip)
4. **§4.1 + §6.2** — Composite RPC for viewer context + header data (biggest single improvement for all page loads)
5. **§5.1 + §6.4** — Stats page SQL aggregation (fixes the slowest individual page)
6. **§3.2** — Parallel middleware calls (easy win)
7. **§4.3** — Restructure `getPrimaryClub` (removes one waterfall stage)
8. **§5.6** — Cross-request caching for stable data (multiplier on all above)
9. **§6.1** — Cache `createClient()` per request (small per-call saving, large aggregate)
10. Everything else as time permits.
