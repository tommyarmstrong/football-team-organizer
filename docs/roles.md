# User Roles

These are the roles for the football organizer app.

1. Management
2. Coach
3. Guardian
4. Guardian assistant
5. Player

Signed-in people have a **login** (`auth.users`) and **one or more roles**.
Roles are **additive** and **scoped**: the same login may be management at the
club, coach on team A, and guardian on team B.

Permissions below describe the intended model. Some fine-grained rules are still
evolving in RLS/UI; callouts note what is already enforced.

## Access gates (current behaviour)

- **Invite-only:** new accounts start via invitation
  (`person_invitations` / Auth invite). There is no public register UI. Uninvited
  Auth users are signed out or denied.
- **Account status:** only `invited` or `active` may remain signed in.
  `none` and `disabled` are rejected. Disabled people are also excluded from
  `has_app_access` / management helpers in RLS.
- **App access:** a linked person needs a club manager row, a `team_members` row,
  a guardian role, or a player role (with non-disabled status). Otherwise they
  land on `/no-access`.
- **Who can be invited today:** the app invites managers, coaches, and
  guardians (including guardian assistants via team access). It does **not**
  expose inviting players to create linked Auth accounts, so players do not
  currently log in — even though RLS/`has_app_access` can still treat a linked
  player role as sufficient if one were created out of band.
- **Planned login gate:** work in progress will require a **manager**,
  **coach**, and/or **guardian** role (including guardian assistant via team
  membership) to sign in. A player-only linked account would then be denied
  even if `has_app_access` historically allowed it.
- **Club create:** `create_club_with_management` requires existing club
  management (`can_manage_any_club()`). The first club/manager must come from
  seed or SQL — `/no-access` does not bootstrap a club.

Practical “site admin” today is club **management** (plus the service role for
Auth invites). A separate IT Admin role is not modelled.

## How roles are stored

- Auth identity: Supabase `auth.users` (the login)
- Central person: `people` — shared first/last name, email, phone, optional
  `auth_user_id`, and account status (`none` | `invited` | `active` |
  `disabled`)
- Domain roles: `managers`, `coaches`, `guardians`, `players` — each links to
  `people` via `person_id`, has `active_role` (default true), and keeps only
  role-specific attributes. A person may hold multiple roles.
- Invitations: `person_invitations` — secure, expiring, single-use invite tokens
  (hashed) for invite-only onboarding
- Linking a login to a person (`people.auth_user_id`) associates every linked
  role with that login
- Team roles: `team_members` — one row per `(team, user, role)`; multiple rows
  per user on the same team are allowed
- Team role values: `management` | `coach` | `guardian` | `guardian_assistant` |
  `player`

**Coach nuance:** the `coaches` / `team_coaches` tables hold staff profile data.
Coach **write** access and several RLS helpers key off
`team_members.role = 'coach'` (and club managers). A coach-only person without a
`team_members` coach row (and without manager/guardian access) hits
`/no-access`.

## Management

### Scope

- **Club management** (manager people record linked to a login): club-wide
- **Team management** (`team_members.role = management`): that team only

### Permissions

Club management has full read and write access to all club data (current
behaviour). Team management write access is intended to be limited to that team;
cross-team write should follow the user’s roles on each team.

**Enforcement gap:** the UI may treat team `management` as editable, but RLS
`can_edit_team` is currently club management **or**
`team_members.role = coach` (not team `management`). Do not assume team-only
management can write everything the UI offers. Match-day RLS
(`can_edit_match_day`) does include team `management`.

## Coach

### Permissions

Coaches have full read and write access to:

- Their own user profile
- Team data for every team they are assigned as coach (`team_members`)
- Match data for every match their team plays (including player of the match)

Coaches have full read (but not write) access to:

- Every team's data in the same club
- Every team's match data in the same club
- Every player's data (sensitive `player_contacts` remain restricted)

A coach of team A who is not a coach (or other write role) on team B can read
team B’s player of the match but cannot set it.

## Guardian

### Permissions

Guardians have read and write access to:

- Their own user profile
- Their linked player's profile

Guardians have read (but not write) access to:

- Their linked player's team data
- Their linked player's team dashboard
- Their linked player's team's match data
- Their linked player's team's stats data

## Guardian assistant

### Permissions

Guardian assistants assist coaches. They have all the access of Guardians, and in
addition they can record match-day data for their team:

- Add and edit matches
- Write access to match-day squad
- Write access to match periods
- Write access to match goal scorers and assists
- Write access to match cards

They cannot add or edit player of the match (coach or management only).

Match-day write and the POTM restriction are **enforced** in RLS/UI
(`can_edit_match_day` and related policies).

## Player

Players are club-level people assigned to teams via `team_players`. They are
**not invited to log in** today: the invite UI does not create linked Auth
accounts for player-only people.

If a player were linked out of band (or later invited), intended access is
read-only for:

- Their own user profile (name / email / phone may be self-editable when linked)
- Their own team data
- Their own team dashboard
- Their own team's match data
- Their own team's stats data

Player-only login is expected to be rejected once the planned manager / coach /
guardian sign-in gate lands.
