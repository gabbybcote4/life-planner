# MVP review checklist

Use the prepared review copy before committing. Save test drafts before changing
pages. This is a checklist, not a record that checks have run. Verify applicable
database assertions whenever schema or permissions change.

## Automated checks

- [ ] `npm test`: all feature and shared-component tests pass.
- [ ] `npm run lint` and TypeScript/build complete successfully.
- [ ] Diff contains no environment values; any migration is limited to the agreed increment.

## Browser regression checks

- [ ] Sign in, sign out, reload, and visit protected pages while signed out.
- [ ] Navigation highlights the right section; headings/account controls align.
- [ ] Tasks: add, edit, complete/reopen, cancel, reload, and confirm saved changes.
- [ ] Calendar: select a day, add/edit/move an event, change months, and use Today.
- [ ] Notes: create/edit multiline text, save/reload, and check stale-tab conflicts.
- [ ] Themes: save Sage/Rose/Midnight and check every page plus sign-out/in.
- [ ] Widgets: add/remove/reorder/width/save/cancel/default and confirm source
  tasks remain intact. Reload and sign out/in to verify persistence.
- [ ] Use keyboard navigation; labels, disabled/pending buttons, and focus are clear.
- [ ] Check a narrow viewport for navigation wrapping, form widths, notes, calendar,
  and widget stacking. Check input/error/focus readability in every theme.

## Privacy and failure checks requiring live interaction

- [ ] Use two real accounts in separate browser profiles; task/event/note data,
  themes, and dashboard arrangements remain separate.
- [ ] Test a failed save without losing the draft or showing a false saved status.
- [ ] Failed loads show a retry/error state rather than an empty successful list.
- [ ] A stale note/layout tab reports a conflict instead of overwriting newer data.

These boxes are a checklist, not a claim that every browser check has run.
Automated context tests cover the helper's handling of mocked verified results;
they do not prove real account isolation or network-failure behavior by themselves.

## Save reliability audit

Reliability tests cover rejected requests, preparation failures, framework control
flow, and secure UUID generation. These simulations do not establish browser offline
behavior or physical phone support. Run the current suite for up-to-date results.

Focused manual checks for this increment:

- [ ] In a note, enter a disposable draft; set browser Network to Offline and save.
  Confirm an error appears, the draft stays, and no Saved confirmation appears.
  Restore Online and retry; reload to confirm one saved note.
- [ ] Repeat a failed task add and calendar add; restore the connection and retry.
  Confirm the entered values remain and no duplicate records are created.
- [ ] With keyboard only, use the first Tab to reveal Skip to main content, activate
  it, then navigate the forms and dashboard controls with visible focus.
- [ ] On a phone/narrow viewport, check calendar, notes, forms, navigation, and
  widgets. If testing over local HTTP, create a task/note/event successfully.
- [ ] Repeat sign-in/out and verify two real accounts remain separate.

This increment changes no database schema or permission policies.

## Knowledge links review

- [ ] Insert a note link in a space page and a page link in a note; save/reload.
- [ ] Follow outgoing links and verify reciprocal Linked from entries.
- [ ] Rename target/space; identity stays valid and Connections shows current names.
- [ ] Remove the full marker and save; the old backlink disappears.
- [ ] Failed/stale saves retain the draft and do not create saved backlinks.
- [ ] Search and paginate with duplicate titles and more than 20 items.
- [ ] Another account's items/titles/backlinks remain inaccessible.
- [ ] Picker, cursor insertion, errors, and lists work by keyboard/on phone/in themes.
- [ ] Existing note/page saves, plain-text escaping, and navigation still work.

## Unified search review

- [ ] All five categories, body-only note/page matches, and event dates work.
- [ ] Result links open the correct item; old tasks outside the list window open.
- [ ] Blank input, no matches, failed requests, and changed-query results are clear.
- [ ] Previous/Next covers more than 20 results without duplicates or hidden caps.
- [ ] Terms are not added to the URL; account switches clear search state.
- [ ] Signed-out/foreign access is denied, including copied task-detail URLs.
- [ ] Keyboard controls, narrow layouts, and all themes remain usable.

## Space starter review

- [ ] Preview Personal, Work, and Study; each creates the displayed three pages.
- [ ] Customize a name, create/reload, edit/rename pages, search, and insert links.
- [ ] Existing space rename and blank-space creation still work.
- [ ] Create a second space from the same form; it uses a fresh request identity.
- [ ] An ambiguous failure preserves inputs; same-request retry does not duplicate
  or overwrite pages. Different retry inputs are rejected clearly.
- [ ] Atomic rollback and receipt/owner protections pass the database assertions.
- [ ] Other accounts cannot see created spaces/pages/receipts or replay the request.
- [ ] Template radios/previews work by keyboard, on phones, and in every theme.

