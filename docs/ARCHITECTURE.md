# Reusable planner architecture

See [OWNER_GUIDE.md](OWNER_GUIDE.md) for editing recipes and audit findings,
[README.md](../README.md) for setup/migrations, and [MVP_REVIEW.md](MVP_REVIEW.md)
for testing. This describes the current structure, not old implementation stages.

## Three layers

A page reads authorized data and composes a screen. A feature component owns its
draft, feedback, and explicit save. Shared UI supplies a consistent appearance.
Validation and rules live in src/lib. Each feature action keeps its authorization,
owner filters, constraints, retries, and revisions. Share presentation without
merging unrelated database operations.

## Reuse map

| Concern | Source |
| --- | --- |
| Shell/loading/heading/account placement | src/app/components/planner-page.tsx: PlannerPage, PlannerHeading |
| Sidebar labels/destinations | src/lib/navigation.ts and PlannerNavigation |
| Setup/retry state | planner-page.tsx: SetupNotice, LoadError |
| Buttons and pending labels | src/components/ui/button.tsx |
| Inputs, text areas, standard dropdowns | src/components/ui/fields.tsx |
| Save/error/pending messages | src/components/ui/feedback.tsx |
| Empty panels | src/components/ui/empty-state.tsx |
| Retro title bar/window | src/components/ui/desktop-window.tsx: WindowTitleBar, DesktopWindow |
| Navigation icons | src/components/ui/desk-icon.tsx |
| Space preview/card/header/icon | src/components/ui/space-visual.tsx: SpaceVisual, SpaceMark |
| Original SVG covers | src/components/ui/space-artwork.tsx |
| Palette values/labels | src/lib/themes/themes.ts |
| Background preset parsing/attributes | src/lib/themes/background.ts |
| Core layout/controls vs retro appearance | src/app/globals.css vs src/app/retro.css |
| Navigation placement and phone rules | src/app/responsive.css |
| Temporary phone section disclosure | src/components/ui/mobile-section.tsx |

Button defaults to type=button; submit buttons explicitly use type=submit. Fields
forward native labeling, validation, disabled/read-only state, and callbacks.
Compact widget-toolbar selects and native radio/hidden fields remain specialized.
WindowTitleBar owns dots/classes; callers supply headings/actions. Embedded windows
avoid duplicate chrome inside a dashboard widget.

## Feature composition

- TaskBoard, TaskList, AddTaskForm serve Tasks, Dashboard, and Spaces.
  TASK_SELECT includes assignments in each relevant projection.
- TaskOverviewWidget, QuickAddWidget, TaskProgressWidget, RecentTasksWidget receive
  data as props. DashboardWidgets arranges content slots, not queries/source data.
- Workspace loaders read the verified owner's first three spaces, next five all-day
  events, and first twelve documents sorted by title/kind/id. The graph draws only
  saved links between displayed documents. It labels the bounds and UTC date context.
- TextDocumentEditor composes PlainTextEditor and owned link resolution for Notes
  and space pages. Notes now calls it directly; saveNote/saveSpacePage stay separate.
- LinkPicker inserts into a draft; normal document save persists it. LinkedText
  renders escaped text and resolved internal links. Connections shows current titles.
- MonthView receives dates/events; CalendarEvents owns forms. Local Today is computed
  after hydration. Date-only formatting uses UTC to preserve calendar dates.
- SearchForm posts queries as action state, not URL/history/shared storage.
  loadSelectedTask reads an exact owned result independently of list truncation.

Task/event/note/page titles allow 1-200 characters; document bodies up to 20,000.
Dates are 1900-2100. Tasks shows the latest 200 with a limit notice; notes/pages
paginate by 20. Calendar queries over 1,000 events report a limit error. Keep these
explicit bounds and feature-specific validation rather than silently truncating data.

## Drafts, saves, and retries

runAction catches transport failures while preserving Next redirects/not-found
control flow. Keep drafts and stable create IDs until confirmation. Do not retry
writes automatically or display Saved for an unconfirmed response. createRequestId
uses secure UUID/random bytes, including local HTTP without randomUUID.
No localStorage/persistent browser cache holds planner data. Save before navigation.

