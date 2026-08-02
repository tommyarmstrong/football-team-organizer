-- Rename half period labels for display consistency.
update public.match_periods
set name = 'First half'
where name = 'Half 1';

update public.match_periods
set name = 'Second half'
where name = 'Half 2';

update public.goals
set period = 'First half'
where period = 'Half 1';

update public.goals
set period = 'Second half'
where period = 'Half 2';
