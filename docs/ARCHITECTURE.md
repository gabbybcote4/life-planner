# Reusable planner architecture

The planner uses a small shared UI layer with feature-specific content and save
logic. Reuse the existing components before adding another version of a control.

## Where to change things

| Concern | Source |
| --- | --- |
| Navigation labels and destinations | `src/lib/navigation.ts` |
| Planner page frame and loading boundary | `src/app/components/planner-page.tsx` → `PlannerPage` |
| Account heading and sign-out placement | Same file → `PlannerHeading` |
| Standard retry/error and setup states | Same file → `LoadError`, `SetupNotice` |
| Buttons, variants, and pending labels | `src/components/ui/button.tsx` |
| Text inputs and text areas | `src/components/ui/fields.tsx` |
| Save, pending, and validation feedback | `src/components/ui/feedback.tsx` |
| Shared panel empty states | `src/components/ui/empty-state.tsx` |
| Colours for every theme, including fallback | `src/lib/themes/themes.ts` |
| Shared control rules and feature layout styles | `src/app/globals.css` |
| Verified current account | `src/lib/auth/account.ts` |
| Common record-id validation | `src/lib/shared/validation.ts` |

`PlannerPage` accepts an active navigation section, a loading message, and children.
It owns the paper frame, navigation, and Suspense boundary, so new pages keep the
same spacing and request-time rendering pattern. `PlannerHeading` accepts the
page's title/copy and current account email; content still belongs to the feature.

## Reusable content

- `src/app/dashboard/task-widgets.tsx` exports TaskOverviewWidget, QuickAddWidget,
  TaskProgressWidget, and RecentTasksWidget. These take data as props; their
  presentation is independent of the home-page query. Optional heading ids allow
  multiple compositions without duplicated accessible labels.
- `src/app/dashboard/dashboard-widgets.tsx` manages arrangement and saved layouts.
  It receives rendered content slots, so it does not own task queries or mutation
  logic. Removing a slot never deletes the feature's source records.
- `src/app/tasks/task-board.tsx` exports TaskBoard, TaskList, and AddTaskForm.
- `src/app/calendar/month-view.tsx` renders a month from its selected date/events.
  CalendarEvents owns the interactive event forms; date helpers remain in lib.
- `src/app/notes/note-editor.tsx` owns plain-text note editing and draft/revision
  state. ThemePicker similarly owns theme selection, not session verification.

A page fetches authorized data and composes content; a widget displays provided
data; an interactive feature component owns its form state. Keep those boundaries
visible instead of introducing a generic component with many unrelated flags.

## Forms and styling

Use Button with `variant="primary"`, `"secondary"`, `"text"`, or `"plain"`.
Buttons default to `type="button"`; form submission must explicitly use
`type="submit"`. The pending prop disables the button, marks it busy, and supplies
a pending label. Plain preserves specialized checkbox/calendar/widget styling.

Use TextInput/TextArea with normal HTML attributes and a matching label/id. The
shared form-control class owns borders, colour, font, padding, and focus; feature
styles should handle placement, sizes, and spacing. Keep hidden/radio fields
native when they need their existing specialized semantics.

Use FormFeedback for common pending/error/success output. It gives pending/error
priority over stale success messages and uses live announcements. Domain notices
with richer navigation can retain their own presentation when appropriate.

Theme colours come only from the palette module. The root layout supplies the
Sage fallback with the same themeVariables helper used by the saved ThemeRoot,
so changing a palette does not require maintaining a second CSS copy.

## Authentication and data boundaries

`requireAccount()` is for protected page reads and redirects signed-out visitors.
`getAccountContext()` is for mutations/theme reads that need their own failure
feedback. It creates a request-scoped Supabase client and calls getClaims; it never
trusts getSession or caches identities across requests.

Every mutation still invokes the helper inside that action. Keep owner filters,
RLS, input validation, revision checks, duplicate-retry handling, and feature error
messages close to the feature's data access. Shared page gating is not authorization.
Sign-in/sign-out and the email callback intentionally use the raw auth client.

Next.js requires static proxy matchers. Keep that literal list in src/proxy.ts;
the navigation regression test verifies that all registered planner routes appear
in it rather than replacing it with a dynamic configuration the compiler ignores.

## Verification

`npm test` runs the existing feature tests plus shared-component/auth-context
regression checks. The latter compile actual TSX primitives with the installed
TypeScript package and server-render them with React. Account tests mock the SDK
result to check request isolation and failure handling; they do not replace live
Supabase authentication or database privacy testing.