Notes/pages/spaces/layout/backgrounds retain revision baselines and report stale
saves without losing the draft. Task title/calendar/theme updates use the last
successful write. Task-space moves guard the original assignment. Creation retries
compare the original request without replacing later edits.

The starter catalog and receipt live in SQL. Space+pages+receipt are transactional.
Retrying does not recopy pages, rename a space, or reset its appearance. Receipts
record original request metadata, not general document history.

## Appearance contracts

themeVariables is the single palette-to-CSS mapping. Layout supplies the same Sage
fallback; ThemeRoot reads the verified account's preferences without shared caching.
Explicit palette mode sets colorScheme. Previews do not change the saved root.
Sign-in/out refreshes the layout to keep account settings separate.

retro.css owns local font roles (Tahoma/Verdana UI, Trebuchet headings, Lucida
Console title bars), shell/window styling, and semantic accents. Space presets are
validated; automatic covers stay stable by ID. Arbitrary URLs, SVG payloads, CSS,
uploaded wallpaper, and hex strings are not persisted as preferences.

Widget id/width/optional-accent validation matches SQL. Legacy layouts stay valid;
adding widgets/restoring defaults stays draft-only until Save. Removing a widget
does not delete its records. Existing rows are not automatically rewritten.

The shared background parser/attributes drive the saved desktop and isolated
preview. Saves update background columns with owner/background_revision guards.
A nondefault initial insert starts at revision 2 to protect concurrent first saves.
Palette saves do not change backgrounds.

## Account and database boundaries

requireAccount protects page reads; getAccountContext checks verified claims inside
each action. Page gating alone is not authorization. Supabase creation stays
request-scoped behind connection() before cookie/auth access; removing that boundary
previously caused Next prerender clock errors.

proxy.ts refreshes cookies and marks responses private/no-store. Its matcher must
stay a static literal; navigation tests check route coverage. Never cache identities
or authenticated responses across accounts.

Keep RLS, narrow grants, and composite same-owner parent foreign keys. Never trust
caller ownership/timestamps/revisions. Search/link helpers are security-invoker,
owner-filtered, and authenticated-only. Marker parsing matches JS/SQL: note/page,
UUID, 1-200-character one-line label, deduplicated identities, 20,000-character body.
Bodies stay plain text and never become unsanitized HTML.

Add new migrations instead of editing applied history. Do not build a generic
save-everything helper. Browser database access can be added if a real future feature
needs it; the unused browser-client module was removed.

## Verification

npm test renders actual components and mocks account/action responses. It checks
contracts/failures, not live RLS/browser interaction. SQL tests are separate.
This cleanup changes presentation reuse and organization, with no dependency,
migration, data operation, permission change, or timer implementation. The following
mobile/navigation increment is separate and adds migration 016.


## Mobile navigation and responsive panels

PlannerNavigation is a client component using the same PLANNER_ROUTES for the
full menu and MOBILE_PRIMARY_ROUTES shortcuts. The More disclosure is nonmodal:
route clicks, its close control, Escape, and outside pointer clicks dismiss it.
Escape/Close return focus to the toggle. Hidden menu items leave the accessibility
tree through CSS display:none. The shared Button accepts its native ref.

ThemeRoot reads nav_position on the verified account; Settings loads nav_revision.
NavigationPicker has isolated preview, cancel/default, explicit save and transport
feedback. saveNavigation authenticates and filters by owner/revision; it never
writes theme/background. Migration 016 restricts positions to four presets and
protects revisions, including concurrent nondefault initial inserts (revision 2).
Existing accounts remain left; no row/layout rewrite is performed.

responsive.css loads after retro.css. Left/right are desktop sidebars, top is a
sticky horizontal menu, bottom a fixed dock with reserved content/safe-area space.
At 800px and below, Dashboard/Tasks/Calendar/More replace the full navigation.
Left/right use a compact side rail and side-aligned More; top/bottom use their chosen edge.
Do not keep persistent sidebars on narrow phones and squeeze the editor.

