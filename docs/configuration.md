# Configuration

Environment variables for Football Team Organizer. The machine-readable
reference is [`.env.example`](../.env.example). This document explains what each
variable means, where to find the value, and which environments require it.

**Never put real secrets in `.env.example`, documentation, or source control.**

---

## Variables

### `NEXT_PUBLIC_SUPABASE_URL`

The Project URL for your Supabase project.

- **Format:** `https://<project-ref>.supabase.co` — no trailing path (no
  `/rest/v1/`, no `/auth/v1/`, etc.)
- **Where:** Supabase Dashboard → Project Settings → API → Project URL
- **Required in:** all environments (local, integration, production)
- **Safe to expose:** yes — it is a public endpoint identifier

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The publishable (formerly "anon") key for your Supabase project. Used by both
the browser client and the SSR client.

- **Where:** Supabase Dashboard → Project Settings → API → Project API keys →
  `anon` / `public`
- **Required in:** all environments
- **Safe to expose:** yes — it is intentionally public. Row Level Security (RLS)
  policies enforce what an anonymous or authenticated request can actually see
  or change.

### `SUPABASE_SERVICE_ROLE_KEY`

The secret service role key. Bypasses RLS entirely.

- **Where:** Supabase Dashboard → Project Settings → API → Project API keys →
  `service_role`
- **Required in:** integration and production (server-side only — invites and
  onboarding admin APIs). Not needed to run the app in read-only/dev mode, but
  invite flows will fail without it.
- **Safe to expose:** **no**. This is a server-side secret.
  - Do **not** prefix it with `NEXT_PUBLIC_`.
  - Do **not** import `src/lib/supabase/admin.ts` (which uses this key) from any
    Client Component.
  - In Vercel: add as a **Sensitive** secret, restrict team member visibility,
    set for Production and Preview only.
  - CI uses a canary value (`ci-service-role-canary-do-not-leak-into-client-bundle`)
    and `npm run check:client-secrets` asserts it never appears in the browser
    bundle.

### `NEXT_PUBLIC_APP_URL`

The public origin of the app. Used to build absolute URLs in invitation emails
and redirect links.

- **Format:** `https://your-domain.com` (no trailing slash)
- **Local default:** `http://localhost:3000`
- **Required in:** integration and production (invite emails break without it).
  Optional locally — the app defaults to `http://localhost:3000`.
- **Safe to expose:** yes — it is the public domain

### `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`

Google Maps Embed API key for venue map iframes.

- **Where:** Google Cloud Console → APIs & Services → Credentials
- **Required in:** optional in all environments. Without it, venue pages embed
  a maps search query instead of an API-keyed map, which still works but may be
  less reliable.
- **Safe to expose:** yes (it is an Embed API key, not a server key). Restrict
  it in the Google Cloud Console to your production domain and the Embed API
  only.

---

## Per-environment summary

| Variable                                | Local         | Integration | Production |
| --------------------------------------- | ------------- | ----------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`              | ✓ required    | ✓ required  | ✓ required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | ✓ required    | ✓ required  | ✓ required |
| `SUPABASE_SERVICE_ROLE_KEY`             | ✓ for invites | ✓ required  | ✓ required |
| `NEXT_PUBLIC_APP_URL`                   | optional      | ✓ required  | ✓ required |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` | optional      | optional    | optional   |

---

## Local setup

```bash
cp .env.example .env.local
```

`.env.local` is gitignored. Never commit it. Fill in the values from your
Supabase project's API settings page and, for the service role key, treat it
with the same care as a database password.

For local Supabase via `npx supabase start`, read the values from:

```bash
npx supabase status
```

---

## Vercel setup

Set variables in the Vercel project dashboard under **Settings → Environment
Variables**, or via the CLI:

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production,preview,development
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production,preview
npx vercel env add NEXT_PUBLIC_APP_URL production,preview
```

`SUPABASE_SERVICE_ROLE_KEY` is intentionally excluded from Development in Vercel
— local dev uses `.env.local`. Only set it for Preview if your preview
deployments need to send invites.

---

## GitHub Actions secrets

The CI workflow uses placeholder env vars at build time — no real Supabase
credentials are needed. The backup workflow requires separate secrets:

| Secret / Variable      | Used by         | Notes                                                       |
| ---------------------- | --------------- | ----------------------------------------------------------- |
| `SUPABASE_DB_URL`      | `db-backup.yml` | Session-mode Postgres URL (port 5432) for the backup target |
| `SUPABASE_PROJECT_REF` | `db-backup.yml` | Project ref from Supabase dashboard                         |
| `AWS_ROLE_TO_ASSUME`   | `db-backup.yml` | IAM role ARN via GitHub OIDC                                |
| `AWS_REGION`           | `db-backup.yml` | AWS region                                                  |
| `BACKUP_S3_BUCKET`     | `db-backup.yml` | S3 bucket name (no `s3://` prefix)                          |

See [Operations](operations.md) for full backup configuration.
