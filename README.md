# Life Planner

A private, customizable planner with a playful late-90s/early-2000s desktop.

**Start here: [Your editing guide](docs/OWNER_GUIDE.md).** It explains the folders,
safe edits, checks, and recovery. [Architecture](docs/ARCHITECTURE.md) maps reusable
components; [the blueprint](docs/PRODUCT_BLUEPRINT.md) records product direction;
[the review checklist](docs/MVP_REVIEW.md) covers manual testing.
[AGENTS.md](AGENTS.md) gives coding assistants development conventions.

## What works now

- Email/password accounts with confirmation and sign-out.
- Private tasks: add, rename, complete/reopen, assign to a space, and set optional due dates/priorities.
- All-day calendar events, plain-text notes, and space pages.
- Saved internal links/backlinks, private search, and Personal/Work/Study starters.
- Space icons/covers/accents, ten available dashboard widgets (seven by default), twelve palettes,
  and saved solid/dots/grid backgrounds.

Saves are explicit; failed saves retain drafts. Removing a widget keeps its data.
Notes/pages/spaces/layout/backgrounds and task planning guard stale edits. Task title/calendar/theme
updates use the last successful write. Revisions are not history/restore.

Social sign-in, timed/recurring events, reminders, deletion/export/history, sharing,
offline drafts, rich text, custom databases, uploaded wallpaper, and
other advanced widgets remain future work. Notion/Obsidian imports are not implemented.

Phone layouts use compact navigation and expandable panels. Settings offers saved
left/right/top/bottom navigation; left/right adapt to a top bar and side-aligned
More menu on phones. Desktop widget order/widths remain unchanged.

## Local setup (Windows PowerShell)

Use Node.js 22.18+ for the tests. Open your actual Git repository, then run npm ci.
For a fresh checkout only, copy .env.example to .env.local; do not overwrite an
existing configured file. Fill these values locally:

| Variable | Meaning |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Supabase HTTPS project API URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Publishable key, never secret/service-role |
| NEXT_PUBLIC_SITE_URL | http://localhost:3000 locally; canonical HTTPS URL when deployed |

Keep .env.local private and out of commits/screenshots. .env.example is placeholders.
In Supabase Authentication URL Configuration, include the exact
http://localhost:3000/auth/callback redirect plus the HTTPS callback for deployment.
Keep email confirmation enabled. Open confirmation in the same browser (PKCE);
if another browser opens it, sign in after confirmation. The built-in sender has
recipient/frequency limits; configure production email before broad registration.
Forgot-password is not implemented.

After database setup, run npm run dev and open http://localhost:3000.
Signed-out users go to /login. Stop with Ctrl+C. A production preview uses
npm run build followed by npm start.

## Database setup and privacy checks

**Keep all supabase/migrations files.** New databases need every migration in
filename order; existing databases need only unapplied ones. Do not rerun history,
edit applied migrations, or drop tables to get past setup errors.

| Suffix in filename order | Purpose | SQL test in supabase/tests |
| --- | --- | --- |
| 001 create_tasks | Tasks | tasks_rls.sql |
| 002 create_calendar_events | Events | calendar_events_rls.sql |
| 003 create_notes | Notes/revisions | notes_rls.sql |
| 004 create_planner_preferences | Preferences | planner_preferences_rls.sql |
| 005 create_dashboard_layouts | Layouts | dashboard_layouts_rls.sql |
| 006 create_spaces | Spaces/pages | spaces_rls.sql |
| 007 linked_knowledge | Links/backlinks | knowledge_links_rls.sql |
| 008 unified_search | Search | search_rls.sql |
| 009 space_templates | Starters/receipts | space_templates_rls.sql |
| 010 task_spaces | Task assignment | task_spaces_rls.sql |
| 011 workspace_widgets | Seven widgets | workspace_widgets_rls.sql |
| 012 desktop_theme_library | Twelve palettes | desktop_theme_library_rls.sql |
| 013 widget_accents | Widget colours | widget_accents_rls.sql |
| 014 space_appearance | Space styling | space_appearance_rls.sql |
| 015 desktop_background | Backgrounds | desktop_background_rls.sql |
| 016 navigation_position | Menu placement | navigation_position_rls.sql |
| 017 focus_timer_widget | Optional timer placement | focus_timer_widget_rls.sql |
| 018 task_planning | Task dates/priorities | task_planning_rls.sql |
| 019 dashboard_guidance | Owned guidance + widget | dashboard_guidance_rls.sql |
| 020 inbox_capture | Atomic quick capture + review queue | inbox_capture_rls.sql |
| 021 habits | Habits, check-in snapshots, optional widget | habits_rls.sql |
| 022 today | Connected daily read + complete counts | today_rls.sql |
| 023 projects | Projects + reversible typed relations | projects_rls.sql |

