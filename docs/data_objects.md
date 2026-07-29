# Data objects

Attribute lists for each domain object, based on the current database schema. Fields marked **(required)** are `NOT NULL`. Unmarked fields are optional / nullable. System fields (`id`, `created_at`, `updated_at`) are omitted unless noted.

---

## Club

### Attributes

- Name (required)
- Website
- Email
- Phone

---

## Manager

Club-level person (same shape as coach / guardian). Club-wide management
permissions apply when this record is linked to a login.

### Attributes

- Club (required)
- User — optional link to the person’s auth account
- First name (required)
- Second name (required)
- Phone
- Email
- Notes

---

## Team

Belongs to a club. Squad, fixtures, and competitions are scoped to a team.

### Attributes

- Club (required)
- Name (required)
- Age group (required) — `U7`…`U16` | `Adults`
- Gender (required) — `boys` | `girls` | `mixed`
- Home venue
- Training venue
- Training days — weekdays (`mon`…`sun`)
- Season label (required) — e.g. `2025/26`

Head coach is assigned via team coaches with role `Head Coach` (not a free-text field on the team).

---

## Team member

Team-scoped access. Links an auth user to a team with one role. A user may have
**multiple** `team_members` rows for the same team (one per role), e.g. coach +
player + management on team A and only coach on team B.

### Attributes

- Team (required)
- User (required)
- Role (required) — `management` | `coach` | `guardian` | `guardian_assistant` | `player`

Unique on `(team, user, role)`.

---

## Player

Club-level person. Assigned to teams via team player membership.

### Attributes

- Club (required)
- User — optional link to the player’s auth account
- First name (required)
- Last name (required)
- Position
- School

---

## Player contact

Sensitive contact details (1:1 with player). Stricter access than the player profile.

### Attributes

- Player (required)
- Phone
- Email
- Address
- Emergency contact — linked guardian
- Medical notes

Emergency phone is taken from the linked guardian’s phone (not stored separately).

---

## Guardian

Club-level person. Can be linked to zero, one, or many players.

### Attributes

- First name (required)
- Second name (required)
- Phone
- Email
- Notes

### Player links (`player_guardians`)

For each linked player:

- Player (required)
- Relationship (required) — `Parent` | `Guardian` | `Football contact` | `Other`
- Legal guardian — checkbox (default off)

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

Club-level coaching staff record (distinct from auth team membership).

### Attributes

- Club (required)
- First name (required)
- Second name (required)
- Date of birth
- Date joined (required)
- DBS checked (required) — default `false`
- FA Level 1 (required) — default `false`
- FA Level 2 (required) — default `false`
- Phone
- Email
- Notes
- Biography

### Development objectives

Zero, one, or many text objectives per coach (`coach_development_objectives`).

---

## Team coach

Assigns a club coach to a team.

### Attributes

- Team (required)
- Coach (required)
- Role — `Head Coach` | `Assistant Coach` | `Sporting Director` | `Head of Year` | `Head of Boys` | `Head of Girls`

---

## Competition

Competitions a team enters this season.

### Attributes

- Team (required)
- Name (required)
- Kind — `league` | `cup` | `friendly` | `tournament` | `other` (default `league`)

---

## Match

Fixture / result for a team.

### Attributes

- Team (required)
- Opponent name (required)
- Date (required)
- Kick-off time
- Venue (required) — `home` | `away` | `neutral`
- Competition
- Coach's player of the match
- Player's player of the match
- Status (required) — `scheduled` | `in_progress` | `played` | `postponed` | `cancelled` (default `scheduled`)
- Goals for
- Goals against — opponent aggregate score only
- Coach's notes
- Club notes

Goals, cards, scores, and both players of the match are editable when status is `in_progress` or `played`.

---

## Goal

Goal scored by one of our players. Opposition scorers are not recorded.

### Attributes

- Match (required)
- Player (required) — scorer
- Assist player
- Period
- Minute
- Penalty (required) — default `false`
- Free kick (required) — default `false`
- From set piece (required) — default `false`

---

## Card

Disciplinary / other card recorded against a match. Add zero, one, or many cards per match.

### Attributes

- Match (required)
- Linked person (required) — exactly one of: Player | Coach | Guardian
- Type (required) — `Yellow card (1st)` | `Yellow card (2nd)` | `Red card` | `Timeout` | `Other`
- Coach notes
- Referee notes
- Club notes
