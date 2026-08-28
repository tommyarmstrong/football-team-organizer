-- Guardians may update their own player_guardians link (relationship, legal
-- guardian, emergency contact). Staff retain full control via the existing
-- player_guardians_update_staff policy; RLS OR-combines both policies.

create policy "player_guardians_update_guardian" on public.player_guardians
  for update to authenticated
  using (
    exists (
      select 1 from public.guardians g
      where g.id = player_guardians.guardian_id
        and public.person_auth_user_id(g.person_id) = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.guardians g
      where g.id = player_guardians.guardian_id
        and public.person_auth_user_id(g.person_id) = auth.uid()
    )
    and public.guardian_club_id(player_guardians.guardian_id)
      = public.player_club_id(player_guardians.player_id)
  );
