-- Team season archival: keep historical team rows (matches, roster, scorers)
-- while marking a season closed. Unique identity is club + name + season.

alter table public.teams
  add column if not exists archived_at timestamptz;

comment on column public.teams.archived_at is
  'When set, this season''s team record is archived. Historical matches, roster, and stats remain available.';

-- Enforce team name + season uniqueness within a club (the product identity).
create unique index if not exists teams_club_name_season_uidx
  on public.teams (club_id, name, season_label);

create index if not exists teams_archived_at_idx
  on public.teams (archived_at)
  where archived_at is not null;
