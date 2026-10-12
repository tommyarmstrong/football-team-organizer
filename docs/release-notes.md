# What's new

Product updates for Football Team Organizer, written for coaches, managers, and families. Each section is a release you can share. Dates are when the work landed on `main`.

---

## 12 October 2026 — Tournaments and player cards

### Tournament squads

- A tournament has its own squad, with kit numbers, names, add, and remove.
- A new tournament starts with every active player on the team.
- Coaches and guardian assistants can change that squad.
- Creating a match in the tournament copies the tournament squad onto the match-day squad.
- League, cup, and friendly fixtures still start from the full active team squad.

### Player cards in club colour

- The name banner, shirt number, and apps / wins / draws / losses marks follow the club colour.
- Pale club colours are darkened only as far as white type still reads.

### Running a tournament

- Each competition has a format: league, knockout, groups and knockout, or other.
- Tournaments can store a shared date, meet-up time, home or away, venue, and periods. Saving a match in that tournament copies those details onto the fixture, and each match can still be changed on its own.
- Cup and tournament matches have a stage: Group, Quarter Final, Semi Final, Final, Knockout, Playoff, or Playoff Final.
- Competition create and edit use the same pop-out as the rest of the app, in a single column, including on a wide screen.
- Competition pages sit in the same phone-width column as matches, venues, and people.

### Match day

- Starting players on a period stay on the page until Save. Adding or removing several players writes once, with the period name, and returns to the match. Cancel leaves the saved starters as they were.

---

## 29 September 2026 — Player cards

Share a player card from the player's page. The image is 4:5, sized for WhatsApp and Instagram, and only people who can open that player can generate it.

- Club colour, crest, shirt number, age group, name, and position.
- A neon street-art placeholder fills the photo area until a player photo exists. If that artwork cannot load, the card falls back to a silhouette so the share still works.
- Clubs without a crest get a football emoji in that spot.
- The record is competitive only: appearances, wins, draws, and losses from played, non-friendly matches where the player was in the match-day squad.
- Goals, assists, and coach's player of the match use the same competitive set.
- The share dialog scrolls on a small screen, and the caption always lists goals, assists, and player of the match.

---

## 28 September 2026 — People, leaderboards, and appearances

### People

- Club managers can assign club roles on every profile, including adding coach to an existing player, and can turn a deactivated role back on.
- Team dropdowns show the season, for example `England Women - 2024/25`.
- Position is labelled "Playing position", and coach assignments are labelled "Coach teams".
- Linking a player from a guardian profile keeps the form readable on desktop: player and relationship side by side, legal guardian and emergency contact on the row below.

### Dashboard and stats

- Top scorers, most assists, and player of the match use competition ranking: tied values share a rank, and the next rank skips ahead. Player of the month stays in month order.
- Leaderboard rows show the rank and the name, without an initials bubble.
- The player of the match table counts the coach's award.
- Appearances, goals per game, and assists per game count played matches where the player was in the match-day squad.

---

## 24 September 2026 — The club colour, everywhere

The app reads as the club rather than a generic admin screen.

- Match pages, the matches list, and dashboard fixtures share one match card: scoreboard, home or away, venue, LIVE, competition, date, then meet-up and kick-off when the fixture is still scheduled.
- The header, the mobile tab bar, and the dashboard title use the same club-colour gradient. Clubs without a colour keep the pitch-green Matchday ready look.
- Squad lists show kit number and name. Team sheets use a kit-number badge.
- Add goal, add period, cards, player of the month, and objectives open in a dialog on the current page.
- Buttons stay as wide as their labels, including match actions such as Full time and Add goal.
- Signing in lands in the club colour, and a slow colour lookup no longer blocks login.

---

## 17 September 2026 — Shareable match postcards

From a match, share, save a PNG, or copy a caption. Images are created for the signed-in session. There is no public link.

### Played matches

- Score, scorers, both players of the match, the match-day squad, recent form, and a one-line recap in club colours.
- Goals read as scorer, penalty mark when it applies, and assister. Opposition own goals are included.
- Youth names stay first name and shirt number on the card. Adults use first and last name on the match-day squad.
- The recap line comes from the final score: a goalless draw, a big win, a narrow loss, and the rest each have their own line.
- The summary uses the score at the end of each half or quarter when those periods are complete.

### Scheduled matches

- A fixture card with teams, home or away, competition, date, meet-up, kick-off, venue, and address.
- Missing kick-off, meet-up, or venue shows as TBC.
- The caption uses fixture emojis, with a blank line between the venue and the address.

### Who can sign in

- Access stays invite-only. Sign-in needs a person who is invited or active.
- A player-only account cannot open the app. A player who is also a manager, coach, or guardian still can.
- Someone without an invitation cannot create a club from the no-access screen.

---

## 7 September 2026 — Meet-up time and a clearer match page

