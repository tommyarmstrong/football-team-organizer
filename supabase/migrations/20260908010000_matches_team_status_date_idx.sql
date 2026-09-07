create index if not exists matches_team_status_date_idx
  on public.matches (team_id, status, date);
