# Data objects

Attribute lists for each domain object, based on the current database schema. Fields marked **(required)** are `NOT NULL`. Unmarked fields are optional / nullable. System fields (`id`, `created_at`, `updated_at`) are omitted unless noted.

---

## Club

### Attributes

- Name (required)

---

## Club member

Club-wide access (management). Links an auth user to a club.

### Attributes

- Club (required)
- User (required)
- Role (required) — `management`

---

## Team

Belongs to a club. Squad, fixtures, and competitions are scoped to a team.

### Attributes

- Club (required)
- Name (required)
- Age group (required) — e.g. `U9`, `U11`
- Gender (required) — `boys` | `girls` | `mixed`
- Home venue
- Head coach name (required)
- Season label (required) — e.g. `2025/26`

### Required Updates

- Home venue - make optional, not required and change "ground" to "venue"
- Training venue
- Training days
- Coach roles should be drop down with: 'Head Coach' | 'Assistent Coach' | 'Sporting Director' | 'Head of Year' | 'Head of Boys' | 'Head of Girls'

---

## Team member

Team-scoped access. Links an auth user to a team.

### Attributes

- Team (required)
- User (required)
- Role (required) — `coach` | `guardian` | `player`

### Required Updates

- Role options should be `coach` | `guardian assistant` | `guardian` | `player`

---

## Player

Club-level person. Assigned to teams via team player membership.

### Attributes

- Club (required)
- User — optional link to the player’s auth account
- First name (required)
- Last name (required)
- Position

### Required Updates

- Date of birth (date)
- Season fees paid (tick box)
- FA registered (tick box)

---

## Player contact

Sensitive contact details (1:1 with player). Stricter access than the player profile.

### Attributes

- Player (required)
- Phone
- Email
- Address
- Emergency contact name
- Emergency contact phone
- Medical notes

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
- Relationship (required) — `Dad` | `Mum` | `Guardian` | `Football contact` | `Other`
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
- Date joined (required)
- DBS checked (required) — default `false`
- FA Level 1 (required) — default `false`
- FA Level 2 (required) — default `false`
- Phone
- Email
- Notes
- Biography

---

## Team coach

Assigns a club coach to a team.

### Attributes

- Team (required)
- Coach (required)
- Role — free-text staff role on that team (e.g. head coach, assistant)

---

## Competition

Competitions a team enters this season.

### Attributes

- Team (required)
- Name (required)
- Kind — `league` | `cup` | `friendly` | `tournament` | `other`

### Required Updates

- Default kind to `league`

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
- Player of the match
- Status (required) — `scheduled` | `played` | `postponed` | `cancelled` (default `scheduled`)
- Goals for
- Goals against — opponent aggregate score only
- Notes

### Required Updates

- Add zero, one or multiple goals

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
