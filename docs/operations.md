# Operations

Operational procedures for Football Team Organizer.

- [Deployment](deployment.md) — releases and environment setup
- [Database](database.md) — schema design and migrations

---

## Database backups

### How it works

Daily logical backups run via
[`.github/workflows/db-backup.yml`](../.github/workflows/db-backup.yml) on a
cron schedule (02:15 UTC) and can also be triggered manually. The workflow dumps
the target database with the Supabase CLI and uploads the archive to S3.

The target is whichever project `SUPABASE_DB_URL` and `SUPABASE_PROJECT_REF`
point to — configure those secrets/variables in GitHub Actions to target the
production project.

**Dumps go to S3 only.** They are never stored as GitHub Actions artifacts and
never committed to git. Archives contain PII and medical notes.

### S3 object layout

```
s3://$BACKUP_S3_BUCKET/database-backups/YYYY-MM-DD/backup.tar.gz
```

Each archive contains: `roles.sql`, `schema.sql`, `data.sql`.

### Required GitHub secrets and variables

| Name                   | Type     | Purpose                                                          |
| ---------------------- | -------- | ---------------------------------------------------------------- |
| `SUPABASE_DB_URL`      | Secret   | Session-mode Postgres URL (port **5432**) for the target project |
| `SUPABASE_PROJECT_REF` | Variable | Target project ref (must match the value in `SUPABASE_DB_URL`)   |
| `AWS_ROLE_TO_ASSUME`   | Secret   | IAM role ARN assumed via GitHub OIDC                             |
| `AWS_REGION`           | Variable | AWS region, e.g. `us-east-1`                                     |
| `BACKUP_S3_BUCKET`     | Variable | Destination bucket name (no `s3://` prefix)                      |

### Formatting `SUPABASE_DB_URL`

1. In Supabase: Dashboard → **Connect** → **Session pooler** (port **5432**) or
   Project Settings → Database.
2. Replace `[YOUR-PASSWORD]` with the real database password (not the anon/service
   role API key).
3. If the password contains `@`, `#`, `:`, `/`, `?`, `%`, or spaces,
   percent-encode those characters (`@` → `%40`, `#` → `%23`, etc.). Or reset
   the password to alphanumeric to avoid encoding.
4. Do not wrap the URI in quotes and do not add a trailing newline.

Expected shape:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

`failed to parse connection string` almost always means the password was not
encoded or the `[YOUR-PASSWORD]` placeholder was not replaced.

### AWS setup

1. Create a private S3 bucket with Block Public Access on and default encryption
   (SSE-S3 or SSE-KMS).
2. Add the GitHub OIDC provider in IAM
   (`token.actions.githubusercontent.com`) if the account does not have one.
3. Create an IAM role trusted by that OIDC provider with
   `sts:AssumeRoleWithWebIdentity`. The trust policy `sub` condition must use
   numeric owner/repo IDs (e.g.
   `repo:OWNER@OWNER_ID/REPO@REPO_ID:*`) — copy the exact `sub` from a
   CloudTrail `AssumeRoleWithWebIdentity` event if unsure.
4. Grant the role least-privilege writes on the backup prefix:
   - `s3:PutObject`, `s3:AbortMultipartUpload` on
     `arn:aws:s3:::BUCKET/database-backups/*`
   - Optionally `s3:ListBucket` scoped to the prefix
5. Add an S3 lifecycle rule to expire or transition old backups as required.

**Fallback:** use `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` instead of OIDC
by editing the `configure-aws-credentials` step in the workflow. This is not
preferred.

### Triggering a manual backup

GitHub → Actions → **Database backup** → **Run workflow**.

---

## Restore procedure

> **Never restore a production dump over a live production database without an
> explicit incident plan.** Always use a disposable Supabase project or a local
> Postgres instance.

```bash
# 1. Download (using your AWS profile / role)
aws s3 cp \
  "s3://${BACKUP_S3_BUCKET}/database-backups/YYYY-MM-DD/backup.tar.gz" \
  ./backup.tar.gz

# 2. Extract
tar -xzf backup.tar.gz

# 3. Restore into staging (session-mode URL, port 5432)
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -f roles.sql \
  -f schema.sql \
  -f data.sql

# 4. Delete local files when finished
rm -f backup.tar.gz roles.sql schema.sql data.sql
```

Role restore may warn about existing cloud roles on hosted Supabase — that is
expected. Adjust or skip `roles.sql` if the target project already has
equivalent roles.

---

## Applying schema changes

Migrations must be applied to the database **before** deploying application code
that depends on them.

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

After each schema change, regenerate TypeScript types and commit them with the
migration:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

For outstanding migration history issues (e.g. a project that applied an older
chain):

```bash
npx supabase migration list
npx supabase migration repair
```

---

## Monitoring

The application is hosted on Vercel. Check the following for operational issues:

- **Vercel dashboard** — deployment status, build logs, function logs
- **Supabase dashboard** → **Logs** — database query logs, Auth logs, API logs
- **GitHub Actions** — CI results and backup workflow run history

There is no application-level error reporting (e.g. Sentry) configured in the
current version.
