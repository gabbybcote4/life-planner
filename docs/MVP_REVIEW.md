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
