# People & authentication onboarding — design

Design for a central `people` entity and invite-only account onboarding.
Written from the existing schema and app before implementation.

## Assumptions from the codebase

1. **Role tables today** — `managers`, `coaches`, `guardians`, and `players` each store
   their own shared identity fields (`first_name`, `last_name` / `second_name`,
   `email`, `phone`) and optional `user_id` (except coaches, which have no
   `user_id` and attach logins via `team_members`).
2. **Naming inconsistency** — players use `last_name`; managers / coaches /
   guardians use `second_name`. The `people` model normalises to `last_name`.
3. **Multi-role already exists** — `team_members` allows multiple roles per user
   per team; club management is via `managers.user_id`. A person may already be
   both coach and guardian conceptually, but duplicated identity rows make that
   awkward.
4. **“Admin” for onboarding** — IT Admin is documented but not modelled. Club
   management (`canManageClub`) is the gate for creating people, assigning
   roles, and sending invitations.
5. **Auth today** — email/password only (`LoginForm` → `signInWithPassword`).
   No service-role admin client yet; `.env.example` already documents
   `SUPABASE_SERVICE_ROLE_KEY` as server-only.
6. **Dev seed** — `supabase/seed.sql` hard-codes Auth UUID
   `05b5a111-bd09-440a-8613-8225e7b9397b` on the seed manager. That UUID moves
   onto the linked `people.auth_user_id`.
7. **Players and logins** — players may have `user_id` today, but product intent
   is that players do **not** get accounts by default. Migration still creates a
   `people` row for every player so a login can be attached later.
8. **`player_contacts`** — remains the sensitive, player-specific contact store
   (address, medical notes, emergency guardian). Person-level email/phone on
   `people` is identity / account contact, not a replacement for
   `player_contacts`.

## Target schema

### `people`

| Column                     | Notes                                         |
| -------------------------- | --------------------------------------------- |
| `id`                       | UUID PK                                       |
| `first_name`, `last_name`  | Required                                      |
| `email`                    | Nullable; unique on `lower(email)` when set   |
| `phone`                    | Nullable                                      |
| `auth_user_id`             | Nullable FK → `auth.users`; unique when set   |
| `account_status`           | `none` \| `invited` \| `active` \| `disabled` |
| `created_at`, `updated_at` | Audit timestamps                              |

`people` is **global** (not club-scoped). Club membership stays on role rows.
One person can hold multiple roles across one or more clubs via `person_id`
foreign keys.

### `person_invitations`

Secure, expiring, single-use invite records:

| Column                     | Notes                                           |
| -------------------------- | ----------------------------------------------- |
| `id`                       | UUID PK                                         |
| `person_id`                | FK → `people`                                   |
| `email`                    | Intended recipient (must match person email)    |
| `token_hash`               | SHA-256 of opaque token (never store raw token) |
| `expires_at`               | Default 7 days                                  |
| `accepted_at`              | Set on successful accept; blocks reuse          |
| `revoked_at`               | Set on resend / cancel                          |
| `invited_by`               | Auth user who sent the invite (nullable)        |
| `created_at`, `updated_at` | Audit timestamps                                |

Only one non-revoked, non-accepted invitation may be outstanding per person.

### Role tables

Each of `managers`, `coaches`, `guardians`, `players` gains:

- `person_id uuid not null references people(id)`

Shared identity columns and `user_id` are removed **after** backfill and app
updates (same feature, second migration), so role rows keep only role-specific
attributes (e.g. shirt number on `team_players`, DBS / FA levels on `coaches`,
notes on guardians/managers, DOB / school / position on players).

### Conflict reporting

`people_migration_conflicts` records non-silent merge issues during backfill:

- `source_table`, `source_id`
- `conflict_type` (e.g. `name_mismatch`, `email_mismatch`, `user_id_clash`)
- `details` JSONB with both values
- `created_at`

## Migration approach

1. Create `people`, `person_invitations`, `people_migration_conflicts`, enums.
2. Add nullable `person_id` to the four role tables.
3. Backfill:
   - Prefer merge by existing `user_id` (same Auth UUID → one person).
   - Else merge by `lower(email)` when emails match and Auth UUIDs do not clash.
   - Else create a distinct person per role row.
   - On attribute conflicts, keep the first non-null chosen values and insert a
     conflict row (do not silently discard alternate values without a record).
   - Players with no email/user still get a `people` row (`account_status =
none`).
   - Seed manager’s Auth UUID becomes `people.auth_user_id` with
     `account_status = active`.
4. Set `person_id` NOT NULL; add indexes / FKs.
5. Rewrite `has_app_access`, `is_club_management`, and related helpers to resolve
   Auth UUID via `people.auth_user_id` through role `person_id` links.
6. Update `create_club_with_management` to create a `people` row + manager.
7. Drop role-level `user_id`, `first_name`, `second_name` / `last_name`,
   `email`, `phone` only after step 5 is in place (second migration file).

No detailed new RLS role matrix in this feature — policies stay equivalent in
spirit (staff manage club people; a user can read/update their own person row
for profile completion). Structure supports future RBAC.

## Onboarding sequence

```text
Admin (club management)
  ├─ Create person (name, email, optional phone)
  ├─ Link existing role records (manager / coach / guardian / player)
  │    or create role rows that reference the person
  └─ Send invitation
       └─ Server (service role):
            • revoke prior outstanding invites
            • insert person_invitations (hashed token)
            • auth.admin.inviteUserByEmail / generateLink
            • set people.account_status = invited
            • never expose service role to the browser

Invitee
  ├─ Opens invite link → /onboarding/accept?token=…
  ├─ Validates token (hash match, not expired, not accepted/revoked,
  │    email matches person)
  ├─ Registers with password OR continues with Google OAuth
  ├─ Auth callback links auth.users.id → people.auth_user_id
  │    (match invitation + verified email; no duplicate people)
  ├─ Completes missing fields (e.g. phone) on /onboarding/complete
  └─ Mark invitation accepted; account_status = active
```

### Normal sign-in (after onboarding)

- Email + password
- Google OAuth

No magic-link / email-code login for day-to-day auth.

Google must bind to the invited person when the verified email matches; if an
Auth user already exists for that email, link rather than creating a second
person or orphan Auth user.

## Application surface

| Area                                     | Change                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `/people`, `/people/new`, `/people/[id]` | Management UI: create person, assign roles, invite status, send/resend     |
| `/onboarding/accept`                     | Public (token-gated): password signup or Google                            |
| `/auth/callback`                         | OAuth / invite completion; link Auth UUID                                  |
| `/onboarding/complete`                   | Authenticated: fill missing person fields                                  |
| `/login`                                 | Add Google button; keep password; no magic link                            |
| Role CRUD                                | Create/update person fields via `people`; role forms keep role-only fields |
| Seed                                     | Create people for seeded roles; manager Auth UUID on `people`              |
| Middleware                               | Allow `/login`, `/onboarding/accept`, `/auth/callback` without membership  |

## Testing

- Unit tests for invitation token hashing/validation helpers, person form parse,
  migration conflict merge helpers, and onboarding status transitions.
- Vitest (existing `src/**/*.test.ts` pattern).

## Out of scope (this feature)

- Fine-grained RLS by role beyond current equivalence
- Role-based UI visibility overhaul
- Magic-link / OTP login
- Multi-club tenancy / platform super-admin
- Automatic player invites
