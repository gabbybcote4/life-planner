# Your Life Planner editing guide

You do not need to understand every file to make a small change. Start from the
recipe below, change one thing, and review it before saving a checkpoint in Git.
This guide is for you; AGENTS.md is for coding assistants.

## Which folder should I open?

Your everyday VS Code project is:

C:\Users\gbcot\Desktop\life-planner\life-planner

Use VS Code's File > Open Folder on that folder. Its Source Control view should
show the life-planner repository. The Documents/Codex/work/life-planner folder is a
separate review copy used in this chat; it is not a Git checkout. Do not pull there
or copy its whole folder over the Desktop repository.

Before editing, open Terminal > New Terminal in VS Code:

```powershell
cd C:\Users\gbcot\Desktop\life-planner\life-planner
git status
```

If the folder is wrong, correct it before continuing. If there are uncommitted
changes, inspect them in Source Control first; do not overwrite or discard them.

## Do we need all these folders?

| What you see | Why it exists | Your usual action |
| --- | --- | --- |
| src/app | The screens and controls you see in the planner | Edit the specific screen |
| src/components/ui | Shared buttons, fields, windows, icons, space artwork | Edit here for an app-wide visual change |
| src/lib | Palettes, validation, navigation, account helpers | Use the recipes; take care with rules |
| docs | This guide, blueprint, architecture, review checklist | Read/update as decisions change |
| scripts | Checks that catch broken behavior | Keep; run npm test |
| supabase/migrations | Fifteen ordered database setup changes | Keep all; do not edit applied history |
| supabase/tests | Checks that accounts stay private | Keep; run separately when data rules change |
| public | Optional static image files | Currently empty; it may disappear from Git checkouts |
| .vscode/settings.json | Makes Explorer quieter | Safe to adjust the hiding rules |
| package.json | Commands and dependency names | Use its scripts; do not remove packages at random |
| package-lock.json | Exact dependency versions | Keep alongside package.json |
| next.config.ts, tsconfig.json, eslint.config.mjs | Framework/type/check settings | Usually leave alone |
| AGENTS.md | Instructions for future coding assistants | Keep; not a planner screen |
| .env.example | Placeholder configuration | Keep; contains no real keys |
| .env.local | Your local Supabase settings | Private; never commit or paste publicly |
| .git (normally hidden) | Repository history and branches | Never delete or edit manually |

Generated files are different from source:

- node_modules contains installed libraries. npm ci recreates it from the lockfile.
- .next contains development/build output. Next recreates it.
- next-env.d.ts and *.tsbuildinfo are generated TypeScript support/cache files.
- coverage and out are optional generated reports/export output, if created.

The project hides those generated items in Explorer, not on disk. It does not hide
source, tests, SQL, or config files. To reveal one, open .vscode/settings.json and
change its files.exclude entry from true to false; save. Restore true to hide it.
VS Code settings can also be opened with Ctrl+,; search for Files: Exclude and
check the Workspace tab. If an empty public folder is absent, nothing is broken.

## Audit findings (2026-10-27)

The audit inspected source imports from Next's page/layout/route/error/proxy entry
points, asset references, shared controls, styles, dependencies, and documentation.
File count alone is not a good reason to combine unrelated features.

Removed:
- Five unused Next/Vercel starter SVGs: file, globe, next, vercel, window.
- src/lib/supabase/client.ts, which had no caller. Current saves use server actions.
- src/app/notes/note-editor.tsx, a pass-through wrapper. Notes now calls the existing
  shared TextDocumentEditor directly with the same save action.
- CSS for the retired top navigation, fixed dashboard rail, and unused shortcuts.

Consolidated:
- WindowTitleBar now supplies window chrome for DesktopWindow, dashboard widgets,
  and theme previews from one existing component file.
- Select in fields.tsx supplies standard dropdown styling for Spaces, Search, and
  Background settings. Compact widget-toolbar selects retain their own styling.
- README and architecture now describe the current app rather than accumulating
  outdated feature-stage notes. Helpful editing comments mark shared entry points.

Kept intentionally:
- Separate feature actions: their ownership checks, retries, and conflict rules differ.
- Shared Notes/Spaces editor, task controls, theme tokens, and space visuals.
- Every migration, privacy assertion, dependency lockfile, and test suite.
- Focused feature files rather than one giant screen/component.