## Task-space review

- [ ] Assign a main-list task, move it, remove its space, and reload; task survives.
- [ ] Quick-add in a space saves there and remains visible on Tasks/dashboard.
- [ ] Complete/reopen/rename in each view; other views stay consistent.
- [ ] Paginate matching spaces and space tasks beyond 20 entries.
- [ ] Two stale tabs cannot silently overwrite each other's assignments.
- [ ] Lost-response retries do not duplicate tasks or confirm a different parent.
- [ ] SQL owner constraints and task privacy regressions return PASS.
- [ ] Two accounts, keyboard, phone layouts, themes, search, and page drafts work.

## Retro desktop review

- [ ] Pastel Desktop matches the approved window-card direction; Sage/Midnight work.
- [ ] Sidebar navigation, skip link, focus, sign-in/out, and narrow screens work.
- [ ] Saved widget order/width/remove/add/save/cancel behavior remains unchanged.
- [ ] Space cover cards open actual owned spaces; preview limits are visible.
- [ ] Calendar day/event links open actual date-only records; UTC context is clear.
- [ ] Map lines match saved links; node links and the full-title list open the items.
- [ ] Empty/failed spaces/events/links show honest states without demo data.
- [ ] Tasks, Notes, Spaces, templates, assignments, search, and themes still work.
- [ ] Two accounts keep data, preferences, and layout isolated.

## Workspace widget review

- [ ] Existing four-widget or empty layouts remain saved unchanged after setup.
- [ ] Add workspace widgets appends only missing panels, preserving order/width.
- [ ] Each new panel supports individual add/remove/up/down/half/full/save/cancel.
- [ ] Reload and sign out/in preserve the seven-widget arrangement.
- [ ] Removing every widget leaves source tasks/events/spaces/notes/links intact.
- [ ] Restore default creates a seven-widget draft that needs Save.
- [ ] Two tabs report revision conflicts rather than overwriting saved layouts.
- [ ] Keyboard, phone stacking, every theme, previews, and actual links still work.

## Expanded palette review

- [ ] Settings shows six light and six dark palettes with readable previews.
- [ ] Radio selection previews locally; leaving without Save keeps the saved theme.
- [ ] Save/reload/sign out/in preserves a new light or dark choice.
- [ ] All pages, SVG artwork, map nodes, calendar, controls, errors, and focus adapt.
- [ ] Old Sage/Pastel/Midnight choices and default are preserved through setup.
- [ ] Failed save keeps the choice but does not falsely confirm persistence.
- [ ] Keyboard/radio controls, phone layout, and separate accounts work.

## Widget accent review

- [ ] Each widget previews five title-bar colors and its automatic default.
- [ ] Save/reload/sign-in preserves choices; changing theme adapts their shades.
- [ ] Cancel restores saved colors, order, and size.
- [ ] Reset widget colors preserves arrangement; Restore default resets all as draft.
- [ ] Reorder/resize/add-workspace operations retain existing accents.
- [ ] Invalid values and stale writes fail; account layouts stay isolated.
- [ ] Keyboard, phone layouts, twelve themes, and source-data preservation work.

## Space appearance review

- [ ] Built-in icon/cover/accent previews match dashboard/header/navigation output.
- [ ] Save/reload/sign-in persists choices; theme changes adapt accent shades.
- [ ] Automatic covers stay consistent; No cover hides artwork without losing data.
- [ ] Name and appearance save together; stale tabs show conflict and retain choices.
- [ ] Older name-only updates and template retries preserve saved personalization.
- [ ] Direct invalid values/foreign writes fail under SQL constraints and RLS.
- [ ] Keyboard, phone layouts, all themes, templates, tasks, and pages still work.

## Desktop backgrounds

- Apply migration 015, run desktop_background_rls.sql and existing preference privacy tests, and confirm final PASS results.
- In Settings, preview each pattern/intensity. Confirm the surrounding desktop changes only after Save; Cancel restores the saved preview, and Preview default requires saving.
- Refresh and visit Tasks/Spaces; verify the saved background follows the account. Change palette and check light/dark backgrounds, focus, and readable panels.
- Save in one tab, then attempt a different background from a stale tab: keep its draft and show conflict. Reload to reconcile.
- Check a new account with no preferences, two-account isolation, offline errors, keyboard controls, and a narrow viewport.

## Structure and reuse audit review

- Confirm the app looks the same: title bars/dots in widgets and theme previews, and dropdowns in Spaces/Search/Background settings.
- Create/edit/save a note and follow its links after removing the pass-through editor wrapper.
- Check keyboard labels/focus, narrow layouts, a light palette and a dark palette.
- Review Explorer: generated folders are hidden, while source/tests/SQL/config remain visible. See OWNER_GUIDE.md to reveal them.
- No SQL migration or live permission change is part of this cleanup.

