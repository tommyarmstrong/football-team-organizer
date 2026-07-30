-- Allow goals scored by the opposition (no known player).

alter table public.goals
  alter column player_id drop not null;

alter table public.goals
  add column if not exists is_opposition boolean not null default false;

alter table public.goals
  drop constraint if exists goals_assist_not_scorer;

alter table public.goals
  add constraint goals_assist_not_scorer check (
    assist_player_id is null
    or (player_id is not null and assist_player_id <> player_id)
  );

alter table public.goals
  drop constraint if exists goals_opposition_scorer_consistency;

alter table public.goals
  add constraint goals_opposition_scorer_consistency check (
    (
      is_opposition = false
      and player_id is not null
    )
    or (
      is_opposition = true
      and player_id is null
      and assist_player_id is null
    )
  );

comment on column public.goals.is_opposition is
  'True when scored by the opposition; player_id and assist_player_id are null.';

comment on table public.goals is
  'Goals for a match, including our players and generic opposition goals.';
