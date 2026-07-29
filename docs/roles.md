# User Roles

These are the roles for the football organizer app.

1. Management
2. Coach
3. Guardian
4. Guardian assistant
5. Player
6. Admin

Every signed-in person has a **login** (`auth.users`) and **one or more roles**.
Roles are **additive** and **scoped**: the same login may be management at the
club, coach on team A, and guardian on team B.

Permissions below describe the intended model. Fine-grained enforcement is
still evolving; do not assume every rule is fully applied in RLS/UI yet.

## How roles are stored

- Auth identity: Supabase `auth.users` (the login)
- Domain people: `managers`, `coaches`, `guardians`, `players` — roster /
  profile records for each role. These are the same kind of people data; only
  permissions differ.
- Linking a login to a people record (`user_id` on managers, guardians,
  players) associates that role with the login. Coaches currently attach via
  `team_members.role = coach` (team-scoped) rather than `coaches.user_id`.
- Team roles: `team_members` — one row per `(team, user, role)`; multiple rows
  per user on the same team are allowed
- Team role values: `management` | `coach` | `guardian` | `guardian_assistant` | `player`

## Management

### Scope

- **Club management** (manager people record linked to a login): club-wide
- **Team management** (`team_members.role = management`): that team only

### Permissions

Club management has full read and write access to all club data (current
behaviour). Team management write access is intended to be limited to that team;
cross-team write should follow the user’s roles on each team.

## Coach

### Permissions

Coaches have full read and write access to:

- Their own user profile
- Team data for every team they are assigned as coach
- Match data for every match their team plays (including player of the match)

Coaches have full read (but not write) access to:

- Every team's data in the same club
- Every team's match data in the same club
- Every player's data (some fields may be restricted later)

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

Guardian assistants assist coaches. They have all the access of Guardians, and in addition, they have:

- Write access to match goal scorers
- Write access to match goal assists
- Write access to match scorers

## Player

Players have read (but not write) access to:

- Their own user profile
- Their own team data
- Their own team dashboard
- Their own team's match data
- Their own team's stats data

## Admin

This is the IT Admin for the site. They have full admin rights at this stage.
Not yet modelled as a dedicated enum/table value.
