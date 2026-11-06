# Season report content

Hand-written sections for the end of season report, shown by the manager-only
"Season report" button on the team page (`/team/report`).

Each team's season has its own folder. The folder name is the team name and
season label, lower-cased and hyphenated: team "U10 Lions", season `2025/26` →
`u10-lions-2025-26`.

| File                 | Where it appears                      |
| -------------------- | ------------------------------------- |
| `coach-notes.md`     | Coach's notes page(s)                 |
| `looking-ahead.md`   | "Looking ahead" page(s)               |
| `season-awards.json` | Season award boxes on the Awards page |

A line containing only `<!-- page -->` starts a new printed page. Missing files
show a placeholder in the report that tells you the path to create.

`season-awards.json` names the winners of the three whole-season awards. Use
first names, like the rest of the book. Leave a key out (or the whole file) and
that box prints blank, ready to write the winner in by hand:

```json
{
  "playerOfTheSeason": "Isaac",
  "playersPlayer": "Finn",
  "mostImproved": "George"
}
```

`_sample/` is fabricated content used by `/team/report/sample` (development
only). Copy it as a starting point.
