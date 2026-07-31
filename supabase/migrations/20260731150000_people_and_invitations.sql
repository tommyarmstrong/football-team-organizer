-- Central people identity + invite-only onboarding foundation.
-- Role tables gain person_id; shared attributes are copied onto people.
-- Shared columns on role tables are dropped in the follow-up migration after
-- auth helpers are rewritten to use people.auth_user_id.

create type public.person_account_status as enum (
  'none',
  'invited',
  'active',
  'disabled'
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  auth_user_id uuid references auth.users (id) on delete set null,
  account_status public.person_account_status not null default 'none',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint people_email_nonempty check (email is null or length(trim(email)) > 0)
);

create unique index people_auth_user_id_uidx
  on public.people (auth_user_id)
  where auth_user_id is not null;

create unique index people_email_lower_uidx
  on public.people (lower(email))
  where email is not null;

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create table public.person_invitations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint person_invitations_email_nonempty check (length(trim(email)) > 0),
  constraint person_invitations_token_hash_nonempty check (length(token_hash) > 0)
);

create index person_invitations_person_id_idx
  on public.person_invitations (person_id);

create unique index person_invitations_token_hash_uidx
  on public.person_invitations (token_hash);

create unique index person_invitations_one_outstanding_uidx
  on public.person_invitations (person_id)
  where accepted_at is null and revoked_at is null;

create trigger person_invitations_set_updated_at
before update on public.person_invitations
for each row execute function public.set_updated_at();

create table public.people_migration_conflicts (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid not null,
  conflict_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index people_migration_conflicts_source_idx
  on public.people_migration_conflicts (source_table, source_id);

alter table public.managers add column person_id uuid references public.people (id);
alter table public.coaches add column person_id uuid references public.people (id);
alter table public.guardians add column person_id uuid references public.people (id);
alter table public.players add column person_id uuid references public.people (id);

-- ---------------------------------------------------------------------------
-- Collect role identity rows for backfill
-- ---------------------------------------------------------------------------

create temporary table tmp_role_identity (
  source_table text not null,
  source_id uuid not null,
  auth_user_id uuid,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  primary key (source_table, source_id)
) on commit drop;

insert into tmp_role_identity
select
  'managers', m.id, m.user_id, m.first_name, m.second_name,
  nullif(lower(trim(m.email)), ''), nullif(trim(m.phone), '')
from public.managers m;

insert into tmp_role_identity
select
  'coaches', c.id, null, c.first_name, c.second_name,
  nullif(lower(trim(c.email)), ''), nullif(trim(c.phone), '')
from public.coaches c;

insert into tmp_role_identity
select
  'guardians', g.id, g.user_id, g.first_name, g.second_name,
  nullif(lower(trim(g.email)), ''), nullif(trim(g.phone), '')
from public.guardians g;

-- Players: prefer player_contacts email/phone when present (identity contact).
insert into tmp_role_identity
select
  'players', p.id, p.user_id, p.first_name, p.last_name,
  nullif(lower(trim(pc.email)), ''), nullif(trim(pc.phone), '')
from public.players p
left join public.player_contacts pc on pc.player_id = p.id;

create temporary table tmp_role_person (
  source_table text not null,
  source_id uuid not null,
  person_id uuid not null,
  primary key (source_table, source_id)
) on commit drop;

create or replace function pg_temp.report_attr_conflicts(
  p_source_table text,
  p_source_id uuid,
  p_person_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text
) returns void
language plpgsql
as $$
declare
  v_person public.people%rowtype;
begin
  select * into v_person from public.people where id = p_person_id;

  if lower(v_person.first_name) is distinct from lower(p_first_name)
     or lower(v_person.last_name) is distinct from lower(p_last_name) then
    insert into public.people_migration_conflicts (
      source_table, source_id, conflict_type, details
    ) values (
      p_source_table, p_source_id, 'name_mismatch',
      jsonb_build_object(
        'person_id', p_person_id,
        'kept', jsonb_build_object(
          'first_name', v_person.first_name,
          'last_name', v_person.last_name
        ),
        'other', jsonb_build_object(
          'first_name', p_first_name,
          'last_name', p_last_name
        )
      )
    );
  end if;

  if p_email is not null
     and v_person.email is not null
     and lower(v_person.email) is distinct from lower(p_email) then
    insert into public.people_migration_conflicts (
      source_table, source_id, conflict_type, details
    ) values (
      p_source_table, p_source_id, 'email_mismatch',
      jsonb_build_object(
        'person_id', p_person_id,
        'kept_email', v_person.email,
        'other_email', p_email
      )
    );
  elsif p_email is not null and v_person.email is null then
    update public.people set email = p_email where id = p_person_id;
  end if;

  if p_phone is not null
     and v_person.phone is not null
     and v_person.phone is distinct from p_phone then
    insert into public.people_migration_conflicts (
      source_table, source_id, conflict_type, details
    ) values (
      p_source_table, p_source_id, 'phone_mismatch',
      jsonb_build_object(
        'person_id', p_person_id,
        'kept_phone', v_person.phone,
        'other_phone', p_phone
      )
    );
  elsif p_phone is not null and v_person.phone is null then
    update public.people set phone = p_phone where id = p_person_id;
  end if;
end;
$$;

-- 1) One person per distinct auth_user_id
do $$
declare
  uid uuid;
  seed record;
  row_rec record;
  v_person_id uuid;
