# What's new

Product updates for Football Team Organizer, written for coaches, managers, and families. Each section is a release you can share. Dates are when the work landed on `main`.

---

## 7 November 2026 — Season report leans towards white text

- On the season report, text that sits on a **club-coloured panel** (the cover, and the coloured boxes and labels through the book) now favours **white** more often. Mid-tone and deeper orange, red-orange, red, green and teal club colours now get white text, where they sometimes got black.
- Very light and bright colours such as yellow and light orange still get black text so they stay readable.
- No database changes.

---

## 6 November 2026 — Team photos are shrunk and cleaned

- The **team photo** you upload on the team page now gets the same treatment as venue photos. Large phone photos are **scaled down and compressed**, so they upload reliably and load quickly on the team page and in the season report.
- Location and camera details hidden inside the picture (such as where and when it was taken) are **removed** before the photo is stored.
- Replacing or removing a team photo now also deletes the old file.
- No database changes.

---

## 6 November 2026 — Centred default club icon

- The football shown for clubs **without a club badge** is now centred, in the app, on the cards and in the season report. It used to sit towards the left and top of its circle. It is now a glossy football picture (an Openclipart public domain image) rather than an emoji, so it looks the same on every device and browser.
- The browser tab icon uses the same football.
- No database changes.

---

## 6 November 2026 — Season report: Competitions moved, Safari cards fixed

- The **Competitions** page now comes straight after **The season in numbers** and before the **Player Gallery**.
- The Player Gallery cards now show correctly in **Safari**. They used to appear as empty white boxes, because Safari mis-sized the card artwork. Chrome was never affected.
- No database changes.

---

## 6 November 2026 — Season report counts league and cup matches

- The season report's numbers now count **league and cup matches only**. Friendlies, tournaments and other kinds of game no longer count towards Season at a glance, the season in numbers (the goals chart, top scorers and most assists), Competitions, Awards, or the stats on the Player Gallery cards.
- The **Competitions** page now lists league and cup competitions only.
- The **Venues** page is the exception: it lists **every ground the team played at**, including grounds used only for friendlies or tournaments, and its results at each ground count every game played there.
- The **Results** page still lists **every match** that was played, whatever the type. Scores now read the way they do on a match sheet: the **home team's score first**, so an away game shows the opposition's goals first. At a neutral venue our score stays first. The "H home · A away · N neutral" key at the bottom of the page is gone.
- The **Player Gallery** no longer has a card for a player who has not played a league or cup match. Coach cards are unchanged.
- Pages that count league and cup matches only say so at the bottom of the page.
- No database changes.

---

## 6 November 2026 — Season report layout updates

- **Player Gallery** cards are easier to read when printed. The club name is gone from the bottom of each card, the team name and year are **bold**, and the team name, year, goals, assists and player of the match text are all larger. This applies to the cards in the report only; the cards you share from the app are unchanged.
- **Venues** page is tidier. Each venue shows its name, surface and results at that ground, with the venue **photo** underneath the name when one has been added. The address, parking and food and drink details are no longer printed.
- **Notes** page is now a solid white box with a club colour outline, like the Autographs page, with ruled lines inside, so the page background no longer shows through the writing area.
- **Double-page covers** for printing. A blank cover page is now page 2, so the team info starts on page 3, and another blank cover page sits just before the back cover with the thank you message. The book still always has an even number of pages.
- No database changes. Venue photos use the setup from the previous release.

---

## 6 November 2026 — Venue photos

- Coaches and club management can now add a **photo** to a venue when adding or editing it. It shows at the top of the venue page, above the Location map, and can be replaced or removed at any time.
- Photos are cropped to a 16:9 landscape shape to match the map, so landscape pictures work best. PNG, JPEG, WebP or GIF.
- Big phone photos are **shrunk and compressed automatically** when you upload them, so there is no need to resize them first.
- All hidden details in the picture, such as the location it was taken, the camera and the date, are **removed** before it is stored.

---

## 6 November 2026 — Season report refresh

