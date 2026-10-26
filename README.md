# Life Planner

A digital life planner, simple by default and customizable as it grows.
See [the product blueprint](docs/PRODUCT_BLUEPRINT.md) for the agreed direction
and [AGENTS.md](AGENTS.md) for development conventions.

## Current increment

Supabase email/password accounts, a live dashboard, a private task planner, an all-day calendar, plain-text notes, and saved account themes. Signed-in users can
add tasks, edit their titles, complete/reopen them, and reload saved results.
The database migration must be applied separately before tasks can be loaded.
Social sign-in, timed events, rich-text/linked notes, and advanced planning remain future increments.

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

The Tasks page at `/tasks` shows the 200 most recent tasks and labels that limit when older
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


## Dashboard

`/` is the signed-in dashboard. `/tasks` retains the full task workflow. Both
routes verify the session, refresh cookies through the proxy, and use the same
per-user RLS-protected task storage. No new migration or dependency is required.

The dashboard shows exact counts for open/completed tasks across the whole account,
a completion progress indicator, a quick-add form, and the five most recently added
tasks. Counts are not derived from the limited recent list. Titles and completion
can be changed from either page; successful mutations refresh both routes.

All-time counts and progress are labeled as covering all saved tasks, not daily
goals. Empty and failed-load states are distinct. The dashboard supports saved widget customization as described below.
Calendar and notes are not displayed as working features before implementation.

Dashboard review checks:

1. Add a task from the dashboard: To do and Total tasks each increase by one,
   and the task appears in Recently added and on the Tasks page.
2. Complete it from either page: To do decreases by one, Completed increases by
   one, and Total tasks is unchanged. Navigate between both pages and reload.
3. Reopen and rename the task. Confirm the result remains consistent across pages.
4. With more than five tasks, verify totals include tasks outside Recently added.
5. Check the empty dashboard and a completed-only list. Progress must remain valid
   with zero tasks. A failed load must not show zero counts as if loading succeeded.
6. Verify both routes redirect after sign-out and show only the signed-in account's
   data. Check keyboard navigation and narrow layouts.

## Calendar (all-day events)

`/calendar` shows a month grid and events for the selected day. Add events, rename
them, or move them to another date. All saved records are private to their owner.
The first visit chooses today's date in the browser's local time after hydration;
subsequent selection is stored in the URL as `/calendar?date=YYYY-MM-DD`.

Dates are date-only Postgres values. Fixed UTC formatting preserves the literal
event date across time zones. The range is 1900-01-01 through 2100-12-31; invalid
URLs return to today's local date. Month navigation clamps the selected day to
the new month's final day. Calendar weeks start on Sunday in this increment.

Apply `supabase/migrations/20261026000200_create_calendar_events.sql` once to a new
target, then verify `supabase/tests/calendar_events_rls.sql` in a test database.
The direct assertions use two fictional identities and roll back their records.
The migration creates only calendar event storage/index/trigger/policies and
leaves tasks unchanged. Review any existing table before proceeding if creation
fails; do not drop/replace existing data. A manually applied SQL Editor migration
does not register itself in Supabase CLI migration history; reconcile history
before adopting CLI deployment.

Only authenticated owners can select, insert, or update their events. Writable
columns are limited to title/date (and id/owner on insert). Anonymous access,
changing ownership/timestamps, and deletion are denied. Every save verifies the
session and filters by owner in addition to database RLS. Add retries reuse the
same UUID to avoid duplicates after a lost response.

Run `npm run test:calendar` for date/title validation, leap years, month alignment,
month/year boundary navigation, and time-zone-independent formatting. Also run
`npm run test:tasks`, lint, and build. No new packages are needed.

Calendar acceptance checks:

1. Open Calendar and verify it selects the browser's current local date. Move to
   another month, pick a date, and reload; that selection must remain in the URL.
2. Add an all-day event and refresh. Its title and date must remain saved.
3. Edit its title, then move it to a date in another month. Use the View date link
   to verify it appears on the new date and no longer appears on the old date.
4. Cancel an edit, and check that no saved values changed. Check a failed save
   retains input and a failed load never masquerades as an empty event list.
5. Verify the database privacy assertions pass, and use another account in a
   separate browser profile to confirm that lists stay private. Sign out and
   check that direct access to `/calendar` redirects to login.
6. Check keyboard controls, a narrow screen, February in leap/non-leap years,
   and December/January navigation. Today should use browser-local time.