begin
  for uid in
    select distinct auth_user_id from tmp_role_identity where auth_user_id is not null
  loop
    select * into seed
    from tmp_role_identity
    where auth_user_id = uid
    order by
      case source_table
        when 'managers' then 1
        when 'guardians' then 2
        when 'players' then 3
        else 4
      end,
      source_id
    limit 1;

    insert into public.people (
      first_name, last_name, email, phone, auth_user_id, account_status
    ) values (
      seed.first_name,
      seed.last_name,
      seed.email,
      seed.phone,
      uid,
      'active'::public.person_account_status
    )
    returning id into v_person_id;

    for row_rec in
      select * from tmp_role_identity where auth_user_id = uid
    loop
      perform pg_temp.report_attr_conflicts(
        row_rec.source_table,
        row_rec.source_id,
        v_person_id,
        row_rec.first_name,
        row_rec.last_name,
        row_rec.email,
        row_rec.phone
      );
      insert into tmp_role_person (source_table, source_id, person_id)
      values (row_rec.source_table, row_rec.source_id, v_person_id);
    end loop;
  end loop;
end $$;

-- 2) Merge remaining rows that share an email (no auth clash)
do $$
declare
  email_key text;
  seed record;
  row_rec record;
  v_person_id uuid;
  v_existing public.people%rowtype;
  v_new_person_id uuid;
begin
  for email_key in
    select distinct i.email
    from tmp_role_identity i
    left join tmp_role_person tp
      on tp.source_table = i.source_table and tp.source_id = i.source_id
    where i.email is not null and tp.person_id is null
  loop
    select * into v_existing
    from public.people
    where email is not null and lower(email) = email_key
    limit 1;

    if v_existing.id is null then
      select * into seed
      from tmp_role_identity i
      left join tmp_role_person tp
        on tp.source_table = i.source_table and tp.source_id = i.source_id
      where i.email = email_key and tp.person_id is null
      order by
        case i.source_table
          when 'managers' then 1
          when 'guardians' then 2
          when 'coaches' then 3
          else 4
        end,
        i.source_id
      limit 1;

      insert into public.people (
        first_name, last_name, email, phone, auth_user_id, account_status
      ) values (
        seed.first_name,
        seed.last_name,
        seed.email,
        seed.phone,
        seed.auth_user_id,
        case
          when seed.auth_user_id is not null then 'active'::public.person_account_status
          else 'none'::public.person_account_status
        end
      )
      returning id into v_person_id;
    else
      v_person_id := v_existing.id;
    end if;

    for row_rec in
      select i.*
      from tmp_role_identity i
      left join tmp_role_person tp
        on tp.source_table = i.source_table and tp.source_id = i.source_id
      where i.email = email_key and tp.person_id is null
    loop
      select * into v_existing from public.people where id = v_person_id;

      if row_rec.auth_user_id is not null
         and v_existing.auth_user_id is not null
         and v_existing.auth_user_id is distinct from row_rec.auth_user_id then
        insert into public.people_migration_conflicts (
          source_table, source_id, conflict_type, details
        ) values (
          row_rec.source_table,
          row_rec.source_id,
          'user_id_clash',
          jsonb_build_object(
            'kept_person_id', v_person_id,
            'kept_auth_user_id', v_existing.auth_user_id,
            'other_auth_user_id', row_rec.auth_user_id,
            'email', email_key
          )
        );

        insert into public.people (
          first_name, last_name, email, phone, auth_user_id, account_status
        ) values (
          row_rec.first_name,
          row_rec.last_name,
          null,
          row_rec.phone,
          row_rec.auth_user_id,
          'active'::public.person_account_status
        )
        returning id into v_new_person_id;

        insert into public.people_migration_conflicts (
          source_table, source_id, conflict_type, details
        ) values (
          row_rec.source_table,
          row_rec.source_id,
          'email_deferred_for_user_clash',
          jsonb_build_object(
            'new_person_id', v_new_person_id,
            'deferred_email', email_key
          )
        );

        insert into tmp_role_person (source_table, source_id, person_id)
        values (row_rec.source_table, row_rec.source_id, v_new_person_id);
      else
        perform pg_temp.report_attr_conflicts(
          row_rec.source_table,
          row_rec.source_id,
          v_person_id,
          row_rec.first_name,
          row_rec.last_name,
          row_rec.email,
          row_rec.phone
        );

        if row_rec.auth_user_id is not null and v_existing.auth_user_id is null then
          update public.people
          set auth_user_id = row_rec.auth_user_id,
              account_status = 'active'
          where id = v_person_id;
        end if;

        insert into tmp_role_person (source_table, source_id, person_id)
        values (row_rec.source_table, row_rec.source_id, v_person_id);
      end if;
    end loop;
  end loop;
