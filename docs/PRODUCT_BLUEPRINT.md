# Life Planner product blueprint

Status: agreed product direction; implementation has not started.
Consolidated: 2026-10-26.

## Source and scope

This document consolidates the six rounds of decisions from the referenced
[Notion Or Obsidian Comparison conversation](chatgpt-conversation://6adf5e11-5560-83e8-80ad-1363870b88dd),
as summarized explicitly by the project owner in the documentation request.
The available chat retrieval contained recent Git setup messages and unresolved
content references, not the six full rounds. The sections below group the supplied
decisions by topic; they do not claim to reproduce the original round order.
Unspecified details remain open rather than becoming requirements by assumption.

This change documents the product and development conventions only. It does not
authorize implementing the entire roadmap.

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
