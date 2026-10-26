<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Read [docs/PRODUCT_BLUEPRINT.md](docs/PRODUCT_BLUEPRINT.md) before planning or
  implementing product work. Keep confirmed decisions distinct from open questions.
- Keep the default planner simple; make advanced spaces, widgets, databases, and
  life modules optional. Build custom spaces/pages before general databases.
- The next feature priority is working add/edit/complete/save tasks with real
  accounts and persistence. Do not implement roadmap features during documentation work.
- Work in small increments: scope, code, test, show the result, confirm with the
  owner, then commit. Honor authorization already given for the specific change.
  Prefer a branch and PR; do not push to main or merge without approval.
- Preserve unrelated work and the generated Next.js block above.

## Repository setup and code style

- Use npm and the committed package-lock.json. Install with `npm ci`; avoid
  dependency changes unless needed for the authorized increment.
- App Router entry points are in `src/app/`, including `page.tsx`,
  `layout.tsx`, and `globals.css`; public assets are in `public/`.
- Use TypeScript with strict types, the `@/*` alias for `src/*`, existing
  formatting, and Tailwind/CSS theme variables. Keep components focused and reuse
  shared UI when it becomes useful; avoid premature framework abstractions.
- Respect Server/Client Component boundaries and existing Next.js configuration.
  Read the relevant installed Next.js guides before code changes.
- Make planner controls accessible by keyboard, label form inputs, maintain readable
  contrast, and verify narrow-screen layouts. Include loading, empty, saving,
  success, and error states for data interactions.

## Data and security

- Introduce Supabase early for real accounts and saved data. Protect all user-owned
  tables with per-user RLS; never rely only on client-side filtering.
- Verify isolation with two users and direct unauthorized read/write attempts
  whenever persistence or permissions change. Keep sharing explicit and private
  by default; do not weaken RLS to make a feature work.
- Keep secrets and service-role keys on the server and out of commits, browser
  bundles, logs, and screenshots. Environment files are ignored; document variable
  names with placeholders if setup instructions are needed.
- Keep schema changes in reviewable migrations when Supabase is introduced.
  Report persistence failures honestly and protect cached data across accounts.

## Verification and handoff

- For application changes run `npm run lint` and `npm run build`, plus focused
  tests/manual checks for the changed behavior. No test framework or test script
  currently exists; do not claim tests ran when they did not.
- For docs-only changes, inspect the full diff, links, decision coverage, and
  preservation of existing guidance. An app build is not required.
- Report what changed, checks performed, any limits, and the branch/PR. Keep docs
  aligned with actual setup; do not describe planned capabilities as implemented.
