<!-- BEGIN:git-agent-rules -->

# Git Rules

Always follow these rules.

## Before editing

FIRST ACTION — run:

```
git rev-parse --abbrev-ref HEAD
git fetch origin
```

Then choose base for work:

1. **Depends on open feature branch / unmerged PR**  
   Stay on feature branch, or create child branch from it (`git checkout -b feat/<ticket-id>-<description>`). Do **not** branch from `main` if the new work needs those unmerged commits.

2. **Independent of open PRs**  
   Refresh and branch from up-to-date `main` (never from a stale local `main`):

```
git checkout main
git pull origin main
git checkout -b feat/<ticket-id>-<description>
```

3. **Already on `main`, `master`, or `develop`**  
   Create feature branch before editing (same commands as independent work above).

Only after the correct branch is checked out may you edit files.

Branch names use `feat/<ticket-id>-<description>` (or `feat/<description>` when there is no ticket). Prefer this over `feature/`.

## After completing feature

Commit using **Conventional Commits**:

Format: `<type>(<scope>): <short description>`

Examples:

- feat(auth): add invite-only registration
- fix(api): handle expired JWT tokens
- docs(readme): update installation steps
- refactor(db): simplify query builder
- test(auth): add login integration tests
- chore(ci): upgrade GitHub Actions

Push the feature branch and open a PR into `main`. Do not merge directly to `main` when branch protection requires a PR.

Further commits for the same open PR go on that same feature branch (or a stacked child branch if a separate review is needed).

<!-- END:git-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
