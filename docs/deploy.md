# Deploy

Host Football Team Organizer on Vercel with a hosted Supabase project.

Local setup is in [Install](install.md). Backups are in the [operations runbook](operations-runbook.md).

## CI / CD

| Stage                                                                      | When                        | What runs                                                          |
| -------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| Pre-commit                                                                 | Local `git commit`          | ESLint + Prettier on staged files only                             |
| GitHub Actions ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) | Every PR and push to `main` | `lint`, `format:check`, `test`, `build`, client-bundle secret scan |
| Vercel                                                                     | After push / PR             | Next.js deploy (preview or production)                             |

**Gate:** `main` requires a pull request and a green **Lint, test, and build** check before merge. That keeps failed CI from landing on `main` and triggering a production deploy. Preview deploys still build on the PR in parallel with Actions.

## Vercel

Repo config: [`vercel.json`](../vercel.json) (Next.js + Git deployments enabled).

Typical mapping:

- **`main`** (after merge) → production
- **PR branches** → preview

Production changes should go through a PR so GitHub Actions can block a bad merge.

### One-time project setup

1. Create/link the Vercel project and connect GitHub:

   ```bash
   npx vercel project add football-team-organizer
   npx vercel link --yes --project football-team-organizer
   npx vercel git connect https://github.com/tommyarmstrong/football-team-organizer --yes
   ```

2. Set env vars for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — **SERVER-ONLY**. Do not prefix with `NEXT_PUBLIC_`. In the Vercel dashboard, add it as a Sensitive secret, limit which team members can access Environment Variables, and set it for Production and Preview (invites need it on both). Never commit the real value.
   - `NEXT_PUBLIC_APP_URL` — public origin used in invitation links (production domain)

   ```bash
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development
   npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production,preview,development
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY production,preview
   npx vercel env add NEXT_PUBLIC_APP_URL production,preview
   ```

3. Push to `main` (or open a PR) to trigger a deployment.

This repository’s Vercel project: [vercel.com/tommyarmstrongs-projects/football-team-organizer](https://vercel.com/tommyarmstrongs-projects/football-team-organizer)

## Supabase Auth URLs

In Supabase **Authentication → URL Configuration**:

- **Site URL** — your public origin only (e.g. `https://your-domain.com`), not `/login`. Invite and reset emails fall back to this URL when `redirectTo` is not allow-listed.
- **Redirect URLs** — include:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/auth/confirm`
  - `https://your-domain.com/auth/invite`
  - `https://your-domain.com/auth/reset-password`
  - or a wildcard such as `https://your-domain.com/auth/**`

## Email templates

Single source of truth is `supabase/templates/`. Local `supabase start` loads them via `config.toml`. For **hosted** Supabase, paste each file into **Authentication → Email Templates** (and enable security notifications where noted):

| Dashboard template    | File in repo                                                 | Notes                                                       |
| --------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Invite user           | `supabase/templates/invite.html`                             | Uses `{{ .ConfirmationURL }}`; club/user from `{{ .Data }}` |
| Reset password        | `supabase/templates/recovery.html`                           | `token_hash` → `/auth/confirm` → `/auth/reset-password`     |
| Confirm signup        | `supabase/templates/confirmation.html`                       |                                                             |
| Magic link            | `supabase/templates/magic_link.html`                         |                                                             |
| Change email address  | `supabase/templates/email_change.html`                       |                                                             |
| Reauthentication      | `supabase/templates/reauthentication.html`                   | OTP via `{{ .Token }}`                                      |
| Password changed      | `supabase/templates/password_changed_notification.html`      | Enable security notification                                |
| Email address changed | `supabase/templates/email_changed_notification.html`         | Enable security notification                                |
| Phone number changed  | `supabase/templates/phone_changed_notification.html`         | Enable security notification                                |
| Identity linked       | `supabase/templates/identity_linked_notification.html`       | Enable security notification                                |
| Identity unlinked     | `supabase/templates/identity_unlinked_notification.html`     | Enable security notification                                |
| MFA method added      | `supabase/templates/mfa_factor_enrolled_notification.html`   | Enable security notification                                |
| MFA method removed    | `supabase/templates/mfa_factor_unenrolled_notification.html` | Enable security notification                                |

Templates personalize with `{{ .Data.first_name }}` and `{{ .Data.club_name }}` from Auth user metadata (set on invite). Do not hardcode a club name in the HTML.

## Hosted Auth settings

- **Password**: minimum length 8; requirements lowercase + uppercase + digits (matches `supabase/config.toml`).
- **Sessions**: timebox `24h` so sessions expire after 24 hours.

The recovery template uses `token_hash` + `/auth/confirm` (`verifyOtp`) so reset links work on any device. The default `{{ .ConfirmationURL }}` PKCE recovery links need a same-browser code verifier and often fail with “PKCE code verifier not found in storage.” Until the hosted Recovery template is updated, the app requests reset emails with the implicit Auth flow so Supabase’s default ConfirmationURL returns hash tokens instead of a PKCE `code`.

The app also handles Site URL `/login` fallbacks: it forwards invite tokens to `/auth/invite` and recovery tokens to `/auth/reset-password`.

Apply the database schema and seed as described in [Install](install.md#database) against the production Supabase project before the first login.