No package was added and no database/schema/security rule was changed. Seven files
were removed; this guide and Explorer settings add two, for five fewer files in
that cleanup. The subsequent mobile/navigation feature adds its own focused files.
The audit does not prove every CSS selector or exported helper is necessary forever.
Revisit reuse as real features grow; avoid abstractions that only save a line.

## Find the right place to edit

Use Ctrl+P to open a file by name, Ctrl+Shift+F to search project text, and F12 on a
component name to see its definition. Source Control's diff shows exactly what changed.

| I want to change... | Open this file | What to look for |
| --- | --- | --- |
| Sidebar words | src/lib/navigation.ts | label values, not id/href |
| A page's welcome text | src/app/<feature>/page.tsx | PlannerHeading eyebrow/title/description |
| Dashboard welcome text | src/app/page.tsx | PlannerHeading |
| Browser tab title/description | src/app/layout.tsx | metadata |
| Palette colours/names | src/lib/themes/themes.ts | Palette variables and THEMES labels |
| Phone layout and navbar placement | src/app/responsive.css | Navigation rules first, phone rules below |
| Navigation choices/labels | src/lib/navigation.ts | NAV_POSITIONS; saved keys must match SQL |
| Phone fold-away panels | src/components/ui/mobile-section.tsx | MobileSection; desktop stays expanded |
| App fonts | src/app/retro.css | --font-desktop-ui/display/mono at the top |
| Borders, spacing, retro chrome | src/app/retro.css | Relevant commented section/class |
| Base controls and layout | src/app/globals.css | Shared class such as .form-control |
| All buttons' markup/behavior | src/components/ui/button.tsx | Button, variant and pending props |
| Standard input/dropdown markup | src/components/ui/fields.tsx | TextInput, TextArea, Select |
| Window title bars/dots | src/components/ui/desktop-window.tsx | WindowTitleBar and WindowDots |
| Space card/header appearance | src/components/ui/space-visual.tsx | SpaceVisual and SpaceMark |
| Built-in cover drawings | src/components/ui/space-artwork.tsx | Original SVG variants |
| Background texture drawing | src/app/retro.css | Shared desktop texture section near the bottom |
| Widget labels/default arrangement | src/lib/dashboard/layout.ts | WIDGETS and DEFAULT_LAYOUT |
| Dashboard widget content | src/app/dashboard/task-widgets.tsx or workspace-previews.tsx | Named widget component |
| Shared task controls | src/app/tasks/task-board.tsx | AddTaskForm / TaskList |
| Notes and space-page editing UI | src/app/components/plain-text-editor.tsx | Shared controlled editor |

A component is a reusable piece of UI. Props are the values a screen passes into
it. Changing a shared component affects all its callers; changing a screen's prop
usually changes only that screen. .tsx files contain UI; .ts usually contains rules
or configuration. page.tsx is a screen; actions.ts writes data on the server.


## Three small editing recipes

**Change wording.** Open src/app/tasks/page.tsx and edit the quoted title or
description passed to PlannerHeading. Keep the quotes and braces. Save with Ctrl+S
and check the running Tasks page. This needs no database change.

**Change a font.** At the top of retro.css, adjust one --font-desktop-* value,
keeping a fallback font. UI is controls/text, display is headings, mono is title bars.
Use a font installed on your computer; other devices may use the fallback. Check
headings, inputs, widgets, long text, and a narrow screen before keeping it.

**Change a palette colour.** In themes.ts, find the existing palette and colour
role. foreground is text, surface is windows/cards, background is desktop, primary
is the main action, and accent-* are coordinated highlights. Change the hex colour,
not the saved theme key. Run npm run test:themes: if contrast fails, adjust the pair
instead of deleting the test. Also inspect light/dark text, errors, inputs and focus.
Other palettes may inherit values using ...sage or ...midnight.

Adding a new palette/background/icon/widget option is a bigger change: app allowlists
and SQL constraints must agree through a new migration. Changing DEFAULT_LAYOUT
does not rewrite a user's saved arrangement; use Customize dashboard in the app.

## A safe small-change routine

