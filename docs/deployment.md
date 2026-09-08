# Deployment

Football Team Organizer runs on **Vercel** (Next.js) with a hosted **Supabase**
project for each environment.

- [Development](development.md) — local setup
- [Configuration](configuration.md) — environment variables
- [Operations](operations.md) — database backups and maintenance

---

## Environments

| Branch       | Vercel deployment | Supabase project |
| ------------ | ----------------- | ---------------- |
| `main`       | Integration       | Integration DB   |
| `production` | Production        | Production DB    |
| PR branches  | Preview (per PR)  | — (no DB)        |

`main` is the **integration** environment. All feature work merges to `main`
first. To release to production, open a PR from `main` into `production`. The
`production-source` CI check enforces that only `main` can be the source branch.

---

## CI / CD pipeline

| Stage                                      | When                        | What runs                                                              |
| ------------------------------------------ | --------------------------- | ---------------------------------------------------------------------- |
| Pre-commit (local)                         | `git commit`                | ESLint + Prettier on staged files                                      |
| **Lint, test, and build** (GitHub Actions) | Every PR and push to `main` | `lint` → `format:check` → `test` → `build` → client bundle secret scan |
| Production source check                    | Every PR into `production`  | Fails unless head branch is `main`                                     |
| Vercel                                     | After push / PR             | Next.js build + deploy (preview or production)                         |

`main` is branch-protected: the **Lint, test, and build** check must be green
before a PR can merge. This prevents a broken build from triggering an
integration deploy.

### Build without a real backend

`next build` compiles with placeholder env vars (used in CI):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
npm run build
```

---

## Vercel setup (one-time)

1. Create and link the Vercel project:

   ```bash
   npx vercel project add football-team-organizer
   npx vercel link --yes --project football-team-organizer
   npx vercel git connect https://github.com/tommyarmstrong/football-team-organizer --yes
   ```

2. Set environment variables for **Production**, **Preview**, and
   **Development** in the Vercel dashboard (or via CLI):

   ```bash
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development
   npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production,preview,development
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY production,preview
   npx vercel env add NEXT_PUBLIC_APP_URL production,preview
   ```

   `SUPABASE_SERVICE_ROLE_KEY` is server-only — mark it as a **Sensitive** secret
   in the dashboard and restrict which team members can view it. Never set it on
   Development if it would point at the production database.

3. Configure the `production` branch mapping in the Vercel project settings so
   that `production` branch → production deployment and `main` → the integration
   alias.

4. Push to `main` (or open a PR) to trigger the first integration deploy.

---

## Supabase Auth URL configuration

In Supabase **Authentication → URL Configuration** for each hosted project:

- **Site URL** — the public origin only (e.g. `https://your-domain.com`), no
  path suffix.
- **Redirect URLs** — add:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/auth/confirm`
  - `https://your-domain.com/auth/invite`
  - `https://your-domain.com/auth/reset-password`
  - `https://your-domain.com/auth/forgot-password`
  - Or a wildcard: `https://your-domain.com/auth/**`

The app also handles fallbacks from the Supabase Site URL root — invite tokens
are forwarded to `/auth/invite` and recovery tokens to `/auth/reset-password`.

---

## Supabase Auth settings

- **Password policy** — minimum length 8; require lowercase + uppercase + digits.
  Must match `supabase/config.toml`.
- **Session timebox** — 24 h so sessions expire daily.
- **Public email signup** — disable in hosted projects. The app rejects sign-in
  unless the person is `invited` or `active`, but disabling signup is defence in
  depth.
- **Recovery flow** — use the `token_hash` template (implicit flow) so password
  reset links work across browsers. The default PKCE flow requires the same-browser
  code verifier and commonly fails with "PKCE code verifier not found".

---

## Email templates

Templates live in `supabase/templates/`. Local `supabase start` loads them via
`config.toml`. For hosted Supabase, paste each file into **Authentication →
Email Templates**:

| Dashboard template       | File                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| Invite user              | `supabase/templates/invite.html`                                      |
| Reset password           | `supabase/templates/recovery.html`                                    |
| Confirm signup           | `supabase/templates/confirmation.html`                                |
| Magic link               | `supabase/templates/magic_link.html`                                  |
| Change email address     | `supabase/templates/email_change.html`                                |
| Reauthentication         | `supabase/templates/reauthentication.html`                            |
| Password changed         | `supabase/templates/password_changed_notification.html`               |
| Email address changed    | `supabase/templates/email_changed_notification.html`                  |
| Phone number changed     | `supabase/templates/phone_changed_notification.html`                  |
| Identity linked/unlinked | `supabase/templates/identity_linked/unlinked_notification.html`       |
| MFA enrolled/unenrolled  | `supabase/templates/mfa_factor_enrolled/unenrolled_notification.html` |

Templates use `{{ .Data.first_name }}` and `{{ .Data.club_name }}` from Auth
user metadata (set on invite). Do not hardcode a club name in the HTML.

Enable **security notifications** on: Password changed, Email address changed,
Phone number changed, Identity linked/unlinked, and MFA events.

---

## Applying migrations (production)

1. Link the Supabase CLI to the target project:

   ```bash
   npx supabase link --project-ref <production-project-ref>
   ```

2. Push all pending migrations:

   ```bash
   npx supabase db push
   ```

Apply migrations **before** deploying new application code that depends on them.

---

## First-time production bootstrap

1. Apply all migrations (`npx supabase db push`).
2. Run `supabase/seed.sql` to create the first club and manager person.
   Optionally load `supabase/england.sql` for the England demo dataset (alone
   or after `seed.sql`).
3. Create an Auth user in the Supabase dashboard (Authentication → Users).
4. In Table Editor → `people`, set John Hall's `auth_user_id` to that UUID and
   `account_status` to `active`.
5. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel so invites work.
6. Confirm Supabase Auth redirect URLs (above).

Club creation via `create_club_with_management` requires an existing manager.
The empty `/no-access` page cannot bootstrap the first club.
