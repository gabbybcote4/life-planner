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

### Visual-first UI preference

- Prefer clear action cards, short lists and keywords over explanatory paragraphs.
- Keep one dominant next action; use labeled badges/date chips and existing palette/icon roles. Do not rely on colour alone.
- Put detailed rationale behind optional disclosures, while preserving visible task/date/priority information, accessible names, and visible error/save feedback.

### Inbox and capture checks

- Reuse QuickCaptureProvider and SpacePicker; keep drafts inside the keyed account provider. Refresh/sign-out clears unsaved text; never persist drafts across accounts.
- Quick capture creates a real task/note/space page and immutable original receipt atomically. Reviewed changes only queue status; preserve source data and revision guards.
- Keep stable request IDs until confirmed success. Matching retries must not overwrite later edits or review status. Never accept caller-supplied ownership.
- Run test:inbox, full regressions and inbox_capture_rls.sql after migration 020. Confirm live SQL and browser checks separately; voice/AI/tags remain future work.

### Tables and low-typing interaction direction

- Speech-to-text is deferred; read the latest priority update in PRODUCT_BLUEPRINT.md.
- Prefer selecting existing records, compact inline controls and linked views over repeated entry. Preserve the retro theme, visual-first labels and usable phone layouts.
- Scope the existing Tasks table before general custom databases. Relations use record IDs and verified same-owner access; unlinking never deletes source records.
- Preserve explicit save/error/conflict feedback and reuse controls without combining unrelated feature permissions. Roadmap notes are not implemented capabilities.

- Apply low-typing choices, presets, context defaults and useful suggestions across every module, not only habits. Keep advanced editing discoverable and AI proposals reviewable; do not claim future AI is implemented.

- Keep life areas connected through shared source records, selectable relations and a unified daily view. Do not duplicate records for different views or conflate task completion with habit check-in history.

### Habits checks

- Run test:habits, full regressions and habits_rls.sql after migration 021; confirm the live PASS before claiming isolation/history checks.
- Keep settings and check-ins separate. Preserve recorded target/unit/type on later settings edits; only amount is mutable in logs. Respect both habit/log revisions and stable creation IDs.
- Derive local day only in client events/effects. Keep Monday week boundaries, explicit dates, bounded pagination/preview labels, and same-owner Space references. Do not infer deadlines or silently generate tasks.
- Reuse shared editors/pickers and presets. Keep the optional tenth widget and existing seven-widget defaults/metadata. Multi-step routines, AI, streaks and full Today aggregation remain separately scoped.

### Connected Today checks

- Run test:today and all regressions; after migration 022 run tasks_rls.sql and today_rls.sql before claiming live aggregation/privacy verification.
- Keep Today read-only: aggregate original owner-scoped tasks/habits/events, not recent previews or copied records. Counts precede bounded independent pagination.
- Keep due-date, scheduled/logged habit and all-day event inclusion explicit. Never invent urgency for undated work or merge task completion with habit check-in history.
- Reuse TaskList/HabitCard/EventForm and confirm saves before refreshing counts. Preserve existing source ownership, revisions and draft/error protections.
- Read local day in effects/events only. Tag responses by day/offsets; failures must not become false zero counters. Preserve saved dashboard layouts and navigation placement.

### Project relation checks

- Run test:projects and full regressions; after migration 023 run tasks_rls.sql and projects_rls.sql before claiming live isolation/progress/retry checks.
- Keep projects and sources independent. Relations reference verified-owner record IDs; unlink never deletes source content. Preserve inactive relation rows/revisions for explicit restore and stale-write protection.
- Counts use all active linked tasks, not the paginated preview. Show current titles, complete counts and bounded catalog/item/backlink lists. Project status/Space must not silently alter linked task completion, dates or assignments.
- Reuse search, TaskList, SpacePicker and EditDialog. Keep creation identity stable until confirmed; close/reset only after success. Preserve selected project identity when catalog sort changes.
- ProjectBacklinks is source-kind-specific and owner-filtered. General databases, habit relations, project selectors for non-task records and AI remain separately scoped.

### Task project picker checks

- Run test:task-projects and regressions; migration 024 adds read-only project choices/badges. Run tasks_rls.sql and task_project_picker_rls.sql before claiming live privacy verification.
- Reuse ProjectLinkControl and its confirmed-save callback. Keep relation revision baselines for unlink/restore; never overwrite task title, completion, planning or Space.
- Enrich task lists with one bounded owner-scoped batch (up to 200 IDs, three badges plus exact total). Metadata failure is unknown, not zero. Load searchable twenty-project choices only when opened or explicitly refreshed.