Review SQL before running it; use a disposable/test database where possible.
Assertions create fictional users/records and roll back changes. Confirm every
final PASS; stop on failure. Unit tests do not prove live isolation. Manual SQL
Editor setup does not register CLI migration history: reconcile history before
adopting CLI deployment. Keep your own record of applied migrations.

User-owned data uses RLS and narrow grants; actions verify fresh identity and owner
filters. No service-role key is used. Never weaken policies or add shared account
caches to make a feature work. The organization cleanup required no database changes. Navigation persistence
requires migration 016 and its privacy checks.

## Checks and syncing

Run npm test, npx tsc --noEmit, npm run lint, and npm run build.
Focused commands are in package.json, e.g. npm run test:themes. SQL tests are
separate. Use MVP_REVIEW.md for browser, keyboard, phone, privacy, failure, and
stale-tab checks. The restricted assistant environment sometimes blocks
Turbopack's CSS helper; check the production build in your normal terminal.

After merging an approved PR, stop the old server and follow the exact folder and
sync commands in [Your editing guide](docs/OWNER_GUIDE.md).
The Documents/Codex/work/life-planner review copy is separate and is not a Git
checkout. Do not pull there or copy its whole folder over your repository.

## Folder map

| Location | Purpose |
| --- | --- |
| src/app | Screens, feature controls, save actions |
| src/components/ui | Shared visual building blocks |
| src/lib | Rules, palettes, navigation, account access |
| src/app/responsive.css | Saved navigation placement and phone layout rules |
| scripts | Automated checks |
| supabase | Database history and privacy assertions |
| docs | Editing guide, architecture, blueprint, review |
| .vscode/settings.json | Hides generated Explorer clutter only |
| package.json / package-lock.json | Commands/dependencies and exact versions |
| next.config.ts / tsconfig.json / eslint.config.mjs | Framework, types, lint |

The empty public folder is for future assets. Unused starter images were removed.
node_modules, .next, next-env.d.ts and *.tsbuildinfo are generated working files,
not extra planner features. Explorer hides them without deleting them.


## Optional focus timer

After migration 017, use Customize dashboard > Add Focus timer > Save layout.
Focus/short/long sessions have start/pause/resume/reset and 1-180 minute lengths.
The countdown continues across planner routes in this tab; refresh/close resets it.
Its placement saves, but active sessions/history do not sync or persist. No sound,
OS notification, or automatic next session. Run npm run test:timer.

## Task planning foundation

Quick capture remains title-only. Open Add a date or priority on any saved task,
choose optional planning details, then Save task plan. Clearing/canceling stays
draft-only until confirmed. Apply migration 018 and run test:task-planning plus
the SQL privacy checks. Due dates are date-only; no events/reminders are created.
The blueprint records optional nutrition/workout modules as future work. Capture-first
guidance is implemented in the subsequent increment described below.

## Your next step and compact widgets

After migration 019, add/promote Your next step at the top and Save layout. It uses
explainable rules over all owned open tasks and upcoming all-day events, not just
recent previews. Show another and Open task keep you in control; focus reuses the
timer without overwriting an active session. Desktop previews are more compact,
with full month/map/task controls available in disclosures or their main pages.
Run npm run test:guidance and the SQL privacy/ranking checks. No AI service is used.

Guidance is visual-first: Next up, keyword badges, counts and short event rows.
Why this? and How suggestions work reveal the detailed reasoning on demand.

## Inbox and quick capture

