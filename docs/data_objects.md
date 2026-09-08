# Data objects

Attribute lists for each domain object, based on the current database schema
(`supabase/migrations/` + `src/lib/supabase/database.types.ts`). Fields marked
**(required)** are `NOT NULL`. Unmarked fields are optional / nullable. System
fields (`id`, `created_at`, `updated_at`) are omitted unless noted. Enum values
below use the labels shown in the UI; DB stores snake_case where noted.

---

## Club

### Attributes

- Name (required)
- Website
- Email
- Phone
- Icon URL
- Colour — `#RRGGBB`
- Established — year (1800–2100)
- About

---

## Person

Central identity for anyone who may hold one or more roles. Not club-scoped;
club association lives on role rows (`managers`, `coaches`, `guardians`,
`players`) via `person_id`.

### Attributes

- First name (required)
- Last name (required)
- Email
- Phone
- Auth user — optional Supabase Auth UUID
- Account status (required) — `none` | `invited` | `active` | `disabled`

Sign-in is allowed only for `invited` or `active`. `disabled` (and `none`) are
signed out / denied. See [Roles](roles.md).

### Invitations (`person_invitations`)

Secure invite-only onboarding (hashed token, expiry, single-use).

- Person (required)
- Email (required)
- Token hash (required)
- Expires at (required)
- Accepted at / revoked at
- Invited by — Auth user who sent the invite

---

## Manager

Club-level role linked to a `people` record. Club-wide management permissions
apply when the linked person has an Auth login.

### Attributes

- Club (required)
- Person (required)
- Active role (required) — default `true` (soft-deactivate without deleting)
- Notes

---

## Venue

Club-level place used as a home or training ground.

### Attributes

- Club (required)
- Name (required)
- Address line 1
- Address line 2
- Town / city
- Postcode
- Surfaces (required) — zero or more of `Astro` | `Grass` | `Hard court` |
  `Indoor` | `Varies` | `Unknown` (default empty array)
- Parking (required) — `Usually fine` | `Weekend parking` | `Paid parking` |
  `No parking` | `Unknown` (default `Unknown`)
- Food & Drink / amenities — zero or more of `BBQ` | `Cafe` | `Tuck shop` |
  `Local outlets` | `Ice cream van` | `Bar` | `Toilets` | `Rain shelter`

---

## Team

Belongs to a club. Squad, fixtures, and competitions are scoped to a team.
Unique on `(club, name, season label)`.

### Attributes

- Club (required)
- Name (required)
- Display name — short label for lists/headers; falls back to name
- Age group (required) — app-enforced `U7`…`U16` | `Adults` (DB is free text)
- Gender (required) — `boys` | `girls` | `men` | `women` | `mixed` (forms offer
  boys/girls/men/women; `mixed` is legacy)
- Home venue — linked venue
- Training venue — linked venue
- Training days — weekdays (`mon`…`sun`)
- Season label (required) — e.g. `2025/26`
- Photo URL
- Archived at — null means active season; set when the team is soft-archived

Head coach is assigned via team coaches with role `Head Coach` (not a free-text
field on the team).

---

## Team member

Team-scoped access. Links an auth user to a team with one role. A user may have
**multiple** `team_members` rows for the same team (one per role), e.g. coach +
player + management on team A and only coach on team B.

### Attributes

- Team (required)
- User (required)
- Role (required) — `management` | `coach` | `guardian` | `guardian_assistant` |
  `player`

Unique on `(team, user, role)`.

Coach write access and several RLS helpers key off `team_members.role = coach`,
not the `coaches` domain table alone. See [Roles](roles.md).

---

## Player

Club-level role linked to a `people` record. Assigned to teams via team player
membership. Players get a `people` row but are not invited to log in by default.

### Attributes

- Club (required)
- Person (required)
- Active role (required) — default `true`
- Position
- School
- Date of birth

### Development objectives

Zero, one, or many objectives per player (`player_development_objectives`).

#### Attributes

- Body / objective text (required)
- Type (required) — `Skills` | `Confidence` | `Team work` | `Positional` |
  `Following coaching` | `Other` (default `Other`)
- Status (required) — `Emerging` | `Expected` | `Exceeding` | `Complete`
  (default `Emerging`)
- Sort order (required) — default `0`

---

## Player contact

Sensitive contact details (1:1 with player). Stricter access than the player
profile.

### Attributes

- Player (required)
- Phone
- Email
- Address
- Emergency contact — linked guardian
- Medical notes

Emergency phone is taken from the linked guardian’s phone (not stored
separately).

---

## Guardian

Club-level role linked to a `people` record. Can be linked to zero, one, or many
players.

### Attributes

- Club (required)
- Person (required)
- Active role (required) — default `true`
- Notes

