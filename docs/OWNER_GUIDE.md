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