After migration 020, use + Capture for a task or note, optionally in a space.
Inbox links to the saved source; Reviewed clears only its queue entry. Unsaved drafts
survive closing the dialog/routes within this tab, but refresh/sign-out clears them.
Run npm run test:inbox and the Inbox SQL privacy assertions. See OWNER_GUIDE for editing notes.

## Habits

After migration 021, choose Habits for presets, flexible schedules and binary/amount check-ins. Dates open history; saved check-ins retain their recorded targets. Add the optional Habits today widget through the dashboard pencil and Save layout. Run test:habits and the live SQL checks. Multi-step routines and AI remain future work.

## Connected Today

After migration 022, Today combines original due tasks, scheduled/logged habits and same-day all-day events. It reuses source editors and saves; counts cover all matching records with independent five-item pages. Open Today from navigation or the dashboard. Run test:today and the live SQL privacy/count checks.

## Connected Projects

After migration 023, Projects links existing tasks, notes and pages, with optional Space context and progress from all linked tasks. Unlink/restore keeps original records; source detail pages show project backlinks. Run test:projects plus tasks_rls.sql/projects_rls.sql. General database builders, project widgets and AI remain future work.

## Task project controls

After migration 024, task pencil editors let you browse/search existing projects and link, unlink or restore them. Tasks shows a Projects column; shared task cards show linked project badges. Three names plus a full count keep previews small. Run test:task-projects, tasks_rls.sql and task_project_picker_rls.sql. No source records are copied or moved.


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

### Recurring task setup

After migrations 001–027, apply `supabase/migrations/20261029002800_recurring_tasks.sql` once. It extends tasks and replaces Today/export functions; it keeps existing RLS and one-off task defaults. Run `supabase/tests/tasks_rls.sql`, `supabase/tests/recurring_tasks_rls.sql` and `supabase/tests/data_export_rls.sql`; each rolls back fictional fixtures. Confirm their final PASS results. `npm run test:recurring` tests controls, save boundaries, v1/v2 export compatibility and migration contracts. Try a real repeating task through its pencil editor before committing.

### Custom repeat setup

After 028, apply supabase/migrations/20261029002900_custom_repeats_calendar.sql once. Run recurring_tasks_rls.sql and custom_repeats_calendar_rls.sql for two PASS results. Refresh the app, test Custom repeat, then check Tasks on Calendar. Export now uses v3; older v1/v2 manifests remain supported by the app.


Migration 030 repairs the custom-repeat validator’s field count (seven fields). Apply it after 029, then rerun recurring_tasks_rls.sql and custom_repeats_calendar_rls.sql. It replaces only the validation function and preserves tasks, RLS and grants. test:recurring now checks the SQL field count and allowlist against DEFAULT_REPEAT_RULE.


### Optional task time setup

Apply supabase/migrations/20261029003100_task_due_times.sql after 030. Run custom_repeats_calendar_rls.sql and task_due_times_rls.sql for two PASS results. Refresh, save a clock time/zone through the task pencil, complete a repeat and check its successor and calendar entry. npm run test:task-time covers input, actions, UI, inheritance contracts and v1–v4 export compatibility.


### Calendar repeat previews

Apply migration 032 after 031. Run task_due_times_rls.sql and calendar_repeat_previews_rls.sql for two PASS results. Refresh Calendar to see future repeat previews. Time-zone controls are hidden by default and available under Settings > Workspace > Planning. Export uses v5 and retains compatibility with earlier versions.


### Calendar week view

Calendar now has Month/Week links. Week uses existing task times, all-day events and read-only repeat previews; no new migration is needed after 032. npm run test:calendar-week verifies date boundaries, cross-month owner-filtered reads, partial-failure handling, hourly buckets and view navigation.


### Calendar move setup

Apply supabase/migrations/20261029003300_calendar_reschedule.sql after 032. Run calendar_repeat_previews_rls.sql and calendar_reschedule_rls.sql for two PASS results. npm run test:calendar-moves covers input/action boundaries, modal scopes, retry identity, move eligibility, restricted database writes and export v6. Try Save move and refresh before committing. No changes are written on drag alone.