### Browse-first record pickers

Spaces, project item links and note/page links load existing choices when opened; project type changes load that type. Search is optional, with bounded pages and explicit refresh/error states. Space and project-item pickers share useRecordChoices and browsePlanner. Blank browsing uses verified-owner reads under existing RLS; normal global search still waits for a term. No new migration is needed. Selection does not save or copy source records; existing confirmation flows stay intact.


### Settings workspace and display preferences

Settings has six compact keyboard-accessible categories: Appearance, Workspace, Accessibility, Account, Data & privacy, and About. Appearance groups Colours, Background, Fonts & text, and Zoom in expandable sections; Workspace owns navigation and the dashboard shortcut. Panels stay mounted to retain drafts when switching tabs. Existing theme/background/navigation forms keep their own saves.

Migration 025 adds font presets (classic desktop/system/rounded/monospace), 14/16/18px text, 90/100/110/125% app zoom, reduced motion, stronger focus and simpler backgrounds/shadows to existing owner-protected preferences. Text, zoom and accessibility have independent revision checks and narrow update grants. Missing setup permits a local preview but disables these new saves; it does not block existing controls or reset their saved preferences.

DisplayPicker owns preview/cancel/save. ThemeRoot reads saved display options separately from palette/navigation so a missing new column cannot erase the older choices. settings.css applies font roles, reading sizes, app zoom and accessibility attributes. App zoom is separate from browser zoom; very large combined settings can require scrolling. OS reduced motion is respected. About describes the current product without invented versions or AI/offline claims.

Run test:display, full regressions, TypeScript, lint/build. Apply 025 then run planner_preferences_rls.sql and display_preferences_rls.sql, checking both PASS results before claiming live privacy verification. Review font/text/zoom saves across refresh, phone overflow at 125%, keyboard tabs/strong focus and reduced motion; preserve theme/navigation settings.


### Planning defaults foundation (migration 026)

Workspace > Planning offers Sunday/Monday calendar starts and ISO, day/month/year or month/day/year short dates. Both the full calendar and dashboard mini-calendar use the chosen start; compact task due dates (including reused Today/Space/project lists) and upcoming event dates use DateLabel. Long spoken/full date headings and native date-input formats stay independent. No stored task/event dates are rewritten.

Existing Sunday-first/ISO behavior remains the default. Habit weekly goals remain Monday-based; this control is explicitly labelled Calendar week starts on. Time zones, habit week-policy changes, default views and reminders are future increments.

PlanningProvider carries fresh account-scoped preferences from ThemeRoot, with an independent read so unapplied setup cannot reset existing themes/fonts/navigation. PlanningPicker keeps local drafts, preview/cancel and confirmed-only saves. It reuses saveDisplay with an allowlisted planning group and planning_revision guard; unrelated settings revisions do not change. Missing setup permits previews but disables saves.

Run test:calendar, test:display, full regressions, TypeScript, lint/build. Apply only unapplied migration 026, then planner_preferences_rls.sql and planning_preferences_rls.sql; confirm both live PASS results before claiming privacy verification. Verify save/refresh, Monday alignment (November 2026), short labels, mobile layout and failed/stale drafts. Live DB checks remain pending until owner confirmation.


### Data export foundation (migration 027)

Settings > Data & privacy > Download JSON exports a versioned saved-data snapshot: tasks, events, notes, spaces/pages, habits/check-ins, projects and active/inactive relations, Inbox and starter receipts, preferences/layouts, and resolved owned note/page connections. IDs and raw saved bodies/markers are preserved; dates stay ISO. This is an export, not an implemented importer/restore service. Credentials, deleted records, unsaved drafts and running timers are excluded.

planner_export_data() is a stable security-invoker function with verified auth.uid(), explicit own-user filters, existing RLS and an internal table/column allowlist. There are no caller ownership arguments. It reads one statement snapshot, checks complete counts and UTF-8 sizes, and fails instead of truncating above 50,000 total records or 20 MiB. PostgREST row limits do not truncate nested arrays. Resolved links include only targets visible in the caller's own documents; unresolved references remain in raw saved text. No records are created or changed.