Run lint, TypeScript/build, and the browser review in `docs/MVP_REVIEW.md` before
committing a refactor. No schema/migration change is needed for this refactor.

## Reliable client saves

Wrap client-side server-action calls with runAction from
src/lib/shared/client-actions.ts. Server try/catch cannot catch a request that
never reaches the server. The wrapper returns honest failure feedback while
preserving Next.js redirects/not-found control flow via unstable_rethrow.
Keep drafts and request ids until confirmed success; do not automatically retry
mutations. An unconfirmed save may have reached the database.

Use createRequestId from src/lib/shared/request-id.ts for new records. It uses
native randomUUID or secure random bytes when local HTTP lacks randomUUID;
it never falls back to Math.random. Tests simulate both environments.
PlannerPage supplies a keyboard-visible skip link to the main content.

## Spaces and text pages

`src/app/components/plain-text-editor.tsx` supplies the shared controlled text
editor for Notes and Spaces. It accepts a server save action, a navigation
prefix, and an optional space identifier. Feature actions retain authorization,
parent verification, owner filters, validation, retry confirmation, and revisions.
Notes keeps a thin wrapper with its own action and destination.

`src/app/spaces/space-form.tsx` handles create/rename drafts. The spaces page loads
only the selected owner's space and selected page, with separate paginated lists.
Do not replace the database's composite owner/parent foreign key with UI filtering.

## Knowledge links

src/lib/knowledge/links.ts defines typed link targets, stable plain-text markers,
selection insertion, and safe planner destinations. PlainTextEditor composes
LinkPicker outside its save form to avoid nested forms. Insertion only changes
the draft; established feature actions retain ownership/revision/save checks.

KnowledgeConnections loads saved outgoing/backlink lists; ConnectionList supplies
read-only refresh and pagination. Server actions always re-check account context
and call authenticated SQL functions. Nothing is stored in browser persistence or
shared caches. Notes/page saves revalidate both areas so connections can refresh.

The database reads the current user's Notes and Spaces through security-invoker
helpers. The marker parser deduplicates kind/UUID references and joins only owned
targets. Backlinks are computed from saved bodies, avoiding dual-write/index drift.
An unavailable target returns no metadata; an inaccessible source cannot enumerate
links. Searches use literal substring matching and deterministic title/kind/id
ordering. List queries return 21 rows for a 20-item page, not an unreported cap.

The first implementation scans the owner's saved bodies for backlinks. For large
libraries, profile before adding a transactionally maintained index; do not add a
client-updated link table that can drift from saved text or bypass ownership.


TextDocumentEditor resolves initial owned link targets for PlainTextEditor. Read
mode renders body segments through LinkedText: literal text stays escaped, and
only resolved account-owned targets become Next links. Unknown targets display
an unavailable label. The shared marker parser handles reading and insertion.
ResolveLinkPreview performs fresh account checks and owner-filtered target reads
in batches of 50. It accepts no owner parameter and makes no writes. Preview
failures never turn a confirmed save into a failed save or discard text.

## Unified search

src/lib/search/types.ts owns validated search inputs, result types, category
labels, and destination mapping. SearchForm uses shared inputs, buttons, feedback,
and the planner frame; its explicit action runs a fresh account check each time.
Search is posted as form state, without query terms in navigation URLs or shared
caches. Prior results are labeled when the input/category changes, and pagination
is disabled until the new search runs. Failures are separate from zero matches.

planner_search is a read-only, security-invoker SQL function. Each UNION branch
filters auth.uid and keeps RLS active; page matches also join their owned parent.
Literal substring matching does not interpolate SQL or expose a caller owner field.
The first version scans owned text; profile larger libraries before adding indexes
or changing search semantics. Result metadata excludes full body content.

loadSelectedTask performs an exact id plus owner query for task result links,
independent of the normal task-list limit. It reuses TaskList and task actions,
including existing save-error handling, rather than introducing a second editor.

## Space starters

SpaceForm composes native radio choices, complete page previews, shared controls,
and the existing rename action. New spaces call createSpaceFromTemplate;
the server validates the key/title/request ID, verifies account context, and calls
one transactional RPC. It passes no owner or caller-provided page content.