Start from a clean main after an approved merge. Create your own branch:

```powershell
git switch main
git pull --ff-only origin main
git switch -c chore/my-small-change
npm run dev
```

Change one thing, save, and inspect it at http://localhost:3000. Save your planner
drafts before refreshing. Check a second page if the component/style is shared.
Review the diff in Source Control, then run:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Use Ctrl+C to stop a dev server if needed, or open a second terminal for checks.
Do not continue past a failing check just because the page looks right. A successful
build is not a substitute for checking keyboard focus, phone layout, saving/reload,
and both a light and dark palette. docs/MVP_REVIEW.md has the fuller checklist.
SQL privacy checks are separate when storage/permissions change.

When checks pass, stage only the files you intentionally changed in Source Control,
review the staged diff, and make a commit with a useful message. Publish the branch
and open a pull request on GitHub. Review it before merging. Do not stage .env.local,
generated files, or unrelated changes. This keeps a checkpoint you can return to.

## If something goes wrong

- For an unsaved edit, use Ctrl+Z. For a saved change, Source Control shows its diff.
- Copy any draft you need before undoing a file. Discard Changes on one specific
  uncommitted file restores the last committed version and loses its uncommitted edits.
  Use it only after checking/copying that file; do not discard everything blindly.
- For a committed mistake, use a separate revert commit/PR, preserving history.
- Red squiggles or terminal errors often identify a file/line. Check the first error
  and recent diff; look for a missing quote, brace, or closing JSX tag.
- If a test starts failing, compare your change with the last working commit.
  Do not delete the test to get green.
- If git says "not a git repository", check the folder path above.
- If a port is busy, stop the old dev server in its terminal. Confirm which URL
  the new server prints instead of testing an old running copy.
- If a preference/feature says setup is missing, inspect the unapplied migrations.
  Do not drop existing tables or weaken RLS.

Keep .env.local, auth/account helpers, proxy.ts, migration history, ownership filters,
revision checks, connection(), and server/client boundaries unchanged during a
simple visual edit. Those protect saved data and accounts. API keys and passwords
do not belong in a screenshot, commit, component, or browser console snippet.

## Sync a merged PR into your everyday project

Stop the old dev server with Ctrl+C, then:

```powershell
cd C:\Users\gbcot\Desktop\life-planner\life-planner
git status
git switch main
git pull --ff-only origin main
npm run dev
```

If status shows your own uncommitted work, save it on a branch first. If dependencies
changed, run npm ci before restarting. The audit changes no dependencies. The later saved-navigation feature needs
migration 016 and navigation_position_rls.sql before testing persistence. Keep using the prepared review folder only until the PR is merged.

For deeper changes, [ARCHITECTURE.md](ARCHITECTURE.md) explains reuse and data flow.
[README.md](../README.md) maps all setup migrations to their privacy tests.


## Mobile layout and navigation

Settings now offers left, right, top, or bottom navigation with preview and explicit
save. On phones, side choices become a compact top bar with the More menu aligned
to the chosen side; bottom stays at the bottom. All seven routes remain in More.

Phone panels can be opened individually. The first dashboard widget plus Quick add
and Recently added start open when present. This does not change saved widget order
or widths. Note/space libraries and colour/background sections fold away; closing
keeps drafts mounted. On desktop the content is fully visible.

Edit responsive.css for phone spacing/placement; keep the 44px touch targets and
bottom safe-area padding. Change route text in navigation.ts; do not remove ids or
saved position keys without coordinating the database. Test a real phone as well
as desktop resizing, especially its on-screen keyboard and bottom navigation.

## Focus timer

Use Customize dashboard > Add Focus timer > Save layout, after migration 017.
Start/Pause/Resume/Reset control the selected session. Focus starts at 25 minutes,
short break at 5, long break at 15. Session length accepts whole minutes 1-180;
changing mode/length resets it and requires pausing first. Completion waits for you.

The timer stays active while you browse within the same tab. Its small status
control beside account controls lets you pause/resume/reset away from Dashboard,
even if the widget is removed. Refreshing/closing the tab resets it; another tab
or device has its own session. No focus history, sounds, or notifications are saved.

