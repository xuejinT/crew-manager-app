# Spec: promotable primary column

Handoff for the next session. Repo: `/Users/xuejint/Developer/overwatch-kiro-crew-app`.

## Goal

Four panels — Work (Goals/Sessions), PRs, Loops, Scheduled tasks. The layout is
three columns at **35% / 35% / 30%**:

- **Column 1** always holds exactly **one primary** panel, expanded.
- **Column 2** holds the other **three** as an accordion: one open at a time, the
  open card takes the leftover height, the closed two collapse to their header.
- **Column 3** is the Conductor chat. It is pinned and never participates.

Dragging any card from column 2 onto column 1 promotes it to primary and demotes
the current primary into column 2. Work is just one of the four candidates.

## What exists today (all installed and green)

- 35/35/30 via `.ow-layout { grid-template-columns: 7fr 3fr }` plus
  `.ow-main { grid-template-columns: 1fr 1fr }`.
- Accordion middle column: `openStack: StackCard | null`, persisted under
  `crew-manager.stack-open-v2`, default `'prs'`. `.ow-stack-card[open] { flex: 1 1 auto }`.
- A **column-level** swap: `swapped` boolean under `crew-manager.swap-left`, a
  `Swap` button, and HTML5 drag from any `.ow-stack-card` onto `.ow-listcard`.

**This swap is the wrong granularity and should be replaced, not extended.** It
exchanges the whole rail with the whole work column, so column 1 keeps holding
Goals/Sessions and column 2 keeps all three utilities.

## Required changes

### 1. State

Replace the `swapped` boolean with:

```ts
type PanelId = 'work' | 'prs' | 'loops' | 'schedule'
```

- `primary: PanelId`, default `'work'`, persisted under a NEW key
  (`crew-manager.primary-v1`) so old `swapped` values cannot be misread.
- Delete `SWAP_KEY` / `swapped` / `applySwap`.
- `openStack` stays, but must only ever name a panel currently in the rail. When
  a card is promoted, pick the next open card deterministically (first remaining
  in `['prs','loops','schedule','work']` order) rather than leaving `openStack`
  pointing at the primary.

### 2. Structure — the blocker

The three utility cards are wrapped in `<div className="ow-stack">`. **A card
cannot leave that wrapper to reach column 1, so the wrapper must go.** Render all
four panels as direct children of `.ow-main` in a FIXED DOM order and move them
with grid placement only:

- primary: `grid-column: 1; grid-row: 1 / -1`
- the other three: `grid-column: 2`, in rail order

Fixed DOM order is a hard requirement: reordering nodes remounts `ChatEmbed` and
loses transcript scroll and in-flight streaming. Drive everything from
`data-primary` / per-panel `style` placement, never from array reordering in JSX.

### 3. Accordion on a grid

`.ow-stack-body`'s `flex: 1 1 auto` no longer applies once the flex wrapper is
gone. Column 2 needs three rows where the open card takes the remainder:
`grid-template-rows: min-content min-content minmax(0, 1fr)` does NOT work,
because the open card is not always third. Prefer keeping column 2 as its own
flex container — e.g. one `.ow-rail` element that is itself a grid child of
column 2 — but the primary must still be able to move OUT of it. Two workable
shapes, pick one and say why:

- `display: contents` on the rail wrapper, so its children participate in
  `.ow-main`'s grid directly.
- No wrapper; give column 2 items `grid-row: auto` and size the open one with
  `grid-row: span` plus `align-self: stretch`.

Whichever is chosen, each card body must still scroll internally and no card may
push another off-screen.

### 4. Work as a rail card

Work currently has no collapsed state — it is a bare `<section>` with tabs. When
demoted it needs the same `<details>` anatomy as the others: a summary header
reading `Goals` / `Sessions`, a count, and a collapsed state. Keep the tab row and
filters usable while it is primary; when collapsed in the rail, the summary alone
is enough. Do not introduce a second container language — reuse
`.ow-card.ow-stack-card`.

### 5. Drag and drop

- Every one of the four cards is `draggable` and carries its `PanelId` on
  `text/x-crew-panel`.
- Column 1 is the drop target: on drop, set `primary` to the dropped id. Dropping
  the current primary on itself is a no-op.
- Keep the accent drop outline (`[data-dragover='true']`).
- Keep a keyboard-accessible path: replace the `Swap` button with a per-card
  "Make primary" action in each rail card's header. Drag must not be the only route.

## Acceptance criteria

1. Default load: Work primary in column 1, PRs open in column 2, Conductor right.
2. Dragging Loops onto column 1 makes Loops primary and puts Work into the rail.
3. Column 1 always holds exactly one card; column 2 always holds exactly three.
4. Conductor never moves and never remounts — assert the `ChatEmbed` node identity
   survives a promotion.
5. `primary` and `openStack` persist across reload and never name the same panel.
6. Column widths stay 35/35/30 at 1440px.
7. Below 1100px the three columns stack vertically and remain scrollable.

## Validation required before reporting done

- `npm run check` (typecheck + build + 205 existing tests + backend selftest).
- Add tests for each acceptance criterion above; the existing
  `describe('left column swap')` block should be rewritten, not kept.
- Install and verify hashes match:
  `cp ui/index.mjs ~/.kiro/crew/apps/crew-manager/ui/index.mjs`
  then `shasum -a 256` on both.
- Render with dense data at 1440x900 and a narrow width, read the pixels, run a
  new-user critique, fix at least one finding.
  A working harness recipe is in `/tmp/cm-layout-harness/` (esbuild entry +
  `@kirocrew/app-sdk` stubs + `python3 -m http.server 8765 --bind 127.0.0.1`);
  recreate it if `/tmp` was cleared. The dashboard's own browser panel is not
  installed on this host, and the signed-in dashboard session cannot be reused,
  so the standalone harness is the verification path.

## Notes

- Reply in English; code, comments, tests, commits in English.
- Follow the user's sketch over invented arrangements; ask before changing agreed
  proportions.
- Do not commit or push unless asked.
