-- Emergency contact as a flag on the guardian–player relationship.

alter table public.player_guardians
  add column emergency_contact boolean not null default false;

-- At most one emergency contact per player.
create unique index player_guardians_one_emergency_per_player_idx
  on public.player_guardians (player_id)
  where emergency_contact;

-- Backfill from the previous player_contacts.emergency_guardian_id pointer.
update public.player_guardians pg
set emergency_contact = true
from public.player_contacts pc
where pc.player_id = pg.player_id
  and pc.emergency_guardian_id = pg.guardian_id;