Change defaults in src/lib/timer/timer.ts. Change widget/provider controls in
src/app/dashboard/focus-timer.tsx and appearance in retro.css's Focus timer section.
Keep clock reads in effects/events and the provider keyed by account. Use test:timer
after changing rules. Adding timer placement requires the existing layout SQL setup.

## Task dates and priorities

You can still dump a task in using just its title. Open Add a date or priority under
a saved task to plan it later. Choose an optional date and No priority/Low/Medium/High,
then Save task plan. Cancel restores the confirmed draft. Clear date & priority is
a draft change until saved. This is shared across Tasks, Dashboard, and Spaces.

A stale plan asks you to reload rather than overwriting newer choices. Copy any
draft you need first. Renaming, completing, or assigning the task does not clear
its date/priority. A due date is date-only; it does not create an event or reminder.

Edit labels in TASK_PRIORITIES in src/lib/tasks/types.ts; keep saved keys unchanged.
Shared date validation is in lib/calendar/dates.ts; planning controls/action are
in src/app/tasks/task-planning.tsx and planning-actions.ts. Add a new migration for
schema choices. Run test:task-planning. Existing tasks start with no date/priority.

The blueprint also records future optional meals/calorie tracking and workouts,
and capture-first guidance. Those modules and the Your next step widget are not
implemented by this planning-input increment.

## Guidance and less dashboard scrolling

After migration 019, click Add Your next step at the top, then Save layout. If it
already exists lower down, Move Your next step to the top does the same as a draft.
Cancel restores your layout. Width and accent still use the normal widget controls.

Guidance explains overdue/today/priority/date-based suggestions and shows three task
alternatives from all open tasks. Show another changes only the displayed option.
Open task lets you edit/complete it. Start focus uses the timer, without completing
the task or replacing an existing active/paused session. Missing dates/priorities
are organizing cues, not invented urgency. Refresh guidance rechecks saved plans;
source edits and local-day changes also refresh it.

Calendar commitments are all-day, not timed appointments. Sparse data may produce
an oldest-capture suggestion or no open task; read the reason. This is rule-based,
not automatic understanding of every note or an external AI integration.

Desktop widgets now use compact space shortcuts, smaller graphics and fewer repeated
headings. Month view, map links and Manage these tasks open the existing full
content. Recent tasks/events show up to three; open the full pages for everything.

Edit rule explanations/types in lib/dashboard/guidance.ts, UI in
app/dashboard/guidance-widget.tsx, and compact styling in app/responsive.css.
Ranking changes require a new SQL migration and matching explanation/tests.

## Visual-first labels

The dashboard now leads with Next up, a task title, status badge, counts and short
event rows. Open Why this? for the saved reason, or How suggestions work for the
rules. Neither disclosure changes the task. Colour always has a readable label.

Edit short status/date labels in lib/dashboard/guidance.ts (taskCue/
shortGuidanceDate), the card/list in app/dashboard/guidance-widget.tsx, and visual
styles in responsive.css's Visual-first guidance section. Keep due dates and action
buttons visible. Keep errors explicit even when shortening other copy.

## Inbox and quick capture

Use + Capture in the account controls. Choose Task or Note, enter text and optionally pick a space. A task is immediately available in Tasks; a note goes to Notes, or becomes a page in the chosen space. Opening Capture from a selected space supplies that space for an empty draft.

Close/reopen keeps an unsaved draft within this tab. Refresh, sign-out or account change clears it. Discard draft clears it explicitly. Wait for Captured before treating an item as saved; after an uncertain save, retry the unchanged draft or check Inbox first.

Inbox keeps the original capture. Open its source to edit, plan, move or complete it. Reviewed only clears the queue; Reviewed tab > Return to Inbox restores it. Later source edits do not rewrite the original snapshot. Deleting a source removes its Inbox receipt too.

To change capture fields/labels, edit src/app/inbox/quick-capture.tsx. Inbox cards are in capture-card.tsx; shared space choices are in src/app/components/space-picker.tsx. Validation belongs in src/lib/inbox/types.ts and actions in app/inbox/actions.ts. Styles are in responsive.css's Inbox section. Run npm run test:inbox after changes. Database changes require a new migration; never rewrite applied migration 020.

