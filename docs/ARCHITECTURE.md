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
Left/right use a top bar and side-aligned More; top/bottom use their chosen edge.
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