- Fixtures have an optional meet-up time. Scheduled matches show the date, then meet-up and kick-off on the next line, on the dashboard, the matches list, and the match page.
- The matches list marks Scheduled in red above the date.
- Goals and periods live in one table. Every period is listed, including "No goals", and the period name links through to edit it.
- Coach's and players' player of the match show as gold trophy chips.
- Competitions can have a shorter display name, used on the dashboard, team page, matches list, and match page.
- The dashboard and stats leaderboards drop shirt numbers from the name line.
- The signed-in app shell streams in faster, so page content no longer waits on club branding.

---

## 31 August 2026 — Accounts, stats, and who records the match

### Accounts

- Invited people set a password from the invite email, then finish their profile.
- Forgot password on the login screen, and Reset password in the account menu, send a reset email.
- New passwords need 8 characters, with an uppercase letter, a lowercase letter, and a number.

### Stats

- One competition filter for the whole stats page. Competition type can be Friendlies, All League and Cup, All Competitive, or a single kind. The page opens on All League and Cup, so friendlies stay out until you ask for them.
- Results over time, a results pie, and a goals for / against pie.
- Goal difference plots goals for, goals against, and the difference.
- Form sits on the dashboard. A friendly next fixture is labelled Friendly.

### People and match day

- Anyone can edit their own name, email, and phone. Club roles stay with managers.
- New people can be given club roles as they are added.
- Deleting a person disables the account. Managers see previous members and can reactivate them, restore roles, and relink login. A manager cannot delete their own account.
- Archived teams stay readable and cannot be edited.
- Guardians can update relationship, legal guardian, and emergency contact on their own player links. Linking and unlinking players stays with coaches and managers.
- Guardian assistants can edit the match-day squad, periods, goals, assists, and cards. Player of the match stays with coaches and managers.
- Guardians and coaches can open Club and People. What they see is limited to their teams and linked players. Club editing stays with managers.

---

## 20 August 2026 — Seasons, awards, and running a match

### Seasons and squads

- Seasons use a `2025/26` label. A team is unique by name and season, so last year's squad, matches, and scorers stay put when a new intake starts.
- From Team → Edit → Season, archive the current team or carry it forward, with age-group rollover and an option to bring the squad and coaches across.
- The club page splits Current teams and Archived teams.
- Shirt numbers can be set when a player joins a team, and edited later.
- The team page can show a team photo, and player of the month has its own list.

### Recording the match

- New fixtures choose a status. Scheduled hides goals, cards, periods, and player of the match until the match is in progress or played.
- Creating a fixture adds its periods, taken from the competition, and pre-selects the match-day squad as starters.
- Kick off, Full time, and Cancelled sit on the match page. Cancelling asks for confirmation. Status can still be changed from the edit form.
- Extra time and penalties are added as their own periods, with starters chosen at the time.
- The score comes from the goals you enter, including goals against and own goals. Goal type is one choice, defaulting to open play. Assists are turned off for own goals, goals against, penalties, and direct free kicks.
- Goals and cards are added on their own screens and saved once. Delete asks in an in-app dialog, including on iPhone.
- Optional fields are labelled Optional.

### Stats

- Goals can be filtered by position, and viewed as a total, per game, or per period.
- The goals and assists tables always show the per-game rate, using match-day squad appearances.

### Competitions

- Competitions have a result (ongoing, completed, cancelled), season, age group, gender, squad size, periods, and notes.
- The competitions list lives on the dashboard.

---

## 9 August 2026 — Club, people, and venues

### Club and people

- One club, many teams, with a header switcher that shows the active team name.
- Club crest and colour show in the header and through the app.
- People is the directory for the club. Each person has one profile that can hold several roles, a biography, coaching philosophy, player details, and emergency contact.
- Player, coach, and guardian pages fold into that profile. Development objectives live there too.
- Guardians can edit the relationship on a linked player.
- Lists filter by name and paginate, and people pickers search as you type.
- The account menu holds name, email, role, and sign out. On a phone, navigation sits behind the menu icon.

### Venues

- A venue can list more than one surface, including hard court, plus amenities and parking.
- Parking, surface, and amenities show on the venue page.

### Match page

- Played and in-progress matches lead with the score. A live match shows a LIVE chip.
- Competition sits above the date, kick-off, and venue.
- Players of the match, periods, goals, cards, and the match-day squad are on the match itself.

---

## 30 July 2026 — First matchday release

The first version you can run a team on.

- Club platform with managers, coaches, guardians, and players, and invite-only sign-in.
- Team switching inside a club.
- Venues, and create and edit flows for teams, staff, and matches.
- Match-day squads. A new match starts with the active roster, shown as removable players you can add back.
- Periods with starting players. Goals belong to a period.
- Player date of birth.
- Scores calculated from goals, with pages to edit periods, goals, and cards.
- Own goals, and a single goal type for penalty, free kick, and set piece.
- Coach and player development objectives, with type, target date, and status.
- Fixtures can be deleted from the matches list.
