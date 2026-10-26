# Life Planner

A digital life planner, simple by default and customizable as it grows.
See [the product blueprint](docs/PRODUCT_BLUEPRINT.md) for the agreed direction
and [AGENTS.md](AGENTS.md) for development conventions.

## Current increment

Supabase email/password accounts and a private task planner. Signed-in users can
add tasks, edit their titles, complete/reopen them, and reload saved results.
The database migration must be applied separately before tasks can be loaded.
Social sign-in, calendar, notes, and advanced planning remain future increments.

## Local setup (Windows PowerShell)

Requirements: a supported Node.js release for the installed Next.js version,
npm, and a Supabase project. The focused Node test command needs Node.js 22.18 or newer.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Fill in `.env.local` using the project's Supabase **Connect > Framework > Next.js >
App Router** instructions:

- `NEXT_PUBLIC_SUPABASE_URL`: your project's HTTPS API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: its publishable key (never a secret or
  service-role key).
- `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` for local development; your
  canonical HTTPS app URL for deployment.

Keep `.env.local` out of Git. `.env.example` contains placeholders only.

Before testing account creation, check Supabase **Authentication > URL
Configuration**. The redirect allowlist must include
`http://localhost:3000/auth/callback` (and the exact HTTPS callback for deployment).
Keep email confirmation enabled; use the same browser when opening its link,
because the confirmation exchange uses PKCE. Changing these dashboard settings
is a separate owner action; the code does not change them.

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000). Signed-out visitors are directed to
`/login`. Use **Create account**, confirm the email, and sign in. If the link opens
in another browser, return to the original browser or sign in after the email has
been confirmed.

Supabase's default email sender can restrict recipients and sending frequency.
Configure a production email sender before opening registration broadly. Do not
disable confirmation as a workaround. Forgot-password and social sign-in are
future increments.

## Verification

```powershell
npm run lint
npm run build
```

Manual acceptance checks:

1. Signed-out visitors to `/` are sent to `/login`.
2. Invalid email/empty password are rejected; new passwords require 8+ characters.
3. Create an account, confirm email, sign in, and reload. The same account remains
   signed in. Do not share passwords, confirmation codes, or session cookies in logs.
4. Sign out and revisit `/`; the account page is no longer accessible.
5. Check wrong-password and expired/missing confirmation-link feedback.
6. Use two separate browser profiles/accounts to verify account identity stays
   separate, and test keyboard navigation and a narrow viewport.
7. Apply the task migration and run the direct privacy assertions described below.

Task input checks run with `npm run test:tasks` using the built-in Node test runner. No third-party test framework is installed. The authenticated UI reads verified
claims behind Suspense boundaries for the existing Cache Components setup.
Session responses are private/no-store. Never cache authenticated responses at a
CDN or trust an unverified session cookie for data access.

## Structure

- `src/app/`: App Router pages, account actions, and confirmation callback.
- `src/lib/supabase/`: browser/server clients and environment configuration.
- `src/proxy.ts`: cookie-based session refresh using Next.js 16's proxy convention.
- `public/`: static assets.

Implementation follows the official [Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
and the installed Next.js documentation under `node_modules/next/dist/docs/`.

## Task storage and privacy

Apply `supabase/migrations/20261026000100_create_tasks.sql` once in the target
project, using the Supabase SQL Editor or your migration workflow. Review it before
running it: it creates only `public.tasks`, an index, an update timestamp trigger,
and ownership policies. It fails if that table already exists; stop and inspect
any existing table instead of dropping/replacing it. The transaction ensures the
table and its protections become available together.

The migration revokes default client grants, enables and forces RLS, then allows
signed-in users to select/insert/update their own rows only. Insert grants cover
id/owner/title; update grants cover title/completed only. Anonymous requests,
changing ownership/timestamps, and deletion are not supported. No service-role key
is needed by the application.

Run `supabase/tests/tasks_rls.sql` against a disposable local/test database after
applying the migration. It tests direct database access under authenticated and
anonymous roles, including two fictional user identities, valid own writes,
forged ownership, cross-account reads/updates, and input constraints. Its changes
are rolled back. If using a hosted SQL Editor for this test, review it first and
verify the final PASS result; stop if any assertion fails.

The planner shows the 200 most recent tasks and labels that limit when older
records exist. Task titles allow 1-200 characters. Completion and title changes
are saved separately so one action does not overwrite the other field. Add-task
retries reuse a client-generated UUID to avoid duplicate creation after a lost
response. Concurrent edits to the same title use the last successful write.

Before confirming this increment:

1. Run `npm run test:tasks`, `npm run lint`, and `npm run build`.
2. Verify the database privacy tests pass.
3. Sign in and add a task, rename it, complete it, reload, reopen it, and sign out/in.
   Confirm each saved result survives. Cancel an edit and check that it is unchanged.
4. Use a second account in a separate browser profile. Its list must not show the
   first account's tasks. Also verify `/` redirects after signing out.
5. Test keyboard/phone layouts and a failed save. Unsaved input must remain visible;
   a failed load must show an error, never a misleading empty task list.

The UI waits for a confirmed database response before showing saved state. This
increment does not implement offline persistence or claim that an unsent draft is
saved. No task data is placed in localStorage.

