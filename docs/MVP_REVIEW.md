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
