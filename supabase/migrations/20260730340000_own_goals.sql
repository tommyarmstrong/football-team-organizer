-- Own goals credited to our team (no known player), and mutually exclusive goal kinds.

alter table public.goals
  add column if not exists is_own_goal boolean not null default false;

-- Prefer a single kind flag if historical rows somehow have more than one set.
update public.goals
set
  is_freekick = false,
  from_setpiece = false
where is_penalty = true
  and (is_freekick = true or from_setpiece = true);

update public.goals
set from_setpiece = false
where is_freekick = true
  and from_setpiece = true;

alter table public.goals
  drop constraint if exists goals_opposition_scorer_consistency;

alter table public.goals
  drop constraint if exists goals_scorer_consistency;

alter table public.goals
  add constraint goals_scorer_consistency check (
    (
      is_opposition = false
      and is_own_goal = false
      and player_id is not null
    )
    or (
      is_opposition = false
      and is_own_goal = true
      and player_id is null
      and assist_player_id is null
    )
    or (
      is_opposition = true
      and is_own_goal = false
      and player_id is null
      and assist_player_id is null
    )
  );

alter table public.goals
  drop constraint if exists goals_kind_mutually_exclusive;

alter table public.goals
  add constraint goals_kind_mutually_exclusive check (
    (case when is_penalty then 1 else 0 end)
    + (case when is_freekick then 1 else 0 end)
    + (case when from_setpiece then 1 else 0 end)
    <= 1
  );

comment on column public.goals.is_own_goal is
  'True when an opposition own goal is credited to our team; player_id and assist_player_id are null.';

comment on table public.goals is
  'Goals for a match, including our players, own goals for us, and generic opposition goals.';