Dashboard widget phone toggles are local UI state only. The first saved widget and
Quick add/Recently added start expanded; secondary panels collapse. Customization
opens content while editing. Saved identities/order/width/accent remain untouched.
MobileSection reuses the same phone disclosure pattern for libraries/settings,
retaining mounted children so closing never discards form drafts. Desktop content
stays visible regardless of phone disclosure state. No local storage is used.

Run test:navigation, the full suite, and navigation_position_rls.sql. Browser review
must include 320/390/768/1280px widths, every position, menus, drafts, touch targets,
bottom safe area, keyboard focus, and phone orientation. Desktop emulation does not
replace a physical iPhone/Android keyboard/safe-area check.

## Optional focus timer

src/lib/timer/timer.ts is the pure clock-free state machine: deadlines, exact paused
remaining milliseconds, explicit reset/mode/duration actions, and display formatting.
src/app/dashboard/focus-timer.tsx supplies the shared provider, widget, controls,
and small cross-page status disclosure. Existing Button/fields/feedback and palette
roles keep it consistent. ThemeRoot keys the provider by verified owner; sign-out
or account changes remount it. No timer state goes to browser storage or the DB.

Events start/pause with Date.now; effects tick and catch visibility/pageshow changes.
Rendering never reads the live clock. Delayed ticks derive time from endsAt. The
provider survives internal navigation; full refresh/tab close resets it. Sessions
are independent per tab/device. Completion announces once and does not autoplay.
There is no sound, OS notification, task logging, or saved focus history.

Widget placement uses the existing explicit layout save with the optional timer ID.
Migration 017 expands only the validator to eight possible IDs, preserving the
seven-widget default and all existing rows. Runtime countdown fields are rejected
in layout JSON. Removing the widget leaves a running session controllable from
the page-heading status disclosure; Reset ends it. No automatic database writes.

## Optional task planning inputs

TaskPlanning in src/app/tasks/task-planning.tsx is composed by TaskRow, so Tasks,
dashboard lists, space lists, and exact selected search results share one control.
TASK_SELECT includes due_date/priority/planning_revision everywhere relevant.
Quick capture stays title-only; creation/retry/rename/completion/assignment actions
do not write planning metadata. Existing records remain unplanned by default.

planning-actions.ts validates the shared date-only parser, priority allowlist, task
ID and revision, authenticates fresh context, then updates only date/priority with
owner/id/planning_revision predicates. Empty date clears it; priority none clears
priority. Missing/invalid fields cannot silently clear a plan. Confirmed saves
refresh relevant routes, advance the local baseline, and show current badges.
Errors/stale results retain drafts; cancellation restores the confirmed choices.

Migration 018 adds nullable date (1900-2100), four checked priorities and a protected
planning revision. Its trigger increments only when planning fields change.
Unrelated title/completion/space changes leave it alone. Existing RLS/parent keys,
title/completion behavior, and narrow insert grants remain unchanged. No data rows
are rewritten or calendar events created. This is input groundwork, not automatic
ranking or a guidance widget. Unit mocks and SQL assertions have separate scopes.

## Explainable guidance and compact dashboard

planner_dashboard_guidance(p_today date) in migration 019 is read-only, stable,
security-invoker, owner-filtered, and authenticated-only. It scans all owned open
tasks for exact counts, ranks three alternatives, joins only owned space context,
and returns three owned upcoming events plus today's event count. No recent-task
limit feeds the rankings. It accepts a date, never a caller owner. No notes are
sent to an AI service and no records are inferred or written by guidance.

DashboardGuidance reads latest owned task/event timestamps, using new per-owner
updated-at indexes, and passes a refreshKey to GuidanceWidget. The client requests
data after hydration using localToday(), refreshes when source versions or the
local day change, and supports explicit refresh. Guidance errors replace suggestions
instead of inventing zeros. Calendar mutations now refresh Dashboard as well.
Reason text and SQL ordering must remain aligned. Choosing another task is UI state;
the focus action reuses the existing provider and does not replace a paused/running
session. React escapes all saved labels; exact task links use the existing reader.

withGuidanceFirst promotes/adds only in a draft and preserves existing metadata.
Migration 019 adds the optional ninth identity to the validator without rewriting
defaults/rows. Source counts cover all relevant tasks even beyond the Tasks list's
200-row preview; SQL fixtures test that boundary and account isolation.

