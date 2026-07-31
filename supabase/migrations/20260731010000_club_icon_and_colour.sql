-- Club branding: optional icon URL and look-and-feel colour.

alter table public.clubs
  add column icon_url text,
  add column colour text;

comment on column public.clubs.icon_url is
  'Public URL for the club icon; null uses the app default football icon.';
comment on column public.clubs.colour is
  'Hex club colour (#RRGGBB) used for subtle site theming; null = default theme.';

-- Public bucket for small club icons (path: {club_id}/{filename}).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-icons',
  'club-icons',
  true,
  524288,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "club_icons_public_read"
  on storage.objects for select
  using (bucket_id = 'club-icons');

create policy "club_icons_management_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  );

create policy "club_icons_management_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  );

create policy "club_icons_management_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  );