### Player links (`player_guardians`)

For each linked player:

- Player (required)
- Relationship (required) — `Parent` | `Guardian` | `Football contact` | `Other`
- Legal guardian — checkbox (default off)
- Emergency contact — checkbox (default off)

---

## Team player

Squad membership: which players are on which team.

### Attributes

- Team (required)
- Player (required)
- Shirt number
- Active (required) — default `true`

---

## Coach

Club-level coaching staff role linked to a `people` record (distinct from auth
team membership).

### Attributes

- Club (required)
- Person (required)
- Active role (required) — default `true`
- Date of birth
- Date joined (required)
- DBS checked (required) — default `false`
- FA Level 1 (required) — default `false`
- FA Level 2 (required) — default `false`
- Biography
- Philosophy
- Notes

### Development objectives

Zero, one, or many objectives per coach (`coach_development_objectives`).

#### Attributes

- Body / objective text (required)
- Type (required) — `Coaching` | `Communications` | `Time Management` | `Admin` |
  `Other` (default `Other`)
- Target date
- Status (required) — `In Progress` | `Ready for Review` | `Complete` |
  `Deferred` (default `In Progress`)
- Sort order (required) — default `0`

---

## Team coach

Assigns a club coach to a team.

### Attributes

- Team (required)
- Coach (required)
- Role — free text; app offers `Head Coach` | `Assistant Coach` |
  `Sporting Director` | `Head of Year` | `Head of Boys` | `Head of Girls`

---

## Competition

Competitions a team enters this season.

### Attributes

- Team (required)
- Name (required)
- Display name — short label for lists/headers; falls back to name
- Kind — `league` | `cup` | `tournament` | `other` (nullable; no DB default)
- Season
- Knockout (required) — default `false`
- Age group
- Gender — `female` | `male` | `mixed`
- Players per team
- Periods (required) — `1` | `2` (halves, default) | `4` (quarters) | `other`
- Minutes per period
- Result (required) — `champions` | `runner_up` | `third_place` | `semi_final` |
  `knock_outs` | `group_stage` | `promoted` | `relegated` | `none` | `ongoing`
  (default) | `completed` | `cancelled`
- Organizer
- Notes
- Venue mode (required) — `unknown` (default) | `multiple` | `venue`
- Venue — linked venue when mode is `venue`

---

## Match

Fixture / result for a team. Aggregate score is derived from `goals` rows (there
are no `goals_for` / `goals_against` columns).

### Attributes

- Team (required)
- Opponent name (required)
- Friendly (`is_friendly`, required) — default `false`; when true the fixture is
  a friendly (no competition row; competition must be null)
- Date (required)
- Kick-off time
- Meet-up time — optional time before kick-off
- Home / away (required) — `home` | `away` | `neutral`
- Venue — linked venue, or unknown when unset
- Competition
- Coach's player of the match
- Player's player of the match
- Status (required) — `scheduled` | `in_progress` | `played` | `postponed` |
  `cancelled` (default `scheduled`)
- Coach's notes
- Club notes

Goals, cards, scores, and both players of the match are editable when status is
`in_progress` or `played`.

---

## Match player

Match-day availability: which team players are available for a given match.

### Attributes

- Match (required)
- Player (required)

Unique on `(match, player)`.

---

## Match period

A half, quarter, or other segment of a match. Multiple periods per match.

### Attributes

- Match (required)
- Name (required) — e.g. `1st half`, `Quarter 1`
- Sort order (required) — default `0`

### Starting players (`match_period_starters`)

Players who start the period (assumed to complete it). Linked to players in the
match-day squad.

- Period (required)
- Player (required)

Unique on `(period, player)`.

---

## Goal

Goal recorded against a match. Our scorers, opposition goals, and own goals are
supported.

### Attributes

- Match (required)
- Player — scorer (required unless opposition / own-goal rules apply)
- Assist player
- Period — optional free-text label (auto-filled from the linked period name when
  set)
- Period link — optional FK to match period
- Minute
- Opposition (required) — default `false` (no scorer / assist when true)
- Own goal (required) — default `false`
- Penalty (required) — default `false`
- Free kick (required) — default `false`
- From set piece (required) — default `false`

---

## Card

Disciplinary / other card recorded against a match. Add zero, one, or many cards
per match.

### Attributes

- Match (required)
- Linked person (required) — exactly one of: Player | Coach | Guardian
- Type (required) — `Yellow card (1st)` | `Yellow card (2nd)` | `Red card` |
  `Timeout` | `Other`
- Coach notes
- Referee notes
- Club notes

---

## Player of the month

Monthly award for a team squad member.

### Attributes

- Team (required)
- Player (required)
- Month (required) — first-of-month date
- Notes

Unique on `(team, month)`.