Compact presentation lives in responsive.css and existing widget modules: small
space shortcuts, horizontal counts, smaller dials, folded calendar/link detail,
three recent previews plus existing task controls under Manage these tasks.
The desktop grid retains saved half/full widths and source content; no masonry
order changes or shrinking of phone touch targets. Month previews remain explicitly
UTC; guidance dates use the local day, both labeled.

## Visual-first guidance presentation

taskCue and shortGuidanceDate in lib/dashboard/guidance.ts supply short labels from
the same explicit evidence as taskReason. GuidanceContent renders a single next-up
card, labeled metric tiles, date/space chips and a compact event list. Detailed
reasons/ranking remain in native disclosures. The RPC, owner boundaries, ranking,
refresh, timer behavior and saved layout contract are unchanged. Date formatting
uses explicit date arguments and UTC; no live clock reads enter rendering.

## Inbox and shared quick capture

`app/inbox/quick-capture.tsx` supplies the global native dialog through the account-keyed ThemeRoot. PlannerHeading launches it; Spaces passes the selected space. `components/space-picker.tsx` is shared with task assignment. Drafts live only in this tab's memory.

`lib/inbox/types.ts` validates input and resolves source links. `app/inbox/actions.ts` authenticates each capture/review; migration 020 implements one security-invoker transaction for the source and original Inbox snapshot. A note in a space becomes a space page. Queue review updates only reviewed with owner/id/revision guards. Sources keep their existing editors and permissions. Receipt retries compare the original payload and leave later edits intact.

`app/inbox/page.tsx` paginates owned queue/reviewed snapshots; capture-card.tsx links to existing source controls. Keep original text escaped. Deleting a source cascades its receipt; reviewing never deletes the source. This increment adds no voice, AI or tag service.

## Tasks table foundation

TaskList accepts an optional table presentation. TaskBoard uses it; other callers retain lists. TaskRow composes its existing completion/title controls, TaskPlanning and TaskSpaceAssignment in either semantic table cells or list rows. No duplicated mutation logic or new source records are introduced. Responsive CSS stacks the same mounted rows on phones; explicit table roles preserve structure when display rules change.

Date and priority deliberately share one planning cell and existing revision-protected save. This avoids separate cell forms overwriting each other's planning revision. General database properties, saved views and habit check-ins remain future increments.

## Pencil editors

Saved tasks, calendar events, notes/pages and space settings now use a top-right pencil to open an editor popup. Dashboard and individual widget layout settings use the same pattern; timer length has its own labeled pencil. Completion and timer start/pause stay directly accessible.

Shared popup source: src/components/ui/edit-dialog.tsx. Shared styling: responsive.css, Shared pencil editing section. Each feature keeps its existing form, save buttons, validation, permissions and conflict handling. Task title, planning and assignment remain separate explicit saves inside one popup; closing does not save them.

Close or Escape returns to the card and keeps its mounted draft on this page. A pending save blocks closing. Navigating away, refreshing or changing accounts can discard unsaved drafts; this is not offline draft storage. Read each save message before leaving. Inbox original snapshots remain immutable; open their source to edit it.

Creation forms and Settings remain dedicated forms. Informational disclosures such as Why this? are not editors. The shared pencil does not grant editing to read-only data.

## Habits and check-in snapshots

Habits are independent from task completion. Migration 021 stores settings/revisions in habits and one amount per habit/date in habit_checkins. A before-insert trigger copies the target/unit/type from the owned habit. Only amount can be updated on a log; settings changes cannot rewrite its snapshot. Save/check RPCs are security-invoker, use authenticated identity, same-owner Space constraints, locks and revision baselines. Creation retries confirm matching settings; uncertain existing-write retries fail safely if revisions changed.

HabitsView loads explicit browser-local dates through a bounded owner-scoped RPC, retaining previous matching-page results on read errors. It validates response shape, guards day/page tags, and keeps drafts within the account-keyed page/widget tree. Week totals count target-met days using recorded snapshots, with Monday boundaries. Due cues stay deterministic; no AI, recurrence-generated tasks or notification service is involved.