- The report now runs in this order: cover, team info, coach's notes, season at a glance, the season in numbers, player gallery, competitions, venues, results, awards, looking ahead, autographs, notes, back cover. There is always at least one blank **Notes** page before the back cover.
- **Team info** leaves the team photo out when the team has no photo, instead of showing a placeholder box.
- The **Player Gallery** shows nine cards to a page, three across and three down, so the card text is easy to read. A large squad carries on to further pages.
- **Season at a glance**: the strip of results is now headed "Results · every match, in order", the last chart is "Results through the season", and the Goals scored tile matches the Played tile.
- **The season in numbers** no longer has the "Numbered in date order" caption.
- Players appear by **first name only** throughout the report, including the cards, charts and awards. Coaches keep their full names.
- The **Records** page is **Awards** again. It has new boxes for Player of the season, Player's player of the season and Most improved player of the season, above the thank you to the coaching team. The winners are written in a `season-awards.json` file next to the other hand-written sections (see `content/reports/README.md`); a box with no winner prints a blank line to write on. Player of the month is set in smaller type to fit a full season of awards.
- The back cover now thanks every player, **coach**, parent, guardian and volunteer.

---

## 5 November 2026 — Coach card artwork

- Coach cards now have their own neon artwork showing an older coach with a whistle, instead of reusing the young player silhouette.

---

## 4 November 2026 — Coach cards

- A coach's page now has a **Share coach card** button, next to the player card button. The card matches the player card: 4:5, sized for WhatsApp and Instagram, in the club colours.
- It shows the coach's full name, their role on the team (for example Head Coach), and the team's competitive record for the season: played, wins, draws, losses, and goals for and against. Friendlies are left out.
- Coaches, club managers, and the coaches and team managers of that team can generate it. Guardians and players cannot.
- A coach on several teams gets a card for each team they can see.

---

## 4 November 2026 — Season report

- Managers get a **Season report** button on the Team page. It opens the team's season as a printable A4 book in the club colours: cover, coach's notes, season at a glance, results, charts, competitions, player gallery, awards, looking ahead, autographs, and a back cover. Use Print / Save as PDF, with A4, margins None, and Background graphics on.
- The **Player Gallery** shows every player's collectable player card, four to a row, and carries on to a second page for a large squad. Cards use the same design and rules as shared player cards: children appear by first name only. They are drawn straight into the page, so every card shows, large squads load quickly, and the PDF stays small.
- The **Player Gallery** now starts with the coaching staff's cards, with the head coach first and the other coaches after in name order, then the players. Coach cards show the team's league and cup record, with friendlies left out.
- A **Team info** page follows the cover. It carries the team photo, which has moved off the cover, plus the club, gender, age group and season, head coach, home and training venues, and training days.
- A **Venues** section lists every ground the team played at, with its address, surface, parking, food and drink, the team's record there, and the biggest win.
- The **Awards** page is now called **Records**.
- Every page is white with the app's pitch markings faintly drawn in the club colour.
- **Autographs** is a large blank rounded space after Looking ahead, for players to collect signatures.
- The coach's notes and Looking ahead pages are written as markdown files in `content/reports/`. See the README there.

---

## 4 November 2026 — Period starts on Stats

- Club managers see a new "Period starts" section on Stats. It shows how many periods each player started, and periods as a percentage of appearances. The chart and table follow the style of Goals and Assists.
- Appearances no longer has a View filter. It still follows the Competition and Competition type filters, and can be narrowed by position.
- The Goal Scorers section on Stats is now called Goals.
- Taking a player out of a match-day squad now also removes them from that match's starting players. Before, they stayed in the starting lineups out of sight, and Period starts on Stats still counted those periods.

---

## 2 November 2026 — Speed and reliability

- The dashboard loads faster. The fixtures, leaderboards, and season tiles appear as each one is ready instead of all at once.
- Renaming a player or changing their details shows on rosters straight away, rather than after up to an hour.
- When someone is removed from the app, they lose access to pages within 15 minutes at most (it was up to 90 minutes).
- Club, venue, competition, and roster pages check that you can see that club or team before showing it.

---

## 2 November 2026 — Match cards

- Results headings on Stats match the other sections on that page.
- Next fixture and last result include friendlies. Season totals, form, and the goals and assists leaderboards still count league and cup matches only.
- Scheduled matches show a green Scheduled label instead of "vs", on the dashboard and the matches list.
- Those cards can be shared. A fixture card includes the match-day squad and form under the venue.

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
