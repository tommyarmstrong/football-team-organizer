-- Extra cup and tournament rounds.

alter type public.match_stage add value if not exists 'playoff';
alter type public.match_stage add value if not exists 'playoff_final';