## Mobile and navigation review

- Apply migration 016; run existing preference tests and navigation_position_rls.sql. Confirm both final PASS results.
- Check every screen at 320, 390, 768, and 1280 CSS pixels, including long titles.
- Save each navigation position, reload, navigate, and sign out/in. Check a second account, stale tabs, and failed saves. Preserve palette/background.
- At phone widths check More route/active indicators, Escape/Close/outside dismissal, hidden-menu keyboard behavior, and 44px primary touch targets.
- Open/close dashboard and library/settings panels. Drafts survive; editing layout reveals content; desktop widths reveal everything. Saved widget order/size/accent do not change.
- Check bottom dock never covers the final control, including iPhone safe area, physical phone keyboard, rotation, and zoom. Browser emulation is only part of verification.

## Focus timer review

- Apply migration 017 and run existing layout privacy assertions plus focus_timer_widget_rls.sql; confirm both PASS results.
- Add Focus timer explicitly, save, reload. Move/resize/accent/remove it; existing widgets and source data stay unchanged.
- Start/pause/resume/reset, switch modes while paused, and set 1/25/180 minutes. Reject zero, decimals and >180. Running sessions disable mode/length changes.
- Start a one-minute test, switch pages/tabs and return. Time catches up; paused time does not count. Completion stops at zero without auto-start or repeated announcement.
- Cross-page status controls still work if the widget is hidden/removed. Reset ends the session. Refresh resets; sign-out/account changes clear it.
- Check keyboard, touch controls, narrow 320/390px screens, light/dark palettes, screen-reader completion, and long labels. No physical-device or live SQL claim from unit tests.

## Task planning input review

- Apply migration 018 and run existing task privacy tests plus task_planning_rls.sql; confirm both PASS results.
- Add a title-only task; it needs no date/priority. Add/edit/clear planning from Tasks, a dashboard task list, and its Space; save/reload to confirm shared results.
- Verify title edit, completion, and assignment preserve the plan. Planning changes preserve title/completion/assignment.
- Open two tabs on the same task. Save a plan in one; a stale save in the other retains its draft and reports conflict. Cancel restores its confirmed choices.
- Check valid leap day, empty date, date boundaries, all priorities, failed saves, another account, and signed-out direct writes.
- Check date labels across time zones, mobile input/select widths, keyboard, dark/light palettes, and 44px summary/buttons. No calendar event/reminder is created.
- This increment adds metadata inputs only; guidance/ranking and wellbeing modules remain future work.

## Guidance and compact dashboard review

- Apply migration 019; run guidance privacy assertions and existing dashboard layout tests. Confirm both PASS results, including the older-than-200-captures fixture.
- Add/promote Your next step explicitly, save/reload, and check width/accent/cancel/removal without changing other metadata.
- Create owned overdue/today/high-priority/unplanned tasks. Verify explanations, completed exclusion, Show another, exact task links, and all-day commitments.
- Edit/complete a task elsewhere and return; guidance refreshes. Check local midnight/day changes and explicit refresh; failed reads must not resemble zero tasks.
- Start focus without changing the task. Existing running/paused timers are never replaced.
- Check a second account, sparse/no data, malformed date rejection, keyboard, light/dark, 320/390px phones and 1280px desktop.
- Compare desktop scrolling: compact space cards/counts/dials and three-row previews. Open month/map/task details and confirm real controls are retained.

## Visual-first guidance review

- Check Today/Overdue/Priority/Upcoming/Unplanned cues match task metadata; date chips show Today/Tomorrow or a real date.
- Default view contains short labels and one task; Why this?/How suggestions work disclose the existing reason/rules.
- Open task, focus, Show another, refresh, and Unplanned/Calendar links still work.
- Check keyboard disclosure behavior, readable badge contrast, long titles, empty/error states, and 320/390/1280px layouts.
- No database migration or permission/ranking change is included.

## Inbox capture review

- Apply migration 020; run inbox_capture_rls.sql and confirm PASS separately from automated app tests.
- Capture a task, a standalone note and a note in a space. Open each saved source and verify it survives refresh.
- Close/reopen an unsaved draft, switch routes and confirm it remains; discard explicitly. Refresh clears unsaved drafts.
- Edit a saved source, then mark its receipt Reviewed. Source edits/completion remain intact; restore via Reviewed tab.
- Check keyboard open/close/focus, failed-save feedback, long text, phone widths and both theme modes. Confirm account changes cannot expose the previous draft or queue.

## Tasks table review