planner_space_templates is the single source of preview and copied text. The
security-invoker create function inserts an owned space, all catalog pages, and an
immutable receipt in one transaction. Retry confirmation uses original metadata
so current user edits are not compared with (or replaced by) starter text.
Receipts are scoped by RLS and composite owner/parent foreign keys. They are retry
metadata, not authorization to bypass ownership. Direct authenticated receipt
writes can describe only owned resources; changing/deleting receipts is denied.

After confirmed success the client clears its creation ID/name for another explicit
creation. Errors retain input and the same ID. A conflicting changed retry is
rejected rather than silently creating another space. Catalog load errors leave
existing spaces available; new-space creation requires the starter setup.

## Task-space composition

TASK_SELECT centralizes the task/space summary projection for task lists, selected
tasks, dashboard widgets, and space views. The joined parent is protected by RLS
and the composite owner foreign key; optional Task fields preserve presentation
compatibility with existing test fixtures. TaskSpaceAssignment reuses unified
search restricted to space results; it supports pagination and an explicit save.
Its original assignment baseline is retained until a move confirms, avoiding
silent overwrites from newer server props while a choice is in progress.

assignTaskSpace verifies the current account and desired owned parent, then updates
only space_id with task-id, owner, and previous-assignment predicates. Missing
matches are checked for a matching saved destination to confirm a retry; otherwise
a conflict is returned. Moving or unassigning never touches title/completion.

Space pages compose AddTaskForm(spaceId) and TaskList with owner/space-filtered,
paginated reads. Existing add/edit/complete actions stay shared. Add-task retries
compare the saved parent as well as the title. No client-only ownership assumption
or independent copy of a task is introduced.

## Retro desktop foundation

The owner-selected late-90s/early-2000s visual direction is recorded in the product
blueprint. src/app/retro.css skins the shared desktop shell and existing controls;
window title bars use DesktopWindow/WindowDots, navigation uses DeskIcon, and
SpaceArtwork supplies original code-native decorative covers. Semantic accent
colors live beside existing palette tokens. Preserve saved theme keys: rose now
labels Pastel Desktop, sage Sage Desktop, midnight Midnight Desktop. No database
preference migration or automatic change to a user's chosen theme is introduced.

Existing widget IDs/layout persistence stay unchanged. The space shortcuts,
upcoming calendar rail, and connection-map preview are fixed shared panels in this
first pass; making them individually add/remove/reorder/resize is follow-up work.
Workspace data loaders read the verified account's spaces/events or the existing
owner-scoped document RPC, without a shared cache. Preview bounds: first 3 spaces,
next 5 all-day events, first 12 documents sorted by title/kind/id. The graph draws
only saved links between displayed documents, provides a full-title accessible
list, and never invents placeholder nodes/edges. Calendar context is explicitly UTC
and its live clock is read only after connection().

No timer, habit tracker, external music/weather, new theme IDs, uploaded covers,
or per-widget custom color persistence is introduced in this foundation. Add future
palettes through tokens and extend contrast checks across every accent surface.

Typography uses local font-role tokens: Tahoma/Verdana for classic desktop UI,
Trebuchet MS for softer 2000s headings, and Lucida Console/Courier New for title
bars and small console labels. These apply across palettes without external font
requests. Adjust roles in retro.css rather than changing each component's fonts.

## Unified workspace widgets

All seven widget identities now live in the dashboard registry, with matching
application/database validation. TaskWidgets composes task content and passed
server-rendered workspace slots into DashboardWidgets. DesktopWindow embedded mode
avoids nested window chrome. Fixed workspace placement/rail was removed; the saved
layout alone determines which panels are shown and their order/width.

LEGACY_LAYOUT documents the old four-widget arrangement. It remains valid unchanged.
DEFAULT_LAYOUT is the seven-widget starting point, and addWorkspaceWidgets appends
only missing workspace identities without changing existing order/size. Migration
updates the SQL default/validator without rewriting rows or revisions. Tests check
app/database parity and backward compatibility. Existing layout conflict/privacy
boundaries and metadata-only persistence remain unchanged.

## Expanded palette library

Each registry entry contains explicit light/dark mode and a complete shared token
set. themeVariables reads that metadata rather than inferring dark mode from one
legacy name. Shared UI/artwork/graph/calendar styling continues to use semantic
palette/accent tokens. The twelve-palette allowlist matches the database check;
legacy IDs/defaults and saved selections are preserved.

ThemePicker groups native radio choices by mode and renders an isolated preview
using the chosen palette's variables. The root's saved theme is untouched until
the existing server action confirms a save. Preview text is explicitly illustrative,
not live task data. No search history/local preference cache or external assets
are introduced.