Apply migration 020 after earlier migrations, then run supabase/tests/inbox_capture_rls.sql. Check its PASS result. Voice capture, AI organization and tags remain planned features.

## Small edits: start here

You can experiment locally without publishing every change. Save, preview, then Undo if you dislike the result. GitHub receives changes only when you commit and publish; ordinary font/style changes need no Supabase update. A separate assistant review copy does not sync automatically.

| I want to change... | Open this file | What to look for |
| --- | --- | --- |
| App fonts everywhere | src/app/retro.css | The three --font-desktop variables at the top: ui, display and mono |
| Palette colours | src/lib/themes/themes.ts | Existing semantic palette values; keep theme keys unchanged |
| Buttons everywhere | src/components/ui/button.tsx | Shared button markup; appearance also uses CSS classes |
| Inputs everywhere | src/components/ui/fields.tsx | Shared inputs and selects |
| Tasks table columns | src/app/tasks/task-board.tsx | TaskList's table header and TaskRow's table cells |
| Tasks table spacing/phone layout | src/app/responsive.css | Tasks table section at the end |

For a first experiment, change one existing font name, keep the fallback fonts, save and view the app. Check both a heading and an input. Ctrl+Z reverses an unsaved experiment while the editor history is available. For saved file changes, inspect the Source Control diff; Discard Changes removes all uncommitted changes in that file, so use it only when every listed change is unwanted.

When ready to keep/share changes, use the existing branch/review workflow. Do not overwrite unrelated edits or commit .env.local. Publishing and database setup are separate from trying a visual edit.

## Tasks table foundation

The full Tasks page now uses three columns: Task, Date & priority, Space. Use Edit to rename; open the plan cell for date/priority pickers and Save task plan; open assignment for the shared Space picker and save. The checkbox completes/reopens the original task.

Phones show the same mounted controls as labeled stacked rows. There is no separate mobile copy of task data or draft state. Dashboard, selected-task and space lists retain the existing list presentation. Tables do not add custom databases, saved views, sorting/filtering, general relations or habit tracking yet. Tasks still show up to 200 recent records with an explicit notice; the table is not an all-record report.

No new SQL setup is needed for this presentation increment. Existing task planning and assignment permissions remain in use.

## Pencil editors

Saved tasks, calendar events, notes/pages and space settings now use a top-right pencil to open an editor popup. Dashboard and individual widget layout settings use the same pattern; timer length has its own labeled pencil. Completion and timer start/pause stay directly accessible.

Shared popup source: src/components/ui/edit-dialog.tsx. Shared styling: responsive.css, Shared pencil editing section. Each feature keeps its existing form, save buttons, validation, permissions and conflict handling. Task title, planning and assignment remain separate explicit saves inside one popup; closing does not save them.

Close or Escape returns to the card and keeps its mounted draft on this page. A pending save blocks closing. Navigating away, refreshing or changing accounts can discard unsaved drafts; this is not offline draft storage. Read each save message before leaving. Inbox original snapshots remain immutable; open their source to edit it.

Creation forms and Settings remain dedicated forms. Informational disclosures such as Why this? are not editors. The shared pencil does not grant editing to read-only data.

## Habits: presets, schedules and check-ins

After migration 021 and its privacy checks, open Habits (More on phones). Add habit opens the familiar popup. Choose a preset or a short name, Done/not done or Count/amount, a target/unit, and a schedule. Preset targets are editable. Optional Space uses the same shared picker.

Schedules: daily, selected weekdays, or a number of successful days per Monday-start week. A successful day meets that check-in's recorded daily target. You can log an extra day even when it is not due. No missed-day penalties or automatic tasks/reminders are created.

Binary habits check in/undo with one tap. Counts use plus/minus or an amount and Save. The date picker opens past check-ins for corrections. New habits start today; no earlier entries can be created. Editing targets/units/types does not rewrite a check-in already recorded that day: changes apply to new entries. Existing history uses its original target and unit. Pause stops new entries but keeps history/corrections. No permanent delete is included.

Dashboard > pencil > Add Habits today > Save layout adds the optional tenth widget. Existing layouts/defaults are unchanged. The preview shows up to five due/logged habits from a bounded twenty-record result, ordered toward relevant days. All habits opens the paginated full page. The local day comes from your browser; weeks start Monday. The full habit page keeps your chosen date when midnight passes; the dashboard follows today.

