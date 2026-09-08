# Security

Security policy and development guidelines for Football Team Organizer.

This document covers the authentication model, authorisation approach, secret
management, and security-sensitive development practices. It also explains how to
report vulnerabilities responsibly.

---

## Reporting a vulnerability

If you discover a security vulnerability, please **do not open a public GitHub
issue**. Instead, report it directly to the repository owner via a
[GitHub private security advisory](https://github.com/tommyarmstrong/football-team-organizer/security/advisories/new)
or by email (address on the GitHub profile).

Include:

- A description of the issue and its potential impact
- Steps to reproduce (or a proof of concept)
- Any suggested mitigations

You will receive an acknowledgement and an assessment within a reasonable
timeframe. Please allow time for a fix before public disclosure.

---

## Authentication model

### Invite-only access

There is no public registration. All accounts are created through an explicit
invite flow:

1. A manager sends an invite (creates a `person_invitations` row with a hashed,
   expiring, single-use token).
2. The invitee accepts the token at `/onboarding/accept`, which sets their
   password and links the `people` row to an Auth user.

Alternatively, a Supabase Auth invite can be used (`/auth/invite`). In both
cases, the linked `people` row must have `account_status = 'invited'` or
`'active'` or the session is rejected.

### Session gate (middleware)

Every authenticated request passes through `src/middleware.ts`, which:

1. Refreshes the session cookie.
2. Calls `has_app_access(user_id)` — a SECURITY DEFINER RPC that checks the
   linked person's `account_status` and role membership. If this returns false,
   the user is sent to `/no-access` (if authenticated) or `/login` (if not).

This means a disabled or de-linked account loses access immediately on the next
request — no need to invalidate every outstanding session manually.

### Session lifetime

Sessions are configured to expire after **24 hours**. This is enforced in the
Supabase Auth settings for each hosted project.

### Credential policy

- **Email/password only** in the current version.
- Password minimum length 8; requires lowercase, uppercase, and digits.
- Google OAuth and magic links are out of scope for the current version.

---

## Authorisation and RLS

### Row Level Security

RLS is enabled on every table. No table is left with open policies. The database
enforces access rules regardless of which code path reaches it.

### Design principles

- **No direct joins to other RLS-protected tables in policy expressions.** This
  prevents recursive RLS evaluation. All cross-table checks use SECURITY DEFINER
  helper functions that accept the relevant column values as arguments.
- **RLS policies are the last line of defence, not the only one.** The
  application layer also checks roles before rendering edit UI, but the database
  is the authoritative enforcement point.
- **The service role bypasses RLS.** Code that uses the service role client
  (`src/lib/supabase/admin.ts`) must run exclusively server-side and only for
  operations that legitimately need to act on behalf of the system (invite and
  onboarding flows).

### Sensitive data

Player contact details (`phone`, `email`, `address`, `medical_notes`) and
emergency contact information live in `player_contacts`, not on the `players`
row. Policies restrict reads to management, the player's coaches, the player's
guardians, and the player themselves. Code that touches `player_contacts` must
not change this restriction without a deliberate policy review.

---

## Secret management

### `SUPABASE_SERVICE_ROLE_KEY`

The service role key grants full database access and bypasses RLS. Treat it as a
database root password.

- **Never** prefix it with `NEXT_PUBLIC_`.
- **Never** import `src/lib/supabase/admin.ts` from a Client Component or any
  file that can be included in the browser bundle.
- CI runs `npm run check:client-secrets` on every build to assert the canary
  service role value does not appear in the compiled browser bundle. This check
  must remain in the CI pipeline.
- In Vercel, mark it as a **Sensitive** environment variable and restrict
  visibility to the team members who need it.

### `.env.local`

`.env.local` is gitignored. Never commit it. Never share its contents in issue
comments, PRs, or chat.

### `.env.example`

`.env.example` contains only placeholder values. Never put real secrets in it.

### Database backups

Backup archives contain personal data (names, contact details, medical notes).
They are stored in a private S3 bucket with Block Public Access enabled and
default encryption. They are never stored as GitHub Actions artifacts and never
committed to git. Access to the S3 bucket should be restricted to the IAM role
used by the backup workflow and to authorised operators only.

---

## Security-sensitive development requirements

### Adding new server-side features

- Any server action or route handler that mutates data must verify the caller's
  session and role before touching the database.
- Do not use the service role client for ordinary CRUD — use the SSR client so
  RLS applies.
- New tables must have RLS enabled and explicit policies. Do not rely on the
  default-deny behaviour alone — write explicit `SELECT`, `INSERT`, `UPDATE`,
  and `DELETE` policies.

### Adding new RLS policies

- Follow the no-direct-joins rule (see above).
- Test with a non-management user to confirm the policy is restrictive enough.
- Add the helper function to this document's authorisation section if it is new.

### Client bundle hygiene

- Run `npm run check:client-secrets` locally if you touch anything in
  `src/lib/supabase/` or create new server-side utilities.
- The CI pipeline runs this check on every build. A failure means a secret
  pattern has leaked into the browser bundle — treat it as a blocking issue.

### Dependency updates

- Keep dependencies up to date, particularly `@supabase/ssr`, `@supabase/supabase-js`,
  and Next.js, which are in the security-sensitive request path.
- Review release notes for breaking security changes before upgrading.

### Personal data handling

The application stores personal data including names, contact details, dates of
birth, and medical notes for minors. Any feature that stores, surfaces, or
exports personal data should be reviewed against the access controls described
above before being merged.