POST /settings/export requires matching Origin plus fresh getAccountContext, returns attachment JSON with private/no-store headers, validates the complete v1 manifest, and never returns a downloadable partial file on failure. ExportPanel offers retry and a direct download link, uses only transient account-keyed browser memory and revokes object URLs on replacement/unmount; no export payload is logged or cached. The route uses the normal account Supabase client, never a service-role key.

Run test:export, full regressions, TypeScript and lint/build. Apply only unapplied 027, then planner_preferences_rls.sql and data_export_rls.sql; verify both live PASS results. The latter rolls back fictional records, checks every collection for both accounts, includes over 1,000 tasks, preserves histories/inactive links, and exercises oversized/anonymous failures. Check a real download's counts, multiline/Unicode text, relations and settings; live SQL/download success remain pending until owner confirmation.

### Recurring tasks (migration 028)

Tasks > pencil > task plan now includes Does not repeat, Daily, Weekdays, Weekly and Monthly. Save a due date with a repeat. Completing an occurrence keeps its completed record and atomically creates one next task with the same title, Space, priority and active project links. It does not create calendar events, notifications, habit check-ins or a backlog of every missed date. Dates advance one scheduled interval, including overdue dates. Monthly repeats retain the original day and clamp to the last day of shorter months.

The same TaskPlanning/TaskList components serve Tasks, Today, dashboard, Spaces and projects. A short repeat badge appears beside the due date; completed repeating tasks link to their next occurrence. Reopening/recompleting an old occurrence never duplicates or removes its successor. Edit the next task to change a series; choose Does not repeat there to stop it. Completed repeat schedules are preserved. Future title/Space/project edits affect that occurrence and the successor created from it, not an already-created task.

Implementation: tasks owns repeat_frequency plus internal repeat_anchor_day, repeat_next_id and repeat_parent_id. Only repeat_frequency gains a client update grant. Existing owner RLS, same-owner foreign keys and planning_revision remain enforced. Invoker triggers reserve unique successor/parent identities and perform completion, next task and project copies in one transaction. A failure rolls back completion. Unsupported next dates beyond 2100 fail; stop repeating before completing that boundary occurrence. Monthly anchors reset on explicit due-date changes. No clock, scheduler or service-role key is needed.

Migration 028 updates Today metadata and the export function without editing applied migrations. Export v2 adds the four recurrence fields to tasks; the app still validates/downloads v1 from older setups. Run test:recurring, the full suite, TypeScript, lint and build. Run tasks_rls.sql plus recurring_tasks_rls.sql after applying 028, and recheck data_export_rls.sql. Confirm live SQL and browser behavior separately; automated tests do not establish live database PASS.
### Custom repeats and calendar tasks (migration 029)

Repeat presets now include Yearly and Custom. RepeatRuleFields reuses shared fields and provides every 1–99 days/weeks/months/years, selected weekdays, monthly date/nth-weekday/last-weekday patterns, and Never / On date / After 1–999 occurrences. Count includes the current task. Weekly selections must include its due-date weekday. Monthly dates and yearly leap days clamp in shorter months while retaining the original anchor; fifth-weekday patterns skip months without that fifth day. Explicit due/rule edits on the next open occurrence restart its anchor/count. No notifications or arbitrary recurrence-language import is implemented.

029 adds validated repeat_rule and internal repeat_anchor_date/repeat_index/repeat_finished. Only the rule gets an additional client update grant; identities, anchors, counters and finished state remain trigger-owned. End dates are inclusive. Completion stops cleanly at the selected ending; no nonexistent next-task link is shown. Reopening/recompleting never duplicates a successor. Existing applied migration 028 remains unchanged. Today carries the new metadata; export v3 preserves it and the app continues to accept v1/v2 downloads.

Calendar reads original owner-filtered tasks by due_date within the displayed month alongside calendar_events; it creates no event copies. Month cells show task counts and up to two task titles. The selected date reuses TaskList, completion, pencil editing and relations; completed tasks stay visible. Date/rename/completion saves revalidate Calendar. Full month reads have exact counts and explicit 1,000-task/1,000-event limits with errors instead of truncation; selected-day lists show at most 200 with a notice. Only saved occurrences appear; future repeat occurrences are created on completion, not projected/materialized in advance.

Run test:recurring, full regressions, TypeScript, lint/build. After 029, run recurring_tasks_rls.sql and custom_repeats_calendar_rls.sql, plus export regressions as needed. Confirm live database PASS and browser saves separately. Check selected weekdays, endings, Jan 31, fifth weekdays, leap years, stale drafts, repeat series endings, calendar edits/completion, phone overflow and all themes. Do not claim SQL or production build success from static tests.

