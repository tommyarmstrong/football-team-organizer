-- Venue photo: optional picture shown above the Location section on a venue.
-- Files live in the public `venue-photos` bucket under `<club_id>/<uuid>.<ext>`;
-- club staff (management and coaches) can write to their own club's folder.

alter table public.venues
  add column photo_url text;

comment on column public.venues.photo_url is
  'Public URL for the venue photo; displayed above the venue Location section.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-photos',
  'venue-photos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "venue_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'venue-photos');

create policy "venue_photos_staff_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'venue-photos'
    and (storage.foldername(name))[1] is not null
    and public.is_club_staff(((storage.foldername(name))[1])::uuid)
  );

create policy "venue_photos_staff_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'venue-photos'
    and (storage.foldername(name))[1] is not null
    and public.is_club_staff(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'venue-photos'
    and (storage.foldername(name))[1] is not null
    and public.is_club_staff(((storage.foldername(name))[1])::uuid)
  );

create policy "venue_photos_staff_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'venue-photos'
    and (storage.foldername(name))[1] is not null
    and public.is_club_staff(((storage.foldername(name))[1])::uuid)
  );
