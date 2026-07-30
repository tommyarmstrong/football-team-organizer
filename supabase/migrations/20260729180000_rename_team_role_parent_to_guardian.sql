-- Rename team_role enum value parent → guardian for consistent terminology.

alter type public.team_role rename value 'parent' to 'guardian';