The habits widget is optional and expands the registry to ten while retaining seven-widget defaults. Migration 021 updates the allowlist only; no existing layout rows are rewritten. Server pages, proxy and navigation registry expose the protected module. Existing shared fields, SpacePicker and EditDialog supply presentation.

## Connected Today

The account-keyed TodayView loads an explicit client-local day with independent task/habit/event offsets through loadToday. Migration 022 provides a read-only stable security-invoker RPC, with explicit owner filters and existing RLS. Counts aggregate complete relevant sources before five-item pagination; source IDs and original record types are preserved. Undated tasks remain a separate organizing count.

TaskList accepts optional onChanged/day inputs; confirmed completion/title/planning/assignment changes notify Today. HabitCard is extracted from HabitsView and reused with its original check-in actions and snapshot rules. Calendar EventForm is exported for the shared popup. No save permissions, source validation or mutation implementations are merged.

Client state is tagged by day and all offsets to avoid displaying another date/page's results. Same-page read failures retain labeled previous results; fresh auth is checked per call. Visibility/local-day refresh uses browser effects, never a render-time live clock. The dashboard shortcut and protected navigation register the page; saved dashboard layouts remain unchanged.

## Connected Projects

Migration 023 stores private project settings and typed project_items relations. Same-owner composite foreign keys connect a project to original tasks/notes/space pages. A unique project/kind/target identity allows many projects per source without duplicating it. Unlink toggles active and increments relation revision; restore uses the new baseline, avoiding stale unlink/restore overwrites. Narrow grants prevent ownership/target/revision changes and permanent deletion through authenticated clients.

Authenticated security-invoker RPCs save settings, change relations and read catalog/detail summaries. Progress counts all active related tasks, independently of the twenty-item detail page; metadata joins use current source titles. Catalog pages are twelve records with deterministic title/id ordering. Creation retries confirm matching settings rather than replacing later edits.

Server page reads use fresh verified identity, validate returned shapes and retain exact selected project identity in the URL. Client ProjectEditor/ProjectLinkControl use stable requests, explicit save feedback and router refresh after confirmation. Search reuses planner_search with explicit task/note/page kinds and stale-query hiding. ProjectDetail reuses TaskList and the shared modal/picker primitives. ProjectBacklinks adds bounded owner-filtered reverse navigation to source detail pages. Failed setup/read results stay distinct from empty success; source editors remain usable if project backlinks are unavailable.

## Task project controls

TaskProjectAssignment is a shared lazy disclosure inside TaskList's pencil editor. It calls loadTaskProjects with task/query/offset; migration 024 checks owned task access and returns twenty owned projects with active/inactive relation revisions. ProjectLinkControl retains the existing revisioned mutation and refreshes choices only after confirmed writes. No owner value is accepted from the caller.

withTaskProjects enriches Tasks, selected tasks, Space tasks, recent dashboard tasks, Today and ProjectDetail using one request-scoped batch. It validates exact requested IDs, at most three current project names and full relation counts. Missing/malformed/failed metadata is explicitly unknown, preserving source tasks. TASK_SELECT stays bounded and unchanged; no unrestricted relation arrays or persistent cross-account cache are added.


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


### Consistent font roles

All headings, body text, form controls, legends, charts and desktop chrome use shared font tokens. Monospace, System and Rounded apply to all three roles; Classic desktop keeps its intentional heading/UI/console mix. Theme palette changes do not reset the saved font. Edit font stacks in src/lib/themes/display.ts, not individual cards. Legacy font-family declarations use token fallbacks rather than overriding the preset.


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
### Calendar week view

Calendar offers Month/Week links using the same selected date. WeekView shows seven saved-preference-aligned days, pinned day headers/all-day items, and hourly buckets for timed tasks and planned repeats. Exact minutes are labeled; card height does not represent a duration. Selecting a day uses the existing TaskList/EventForm/preview source links below the grid. Read-only previews are never completed as unsaved records. Today, date selection and week arrows retain view=week; month view remains the default.

