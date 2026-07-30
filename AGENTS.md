<!-- BEGIN:git-agent-rules -->

# Git Rules

You must follow these rules.

FIRST ACTION:
Run:

git rev-parse --abbrev-ref HEAD

If the branch is main, master, or develop:

git checkout -b feature/<ticket-id>-<description>

Only after this succeeds may you edit files.

After you complete a feature you must commit the branch to git using **Conventional Commits**. 

Format is `<type>(<scope>): <short description>`

Examples:
- feat(auth): add invite-only registration
- fix(api): handle expired JWT tokens
- docs(readme): update installation steps
- refactor(db): simplify query builder
- test(auth): add login integration tests
- chore(ci): upgrade GitHub Actions

<!-- END:git-agent-rules -->


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