A month query supports up to 1,000 events; a larger result shows an explicit error
instead of misleading partial counts. Unsaved drafts are not persisted across
date/page navigation. Concurrent edits use the last successful write. Timed and
multi-day events, recurrence, reminders, deletion, calendar integrations, and
Dashboard event widgets are separate future increments.

## Notes

`/notes` is a private plain-text library and editor. Save a title (1–200 characters)
and body (up to 20,000 characters, including line breaks). An empty body is allowed.
Markup stays literal text; it is never rendered as HTML. Save is explicit, with
unsaved/pending/error states. Drafts are not stored offline or autosaved; save
before opening another note, changing pages, or signing out.

The library is paginated in groups of 20, most recently updated first. Only note
summaries are loaded for the list; a selected note's body is fetched separately
with ownership filtering and RLS. Direct links use `/notes?note=UUID`, while
`/notes?note=new` opens a fresh page. Invalid/unavailable references do not reveal
other users' notes. Save returns to page one with the saved note selected.

Apply `supabase/migrations/20261026000300_create_notes.sql` once in a new target,
then run `supabase/tests/notes_rls.sql` in a test database. It verifies own reads/
writes, cross-account isolation, anonymous denial, input constraints, and the
server-maintained revision. Temporary fixtures are rolled back. Existing task
and calendar storage is not modified. Manual SQL Editor setup does not register
Supabase CLI migration history; reconcile history before automated deployment.

Notes use per-user SELECT/INSERT/UPDATE RLS plus restricted column grants. Only
title/body can be updated by clients; owner/id/revision/timestamps are protected.
Every save verifies the session. Existing-note updates include the editor's saved
revision, so stale-tab saves report a conflict and retain the draft instead of
overwriting a newer revision. Create retries reuse an ID to avoid duplicate notes.
A failed/lost update response can require copying the draft and reloading to check
which revision was saved. This is conflict protection, not version history.

Run `npm run test:notes`, existing task/calendar tests, lint, and build. Check:

1. Create a titled multi-line note, save, reload, and sign out/in; content remains.
2. Edit and save again; the title updates in the library and the body stays intact.
3. Open another note and return; saved notes keep their separate content.
4. Open the same saved note in two tabs. Save a change in one; saving a different
   change from the stale tab must retain its draft and report a conflict.
5. Verify privacy assertions and a second browser account. Signed-out direct
   access to `/notes` must redirect to login. Check literal markup, keyboard use,
   narrow layouts, and failed saves without losing the current draft.

Rich text, linked knowledge, autosave/offline drafts, deletion, history, sharing,
and dashboard note widgets remain future increments.

## Saved themes and settings

`/settings` offers Sage (warm stationery), Rose (soft pink), and Midnight (dark).
Select a theme and save it. Shared semantic colour variables apply it across
Dashboard, Tasks, Calendar, Notes, and Settings. Previews use the same palette
values as the live theme. Native form controls inherit the appropriate colour
scheme; major text/action/focus pairs have automated contrast checks.

The choice belongs to the signed-in account. A request-time theme wrapper reads
`planner_preferences` under that user's session without shared caching. Theme
saves refresh the root layout; sign-in/sign-out also refresh it to avoid carrying
one account's appearance into another. Signed-out users use Sage. No localStorage
or theme cookie is used. Existing users without a preference row default to Sage.
If preference loading fails, the planner stays usable with Sage; Settings reports
load/save failures instead of claiming the selection was saved.

Apply `supabase/migrations/20261026000400_create_planner_preferences.sql` once in a
new target and verify `supabase/tests/planner_preferences_rls.sql`. The assertions
use fictional identities and roll back their records. The table allows only owner
reads/inserts/theme updates. Owner reassignment, timestamp edits, unknown themes,
anonymous access, and deletion are denied. Existing tasks/events/notes are not
modified. SQL Editor setup does not register CLI migration history automatically.

Theme saves use update-then-insert with a duplicate-row retry, rather than an upsert
that would require granting permission to rewrite the owner key. Concurrent theme
saves use the last successful write. No secret/service-role key is required.

Run `npm run test:themes` for allowed values and palette contrast checks, plus
existing task/calendar/notes tests, TypeScript/lint/build. Manually review:

1. Save Rose, visit every planner page, and reload. The saved palette persists.
2. Save Midnight and review text, inputs, buttons, calendar selection, progress,
   note editing, and error messages. Check keyboard focus and a narrow viewport.