Source map: src/lib/habits/types.ts holds presets, validation and due labels; src/app/habits/habit-form.tsx handles settings; habits-view.tsx handles cards/date/check-ins; actions.ts authenticates and calls saved-data functions. Migration 021 owns tables, snapshots and permissions. Tests are scripts/test-habits.mjs and supabase/tests/habits_rls.sql. Use the shared EditDialog/SpacePicker/fields instead of adding new skins.

A failed refresh retains previous in-page drafts and labels the data as previous results. Another-tab conflicts require reloading the page to use the latest revisions; copy any unsaved draft first. Active drafts are not stored offline. Routines with multiple steps, AI suggestions, full Today aggregation and habit connections in the knowledge map are future work.

Creating a habit closes its popup only after confirmed success. The next opening starts a fresh form; failed or uncertain saves keep the popup and draft intact.

## Today: one connected daily view

Open Today in navigation (More on phones), or Open Today on the dashboard. It brings together open tasks due today/earlier, habits scheduled or recorded today, and today's all-day calendar items. Space links open the original context. The underlying records stay in their existing modules.

Tasks and habits use their shared completion/check-in controls. Pencils open the same editors, including calendar entries. Confirmed saves refresh Today. Moving a due date/event to another day can remove it from this view; its source remains saved. Habits retain their recorded targets and independent history rules.

Each section shows five items with its own Previous/Next controls. Counts cover all matching owned records, including older tasks. Undated tasks have a separate count/link to Tasks and are never assigned a deadline automatically. Calendar items have no invented times. Weeks start Monday; the browser supplies the local day.

Refresh Today after changes elsewhere. Returning to the browser tab refreshes data; a local-day change resets pagination. Failed refreshes label previous results and retain mounted drafts for the same page. Save before changing pages/sections or navigating away.

Edit the layout/labels in src/app/today/today-view.tsx and its Today CSS section in responsive.css. Validation/page size is in src/lib/today/types.ts; the bounded owner-scoped read is in migration 022. Source editors stay in their existing task/habit/calendar files. Do not change only the JavaScript page size: SQL limits/offset validation and tests must agree.

Apply migration 022 after 001–021. Run tasks_rls.sql plus today_rls.sql and confirm both PASS results. Run npm run test:today after code changes. This is rule-based aggregation, not AI organization, project relations or a replacement for the customizable dashboard.

## Connected Projects

After migration 023 and privacy checks, open Projects (More on phones). Add a project opens the shared popup: choose a name, optional short note, status and Space. Name presets only fill the name; they do not create tasks. A confirmed creation closes the popup and opens the new project.

Link item searches your existing Tasks, Notes or Pages. Find a title, then Link item. No source content is copied. A task/note/page can be linked to several projects. Use the original task controls to edit/complete a task; progress refreshes from all active linked tasks, even beyond the visible twenty-item page. Original titles stay current when renamed.

Unlink keeps the source saved and leaves a revisioned inactive relation. Its row shows Restore link; restore from that row rather than trying to recreate the old relation through search. Items are paginated with active links first. Project status does not complete its tasks, and moving the project's Space does not move linked sources. Deleting a source outside this UI removes its relation through the database constraint; this increment exposes no permanent-delete controls.

Open original leads to the source detail. A Projects section there provides backlinks for tasks, notes and space pages (six shown, with the total labeled). The main Projects page lists twelve projects at a time, alphabetically. Selected project identity is kept in the URL so a rename does not silently switch you to a different project. Refresh updates source changes made elsewhere; save drafts before paging/navigation/refresh.

Edit project fields in src/app/projects/project-form.tsx, relation search in project-item-picker.tsx, and the connected view in project-detail.tsx. Validation and source links live in src/lib/projects/types.ts. ProjectBacklinks is shared by the original task/note/page detail screens. Existing TaskList, SpacePicker, search, fields and EditDialog are reused. Migration 023 owns permissions, counts, relation identity and revision rules.

Run npm run test:projects plus the full checks after changes. Apply only unapplied migrations; after 023 run tasks_rls.sql and projects_rls.sql, verifying both PASS results. No new dependencies. General custom databases, project selectors for non-task records, habit-to-project relations, project widgets, AI and sharing remain future increments.

