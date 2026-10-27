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
- Deliver each agreed feature with real accounts and persistence before advancing
  to the next scoped increment. Do not implement features during documentation work.
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
  tests/manual checks for the changed behavior. Use the focused task checks below;
  do not claim checks ran when they did not.
- For docs-only changes, inspect the full diff, links, decision coverage, and
  preservation of existing guidance. An app build is not required.
- Report what changed, checks performed, any limits, and the branch/PR. Keep docs
  aligned with actual setup; do not describe planned capabilities as implemented.


### Task checks

- Run `npm run test:tasks` for task input validation (Node.js 22.18+).
- For task schema/permission changes, run `supabase/tests/tasks_rls.sql` after the
  migration in a test database and verify its final PASS result. Do not claim RLS
  isolation was verified until the database assertions actually run.

### Calendar checks

- Run `npm run test:calendar` for date validation, month boundaries, leap years,
  and date-only formatting. Keep event dates independent of the server time zone.
- Run `supabase/tests/calendar_events_rls.sql` after applying the event migration
  in a test database. Verify its final PASS result before claiming isolation.
- Only call `localToday()` in browser effects/events; do not read a live clock
  during prerendering. Keep Supabase server access behind its request-time boundary.

### Notes checks

- Run `npm run test:notes` and `supabase/tests/notes_rls.sql` for note changes.
- Keep note bodies plain text and preserve line breaks. Never render stored text
  as unsanitized HTML. Keep the explicit-save contract visible to users.
- Preserve revision checks on existing-note saves; a stale tab must not silently
  overwrite another saved revision. Report conflicts while retaining the draft.

### Theme checks

- Run `npm run test:themes` and the preference RLS assertions for theme changes.
- Use shared semantic palette tokens for new controls; do not hard-code light
  backgrounds that break Midnight. Check main text, muted text, controls, and focus.
- Keep theme preferences account-scoped. Refresh the layout after auth changes,
  and do not put user preferences into a shared cache or persistent browser storage.

### Dashboard layout checks

- Run `npm run test:dashboard` and `supabase/tests/dashboard_layouts_rls.sql`.
- Keep saved layouts restricted to known widget ids and half/full widths, one
  instance per type. Removing a widget must never delete source records.
- Preserve revision checks, explicit save/cancel, keyboard controls, and responsive
  stacking without changing the account's saved widget widths.

### Reuse and refactoring

- Read docs/ARCHITECTURE.md before adding another page or control. Reuse
  PlannerPage/PlannerHeading, the shared UI primitives, and semantic theme tokens.
- Register navigation in src/lib/navigation.ts and preserve the static proxy
  matcher list. The shared test suite checks coverage.
- Use requireAccount for protected pages and getAccountContext inside mutations.
  Do not replace per-action authorization with page gating or cache identities.
- Keep feature validation, owner filters, revision checks, and save/retry semantics
  in feature modules. Reuse presentation without merging unrelated data operations.
- Run npm test, lint/build, and docs/MVP_REVIEW.md before confirming a refactor.

### Client save reliability

- Reuse runAction for client action failures; preserve framework redirects.
- Keep drafts and stable create-request ids until confirmed success. Do not retry
  writes automatically or report an unconfirmed response as saved.
- Use createRequestId for new records, including local HTTP phone testing.
- Run npm run test:client when changing action boundaries or request ids.

### Spaces checks

- Run npm run test:spaces plus existing Notes/shared regressions when changing the
  shared PlainTextEditor. Keep notes and space-page save actions separate.
- Apply the spaces migration and run supabase/tests/spaces_rls.sql; do not claim
  live privacy verification until its final PASS result is confirmed.
- Preserve same-owner parent constraints, immutable ownership/parent fields,
  revision checks, explicit saves, and stable IDs for create retries.

### Knowledge link checks

- Reuse the shared picker/editor and current-title Connections lists. Keep link
  insertion draft-only until the feature's existing save confirms persistence.
- Run npm run test:links plus Notes/Spaces regressions. Run the linked-knowledge
  migration and privacy assertions before claiming live account isolation.
