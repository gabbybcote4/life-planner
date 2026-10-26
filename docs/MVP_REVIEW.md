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
