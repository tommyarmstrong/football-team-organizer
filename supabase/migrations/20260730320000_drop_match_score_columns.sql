-- Score is derived from goal rows; stop storing aggregates on matches.

alter table public.matches
  drop constraint if exists matches_goals_for_non_negative;

alter table public.matches
  drop constraint if exists matches_goals_against_non_negative;

alter table public.matches
  drop column if exists goals_for;

alter table public.matches
  drop column if exists goals_against;
