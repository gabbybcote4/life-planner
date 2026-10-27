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
- Space icons/covers/accents, nine available dashboard widgets (seven by default), twelve palettes,
  and saved solid/dots/grid backgrounds.

Saves are explicit; failed saves retain drafts. Removing a widget keeps its data.
Notes/pages/spaces/layout/backgrounds and task planning guard stale edits. Task title/calendar/theme
updates use the last successful write. Revisions are not history/restore.

Social sign-in, timed/recurring events, reminders, deletion/export/history, sharing,
offline drafts, rich text, custom databases, uploaded wallpaper, habits, and
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