- Preserve security-invoker functions, owner filters, RLS, authenticated-only
  execute grants, and source/target validation. Never accept a caller-supplied owner.
- Keep JS/SQL marker parsing aligned: note/page kind, UUID identity, one-line label
  of 1–200 Unicode characters, deduplicated identities, and body limit 20,000.
- Do not render stored text/labels as HTML or resolve arbitrary external URLs.

### Search checks

- Run npm run test:search and shared navigation/task regressions. Apply the search
  migration and run supabase/tests/search_rls.sql before claiming live isolation.
- Preserve read-only security-invoker search, explicit owner filters, authenticated
  execution grants, literal matching, bounded pagination, and failure states.
- Do not store search terms/results across accounts or add them to URLs/history.
- Keep exact task-result reads owner-filtered and independent of list truncation.

### Template checks

- Run npm run test:templates and Spaces/Notes regressions. Apply the starter
  migration and run supabase/tests/space_templates_rls.sql before claiming live
  atomicity, retry safety, or isolation.
- Keep starter content in the database catalog, with preview/copy from the same
  source. Page content must obey existing title/body limits and remain plain text.
- Keep creation transactional and security-invoker; preserve RLS/owner-parent
  constraints. Never accept caller ownership or arbitrary template page payloads.
- Retain request IDs on unconfirmed results and clear them only after confirmation.
  Retried creation must never overwrite later user edits or rename the space.

### Task-space checks

- Run npm run test:task-spaces, existing task tests, and full regressions. Apply the
  task-space migration and run tasks_rls.sql plus task_spaces_rls.sql before
  claiming live same-account assignment/privacy checks.
- Preserve nullable assignment, composite parent ownership, narrow column grants,
  explicit moves, original assignment baselines, and conditional-update conflicts.
- Reuse TaskList/AddTaskForm across main, dashboard, and space views. Include the
  shared TASK_SELECT projection so assignments never appear falsely unassigned.
- Never delete/copy a task when removing its space. New-task retry confirmation
  must match both saved title and requested space.

### Desktop design checks

- Preserve the confirmed retro desktop visual direction in PRODUCT_BLUEPRINT.md.
  Reuse DesktopWindow, DeskIcon, SpaceArtwork, semantic palette/accent tokens, and
  the existing shared form controls; do not create disconnected page-specific skins.
- Keep theme IDs synchronized between the palette registry and database allowlist.
  Do not imply custom colors/backgrounds/covers are already persisted.
- Run npm run test:desktop, theme contrast checks, and existing regression suites.
  Check sidebar/keyboard/focus, long content, narrow screens, and every palette.
- Keep decorative window chrome non-interactive. Dashboard preview data must stay
  account-scoped, real, bounded with clear labels, and separate from saved widgets.

### Workspace widget checks

- Keep registered widget IDs and validation in sync across app and database.
- Never auto-rewrite existing/empty layouts when expanding the registry. New-widget
  additions and Restore default remain draft changes until Save confirms.
- Run dashboard layout and desktop tests plus SQL privacy/revision assertions.
- Reuse embedded DesktopWindow content; preserve source data when removing widgets.
- Preserve preview bounds, account-scoped reads, and responsive stacking without
  altering saved widths.

### Palette library checks

- Run the theme contrast/allowlist parity tests and existing preference SQL privacy
  assertions. Check text on every accent surface, action states, focus, and inputs.
- Use explicit mode metadata for colorScheme. Keep original preference keys/defaults
  valid and do not automatically change the owner's saved palette.
- Isolate preview variables from the saved app root; radio selection is not a save.
- Arbitrary color/CSS persistence requires its own design/validation; do not treat
  this preset-library increment as completion of full visual customization.

### Widget accent checks

- Keep optional accent enums synchronized in JS and SQL; automatic uses omission.
- Preserve id/width/order when changing or clearing accent metadata. Do not
  auto-rewrite older rows/defaults or let arbitrary CSS/hex values enter layouts.
- Run layout/contrast regressions and the widget accent SQL privacy/revision tests.
- Apply accent roles through shared theme tokens and validated data attributes;
  keep preview-only changes separate from confirmed saves.

### Space appearance checks

