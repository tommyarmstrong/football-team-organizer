# Product Brief

Football Team Organizer is a web application for running a grassroots football
club. Coaches record the match day, management runs the club, and families stay
in the loop — squad, fixtures, scores, and stats in one place.

---

## Who it's for

| Role                   | What they do                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Management**         | Full club access — teams, people, invitations, and club settings                       |
| **Coach**              | Run the match day for their team: squad, fixtures, results, goals, player of the match |
| **Guardian assistant** | Help coaches record match-day data: squad, goals, cards                                |
| **Guardian**           | Follow their player's team — read-only access to fixtures, results, and stats          |
| **Player**             | View their own teams and fixtures (login not currently available)                      |

Access is **invite-only**. There is no public registration. Full permission
detail: [`docs/roles.md`](roles.md).

---

## What it does

### Club and teams

One club owns many teams (e.g. U10 Boys, U11 Girls A, U11 Girls B). Management
creates and switches between teams using a header switcher. Each team carries a
season label; at the end of a season the team is archived and a successor is
created for the next season. Archived seasons remain visible and read-only.

### Squad

Players are registered at club level and assigned to teams with a shirt number.
Sensitive contact details (phone, address, medical notes) are stored separately
and visible only to management, coaches, and the player's guardians.

### Matches

Create fixtures with opponent, date, kick-off time, venue, and competition. Mark
a match as played and record the score. Postpone or cancel. A match detail shows
the squad, periods (halves or quarters), goal scorers, assists, cards, and player
of the match.

### Goals and scoring

Goals are recorded against individual players (scorer, optional assist, period,
minute, penalty / free kick flags). Opposition goals are captured as an aggregate
score — individual opposition scorers are not recorded. Goals feed player
statistics and the dashboard.

### Dashboard

The active team's home screen shows the next fixture, last result, recent form,
and a top-scorer leaderboard.

### Stats

Season charts: goals by player, results over time, form strip. Filterable by
competition.

### Club identity

Each club sets a crest and a primary colour. The header, cards, and background
pick it up so the app feels like the club's own, not a generic tool.

### Venues

Venues store pitch surface, parking notes, and food/drink information — useful
for away days.

---

## What it doesn't do (current version)

- Live match scoring / real-time sync
- Player appearances and minutes played (goals only)
- Opposition goal scorers
- Multi-club tenancy or a platform super-admin
- League tables across clubs
- Native mobile apps (responsive web only)
- Push notifications or SMS
- Payments or subscriptions

---

## Users and access model

The app is single-club: one instance serves one club. Access is controlled by
role. Roles are additive — the same person can be club management and also a
guardian on a specific team.

Invites are sent by management. Managers, coaches, and guardians (including
guardian assistants) can be invited. Players are registered in the system but do
not currently have app logins.

Contact details are need-to-know: guardians can only see details for their own
linked players, not other players in the squad.

---

## Scope decisions

| Topic          | Decision                                                           |
| -------------- | ------------------------------------------------------------------ |
| Club structure | One club, many teams. Users switch the active team from the header |
| Seasons        | Archive + successor model — no dedicated seasons table             |
| Scoring        | Our goals recorded per player; opponent score is aggregate only    |
| Appearances    | Deferred — goals only for now                                      |
| Auth           | Email/password and Google OAuth via Supabase Auth; invite-only     |
| Platform       | Responsive web; iPhone Safari, Android Chrome, desktop Chrome      |

---

## Further reading

| Document                                    | Contents                                               |
| ------------------------------------------- | ------------------------------------------------------ |
| [`docs/architecture.md`](architecture.md)   | System design, components, key decisions               |
| [`docs/configuration.md`](configuration.md) | Environment variables                                  |
| [`docs/database.md`](database.md)           | Data model, entities, RLS strategy                     |
| [`docs/deployment.md`](deployment.md)       | Environments, CI/CD, Vercel and Supabase configuration |
| [`docs/development.md`](development.md)     | Local setup, testing, branching                        |
| [`docs/operations.md`](operations.md)       | Database backups and restore                           |
| [`docs/roles.md`](roles.md)                 | Role definitions, access gates, permission detail      |
| [`security.md`](security.md)                | Vulnerability reporting, auth model, secret management |