Migration 030 repairs the custom-repeat validator’s field count (seven fields). Apply it after 029, then rerun recurring_tasks_rls.sql and custom_repeats_calendar_rls.sql. It replaces only the validation function and preserves tasks, RLS and grants. test:recurring now checks the SQL field count and allowlist against DEFAULT_REPEAT_RULE.

### Optional task times (migration 031)

TaskPlanning now has an optional minute-precision due time plus a named time zone. The device zone is suggested only when interacting with the clock/zone control, and existing saved zones are retained. Blank time means all-day, storing both due_time and due_timezone as null. A time requires a date and a valid named zone. Use shared src/lib/tasks/time.ts for parsing and labels; no per-card formatting forks.

031 adds due_time (time without time zone) and due_timezone (named zone validated against pg_timezone_names), with narrow update grants under existing RLS. Clock/zone changes share planning_revision, preserve failed drafts and cannot change completed repeat history or a source with an existing successor. Time-only edits do not restart the recurrence anchor/count. Atomic completion carries the clock and zone to the next occurrence; all-day clearing carries forward too. Date/rule recurrence semantics remain unchanged.

Times are civil clock labels in the stored task zone, not UTC instants or automatic device-zone conversions. A 09:00 America/Edmonton repeat remains 09:00 across daylight-offset changes. Ambiguous/nonexistent daylight-transition times are not resolved to delivery instants in this increment; notifications/alarms are not implemented. A future delivery scheduler must explicitly define that policy. Calendar grouping remains the saved due_date, not converted travel-zone dates.

TaskList badges and calendar previews show time; the day list includes its zone. Calendar sorts all-day tasks first, then saved clock times within each date (across zones this is a labelled civil-time order, not instant order). Today preserves its priority ranking and uses time within ties. No hourly repeat units, event durations, time-grid view or notifications are claimed. Export v4 includes both fields; v1–v3 remain readable by the app.

Run test:task-time, full regressions, TypeScript, lint/build. Apply 031 after 030; run custom_repeats_calendar_rls.sql and task_due_times_rls.sql for separate live PASS results. Confirm save/refresh, next occurrence time, all-day clearing, stale drafts, calendar labels and phone control layouts. SQL fixtures roll back. Do not infer live PASS from unit tests.
### Future calendar repeats and optional zones (migration 032)

Calendar now calls planner_calendar_repeats(month_start) for read-only future previews from verified-owner open occurrences, including sources before the displayed month. The RPC reuses planner_task_repeat_next with original anchors, counts, endings and clock times. It creates no tasks/events. A saved successor replaces its matching preview naturally; a reopened older occurrence with an existing successor produces no extra projections. Planned dates are labeled with ↻ and link to Edit repeat on their current source. Saved occurrences retain real completion/pencil controls. Editing one projected occurrence or arbitrary series splits is not implemented.

The stable security-invoker RPC accepts only a month, enforces owner RLS and authenticated grants, and fails rather than truncating above 200 repeating sources, 100,000 calculation steps or 5,000 returned previews. Out-of-range next dates beyond supported years end projection. Calendar reports a load error on unavailable/invalid projections, rather than falsely showing none. Month cells show counts and up to two combined saved/projected titles; selected-day planned entries are separate from saved tasks.

Settings > Workspace > Planning adds Show time-zone controls on tasks, off by default, persisted as show_task_timezones with the existing planning_revision guard. Hiding controls/labels never rewrites saved task zones. New timed tasks keep their device-zone suggestion; existing timed tasks retain their saved zone. TaskPlanning and TaskList use the account-scoped PlanningProvider; ThemeRoot reads the new preference independently so missing setup cannot reset week/date choices. Only insert/update of the new boolean is granted under existing preference RLS.

Export v5 adds show_task_timezones to preferences; earlier export versions remain accepted. Apply 032 after 031, then run task_due_times_rls.sql and calendar_repeat_previews_rls.sql. Confirm both live PASS results and browser behavior separately. Run test:recurring, test:task-time, full tests, TypeScript, lint/build. Check current/future month repeats, end-count/date, saved-successor replacement, reopening old tasks, stop-repeat behavior, settings save/refresh and mobile overflow. No projection is persisted in exports; source recurrence records preserve the schedule.