3. Sign out: login uses Sage. Sign back into the same account: its choice returns.
4. Sign into a second account: preferences stay separate. Confirm the database
   assertions pass, and verify failed saves keep the selection available to retry.

The loading shell uses the default Sage appearance until the request-time theme
arrives. This is a saved palette setting, not a custom theme editor, theme importer,
or custom dashboard widget creation. Contrast tests are not a full accessibility audit.


## Dashboard widget customization

Choose Customize dashboard on `/` to arrange Task overview, Quick add, Task
progress, and Recent tasks, one instance each. Remove widgets, add missing ones
back, move up/down, and choose half/full width. Wide screens use two columns;
narrow screens stack both sizes. Saved array order is reading/visual order.
Keyboard controls are supported; drag/drop and free pixel/height resizing are not.

Changes preview locally until Save layout confirms the database write. Cancel
restores the last saved layout. Restore default layout is a draft change that
also needs Save. An empty dashboard is valid; Customize remains accessible.
Removing a widget never deletes source tasks. Save task drafts before removing
their widget, because unsaved input may be discarded. Layout drafts do not persist
when leaving/reloading the page.

Apply `supabase/migrations/20261026000500_create_dashboard_layouts.sql` once in a
new target, then verify `supabase/tests/dashboard_layouts_rls.sql`. The migration
creates only layout metadata, shape validation, revision maintenance, and owner
policies. Existing themes/task/event/note data and policies are unchanged. Manual
SQL Editor setup does not register CLI migration history automatically.

Per-user RLS protects reads/inserts/updates; clients may update only layout, not
owner/revision/timestamps. App and database reject duplicate/unknown widgets,
invalid widths, extra content fields, and malformed shapes. Revision checks prevent
stale-tab overwrites. If an earlier response was lost, reload to check the saved
revision before making further changes.

Run `npm run test:dashboard`, existing tests, lint, and build. Manually check:

1. Remove/add/reorder/resize, Save layout, reload, and sign out/in. The account's
   arrangement must return. Check wide-screen half/full and stacked mobile widths.
2. Cancel draft changes. Restore default + Save must restore all four widgets.
3. Save an empty dashboard, reload, and add widgets again. Verify source tasks
   remain on `/tasks` throughout removal and restoration.
4. Add/edit/complete tasks and navigate to `/tasks`; content/counts must update
   without discarding an unsaved layout draft.
5. Run privacy assertions, check a second account's layout, and test two tabs on
   one saved revision: a stale save must report a conflict without overwriting.
6. Check keyboard controls, all themes, narrow screens, and failed-save feedback.

Only the four existing task widgets are in the first library. Calendar/notes
widgets, custom widgets, drag/drop, free resizing, and custom spaces are later work.

## Shared components and maintenance

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the reusable page frame, headings,
form controls/feedback, navigation registry, feature widgets, and verified account
helper. Use [MVP_REVIEW.md](docs/MVP_REVIEW.md) for the regression checklist.

`npm test` runs all feature suites and the shared UI/account-context checks.
`npm run test:components` runs only those new regressions. No new packages or
database setup are required for the shared-component refactor.

## Private spaces and pages

Visit `/spaces` to create or rename a private space, then create/edit plain-text
pages within it. Space names allow 100 Unicode code points; pages use the shared
200-character title and 20,000-character body limits. Both lists paginate at 20
items. Save drafts explicitly before navigating. There is no autosave, hierarchy,
sharing, deletion, page movement, or database builder in this increment.

Apply `supabase/migrations/20261026000600_create_spaces.sql` once, then run
`supabase/tests/spaces_rls.sql` and verify the final PASS result. The assertions
create temporary test users/records inside a rolled-back transaction. Use a test
project where possible. Manual SQL Editor setup does not register CLI history.

Spaces and pages have owner RLS and restricted column grants. A composite foreign
key ensures page and parent space have the same owner. Revisions protect edits
from stale overwrites; users cannot assign owners, parents, or revisions on update.
Stable create IDs allow confirmation of identical retried writes. Conflicting
retries keep the draft and ask the user to check the saved record.

Run npm test, lint, TypeScript, and build. Manually verify create/rename, page
create/edit/reload, two tabs with stale revisions, offline save/retry, keyboard,
phone layouts, all themes, and two real accounts. Existing Notes reuse the same
PlainTextEditor; verify ordinary note creation/editing as a regression check.
