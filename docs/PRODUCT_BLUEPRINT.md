# Life Planner product blueprint

Status: agreed product direction with implemented increments recorded below.
For the current feature summary and setup, see [README.md](../README.md).
Consolidated: 2026-10-26.

## Source and scope

This document consolidates the six rounds of decisions from the referenced
[Notion Or Obsidian Comparison conversation](chatgpt-conversation://6adf5e11-5560-83e8-80ad-1363870b88dd),
as summarized explicitly by the project owner in the documentation request.
The available chat retrieval contained recent Git setup messages and unresolved
content references, not the six full rounds. The sections below group the supplied
decisions by topic; they do not claim to reproduce the original round order.
Unspecified details remain open rather than becoming requirements by assumption.

The original blueprint documented decisions before implementation. Each later
feature is scoped separately; this roadmap does not authorize implementing it all.

## 1. Audience and product foundation

Build a digital life planner for a broad audience, rather than one profession or
life stage. It should be immediately useful with a simple default setup and grow
with the user through optional customization.

Combine:
- A practical planner for everyday action and reflection.
- Notion-like customizable spaces, pages, dashboards, widgets, and relational databases.
- Obsidian-like linked knowledge, connecting notes and related information.

Advanced tools should be discoverable when needed without overwhelming the
default experience. Custom spaces and pages come before a general relational
database builder.

## 2. Planning and optional life modules

The long-term planning system includes advanced tasks, calendar, goals, and habits,
with connections between those areas. Detailed task fields, recurrence rules,
calendar integrations, reminders, goal metrics, and habit behavior must be specified
within later feature increments.

Support comprehensive optional life modules. Users should choose the life areas
they need and be able to leave others out. Illustrative candidates include personal
planning, work, study, health and wellbeing, finances, home, relationships, and
creative projects. These examples are a planning aid, not a confirmed module
catalog or a promise that every module ships in the MVP.

## 3. Customization, onboarding, and visual identity

Use hybrid onboarding: a guided starting point with templates, plus freedom to
start simply and customize spaces later. Provide a template library and eventual
template import and sharing. Import formats and supported source applications
remain undecided; Notion and Obsidian inspiration does not imply import compatibility.

Initial dashboard widgets must support adding, removing, reordering, and resizing.
Save the resulting layout. Removing a widget should not silently delete its
underlying planner data.

Use polished hybrid stationery styling: the warmth and personality of a paper
planner combined with clear digital controls. Support themes while maintaining
readability, accessible contrast, keyboard access, and responsive layouts.
Exact palettes, typography, decoration, and theme catalog remain design decisions.

## 4. Accounts, privacy, sharing, and continuity

Use Supabase early for real accounts and persisted user data. Do not build a long
sequence of browser-only prototypes that later require replacing the data model.

The authentication direction includes email, Google, Apple, and Microsoft.
Provider configuration and rollout order require separate implementation work;
listing a provider here does not mean it is already configured.

Private data must be private by default. Apply per-user row-level security (RLS)
to all user-owned Supabase tables, validating ownership on reads and writes.
Test isolation with separate users, including attempts to access another user's
records directly. Client-side filtering alone is insufficient.

Selective sharing is a future capability: users choose what to share instead of
exposing their entire planner. Permission levels, recipients, revocation, and the
scope of sharing must be designed before enabling it. Sharing must not bypass RLS.

Full data privacy and history are product requirements. Plan for user control,
export/deletion, and useful change history; exact retention, recovery, and deletion
semantics remain to be agreed. Do not advertise end-to-end encryption, unlimited
history, or other unimplemented guarantees.

Partial offline use is intended. The supported offline actions, local storage
boundaries, sync behavior, and conflict handling remain open. Do not present the
product as fully offline or local-first. Make save, failure, and sync states clear
and protect locally cached data when switching accounts or signing out.

## 5. Business model

Offer a core product with optional premium modules. Pricing, billing model,
free/core boundaries, and the premium module catalog are undecided. Do not
introduce payment flows, paid gates, or invented prices before these decisions.

## 6. MVP and delivery sequence

The MVP is a functional planner with a dashboard, tasks, calendar, notes, themes,
and saved data. It must support real use rather than only static mockups.
The MVP includes the initial widget controls described above. Exact calendar and
notes depth should be scoped before their respective increments.

The following is a proposed delivery sequence consistent with the agreed priorities,
not a commitment to fixed dates:

1. Establish Supabase accounts, ownership, RLS, and the minimum persistence needed
   for the first feature.
2. Deliver the first working task flow: add, edit, complete, and save tasks.
3. Build out the functional dashboard, basic calendar, notes, and themes with
   persisted data, one reviewable increment at a time.
4. Introduce custom spaces/pages and saved widget layouts, completing MVP widget
   add/remove/reorder/resize behavior.
5. Expand into advanced planning, relational databases, linked knowledge, optional
   life modules, selective sharing, template exchange, and partial offline support
   through separately scoped increments.

Custom spaces/pages must precede general relational database functionality.
Advanced goals/habits, the full module catalog, sharing, premium billing, and
external integrations are long-term direction, not automatic MVP requirements.
Authentication rollout beyond the account foundation also needs explicit scoping.

### First task feature acceptance criteria

- A signed-in user can add a task, edit it, and mark it complete.
- Changes persist in Supabase and remain correct after reloading and signing back in.
- Another user cannot read or modify those tasks through either the UI or direct
  data requests.
- Empty, loading, validation, saving, saved, and failure states are understandable.
- Failed saves do not appear as successfully persisted changes.
- The flow works with keyboard controls and on narrow screens.
- The owner reviews the working result before the next feature increment.

### MVP completion criteria

- Dashboard, tasks, calendar, and notes perform their agreed basic actions.
- User data, theme selection, and widget layout survive reloads and account sessions.
- Widgets can be added, removed, reordered, and resized.
- Accounts remain isolated under RLS, with no public access to private planner data.
- Important flows have clear error states and pass the checks appropriate to
  their implementation.
- The owner confirms the working MVP against the agreed scope.

## Current repository baseline

Inspected main at commit `340d3c9ff21fb15a6a1ca781769063e779f12ec4`.

- Create Next App starter; the home page and metadata are still defaults.
- Next.js 16.4.3, React/React DOM 19.3.0, TypeScript with strict checking,
  Tailwind CSS 4, ESLint 9, and npm's committed package-lock.json.
- App Router files live under `src/app/`; `@/*` resolves to `src/*`.
- `next.config.ts` enables cacheComponents and partialPrefetching and configures
  the Tailwind Turbopack loader. Preserve this setup unless a scoped change needs it.
- Available scripts: `npm run dev`, `npm run build`, `npm start`, and
  `npm run lint`. There is no test script or test framework configured.
- No Supabase dependency, migrations, authentication, planner persistence, or
  planner components are present in the inspected repository.
- README.md contains starter setup instructions. Its editing example says
  `app/page.tsx`; the actual entry is `src/app/page.tsx`.
- AGENTS.md contains generated Next.js guidance, which must be preserved.

## Development workflow

For each implementation increment: agree a small scope and acceptance criteria,
code it, run appropriate automated checks and manual verification, show the
working result, obtain owner confirmation, and commit the confirmed increment.
Use a reviewable branch and pull request; do not push directly to main or merge
without approval. Existing authorization for a concrete change need not be
requested again.

For code changes, use the installed Next.js documentation as required by
AGENTS.md. Run lint and build and any targeted tests appropriate to the change;
report checks that could not run. For documentation-only changes, review content,
links, scope, and the diff without claiming app behavior was tested.

Keep this blueprint current when the owner changes a decision. Record unresolved
choices explicitly rather than implementing assumptions as product policy.

## Open decisions before their implementation

- Exact optional module catalog, core/premium boundaries, and pricing.
- Authentication provider rollout and email sign-in method.
- MVP calendar/notes behavior and any external calendar integrations.
- Database fields/views/relations and linked-knowledge interactions.
- Sharing permissions and history retention/recovery/deletion behavior.
- Offline actions, sync conflicts, and cache privacy.
- Template import formats and distribution/sharing model.
- Detailed visual system and supported themes.

## Confirmed visual direction — 2026-10-27

The owner selected the Playful Retro dashboard concept: a late-1990s/early-2000s
computer-inspired workspace. Use a coherent desktop shell, icon sidebar,
window-style widget panels, colored title bars, pastel accents, illustrated space
shortcuts, readable outlines, and restrained pixel/stationery details. Preserve
clear hierarchy and useful density rather than turning the app into a decorative
poster. Existing data and working controls remain real and usable.

The retro shell is the shared foundation, not a single fixed palette. The owner
wants many light and dark themes over time. Initial Sage Desktop, Pastel Desktop,
and Midnight Desktop palettes are starting points; they do not define the eventual
catalog limit. Full customization remains product direction: user-controlled
spaces/pages/dashboard arrangements, colors, backgrounds, covers, icons, and
widget styling through separately scoped increments. Custom palette validation,
image uploads/storage, per-widget styling persistence, and selection interfaces
still require implementation; do not present these as already available.

Start by updating shared presentation components and semantic theme tokens, then
review live dashboard visuals before committing. Keep saved widget arrangements
and account theme choices. The first retro pass adds fixed space/calendar/map
previews alongside the existing customizable task widgets; integrating every
preview into saved layout editing is follow-up scope. Do not substitute demo data
for live tasks/events/links or render decorative window dots as fake controls.
The connection map must derive edges from saved private links and disclose any
preview bounds. A focus timer shown in a concept is not yet a shipped feature.

### Workspace layout follow-up — 2026-10-27

The three workspace previews now join the four task widgets in the saved library.
All seven can be added, removed, reordered, and set to half/full width. Existing
layouts remain unchanged until the owner explicitly adds widgets and saves.
This completes the first retro pass's fixed-panel follow-up; custom colors,
backgrounds, uploaded covers, free sizing, and more light/dark palettes remain
future customization increments.

### Palette library follow-up — 2026-10-27

The initial retro library now includes twelve preset themes: six light and six
dark. Users can preview a preset before explicitly saving it. This is a foundation
for the broader theme library and full customization, not a cap on available
palettes or implementation of user-defined colors/backgrounds/covers. Existing
palette IDs and saved choices remain valid.

### Widget accent follow-up — 2026-10-27

Each widget can now save a theme-relative title-bar accent from five shared roles,
with Theme default and reset controls. This is a first per-widget styling step;
it does not implement arbitrary custom colors, uploaded covers/backgrounds, or
complete visual customization. Older layouts remain valid and unchanged.

### Space appearance follow-up — 2026-10-27

Spaces now support built-in icon/illustration/accent choices with a preview and
explicit settings save. Shared appearances distinguish the space list, dashboard
cards, and selected header. This implements a first space-personalization layer;
custom uploaded covers/backgrounds and user-defined artwork/colors remain future
scope. Defaults preserve old spaces; no source tasks/pages are copied or removed.

### Desktop texture increment

- Solid, dotted, and grid desktop backgrounds use the current palette. Pattern intensity has subtle, medium, and strong presets.
- Settings previews are draft-only with explicit save/cancel/default preview. Saved backgrounds follow the account; stale tabs cannot overwrite a newer background.
- This extends preset customization; uploaded wallpapers, arbitrary colors, and broader layout styling remain future work.

### Mobile and navigation increment

- Keep the retro desktop character while making phone screens quieter: compact
  navigation, readable single-column content, generous touch controls, and temporary
  expandable panels without rewriting the saved dashboard.
- Save left/right/top/bottom navigation per account with isolated preview/cancel.
  On phones, left/right adapt to a top bar with side-aligned More; top/bottom use
  the chosen edge. All sections remain reachable.

### Optional focus timer increment

- Focus (25m), short break (5m), long break (15m), with explicit 1-180 minute session
  length, start/pause/resume/reset and a visual countdown.
- Optional dashboard widget using existing add/remove/order/size/accent controls.
  Existing dashboards/defaults do not gain it automatically.
- Timer continues across internal routes in this browser tab, with status controls
  elsewhere. Refresh/tab close resets it. No session sync/history or notifications.

## Capture-first guidance and optional wellbeing modules (owner direction)

The planner should act as a useful second brain: a low-friction dumping ground for
tasks, ideas, notes, and life information across spaces, then a guide toward what
needs attention. Capture must remain quick; users need not organize everything or
supply a date/priority before saving a thought. Space organization is optional
context, not a prerequisite for capture.

Next foundation: optional task due dates and priorities. Then add a Your next step
dashboard widget that surfaces time-sensitive tasks and commitments, suggests a
focus task, explains each cue using saved evidence (for example Due today), and
lets the user choose something else. Missing metadata is a gentle organizing
prompt, not evidence that a task is urgent. Suggestions should acknowledge sparse
data and never invent deadlines, commitments, or completed work. Notes/pages must
not silently become scheduled tasks without explicit user confirmation.

This direction does not yet specify AI models, external processing, automated
extraction, ranking weights, reminders, or a complete planning algorithm. Begin
with explainable rules over owned data. Keep any later AI/data-sharing choices
explicit and consistent with the privacy requirements above.

Optional modules the owner specifically wants:
- Meals and nutrition, including calorie tracking inspired by their use of
  Cronometer. Support flexible entries for the different foods/meal components
  users want to log, without rigid entry limits that make capture frustrating.
- Workouts and exercise logging.
- Users choose whether these modules appear as tabs/areas; they are not compulsory
  parts of the default planner.

Keep nutrition/workout records private by default. Food data sources/licensing,
portion and unit handling, recipe/meal structure, flexible/bulk entry, nutrient
scope, workout fields, imports, and links to planning guidance need design before
implementation. Do not invent nutrition accuracy guarantees or personal targets.
These modules are roadmap notes, not implemented features or diet/workout advice.

Guidance implementation guardrails: query all relevant owned open/due tasks rather
than deriving priorities from the truncated Recent tasks preview. Treat date-only
deadlines using the user's local day, without inventing a time of day. A load
failure must not look like No tasks need attention. Completed work is not a next
action. The first increment adds planning inputs only; the guidance widget follows.

### Explainable guidance and compact dashboard

- Your next step is an optional widget that can be explicitly added/promoted to the
  top. Use complete owned open-task queries for counts and up to three alternatives.
- Rank overdue, due today, high priority, the next week's dated work, remaining
  planned work, then oldest unplanned captures. Resolve ties by due date, priority,
  capture time and ID. Explain why a task appears; missing metadata is not urgency.
- Show nearby all-day commitments using the browser's local day. Offer an exact
  task link and focus-session action without changing completion or saved priority.
- Use compact desktop shortcuts, folded month/detail views, smaller graphics and
  fewer duplicate headings. Keep the retro character, readable controls, saved
  order/width/accent, source records and phone disclosures intact.

### Visual-first interaction preference (owner-confirmed)

- Keep the app visual and scannable: one clear next action, short lists, concise
  keyword labels, icons, semantic colour cues, progress and compact date chips.
- Users should not need to read paragraphs to understand what to do.
- Default guidance shows Next up, task title and Today/Overdue/Priority/Upcoming/
  Unplanned labels. Detailed evidence and ranking rules belong in optional
  Why this? / How suggestions work disclosures.
- Keep text labels alongside colour/icons for accessibility. Errors and saving/
  conflict feedback must remain clear, visible and honest.
- Apply this preference to future Inbox, widgets and optional life modules, not
  just this one guidance card. Do not hide essential deadlines behind explanations.

### Voice-first brain dumps and assisted organization (future direction)

Owner intent: make capture easy and inviting enough to use spontaneously. Within
a space such as Work, the user should be able to speak freely about an idea or
project without structuring it, adding tags, or deciding on tasks while talking.
Speech-to-text is an optional capture method alongside typing, not a separate
complicated workflow. This is roadmap direction, not an implemented feature.

Target flow:
1. Open a space (or the future global Inbox) and tap a clearly labeled microphone.
2. Record a freeform brain dump with visible recording state and simple stop/cancel.
3. Review/edit the transcript and explicitly save the capture into that space.
4. Optionally ask the planner to organize it: suggest a project outline, notes,
   tasks, and tags as short visual cards/checklists grounded in the transcript.
5. Accept, edit, or reject suggestions individually or in a reviewable batch.
   Keep the original capture accessible so organization does not replace the idea.

Confirmed experience priorities:
- Capture first; organization later. Inherit the current space, with an easy way
  to change it, rather than forcing users through folders/tags before recording.
- Keep the interface visual and calm: Record / Stop / Review / Organize, concise
  status cues, and one obvious next action. A typing fallback remains available.
- AI and tags should reduce effort, not create more forms or require a taxonomy.
  Suggested tags are editable/optional, and proposed tasks remain suggestions.
- Recording is user-initiated, clearly indicated, and stoppable. Avoid hidden or
  always-listening behavior.

Working design guardrails, to refine before implementation:
- Save the original transcript independently of accepted organizational changes.
  Preview proposed tasks/dates/tags before applying them; do not invent commitments
  or silently schedule work from uncertain speech. Ask briefly when necessary.
- Keep captures and derived records private to the verified account, with existing
  ownership protections. Any AI/transcription data transfer must be explicit.
- Handle permission denial, interrupted capture, failed transcription and failed
  saves honestly; make retry/edit/cancel understandable and protect draft work.
- Decide whether audio is kept, where it is processed, retention/deletion, and
  history separately. Do not promise permanent recordings or offline dictation.

Open implementation decisions:
- On-device versus hosted transcription/AI, supported devices/browsers/languages,
  recording limits, long-input handling, accuracy review, accessibility and costs.
- Tag model, project representation, source links, duplicate detection, batch
  acceptance/undo, and how accepted suggestions feed dashboard guidance.

Incremental order: build the reusable Inbox/space capture foundation, add reviewed
speech-to-text capture, then add opt-in AI/tag organization. Exact rollout may be
adjusted after a scoped design and device/privacy evaluation. No microphone access,
AI service, transcription integration or tagging system is added by this note.


## Inbox and quick-capture foundation — October 27, 2026

Confirmed next increment: Inbox and quick capture before speech-to-text. Global capture offers Task/Note and optional space context. It saves an actual task, note or space page immediately and preserves the original capture in a private review queue. Reviewed removes queue clutter without completing/deleting the source; reviewed entries can return to the queue. Existing source editors handle planning and completion.

Reuse the account-scoped capture dialog and shared space picker. Keep unsaved drafts in tab memory, explicit saves, stable retry identities, atomic persistence, per-user RLS and revision-protected review. Preserve compact keyword/action layouts and existing retro theme tokens. Speech, AI, tagging and automatic interpretation are not part of this increment. Database and owner browser verification remain required before release.

## Priority update: intuitive tables and relations — October 27, 2026

### Owner-confirmed direction

- Defer speech-to-text. It remains on the roadmap, but is no longer the next increment. This priority update supersedes the earlier proposed capture > speech > AI sequence.
- Bring Notion-inspired table and relation interactions into Life Planner. The owner values how connected information works, alongside its visual presentation.
- Minimize typing and repeated data entry. Prefer picking existing records, short menus, checkboxes, date controls, templates and useful context defaults.
- Keep everything intuitive, visual and scannable. Preserve the approved retro desktop themes, mobile usability, optional modules and full-customization goal.
- Review useful ideas from earlier planner/app conversations; incorporate compatible lessons without importing their entire feature lists or replacing Life Planner's architecture.

### Earlier conversation evidence and limits

Reviewed accessible messages from:

- [Planner app design](chatgpt-conversation://6adc1d68-3e1c-83e8-9450-f2a836ae5196): the owner chose hybrid app navigation/digital notebook styling and advanced customization. Several older assistant replies resolve only to content references; their missing details have not been reconstructed.
- [Notion Workspace Prompt](chatgpt-conversation://6ad77838-cc80-83e8-81d5-3229cdee1392): accessible recent turns confirm an HQ iteration, but do not expose its actual table schemas. No exact HQ database design has been recovered.
- [AI Life Inbox Idea](chatgpt-conversation://6a69434b-f7f0-83e8-9305-a7c4c6663721): accessible Nook discussion supports a common polished core with optional specialized modules. Retrieved assistant design proposals emphasize visual cards and short forms; these are inspiration, not independently confirmed Life Planner requirements.
- [Nook Prototype Prompt](chatgpt-conversation://6a710320-a05c-83e8-992a-96fc80657e39): the owner explicitly found the earlier architecture too complicated. Selecting owned items for projects is a useful proposed interaction to adapt as selecting existing related records. Do not copy its local-only prototype storage/auth choices into Life Planner.
- [App Ideas Summary](chatgpt-conversation://6aaf2465-ba18-83e8-8856-4cbff27cd8cd): retrieved assistant summaries describe Life Inbox/Holden as capture-first and Nook as connected projects/items. Treat these as secondary summaries, not proof of every original decision or existing implementation.

### Proposed interaction plan — scope each increment before building

| Area | Intended experience | Less typing |
| --- | --- | --- |
| Tasks table first | Clear rows, compact columns, complete checkbox, title, optional due date/priority/space | Edit one cell; choose dates, priorities and existing spaces |
| Record details | Open a row into an accessible detail panel/page | Reuse existing editors and saved values |
| Relations | Labeled chips linking actual records; searchable picker; clear/unlink control | Choose existing records instead of copying names or pasting IDs |
| Linked views | Show the same records in a space/dashboard with saved filters and sorting | Create once, display in multiple places |
| Alternative views | Table/list first; board/calendar/gallery when useful for a specific record type | Switch presentation without duplicating data |
| Templates and context | Optional starter fields/views and visible preselected space | Start quickly without filling a large form |
| Summaries later | Related task counts, progress and other clearly labeled rollups | Derive from saved records rather than maintaining totals manually |

Suggested first increment: a Tasks table using the existing task model and real saved data. Preserve the current list/phone experience as needed. Click a cell to edit, choose Space through the shared picker, and open the existing task controls for details. Establish a consistent save/cancel/keyboard contract before expanding inline editing. This is a proposal, not an implemented feature or approval to build the whole table system at once.

Subsequent increments can define Projects as a real record type, connect tasks/notes/pages, add linked filtered views, then introduce optional custom properties/databases and rollups. Projects, arbitrary relation fields, custom schemas, saved table views and rollups are not implemented by this note. Existing task-to-space assignment and note/page links are foundations, not a general relational database builder.

### Relation and table guardrails

- Use record identity, not copied labels. Renames should display consistently; a table and its linked view refer to the same record.
- Make relation direction, one/many selection and backlinks explicit per relationship. Unlinking must not delete either record. Define deletion/archive behavior before introducing each relation.
- Preserve private defaults, per-user RLS, same-owner constraints and fresh authorization. A relation never grants sharing access by itself.
- Keep field labels in everyday language. Hide advanced property setup until requested. Avoid mandatory tags, classifications or long descriptions just to capture an item.
- Show pending/saved/error/conflict feedback at the edited item. Retain failed drafts and protect stale edits; never suggest an unsaved cell is persisted.
- Support keyboard navigation, labeled controls, touch targets and readable narrow-screen layouts. Avoid making a wide spreadsheet the only phone interface.
- Reuse shared field, picker, table/list and record-detail patterns where contracts match. Keep feature validation and write permissions separate; avoid a large generic database framework before one useful table works.
- Validate real examples: select an existing Space for a task; rename the Space and see its current label; show the task in a filtered view without a duplicate; unlink without deleting the task. Future Project/rollup examples require their own model and tests.

### Acceptance questions for each future increment

Can the owner understand the next action without reading a paragraph? Can an existing value be selected rather than retyped? Is the same information entered only once? Are empty/loading/error states clear? Does the action work on a phone and keyboard? Can the owner safely change the relevant shared component using the editing guide?

This update records direction only. It changes no application code, dependencies, database schemas or permissions.

## Habits priority and interaction decisions — October 27, 2026

Owner-confirmed: habits are a core priority, not a minor optional afterthought. Use the shared visual table/control foundations where useful, but give habits their own recurring schedules and check-in history rather than treating them as tasks that repeatedly reset.

- Support done/not-done habits and measurable counts/amounts with units and targets suited to the habit.
- Let users choose and later change frequency, schedule and targets. Daily, selected weekdays and times-per-week are candidate presets; exact scheduling rules remain to be scoped.
- Include habits on the dashboard. Simple habits support one-tap check-ins; measurable habits use quick increment/decrement and amount controls, with detail/edit controls available when needed.
- Provide preset habits and routines, easy selection, sensible visible defaults and optional customization. Minimize typing, use clear choices and suggestions, and avoid a large mandatory setup form.
- Multi-step routines are a welcomed direction. Define how steps, routine completion and individual habit history relate before implementation.
- AI-assisted suggestions are a confirmed future direction. Begin with useful presets and deterministic suggestions; do not imply AI is already connected or understands unsupplied context. Proposed changes to schedules, goals or records require user acceptance.
- Preserve previous check-ins when editing a habit. Define effective dates, local-day/time-zone behavior, missed days, weekly targets, corrections, pauses/archive and historical target changes within the habit increment. Streaks remain an optional proposal, not a settled scoring rule.
- Reuse accessible table/field/picker patterns while keeping habit validation, ownership, persistence and history distinct. Verify per-user RLS and stale-edit protection before release.

Proposed build sequence: establish the reusable Tasks table, then scope a first-class Habits table/dashboard with binary and amount check-ins, flexible schedules and preset selection. Broader routines and AI suggestions follow scoped working increments. No habit or AI feature is implemented by these planning notes.

## App-wide interaction principle — owner confirmed October 27, 2026

Apply low-typing, intuitive, suggestion-led interaction throughout Life Planner, not only habits. Every module should favor selecting existing information, presets/templates, quick controls, visible context defaults and optional deeper editing. Offer useful suggestions without forcing setup or inventing user intent. Keep advanced options discoverable and short labels visual. Future AI supports this principle across modules, with user-reviewed changes and explicit privacy boundaries; it is not currently implemented.

## Connected life and unified daily view — owner confirmed October 27, 2026

The owner cites CryBaby's Notion HQ as the desired connected experience: chores, tasks and other life areas should work together, with Obsidian-inspired references, instead of feeling like separate apps. This is the owner's description of the HQ; its exact schema has not been independently recovered.

- Provide one useful Today view across selected life areas: household chores, work/personal tasks and scheduled habits/routines. Keep source/type/space labels and clear actions so a mixed day is understandable at a glance.
- Reuse the same source records across tables, spaces and the daily dashboard. Completing or editing an item should be reflected wherever it appears; do not create disconnected copies for each view.
- Support references to related projects, spaces, notes/pages and other relevant records through selectable relation chips and discoverable backlinks. Define allowed relationship types incrementally; do not promise arbitrary relations are already available.
- Let users open related context without losing their place. Offer optional filters and grouping while retaining a combined view; users should not have to visit every module to plan their day.
- Distinguish actionable tasks, habit check-ins, routine steps and calendar commitments. A daily presentation can combine them without pretending their completion, recurrence or history rules are identical.
- Derive daily inclusion from explicit dates/schedules and chosen filters. Show undated captures separately or as explained suggestions; never silently assign deadlines. Define habit local-day behavior before adding check-ins.
- Keep daily views private and bounded, with honest loading/error states. Relations and aggregation must preserve source ownership and sharing boundaries.

Proposed acceptance example: Today shows a work task, a household chore and a habit together; each opens its source/context, completion updates the same source and applicable habit history, and unrelated modules can stay hidden. This is a future implementation criterion, not current functionality.

## Tasks table foundation — prepared for owner review

The full Tasks page now presents existing records in Task, Date & priority and Space columns. The same shared controls save the original records; phone layouts stack those same rows. Other task lists retain their current presentation. Date and priority share a single revision-protected planning save. No new database migration, custom properties, habit system, general relations or saved table views are added by this increment.

## Pencil and popup editing — prepared for owner review

Owner preference: keep cards/entries visually clean with a small labeled pencil at the top right, opening an editor popup. A shared EditDialog supplies the accessible native modal, explicit Close/Escape behavior and retained in-page drafts. Feature-owned saves and validation stay intact. Applied to task controls, saved note/page editors, calendar entries, selected space settings, dashboard/widget layout settings and timer length. Creation forms and dedicated account Settings keep their form flows; immutable Inbox originals remain read-only. This changes presentation, not database permissions or offline persistence.

## Habits foundation — prepared for owner/database review

The first habits increment adds editable presets, binary or amount check-ins, daily/selected-weekday/days-per-week schedules, pause, optional Space links and date-based history/corrections. Shared pencil dialogs and quick controls minimize typing. Check-in snapshots preserve original targets/units/types across later setting edits. Same-owner RLS, narrow grants and independent habit/log revision guards protect persistence.

Habits today is an optional tenth dashboard widget; existing seven-widget defaults remain unchanged. Data is paginated and previews labeled. Browser-local day and Monday-start weeks are explicit. Multi-step routines, AI suggestions, streak scoring, map-wide habit relations and the combined Today view are not part of this increment. Live SQL and owner save/refresh checks remain required before release.

## Connected Today — prepared for owner/database review

A dedicated Today page combines original due/overdue tasks, scheduled or recorded habits, and today's all-day calendar entries. It uses short labeled counters, five-item independently paginated sections, original Space links, shared check-in/completion controls and pencil editors. Counts include all relevant records rather than only recent previews. Undated tasks remain unscheduled with a separate organizing count.

Migration 022 adds only an authenticated, owner-filtered read function under existing RLS. Browser-local day and Monday habit weeks remain explicit. Shared source saves refresh Today; no duplicate records, automatic deadlines, times, tasks or reminders are generated. The customizable dashboard stays available with an Open Today shortcut. AI, project/general relation models and broader life-module aggregation remain future increments. Live SQL and owner verification are required before release.

## Connected Projects foundation — prepared for owner/database review

The first project increment links existing tasks, notes and pages to private projects with optional Space context, manual status and automatic linked-task progress. It uses shared search, field controls and pencil popups. Relationships are many-to-many by source identity, not copied content. Unlink is reversible through an inactive relation with a revision baseline. Source detail pages provide bounded project backlinks; current source titles and task completion are read live.

Catalogs and item lists are paginated, while progress counts all active linked tasks. Project status/Space does not move, complete or schedule source items. No new tasks are silently created by presets or relations. This is a typed project hub, not a general custom database builder or AI organizer. Project selectors for non-task records, habit-project relations, richer views and project dashboard widgets remain future scope. Migration 023 and live owner/privacy verification are required before release.

## Task project controls - prepared for owner/database review

Task pencil editors include optional no-typing project browsing with search and link/unlink/restore. Tasks gains a Projects column; shared task cards reuse compact current-title project badges. Up to three names plus a complete count keep the view visual. Sources remain original records, and links do not alter task completion, dates, priorities or Space.

Migration 024 adds only authenticated, owner-filtered, bounded read functions under existing RLS. Writes reuse existing revision-protected relations. General databases, creating projects inside task editors, habit relations and AI are separate increments. Live database and owner checks remain required before release.


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


## Settings grouping and remaining scope

Owner correction: fonts, reading size and zoom belong in Appearance. Keep top-level categories compact, with one horizontal scrollable tab row on phones and expandable groups inside categories. Retain mounted drafts and existing separate saves.

Current categories: Appearance (palette/background/font/text/zoom), Workspace (navigation plus dashboard link), Accessibility (motion/focus/decoration), Account (verified email/sign-out), Data & privacy (current private-storage/sharing status), About. Future controls are explicitly labeled and collapsed; they are not functional switches.

Remaining settings to scope alongside their features:
- Planning: week start, date/time formats, time zone, default views/Space and scheduling defaults.
- Notifications: optional reminders, quiet hours, channels and permission/status controls; no notification delivery exists yet.
- Account/security: profile, password recovery/change, connected auth providers, active sessions and account deletion, with appropriate confirmation.
- Data/privacy: export/import, backups/recovery/history, selective sharing, retention and offline-data controls; AI/microphone consent only when those features are scoped.
- Integrations: calendar connections, imports and provider permissions/revocation.
- Optional modules/templates: enabled life areas, routines and presets, including future meals/workouts.
- Billing only if premium launches; prices and premium boundaries remain undecided.

Do not add settings that cannot affect a real feature. Add new top-level categories only when they contain useful controls.


### Consistent font roles

All headings, body text, form controls, legends, charts and desktop chrome use shared font tokens. Monospace, System and Rounded apply to all three roles; Classic desktop keeps its intentional heading/UI/console mix. Theme palette changes do not reset the saved font. Edit font stacks in src/lib/themes/display.ts, not individual cards. Legacy font-family declarations use token fallbacks rather than overriding the preset.