- Keep icon/cover/accent allowlists aligned in shared types and database checks.
- Reuse SpaceVisual/SpaceMark for preview/cards/header/navigation; never interpolate
  arbitrary URLs, SVG markup, or CSS. Automatic cover must be stable for identity.
- Save metadata with the space's existing owner/revision guard and retain failed
  drafts. Older name-only submissions must not clear appearance columns.
- Run space-appearance, Spaces, desktop, and theme regressions plus live SQL privacy
  tests, including preservation of appearance across template creation retries.

### Desktop background checks

- Reuse the background preset parser/attributes for the saved root and isolated preview.
- Keep backgrounds account-scoped with explicit saves, retained drafts, and revision guards; never store arbitrary CSS or external URLs.
- Run background/theme regressions and desktop_background_rls.sql after migration 015. Theme saves must preserve the background and its revision.

### Keep the project understandable

- Keep README.md concise and current; put owner editing/recovery notes in docs/OWNER_GUIDE.md and implementation boundaries in docs/ARCHITECTURE.md.
- Reuse WindowTitleBar, DesktopWindow, and fields.Select for standard chrome/controls. Keep specialized native widget-toolbar selects compact.
- Prefer extending an existing relevant module over adding single-use pass-through wrappers. Extract shared behavior only when callers actually share the contract.
- Remove unused imports/assets only after checking code references and framework file conventions. Preserve database migration history, privacy assertions, lockfile, and generated Next.js instructions.
- Explorer exclusions are presentation only. Never hide source, tests, migrations, environment examples, or configuration to disguise unnecessary files.

### Responsive navigation checks

- Keep all routes in PLANNER_ROUTES; phone shortcuts must not orphan secondary sections.
- Reuse MobileSection for temporary phone panels; keep children mounted and drafts intact. Desktop content must remain visible and saved widget metadata unchanged.
- Keep position enums in JS/SQL aligned, explicit preview/save and owner/revision guards. Palette/background writes must preserve navigation.
- Check 320/390/768/1280 CSS pixels, keyboard/More dismissal, 44px touch controls, and bottom safe area. Reset temporary browser viewport overrides.
- Run test:navigation, full regressions, and navigation_position_rls.sql after migration 016. Do not claim live SQL or physical-device verification from mocks/emulation.

### Focus timer checks

- Keep active countdown state in the keyed account provider, not layout JSON, database history, localStorage, or a shared cache.
- Supply live clock values only from events/effects. Derive remaining time from a deadline; do not subtract assumed interval ticks.
- Preserve paused subsecond time, stop at zero, and never automatically start the next session. Keep countdown announcements off; announce completion once.
- The timer is an optional eighth widget. Keep existing seven-widget defaults, saved layouts, widths/accents, revision guards, and RLS unchanged.
- Run test:timer plus full regressions and focus_timer_widget_rls.sql after migration 017. Check route navigation, reset, refresh, account change, and mobile controls.

### Task planning checks

- Keep title-only capture valid; defaults are null due_date and none priority. Reuse TaskPlanning everywhere TaskList is used.
- Use shared date-only validation/UTC formatting. Do not infer urgency from missing fields or create calendar events/reminders silently.
- Save only due_date/priority with verified owner/id/planning_revision; preserve failed drafts. Title/completion/assignment must not reset metadata or bump its revision.
- Run test:task-planning and regressions plus tasks_rls.sql/task_planning_rls.sql after migration 018. Keep applied migration history unchanged.

### Guidance and compact dashboard checks

- Use the verified-owner, security-invoker guidance RPC over all relevant open tasks. Do not rank from recent/limited previews or invent task deadlines/urgency.
- Derive local today only in client effects/events; refresh on source-version/local-day changes. Failures must not show empty-success guidance.
- Keep rule explanations aligned with SQL ordering, all-day calendar labels, and a user choice of another task. Never overwrite an active timer.
- Guidance is an optional ninth widget; explicit promotion/save preserves metadata and seven-widget defaults. Compact styling must keep readable fonts, real actions and phone touch targets.
- Run test:guidance plus regressions and dashboard_guidance_rls.sql after migration 019; confirm live privacy/ranking/older-record tests before claiming verification.