src/lib/calendar/week.ts owns UTC date-only week ranges, safe supported-year edges, contributing months and typed hour/all-day buckets. Weeks crossing a month fetch each contributing month's existing planner_calendar_repeats RPC once, validate each response and filter to the week. A failure in either month or the saved week-start read produces an error, not a partial/false-empty view. Tasks/events remain explicit verified-owner range reads with exact 1,000-record bounds. Read-only requests run in parallel after the range is known. No SQL migration or new data writes are introduced.

The grid initially scrolls near its earliest timed item (08:00 when empty), preserving an account's saved schedule/time zone and avoiding live-clock reads during prerendering. Same-hour items sort by exact minutes/title/identity; all-day events/tasks have distinct typed render keys. Each hour/day bucket shows three items plus a day link for additional entries. Phones scroll inside the week grid, while the day controls stack below it. Day headers and all-day cells stay pinned during time scrolling.

Run test:calendar-week, full regressions, TypeScript, lint/build; check Month/Week, Today/week navigation, Sunday/Monday starts, boundary dates, saved tasks vs future repeats, all-day/event editing, overflow and phone scrolling. No new SQL is required. Dragging/resizing, durations, minute-positioned blocks, individual projected-occurrence edits, new reminders and a persisted default calendar view remain future work.
### Calendar task moves (migration 033)

Week cards for unfinished tasks and versioned repeat previews support drag-to-reschedule plus a Move button for touch/keyboard. Dropping proposes a day/hour while retaining minutes; all-day drops clear time. A shared EditDialog opens for explicit date/time review and Save move. Dragging alone never writes. Source revisions, scheduled identity and request IDs stay in the proposal until confirmation; failures keep the draft. Confirmed saves close the modal and navigate to the target day in Week. Completed tasks and all-day calendar events keep their existing view/edit behavior and are not draggable here.

This occurrence preserves the original repeat phase/clock. A future occurrence becomes one real independent task, with an exception suppressing its original projected date. This and future either restarts the current pending head or splits at the chosen future occurrence, retaining the remaining occurrence count and shifting selected weekdays with the date. Previously moved independent tasks/split branches stay separate. Completed history is never moved. Month/week previews and completion use the same planner_repeat_step resolver, which skips detached occurrences and honors split cutoffs.

033 adds internal repeat_series_id/repeat_scheduled_date to tasks and private task_repeat_changes/task_reschedule_receipts tables. Existing records seed lineage IDs without rewriting due dates or completion. Client grants on internal task columns are unchanged. Change/receipt tables have forced owner RLS, SELECT-only client access, immutable private writes and same-owner task foreign keys. Export v6 preserves these records and identities while v1–v5 remain readable.

planner_reschedule_task is the sole narrow SECURITY DEFINER mutation entry point because it must atomically write private change/receipt records and internal lineage fields. It has empty search_path, no caller owner argument, fresh auth.uid(), exact owner row locks, revision/scheduled-index validation, bounded recurrence walking, owner-filtered mutations, same-owner FKs and authenticated-only execution. It uses no dynamic SQL or service-role key. Raw authenticated change/receipt writes remain denied; all projection/step reads stay SECURITY INVOKER. Do not broaden grants or copy this definer boundary into unrelated features. Verify direct unauthorized calls, not just UI gating.

Request receipts make lost-response retries idempotent and reject changed payloads. Another move or completion makes an old source revision fail. Any failure rolls back target creation, copied active project links, cutoffs and receipts together. Futures are materialized only on an explicitly saved move; browsing stays read-only. General task planning edits can restart a series as before; an already isolated current occurrence retains its original schedule until explicitly moved with the future scope.

Run test:calendar-moves, full regressions, TypeScript, lint/build. Apply 033 after 032, then calendar_repeat_previews_rls.sql and calendar_reschedule_rls.sql. Confirm both live PASS results and real save/refresh/drag/Move-button behavior separately. Fixtures cover weekly/monthly phase, time-only future changes, remaining counts, active project links, completed history, retries/stale state, direct private-write denial, two-account isolation and v6 export. No individual-move undo/rejoin, drag across week navigation, event rescheduling or reminder delivery is claimed.