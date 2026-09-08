# Development

Working on Football Team Organizer day-to-day.

- [Installation](instalation.md) — prerequisites, local database, starting the app
- [Architecture](architecture.md) — system design and decisions
- [Deployment](deployment.md) — Vercel and Supabase hosting
- [Configuration](configuration.md) — environment variables

---

## Running tests

```bash
npm test           # run once (CI uses this)
npm run test:watch # watch mode while developing
```

Tests use [Vitest](https://vitest.dev/) (`vitest.config.ts`). Suites live next to
source as `src/**/*.test.ts`. The suite mocks Supabase — it does not need a live
database.

### Coverage

Coverage uses the Vitest **v8** provider (`@vitest/coverage-v8`). Config lives
under `coverage` in `vitest.config.ts`: it includes `src/**/*.{ts,tsx}` and
excludes Supabase generated/client helpers, shadcn UI primitives, test helpers,
and `*.test.ts` files themselves.

```bash
npx vitest run --coverage
```

Open the HTML report under `coverage/` (gitignored) after a run. There is no
enforced coverage threshold in CI today — CI runs `npm test` without
`--coverage`. Treat coverage as a local / PR hygiene signal:

- Prefer a colocated `*.test.ts` for new logic under `src/lib/` (parsers,
  actions, data helpers, authz).
- When changing behaviour, extend the nearest existing test rather than only
  adding a manual check.
- Do not chase 100% on UI shells or generated types; focus on branching logic
  and security-sensitive paths (auth, invites, RLS-shaped helpers, archive /
  season migration).

---

## Linting

```bash
npm run lint
```

[ESLint](https://eslint.org/) with Next.js and TypeScript rules. Pre-commit hooks
run ESLint on staged files automatically (via Husky + lint-staged).

---

## Formatting

```bash
npm run format         # write
npm run format:check   # check only (used in CI)
```

[Prettier](https://prettier.io/) is the formatter. Pre-commit hooks also run
Prettier on staged files. The CI pipeline fails if `format:check` finds
unformatted files.

---

## Branching

Use the `feat/<description>` branch naming convention (or
`feat/<ticket-id>-<description>` when there is a ticket).

```bash
git checkout main
git pull origin main
git checkout -b feat/my-feature
```

### Environments and branches

| Branch       | Deploys to            | Supabase project |
| ------------ | --------------------- | ---------------- |
| `main`       | Integration (Vercel)  | Integration      |
| `production` | Production (Vercel)   | Production       |
| PR branches  | Vercel preview per PR | —                |

`main` is the integration environment. **Do not deploy directly to production**
— promote via PR from `main` into `production` (see [Deployment](deployment.md)).

---

## Pull requests

1. Open a PR from your feature branch into `main`.
2. GitHub Actions runs: `lint` → `format:check` → `test` → `build` → client
   bundle secret scan.
3. A Vercel preview deployment is created for the PR.
4. `main` is protected — a green **Lint, test, and build** check is required
   before merge.
5. To promote to production, open a PR from `main` into `production`. The
   `production-source` check enforces that the head branch is `main`.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(matches): add meet-up time to fixture
fix(rls): correct guardian assistant policy
docs(readme): update install steps
```
