-- Add Men / Women team gender values alongside boys / girls / mixed.
alter type public.team_gender add value if not exists 'men';
alter type public.team_gender add value if not exists 'women';