- Full Tasks: check headers, completed and unplanned rows, long titles, empty list and 200-record notice.
- Rename, complete/reopen, save/clear/cancel date and priority, assign/change/unlink a Space. Confirm the same saved task in its space/dashboard and after refresh.
- Keep a failed edit draft; test planning conflicts in two tabs using existing revision protections.
- Check table semantics/keyboard, open editor width, theme modes and 320/390/768/1280px. Phone rows must not clip controls or require page-wide horizontal scrolling.
- Existing selected-task, dashboard and space lists should retain working controls. No new migration is required.

## Pencil editor review

- Tasks (table, selected task, space/dashboard lists), calendar entries, saved notes/pages and space settings: pencil opens the right record; Save persists through existing actions.
- Check Escape/Close and focus return; close/reopen a temporary draft without saving. Restore/discard temporary review text before leaving.
- While saving, Close/Escape must not dismiss the editor. Errors/conflicts remain visible inside it.
- Dashboard/global widget pencils: width/colour/order changes stay drafts until Save layout. Closing retains draft; global Cancel restores saved layout. Removing a widget still keeps source records.
- New note Read/Edit toggle remains usable. Note/page links work in Read view; existing save/revision behavior remains.
- Check 320/390px phones, long titles, scrolling to save buttons, keyboard focus and light/dark themes. No new SQL migration.

## Habits increment

- Apply migration 021; run habits_rls.sql and dashboard_layouts_rls.sql, confirming both PASS results. Unit tests do not prove live privacy.
- Create a preset amount habit, a binary habit and a weekly/weekday habit. Pick a Space and verify its link. Close/reopen an unsaved creation draft, then save; a confirmed creation closes the popup and the next opening starts fresh.
- Check in/undo binary; save amounts and refresh. Change a target/type/unit and verify the existing day's snapshot remains intact. New entries use new settings. Pause retains history and prevents new entries.
- Use dates to view/correct logs. Weeks start Monday; due cues respect weekdays/start/paused state. Check another-tab stale settings/log writes and account isolation.
- Add Habits today through the dashboard popup; Save layout; remove the widget without deleting habits. Verify prior layouts/defaults/widths/accents.
- Check phone/keyboard/light/dark, setup error and failed refresh/drafts. Reload the page after a revision conflict while preserving any unsaved text first.

## Connected Today review

- Apply migration 022, then tasks_rls.sql and today_rls.sql. Confirm both live PASS results independently from unit checks.
- Date a task today and another earlier; create a matching habit and an all-day calendar entry today. Verify all three sources and Space links appear in Today.
- Complete/edit/reassign a task; check/undo/save a habit amount; edit an event through its pencil. Verify refreshed counts and the same source record in its original module.
- Move a task/event to a future date: it leaves Today but remains saved. Undated/high-priority future work is not silently included as due.
- Check paused/logged habits, selected weekdays, weekly target-met exclusions and original snapshot targets after settings changes.
- Test more than five items in a section, independent paging, older records and empty pages after completion. Counts must remain global for the selected day.
- Verify two-account isolation, setup/load failures, retained previous results/drafts, mobile/keyboard/light/dark, local midnight and browser-tab return. No new widget layout/default changes.

## Connected Projects review

- Apply migration 023, then tasks_rls.sql and projects_rls.sql. Verify both PASS results separately from unit tests.
- Create a project and optional Space; verify confirmed creation closes/reset the popup. Failed saves keep its draft. Rename the selected project without changing the selected identity.
- Link an existing task, note and page through type/search. Open each original; verify Projects backlinks and current titles after renames.
- Complete/reopen a task from the project. Counts must update across multiple projects using that task and remain correct beyond twenty visible links.
- Unlink/restore each source. Original data must remain. Test stale project edits and stale unlink after restore in another tab; no silent overwrites.
- Status and project Space changes must not complete, move or reschedule sources. Test cross-account parent/target references and anonymous reads/executes.
- Check catalog/item/backlink bounds, empty/error states, phone/keyboard/light/dark, source editors, pending dismissal guard and original Today/task/habit flows.

## Task project controls (migration 024)

- Run test:task-projects, full npm test, lint, TypeScript and build. Apply 024 then run tasks_rls.sql and task_project_picker_rls.sql; live PASS is separate from local unit checks.
- Tasks pencil > Projects: browse without typing, search, link two projects, unlink and restore. Confirm badges/counts after refresh and original title/date/priority/Space/completion remain unchanged.
- Try stale editors and a failed connection: retain drafts, show conflicts/errors, never claim zero project links on read failure. Verify keyboard/Escape and phone layout, plus Today/Space/dashboard/project task editors.


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

Calendar visibility correction: task names now precede their clock times in month cells, wrap up to three lines, and retain a full-title tooltip. The toolbar shows the target month names and a saved/planned count for the displayed month. Task planning links directly to its calendar date. Verified the owner's weekly test schedule on November 6, 13, 20 and 27; this correction changes presentation only, with no SQL/setup or saved schedule changes.