## Connect a task to projects

Open Tasks > pencil > Projects. Existing projects appear without typing; choose Link item, Unlink or Restore link. Find / refresh searches names or reloads choices. Create new projects on the Projects page. Unlinking keeps the original task.

The Projects column shows up to three names and a count of any others. A project name opens its project; + more opens the selected task with its project connections. If project information is unavailable, refresh after checking setup; it does not mean your saved links were removed.

TaskProjectAssignment owns the picker; TaskList in task-board.tsx owns table/card presentation. Shared ProjectLinkControl owns link controls. Prefer these shared files over copying controls. Migration 024 is required; styling changes do not require database edits.


### Browse-first record pickers

Spaces, project item links and note/page links load existing choices when opened; project type changes load that type. Search is optional, with bounded pages and explicit refresh/error states. Space and project-item pickers share useRecordChoices and browsePlanner. Blank browsing uses verified-owner reads under existing RLS; normal global search still waits for a term. No new migration is needed. Selection does not save or copy source records; existing confirmation flows stay intact.


### Compact app layout

The owner requested a denser app, including desktop. Shared sizing lives in src/app/compact.css, imported last by layout.tsx. Start with --density-gap (between panels), --density-panel (inside panels) and --density-control (desktop control height). Body text is 14px by default; smaller headings, narrower sidebars and tighter lists/forms/widgets reduce scrolling. Phone inputs remain 16px and interactive targets retain 44px sizing. Theme colours and saved dashboard order/widths remain independent. No database migration or saved density preference is introduced.


### Navigation edges in narrow windows

All four saved positions now retain their chosen edge at every width. Below 801px, Left and Right use a 64px quick-navigation rail and More opens inward; Top and Bottom retain their horizontal bars. This replaces the previous narrow-screen rule that put side choices at the top. Save navigation still confirms the account setting; the small diagram alone is only a preview. No database change is needed.


### Settings workspace and display preferences

Settings has six compact keyboard-accessible categories: Appearance, Workspace, Accessibility, Account, Data & privacy, and About. Appearance groups Colours, Background, Fonts & text, and Zoom in expandable sections; Workspace owns navigation and the dashboard shortcut. Panels stay mounted to retain drafts when switching tabs. Existing theme/background/navigation forms keep their own saves.

Migration 025 adds font presets (classic desktop/system/rounded/monospace), 14/16/18px text, 90/100/110/125% app zoom, reduced motion, stronger focus and simpler backgrounds/shadows to existing owner-protected preferences. Text, zoom and accessibility have independent revision checks and narrow update grants. Missing setup permits a local preview but disables these new saves; it does not block existing controls or reset their saved preferences.

DisplayPicker owns preview/cancel/save. ThemeRoot reads saved display options separately from palette/navigation so a missing new column cannot erase the older choices. settings.css applies font roles, reading sizes, app zoom and accessibility attributes. App zoom is separate from browser zoom; very large combined settings can require scrolling. OS reduced motion is respected. About describes the current product without invented versions or AI/offline claims.

Run test:display, full regressions, TypeScript, lint/build. Apply 025 then run planner_preferences_rls.sql and display_preferences_rls.sql, checking both PASS results before claiming live privacy verification. Review font/text/zoom saves across refresh, phone overflow at 125%, keyboard tabs/strong focus and reduced motion; preserve theme/navigation settings.


Settings categories live in settings-tabs.tsx; groups and available/current-versus-planned content live in settings/page.tsx. Appearance sections are native accordions: one opens at a time, with draft contents still mounted. Desktop tabs are 34px high; phone/touch tabs keep 44px targets in one scrollable row. No further SQL is needed for this regrouping (display saves still require migration 025).


### Consistent font roles

All headings, body text, form controls, legends, charts and desktop chrome use shared font tokens. Monospace, System and Rounded apply to all three roles; Classic desktop keeps its intentional heading/UI/console mix. Theme palette changes do not reset the saved font. Edit font stacks in src/lib/themes/display.ts, not individual cards. Legacy font-family declarations use token fallbacks rather than overriding the preset.
