# Operations runbook

## Database backups (logical dump → S3)

Daily logical backups are produced by [`.github/workflows/db-backup.yml`](../.github/workflows/db-backup.yml) (cron + `workflow_dispatch`). Dumps go to S3 only — never as GitHub Actions artifacts and never into git. Archives contain PII and medical notes.

### Object layout

```
s3://$BACKUP_S3_BUCKET/football-team-organizer/YYYY-MM-DD/backup.tar.gz
```

The archive contains `roles.sql`, `schema.sql`, and `data.sql` (Supabase CLI logical dump).

### Required GitHub Secrets / Variables

| Name                 | Type     | Purpose                                                                                                                                                                        |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_DB_URL`    | Secret   | Session-mode Postgres URL (port **5432**). Prefer the IPv4 Session pooler string from Supabase → Project Settings → Database. Do **not** use transaction pooler port **6543**. |
| `AWS_ROLE_TO_ASSUME` | Secret   | IAM role ARN assumed via GitHub OIDC (preferred over long-lived access keys).                                                                                                  |
| `AWS_REGION`         | Variable | AWS region for the bucket / STS, e.g. `eu-west-2`.                                                                                                                             |
| `BACKUP_S3_BUCKET`   | Variable | Destination bucket name (no `s3://` prefix).                                                                                                                                   |

Fallback (not preferred): `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` instead of OIDC — requires editing the workflow’s `configure-aws-credentials` step.

### AWS setup (outside this repo)

1. Create a private S3 bucket with Block Public Access on and default encryption (SSE-S3 or SSE-KMS).
2. Add a GitHub OIDC identity provider in IAM if the account does not already have one (`token.actions.githubusercontent.com`).
3. Create an IAM role trusted by that OIDC provider. The trust policy must use `sts:AssumeRoleWithWebIdentity` (not `sts:AssumeRole` for `s3.amazonaws.com`). GitHub’s `sub` includes numeric owner/repo IDs, for example `repo:OWNER@OWNER_ID/REPO@REPO_ID:ref:refs/heads/main`. Match that with `StringLike` (do not use `repo:OWNER/REPO:*` — it will not match). Copy the exact `sub` from a failed CloudTrail `AssumeRoleWithWebIdentity` event if unsure. Example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER@OWNER_ID/REPO@REPO_ID:*"
        }
      }
    }
  ]
}
```

4. Grant the role least-privilege object write on the backup prefix, for example:
   - `s3:PutObject`, `s3:AbortMultipartUpload` on `arn:aws:s3:::BUCKET/football-team-organizer/*`
   - optionally `s3:ListBucket` on the bucket (scoped by prefix condition)
5. Optional: S3 lifecycle rule to expire or transition old `football-team-organizer/` prefixes.

### Restore into a throwaway / staging project

Never restore a production dump over a live production database without an explicit incident plan. Prefer a disposable Supabase project or local Postgres.

```bash
# 1. Download (credentials via your usual AWS profile / role)
aws s3 cp \
  "s3://${BACKUP_S3_BUCKET}/football-team-organizer/YYYY-MM-DD/backup.tar.gz" \
  ./backup.tar.gz

# 2. Extract
tar -xzf backup.tar.gz

# 3. Restore into staging (session/direct URL, port 5432 — not 6543)
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -f roles.sql \
  -f schema.sql \
  -f data.sql

# 4. Delete local dump files when finished
rm -f backup.tar.gz roles.sql schema.sql data.sql
```

Role restore may warn about existing cloud roles; that is expected on hosted Supabase. Adjust or skip `roles.sql` if the target project already has equivalent roles.

### Manual backup run

GitHub → Actions → **Database backup** → **Run workflow**.