end $$;

-- 3) Remaining rows: dedicated person each (no shared email / auth)
do $$
declare
  row_rec record;
  v_person_id uuid;
begin
  for row_rec in
    select i.*
    from tmp_role_identity i
    left join tmp_role_person tp
      on tp.source_table = i.source_table and tp.source_id = i.source_id
    where tp.person_id is null
  loop
    insert into public.people (
      first_name, last_name, email, phone, auth_user_id, account_status
    ) values (
      row_rec.first_name,
      row_rec.last_name,
      row_rec.email,
      row_rec.phone,
      row_rec.auth_user_id,
      case
        when row_rec.auth_user_id is not null then 'active'::public.person_account_status
        else 'none'::public.person_account_status
      end
    )
    returning id into v_person_id;

    insert into tmp_role_person (source_table, source_id, person_id)
    values (row_rec.source_table, row_rec.source_id, v_person_id);
  end loop;
end $$;

update public.managers m
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'managers' and tp.source_id = m.id;

update public.coaches c
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'coaches' and tp.source_id = c.id;

update public.guardians g
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'guardians' and tp.source_id = g.id;

update public.players p
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'players' and tp.source_id = p.id;

do $$
begin
  if exists (select 1 from public.managers where person_id is null)
     or exists (select 1 from public.coaches where person_id is null)
     or exists (select 1 from public.guardians where person_id is null)
     or exists (select 1 from public.players where person_id is null) then
    raise exception 'people backfill left role rows without person_id';
  end if;
end $$;

alter table public.managers alter column person_id set not null;
alter table public.coaches alter column person_id set not null;
alter table public.guardians alter column person_id set not null;
alter table public.players alter column person_id set not null;

create index managers_person_id_idx on public.managers (person_id);
create index coaches_person_id_idx on public.coaches (person_id);
create index guardians_person_id_idx on public.guardians (person_id);
create index players_person_id_idx on public.players (person_id);

-- ---------------------------------------------------------------------------
-- RLS for people / invitations (equivalent spirit; no new RBAC matrix)
-- ---------------------------------------------------------------------------

alter table public.people enable row level security;
alter table public.person_invitations enable row level security;
alter table public.people_migration_conflicts enable row level security;

create or replace function public.can_manage_any_club()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.managers m
    where m.user_id = auth.uid()
  );
$$;

revoke all on function public.can_manage_any_club() from public;
grant execute on function public.can_manage_any_club() to authenticated;

create policy "people_select" on public.people for select to authenticated
  using (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
    or exists (
      select 1 from public.managers m
      where m.person_id = people.id and public.is_club_staff(m.club_id)
    )
    or exists (
      select 1 from public.coaches c
      where c.person_id = people.id and public.is_club_staff(c.club_id)
    )
    or exists (
      select 1 from public.guardians g
      where g.person_id = people.id and public.is_club_staff(g.club_id)
    )
    or exists (
      select 1 from public.players pl
      where pl.person_id = people.id and public.is_club_staff(pl.club_id)
    )
  );

create policy "people_insert_management" on public.people for insert to authenticated
  with check (public.can_manage_any_club());

create policy "people_update" on public.people for update to authenticated
  using (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
  )
  with check (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
  );

create policy "person_invitations_select" on public.person_invitations
  for select to authenticated
  using (
    public.can_manage_any_club()
    or exists (
      select 1 from public.people p
      where p.id = person_invitations.person_id and p.auth_user_id = auth.uid()
    )
  );

create policy "person_invitations_insert" on public.person_invitations
  for insert to authenticated
  with check (public.can_manage_any_club());

create policy "person_invitations_update" on public.person_invitations
  for update to authenticated
  using (public.can_manage_any_club())
  with check (public.can_manage_any_club());

create policy "people_migration_conflicts_select" on public.people_migration_conflicts
  for select to authenticated
  using (public.can_manage_any_club());
