# MVP review checklist

Use the prepared review copy before committing. Save test drafts before changing
pages. Existing database privacy assertions were verified in earlier increments;
this refactor does not change schema, grants, or policies.

## Automated checks

- [ ] `npm test`: all feature and shared-component tests pass.
- [ ] `npm run lint` and TypeScript/build complete successfully.
- [ ] Diff contains no environment values or migration edits.

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

Automated: all 33 tests passed, including rejected requests, preparation failures,
framework control flow, and secure UUID generation. TypeScript passed. These
simulations do not establish browser offline behavior or physical phone support.

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
