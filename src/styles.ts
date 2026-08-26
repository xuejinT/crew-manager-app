export const OVERWATCH_STYLES = String.raw`
  .ow-root {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    color: var(--text);
    background: var(--bg);
  }
  /* Beta pill sits inline right after the name so the two read as one label. */
  .ow-title-line { display: inline-flex; align-items: center; gap: 8px; }
  .ow-beta {
    /* Size to the label, not the title: line-height:1 drops the tall inherited
       line box, align-self stops the flex item stretching to the title height. */
    line-height: 1;
    align-self: center;
    padding: 2px 9px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  /*
   * No page gutter. The 24px px-2/md:px-6 gutter belongs to DOCUMENT pages,
   * where content is cards floating on a page — Artifacts, Logs, Agents, Apps,
   * System all use it. A full-height workspace does not: ChatPage, the closest
   * sibling to this three-column layout, uses that class ZERO times and runs
   * edge to edge. Applying the document gutter here was the wrong convention,
   * and it cost 24px on both sides plus 24px at the bottom of a layout whose
   * columns are supposed to fill the viewport.
   */
  .ow-body { flex: 1; min-height: 0; padding: 0; }
  /*
   * No frame of its own. Every other dashboard page puts content directly in the
   * page gutter; this app used to draw a bordered, rounded, shadowed box INSIDE
   * that gutter and then inset the list again within it. Padding stacks and the
   * eye reads the sum, so the same content sat 41px in where other pages sit
   * 24px in — and the frame is what made this page look unlike the rest.
   *
   * The column divisions do not depend on it: the rail and the work column each
   * carry their own border-right, and the rail and Conductor carry their own
   * background.
   */
  .ow-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 6px var(--ow-conductor-w, 30%);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--bg);
  }
  /* Work 35% + utilities 35% inside the 7fr track; Conductor holds the 3fr.
     All four panels live here as siblings in fixed DOM order — nothing reorders,
     the grid coordinates below decide which one is primary. */
  .ow-main {
    display: grid;
    min-width: 0;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    padding: 6px 6px 16px 16px;
  }
  /* Column 2's rows: the open card's row takes the remainder, the other two
     shrink to their header. A grid row cannot size itself from its item, so the
     open card's index arrives as data-open-row. With nothing open the slack goes
     to the last row, so the primary's 1 / -1 span still fills the height. */
  .ow-main[data-open-row='0'] { grid-template-rows: minmax(0, 1fr) min-content min-content; }
  .ow-main[data-open-row='1'] { grid-template-rows: min-content minmax(0, 1fr) min-content; }
  .ow-main[data-open-row='2'],
  .ow-main[data-open-row='none'] { grid-template-rows: min-content min-content minmax(0, 1fr); }
  .ow-main > .ow-stack-card[data-primary='true'] { grid-column: 1; grid-row: 1 / -1; }
  .ow-main > .ow-stack-card[data-rail-index='0'] { grid-column: 3; grid-row: 1; }
  .ow-main > .ow-stack-card[data-rail-index='1'] { grid-column: 3; grid-row: 2; }
  .ow-main > .ow-stack-card[data-rail-index='2'] { grid-column: 3; grid-row: 3; }
  /* The work|rail handle spans the full column height; the layout handle sits
     in .ow-layout's own middle track and needs no placement. */
  .ow-main > .ow-resizer { grid-column: 2; grid-row: 1 / -1; }
  /* A closed card must not be stretched by its row — only the open one grows. */
  .ow-main > .ow-stack-card:not([open]) { align-self: start; }
  /* Drag handle between two panels. A 6px grab strip with a centred hairline
     that brightens on hover/focus; it is the only divider between the columns. */
  .ow-resizer {
    align-self: stretch;
    position: relative;
    cursor: col-resize;
    touch-action: none;
  }
  .ow-resizer::before {
    content: '';
    position: absolute;
    inset: 0 2px;
    border-radius: 2px;
    background: transparent;
    transition: background 0.12s ease;
  }
  .ow-resizer:hover::before,
  .ow-resizer:focus-visible::before { background: var(--accent); }
  .ow-resizer:focus-visible { outline: none; }
  .ow-filter[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    color: var(--accent);
  }
  .ow-count { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  /* Card shell, shared by the tabbed list and every utility-rail card. */
  .ow-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
  }
  /* Every panel is this card. The primary one is the same shell, expanded. */
  .ow-stack-card {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  /* Chrome wraps every non-summary child in a ::details-content BLOCK box, so
     the card's flex column holds only the summary and that wrapper — a body
     asking to flex was sizing itself against the wrapper and growing to its own
     content, which clipped the overflow with no way to scroll to it. Making the
     wrapper the flex column restores the bounded, internally scrolling body.
     Browsers without the pseudo drop this rule and keep the children as direct
     flex items, which is the same result. */
  .ow-stack-card::details-content {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    flex-direction: column;
    overflow: hidden;
  }
  /* Grab a card by its header; the body keeps normal text selection. */
  .ow-stack-card > summary { cursor: grab; }
  .ow-stack-card:active > summary { cursor: grabbing; }
  .ow-stack-card[data-dragover='true'] {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  /* The primary card cannot collapse, so it must not offer a collapse affordance. */
  .ow-stack-card[data-primary='true'] .ow-stack-chevron { display: none; }
  .ow-stack-actions { display: flex; flex: none; align-items: center; gap: 8px; }
  .ow-promote { padding: 2px 8px; font-size: 11px; }
  .ow-refreshbar { display: flex; flex: none; align-items: center; gap: 6px; }
  .ow-updated { color: var(--muted); font-size: 11px; white-space: nowrap; }
  /* Icon-only refresh: no chrome at rest, a subtle tint on hover, matching the
     other icon buttons. */
  .ow-refresh {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-md, 8px);
    background: none;
    color: var(--muted);
  }
  .ow-refresh:hover { background: var(--bg-hover); color: var(--text); }
  .ow-refresh:disabled { cursor: default; opacity: 0.7; }
  .ow-spin { animation: ow-spin 0.8s linear infinite; }
  @keyframes ow-spin { to { transform: rotate(360deg); } }
  /* Underline tabs, not the pill treatment the rail used: these switch what the
     list IS, so they read as the card's own header row rather than a filter.
     Symmetric padding and the same 13px as every other card title — the tab row
     shares a header line with the count badge, and asymmetric padding pushed the
     badge off the tab's text baseline. */
  .ow-listcard-tools { display: flex; flex: none; flex-direction: column; gap: 10px; padding: 0 14px 12px; }
  .ow-listcard-sub { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* The only scroll container in the column. */
  .ow-work { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .ow-work-inner { padding: 0 14px 14px; }
  /* Layout C — left rail: the state filter as a vertical nav beside the list.
     The rail holds still (its own scroll); .ow-work scrolls the list. */
  .ow-worksplit { flex: 1 1 auto; min-height: 0; display: flex; align-items: stretch; }
  .ow-railnav {
    flex: none; width: 150px; display: flex; flex-direction: column; gap: 2px;
    padding: 2px 10px 14px 14px; border-right: 1px solid var(--border); overflow-y: auto;
  }
  .ow-railnav .ow-railitem { width: 100%; justify-content: space-between; text-align: left; padding: 7px 10px; font-size: 12.5px; }
  .ow-railitem-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ow-stack-card > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 14px;
    list-style: none;
    cursor: pointer;
  }
  .ow-stack-card > summary::-webkit-details-marker { display: none; }
  .ow-stack-card > summary:hover { background: var(--bg-hover); }
  .ow-stack-card > summary:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .ow-stack-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-strong);
    font-size: 13px;
    font-weight: 650;
  }
  .ow-stack-chevron { flex: none; color: var(--muted); transition: transform 140ms ease; }
  .ow-stack-card[open] .ow-stack-chevron { transform: rotate(90deg); }
  .ow-stack-sub { margin: 0; padding: 0 14px; color: var(--muted); font-size: 12px; }
  .ow-stack-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 6px 14px 12px; }
  .ow-stack-empty { margin: 0; padding: 6px 0 2px; color: var(--muted); font-size: 13px; }
  /* Loop and cron rows: a type rail, the text block, then the status pill. */
  .ow-mini {
    display: grid;
    grid-template-columns: 3px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .ow-mini:last-child { border-bottom: none; }
  .ow-mini-rail { align-self: stretch; border-radius: 999px; }
  .ow-mini-title { color: var(--text-strong); font-size: 13px; font-weight: 600; }
  .ow-mini-desc {
    margin-top: 2px;
    overflow: hidden;
    color: var(--text);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ow-mini-when { margin-top: 3px; color: var(--muted); font-size: 11px; }
  .ow-mini-chip {
    margin-left: 6px;
    padding: 1px 6px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg);
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
  }
  .ow-section { margin: 0 0 28px; }
  /* Airy, and pinned: the header sticks to the top of the scrolling list so you
     always know which group you are in. The --card background covers rows that
     scroll up beneath it. */
  .ow-section-header {
    display: flex; flex-direction: column; gap: 3px;
    position: sticky; top: 0; z-index: 2;
    background: var(--card);
    padding: 14px 0 10px;
  }
  /* The first section sits right under the panel header, so it needs no airy
     top gap — that space reads as empty at the top of the list. */
  .ow-section:first-child .ow-section-header { padding-top: 2px; }
  .ow-section-heading { display: flex; align-items: baseline; gap: 8px; }
  .ow-section-title {
    margin: 0;
    color: var(--text-strong);
    font-size: 15px;
    font-weight: 650;
  }
  .ow-section-count { color: var(--muted); font-size: 13px; }
  .ow-section-subtitle { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.4; }
  .ow-section-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  .ow-section-empty { margin: 0; padding: 12px 4px; color: var(--muted); font-size: 14px; }
  .ow-row {
    position: relative;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
    cursor: pointer;
    outline: none;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
  }
  /* State rail on the left edge (option D). The selected / instructed accent
     rails are defined later in this sheet and outrank these, so an active row
     still reads as accent rather than its lane colour. */
  .ow-row[data-lane='unblock'] { box-shadow: inset 3px 0 0 var(--warn); }
  .ow-row[data-lane='followup'] { box-shadow: inset 3px 0 0 color-mix(in srgb, var(--warn) 55%, transparent); }
  .ow-row[data-lane='running'] { box-shadow: inset 3px 0 0 var(--accent); }
  .ow-row[data-lane='done'] { box-shadow: inset 3px 0 0 var(--ok); }
  .ow-row:hover { border-color: var(--border-strong); background: var(--bg-hover); }
  /* Focus ring via outline, not box-shadow, so it never replaces the lane rail.
     Keyboard-focus only; a mouse click to select shows nothing. */
  .ow-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  /* Selection recolours nothing on the row — the expanded detail and the
     Conductor quote are the feedback, so the rail and edges never change. */
  .ow-row-layout { display: flex; align-items: flex-start; gap: 12px; }
  .ow-row-content { min-width: 0; flex: 1; }
  /* Title line. The chevron is pushed to the trailing edge by the title's own
     flex growth, so it lands in the same place on every card. */
  .ow-row-heading { display: flex; min-width: 0; align-items: flex-start; gap: 8px; }
  .ow-row-chevron { flex: none; margin-top: 3px; color: var(--muted); transition: transform 140ms ease, color 140ms ease; }
  .ow-row-chevron[data-expanded='true'] { transform: rotate(90deg); }
  .ow-row:hover .ow-row-chevron { color: var(--text-strong); }
  /* Status line (option B): the state badge, then the one-line reason. */
  .ow-row-status { display: flex; min-width: 0; align-items: center; gap: 8px; margin-top: 6px; }
  .ow-row-statustext {
    min-width: 0;
    flex: 1 1 auto;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Turn rides at the trailing edge of the title line; monospace so a number
     reads as a coordinate into the transcript rather than as prose. */
  .ow-row-turn {
    flex: none;
    margin-left: auto;
    margin-top: 1px;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    white-space: nowrap;
  }
  /* State pill — one shape for all four states, colour + leading glyph vary.
     Translucent fills are mixed from the theme tokens so they track the theme. */
  .ow-rowstate {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .ow-rowstate .ow-icon { width: 11px; height: 11px; }
  .ow-rowstate-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .ow-rowstate-spin {
    flex: none; width: 9px; height: 9px; border-radius: 50%;
    border: 1.5px solid currentColor; border-right-color: transparent;
    animation: ow-rowstate-spin 0.9s linear infinite;
  }
  @keyframes ow-rowstate-spin { to { transform: rotate(360deg); } }
  .ow-rowstate--need   { color: var(--warn);   background: color-mix(in srgb, var(--warn) 14%, transparent);   border-color: color-mix(in srgb, var(--warn) 34%, transparent); }
  .ow-rowstate--follow { color: var(--warn);   background: color-mix(in srgb, var(--warn) 7%, transparent);    border-color: color-mix(in srgb, var(--warn) 20%, transparent); }
  .ow-rowstate--run    { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); border-color: color-mix(in srgb, var(--accent) 34%, transparent); }
  .ow-rowstate--queued { color: var(--muted);  background: color-mix(in srgb, var(--muted) 12%, transparent);  border-color: color-mix(in srgb, var(--muted) 26%, transparent); }
  .ow-rowstate--done   { color: var(--ok);     background: color-mix(in srgb, var(--ok) 13%, transparent);     border-color: color-mix(in srgb, var(--ok) 30%, transparent); }
  .ow-row-title {
    min-width: 0;
    color: var(--text-strong);
    font-weight: 650;
    /* TWO lines, not one line with an ellipsis.
       Auto-generated session titles frequently share a long leading phrase, so a
       single-line clamp cut away the only part that differed: five separate rows
       all read "Open ONE PR on kirodotdev/KiroCrew fixin…" and were impossible to
       tell apart. Two lines is still bounded -- the row cannot grow without
       limit -- while reaching the words that distinguish one from another. */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  .ow-row-summary {
    display: -webkit-box;
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--text);
    font-size: 14px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .ow-row-meta { display: flex; min-width: 0; align-items: center; gap: 8px; margin-top: 8px; color: var(--muted); font-size: 12px; }
  .ow-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ow-references { display: flex; min-width: 0; align-items: center; gap: 4px; overflow: hidden; }
  .ow-reference { display: inline-flex; min-width: 0; align-items: center; gap: 4px; }
  .ow-primary-action { flex-shrink: 0; }
  .ow-icon { width: 14px; height: 14px; flex-shrink: 0; }
  /* Sizing only. The resizer hairline to its left is the divider now, so the
     column carries no border-left of its own. */
  .ow-conductor {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
    /* Match the Sessions card's inset so the two boxes read as siblings and the
       border never hugs the resizer hairline. Left inset is tighter than the
       outer edge so the gutter between the two boxes stays small. */
    margin: 6px 16px 16px 6px;
  }
  .ow-conductor-header { padding: 8px 10px; border-bottom: 1px solid var(--border); }
  .ow-conductor-title { display: flex; align-items: baseline; gap: 8px; }
  .ow-conductor-title h2 { margin: 0; color: var(--text-strong); font-size: 15px; font-weight: 650; }
  .ow-conductor-sub { color: var(--muted); font-size: 12px; font-weight: 500; }
  .ow-lane-head { display: flex; align-items: baseline; gap: 8px; padding: 10px 16px 2px; }
  .ow-lane-badge { flex: 0 0 auto; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 5px; }
  .ow-lane-unblock { background: rgba(240, 185, 70, 0.15); color: #f0b946; }
  .ow-lane-followup { background: rgba(110, 168, 254, 0.16); color: #6ea8fe; }
  .ow-lane-reason { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 12px; }
  .ow-row-check { color: #5bbf7a; }
  /* The card's collapsed ledger: this session's finished goals, offered as
     context under the lanes rather than only in the Done section. */
  .ow-lane-done { padding: 8px 16px; }
  .ow-goals-toggle { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; color: var(--muted); font: inherit; font-size: 12px; cursor: pointer; }
  .ow-goals-toggle:hover { color: var(--text); }
  .ow-goals-toggle .ow-icon { width: 12px; height: 12px; transition: transform 0.15s ease; }
  .ow-goals-toggle .ow-icon[data-open="true"] { transform: rotate(90deg); }
  .ow-done-list { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .ow-eyebrow { color: var(--muted); font-size: 12px; font-weight: 550; }
    min-width: 0;
    overflow: hidden;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-align: left;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .ow-block { display: flex; flex-direction: column; gap: 8px; }
  /*
   * Option 2: the group IS a card, its goals are rows inside it.
   *
   * Option 5 (a tinted region holding filled cards) put two "lighter, rounded,
   * filled" rectangles at DIFFERENT levels into one list, so a container and an
   * item spoke the same visual language and the hierarchy stopped reading —
   * a lone card looked like it might be a group. Here the list has exactly one
   * visual category: a card is either one item, or one session holding rows.
   */
  .ow-block[data-grouped='true'] {
    gap: 0;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
  }
  /*
   * The session header. Its base rule was lost in an earlier edit, leaving the
   * element as a default <button> — which is why its icon wrapped onto its own
   * line rather than sitting beside the name.
   */
  .ow-block-name { font-weight: 600; }
  /* Rows give up their own frame: the enclosing card already provides it. */
  .ow-block[data-grouped='true'] .ow-row {
    border: 0;
    border-radius: 0;
    background: none;
  }
  /* A lane is the group inside a session card: its verb head labels the rows
     directly beneath it with NO line between them. Dividers fall between lanes,
     and between stacked rows within a lane — never right under a head, which is
     what made the badge read as part of the session header instead of its rows. */
  .ow-block[data-grouped='true'] .ow-lane + .ow-lane { border-top: 1px solid var(--border); }
  .ow-block[data-grouped='true'] .ow-lane .ow-row + .ow-row { border-top: 1px solid var(--border); }
  .ow-block[data-grouped='true'] .ow-row:hover { background: var(--bg-hover); }
  .ow-block[data-grouped='true'] .ow-row[data-selected='true'] {
    background: var(--aim-subtle);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .ow-reference-link {
    background: none;
    border: 0;
    padding: 0;
    color: inherit;
    cursor: pointer;
    text-decoration: none;
  }
  .ow-reference-link:hover { color: var(--text); text-decoration: underline; }
  /*
   * A recalled row is quieter than a live one. It reports no state and demands
   * nothing — flattening its background keeps it from competing with the work
   * that is actually in front of the user.
   */
  .ow-recall-row { background: none; }
  .ow-recall-row:hover { background: var(--bg-hover); }
  .ow-recall-age {
    flex: 0 0 auto;
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
  }
  /* An acknowledged item is in progress on the user's word, not the platform's. */
  .ow-row[data-instructed='true'] { box-shadow: inset 2px 0 0 var(--accent); }
  .ow-row-duplicate {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
    padding: 0;
    min-width: 0;
    max-width: 100%;
    background: none;
    border: 0;
    color: var(--warn);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
  }
  .ow-row-duplicate:hover { text-decoration: underline; }
  .ow-row-goals {
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12.5px;
    color: var(--text);
  }
  .ow-row-goals li { position: relative; padding-left: 12px; }
  .ow-row-goals li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 7px;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
  }
  .ow-row-goal-done { display: flex; align-items: center; gap: 6px; color: var(--muted); }
  .ow-row-goal-done .ow-icon { flex: none; color: var(--ok); width: 13px; height: 13px; }
  .ow-row-goals-more { color: var(--muted); }
  .ow-row-why {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .ow-row-why::before {
    content: '';
    flex: 0 0 auto;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
    transform: translateY(-3px);
    opacity: 0.7;
  }
  .ow-rank-why { margin: 8px 0 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
  .ow-next-steps { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .ow-next-step-list { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 0; padding-left: 18px; }
  .ow-next-step-list li { color: var(--text); font-size: 13px; line-height: 1.45; }
  .ow-next-step-what { display: block; font-weight: 550; }
  .ow-next-step-why { display: block; color: var(--muted); font-size: 12px; }
  .ow-chat { display: flex; min-height: 0; flex: 1; }
  .ow-chat-loading { width: 100%; padding: 16px; }
  .ow-chat-panel { position: relative; display: flex; min-height: 0; width: 100%; flex-direction: column; padding: 8px 10px; gap: 8px; }
  .ow-chat-panel > .ow-quote,
  .ow-chat-panel > .ow-permissions,
  .ow-chat-panel > .ow-conductor-receipt,
  .ow-chat-panel > .ow-chat-error { flex: none; }
  /* The embed fills the rest and scrolls inside itself, so the banner above it
     stays put instead of being overrun by the transcript. */
  .ow-embed { display: flex; flex: 1; min-height: 0; }
  .ow-embed > * { flex: 1; min-height: 0; }
  /* The shared chat message rows carry px-4 (16px) on top of the panel's own
     side padding, which pushes the transcript further in than the title/composer.
     Cancel it inside the embed only, so the transcript lines up at the panel's
     10px edge like the header row. */
  .ow-embed .px-4 { padding-left: 0; padding-right: 0; }
  /* One visible way in, pushed to the trailing edge of the session header. */
  .ow-block-open { margin-left: auto; flex: none; }
  /* Icon-only open affordance in the PR header — replaces the redundant "Open"
     text that duplicated the leading external-link glyph. */
  .ow-icon-link { display: inline-flex; align-items: center; padding: 4px; border-radius: 6px; color: var(--muted); }
  .ow-icon-link:hover { background: var(--bg-hover); color: var(--text); }
  .ow-toolbar { display: flex; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }
  .ow-toolbar .ow-search { flex: 1 1 240px; min-width: 200px; width: auto; order: 2; }
  .ow-filters { display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; order: 1; }
  .ow-filter { justify-content: center; gap: 5px; padding: 3px 10px; font-size: 12px; }
  .ow-filter .ow-count { font-size: 11px; }
  /* Title block takes the width; the verdict and the forge link hold the right
     edge, so the pill lands in the same place on every row. */
  .ow-pr-head-row { display: flex; align-items: flex-start; gap: 8px; }
  .ow-pr-head-click { display: block; min-width: 0; flex: 1; cursor: pointer; }
  /* The row's one plain-English line: what is holding this PR up. */
  .ow-pr-status-line { margin-top: 5px; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* One line, never two. The repo is the overflow valve — a wrapped timestamp
     put a stray "ago" on its own row on most cards. */
  .ow-pr-idline {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
  }
  .ow-pr-when { flex: none; }
  .ow-pr-number { flex: none; color: var(--muted); font-size: 12px; }
  /* Which repository — the board spans several, so the row has to say. */
  .ow-pr-repo { flex: none; color: var(--text-strong); font-size: 13px; font-weight: 650; }
  .ow-pr-title-line {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    margin-top: 2px;
  }
  /* Two lines at most, then ellipsis — the title owns the full row width, so it
     is legible before it is ever cut. */
  .ow-pr-title-line .ow-block-name {
    display: -webkit-box;
    overflow: hidden;
    min-width: 0;
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .ow-focus-head {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    color: var(--text);
  }
  .ow-focus-head strong { color: var(--text-strong); }
  .ow-focus-back { margin-left: auto; flex: none; }
  .ow-formal-approval {
    flex: none;
    margin: 10px 12px 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--warn);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
  }
  .ow-formal-badge {
    display: inline-block;
    padding: 2px 10px;
    border: 1px solid var(--warn);
    border-radius: 999px;
    color: var(--warn);
    font-size: 12px;
  }
  .ow-formal-detail {
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--bg-elevated);
  }
  .ow-formal-kv { display: flex; gap: 12px; min-width: 0; padding: 2px 0; font-size: 12px; }
  .ow-formal-key { flex: none; width: 15ch; color: var(--accent); font-family: ui-monospace, monospace; }
  .ow-formal-val { min-width: 0; overflow-wrap: anywhere; color: var(--text); }
  .ow-formal-mono { font-family: ui-monospace, monospace; }
  .ow-formal-actions { display: flex; gap: 8px; margin-top: 10px; justify-content: flex-end; }
  .ow-formal-reject:hover { color: var(--danger); border-color: var(--danger); }
  .ow-trust-wrap { position: relative; display: inline-flex; }
  .ow-trust-caret { transition: transform 0.15s ease; }
  .ow-trust-caret[data-open='true'] { transform: rotate(90deg); }
  .ow-trust-menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 4px);
    z-index: 10;
    display: flex;
    flex-direction: column;
    min-width: 220px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-elevated);
    box-shadow: 0 6px 20px rgba(0,0,0,.3);
  }
  .ow-trust-item {
    border: 0;
    background: none;
    padding: 6px 10px;
    border-radius: 4px;
    color: var(--text);
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }
  .ow-trust-item:hover { background: var(--bg-hover); }
  .ow-init-chevron { flex: none; transition: transform 0.15s ease; }
  .ow-init-chevron[data-open='true'] { transform: rotate(90deg); }

  /* ── Goal cards — the dashboard-mockup anatomy ──
     A plain bordered card: a collapse chevron + the goal name + an optional Split
     + a "N need you" flag, then a one-line composition meta, then the member rows
     (each a dot + label + chevron that expands on select). */
  .ow-goalcard { position: relative; display: flex; flex-direction: column; gap: 0; padding: 12px 14px; }
  .ow-goalcard-summary { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .ow-goalcard-chevron {
    flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer;
  }
  .ow-goalcard-chevron:hover { color: var(--text); }
  .ow-goalcard-header {
    display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;
    padding: 0; background: none; border: 0; text-align: left; cursor: pointer;
  }
  .ow-goalcard-header .ow-icon { color: var(--muted); }
  .ow-goalcard-header:hover .ow-goalcard-title { text-decoration: underline; }
  /* A session card's title is a label, not a hit area — its Open button is the
     only way in, so the hover underline would promise an action it does not have. */
  .ow-goalcard-static { cursor: default; }
  .ow-goalcard-static:hover .ow-goalcard-title { text-decoration: none; }
  .ow-goalcard-header[data-selected='true'] .ow-goalcard-title { color: var(--accent); }
  /* The session name reads as a labelled chip now that the icon is gone: a
     subtle background marks "this is a session" in the icon's place, hugging the
     name (flex 0 1 auto) and still truncating a long one. */
  .ow-goalcard-title { flex: 1; min-width: 0; overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: none; }
  .ow-goalcard .ow-block-open { flex: none; margin: 0; }
  .ow-goal-flag {
    flex: none; margin-left: auto; padding: 1px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
    color: var(--muted); background: var(--bg-hover); border: 1px solid var(--border);
  }
  .ow-goal-flag-warn { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  /* The whole header is a filled band that bleeds to the card's inner edges
     (cancelling the card's 12/14 padding); the card's overflow:hidden rounds its
     top corners. Left padding lands the content at 23px, aligned with the rows. */
  .ow-goalcard-head {
    margin: -12px -14px 10px;
    padding: 10px 14px 10px 23px;
    background: var(--bg-hover);
  }
  .ow-goal-meta { margin: 4px 0 0; color: var(--muted); font-size: 11px; }
  /* --- Session card: one session = one card (status/name/turns, PRs, latest
     goal summary + first next step, everything else behind expand). --- */
  .ow-sessioncard {
    display: flex; flex-direction: column;
  }
  /* Selection tints the WHOLE goal card, not just the headline: the expanded
     section is a sibling of .ow-sessioncard, so the tint lives on the enclosing
     card container and covers both (headline + expanded). The card body itself
     is inert — quoting is the deliberate "Reference in chat" hover action, not a
     stray click, so no pointer cursor / focus ring here. */
  .ow-block[data-grouped='true']:has(.ow-sessioncard[data-selected='true']) { background: var(--aim-subtle); }
  .ow-sessioncard:hover .ow-row-aside,
  .ow-sessioncard:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  /* The hover strip belongs to the CARD, not the card's body: the body sits
     inside .ow-goalcard's 12px/14px padding, so anchoring there pushed the strip
     20px/24px in from the edges the reader sees. Anchor on the card itself so the
     offsets below are measured from the visible border. */
  .ow-sessioncard .ow-row-aside { top: 8px; right: 8px; }
  .ow-card-top { display: flex; align-items: center; gap: 8px; margin: 8px 0 0; }
  .ow-card-meta {
    margin-left: auto; display: flex; align-items: center; gap: 6px;
    min-width: 0; color: var(--muted); font-size: 12px;
  }
  .ow-card-meta > * + *::before { content: '·'; margin-right: 6px; color: var(--border); }
  .ow-card-name {
    padding: 0; border: 0; background: none; font: inherit; font-size: 12px;
    color: var(--muted); font-weight: 500; max-width: 240px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; cursor: pointer;
  }
  .ow-card-name:hover { color: var(--accent); text-decoration: underline; }
  .ow-card-metapart { white-space: nowrap; }
  .ow-card-title { margin: 0; color: var(--text-strong); font-size: 16px; font-weight: 600; line-height: 1.3; }
  .ow-card-prs { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; }
  .ow-card-pr {
    display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px;
    font-size: 12px; color: var(--text); background: var(--bg-hover);
    border: 1px solid var(--border); text-decoration: none; white-space: nowrap;
  }
  .ow-card-pr:hover { border-color: var(--border-strong); }
  .ow-card-pr-status { color: var(--muted); }
  .ow-card-pr[data-status='merged'] { color: var(--ok); background: var(--ok-subtle, rgba(52,211,153,.12)); border-color: transparent; }
  .ow-card-pr[data-status='merged'] .ow-card-pr-status { color: var(--ok); }
  .ow-card-pr[data-status='checks running'] { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
  .ow-card-pr[data-status='checks running'] .ow-card-pr-status { color: var(--accent); }
  .ow-card-pr[data-status='checks failing'], .ow-card-pr[data-status='conflict'] { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  .ow-card-pr[data-status='checks failing'] .ow-card-pr-status, .ow-card-pr[data-status='conflict'] .ow-card-pr-status { color: var(--warn); }
  .ow-card-pr[data-status='closed'] { color: var(--muted); }
  .ow-card-summary { margin: 10px 0 0; color: var(--text); font-size: 13px; line-height: 1.5; }
  /* Suggested next step: a label, then the step as one CTA (arrow + what + its
     quieter "why"). The whole button is the hit area and highlights together. */
  /* Spacing-only wrapper: the "Suggested next step" heading now uses the shared
     .ow-detail-label (a caption + trailing rule) so it matches "You asked for". */
  .ow-card-nextstep { margin-top: 12px; }
  .ow-card-step {
    display: flex; gap: 8px; align-items: flex-start; width: 100%;
    padding: 6px 8px; margin: 0 -8px; border: 0; border-radius: 6px;
    background: none; text-align: left; cursor: pointer; color: var(--text);
  }
  .ow-card-step:hover { background: var(--bg-hover); }
  .ow-card-step:hover .ow-card-step-what { color: var(--accent); }
  .ow-card-step-arrow { flex: none; margin-top: 1px; color: var(--warn); }
  .ow-card-step-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .ow-card-step-what { font-size: 13px; }
  .ow-card-step-why { color: var(--muted); font-size: 12px; font-style: italic; }
  .ow-card-expanded { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
  /* The collapse control is the card's last row; keep its hit area tight to its
     own text rather than letting the flex column stretch it full width. */
  .ow-card-collapse { align-self: flex-start; margin-top: 2px; }
  /* Up-chevron: the host's icon stub has no ChevronUp, so turn the right one. */
  .ow-card-collapse .ow-icon { transform: rotate(-90deg); }
  /* A clear section break: the session's OTHER items are distinct from the
     headline goal's own detail above, so give the group a rule + real space. */
  .ow-card-morelabel {
    margin: 20px 0 4px; padding-top: 16px; border-top: 1px solid var(--border-strong, var(--border));
    color: var(--muted-strong, var(--muted)); font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .04em;
  }
  /* One of the session's other items, in the expand — same treatment as the
     headline (status, title, its own next-step CTA, hover actions). */
  .ow-moreitem {
    position: relative; display: flex; flex-direction: column; gap: 6px;
    padding-top: 8px; border-top: 1px solid var(--border);
  }
  /* The first item sits directly under the section label's rule — don't draw a
     second line right beneath it. */
  .ow-card-morelabel + .ow-moreitem { border-top: 0; padding-top: 4px; }
  .ow-moreitem:hover .ow-row-aside,
  .ow-moreitem:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  .ow-moreitem-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .ow-moreitem-title { min-width: 0; color: var(--text-strong); font-size: 13px; font-weight: 600; }
  .ow-moreitem-summary { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
  /* A more-item's own expanded detail (rest of its steps + ask/progress). */
  .ow-moreitem-detail { display: flex; flex-direction: column; gap: 8px; padding: 2px 0 6px; }
  /* PR/issue links share the line and the muted look of the rest of the meta;
     a dot separates each piece the way the text parts are joined. */
  .ow-goal-meta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .ow-goal-meta-row > * + *::before { content: '·'; margin-right: 6px; color: var(--border); }
  .ow-goal-meta-row .ow-reference { color: var(--muted); font-size: 11px; }
  .ow-goal-meta-row .ow-reference .ow-icon { width: 12px; height: 12px; }
  .ow-goal-meta-row .ow-reference-link:hover { color: var(--text); text-decoration: underline; }
  /* Why the merge happened. Subdued below the meta: it answers a question the
     user only asks when the grouping looks wrong, so it must not compete with
     the goal's own name or its composition. */
  /* Member rows: content aligns with the header title's text (the icon that
     used to force a 26px indent is gone); the state rail sits in the gutter. */
  .ow-goalcard .ow-row { padding: 7px 4px 7px 9px; }
  .ow-goalcard .ow-row + .ow-row { border-top: 1px solid var(--border); }
  .ow-goalcard .ow-row-title { color: var(--text); font-weight: 500; }
  .ow-goalcard .ow-row[data-selected='true'] .ow-row-title { color: var(--text-strong); font-weight: 700; }
  .ow-quote-docked .ow-eyebrow { flex: none; white-space: nowrap; }
  /* Looks like the eyebrow but reads as a control: accent colour + pointer signal
     the destination is switchable. Text carries the active target. */
  .ow-scope-toggle {
    flex: none; white-space: nowrap;
    padding: 0; border: 0; background: none;
    color: var(--accent); font-family: inherit; font-size: 12px; font-weight: 550;
    cursor: pointer;
  }
  .ow-scope-toggle:hover { text-decoration: underline; }
  .ow-srow { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-top: 1px solid var(--border); cursor: pointer; }
  .ow-srow[data-selected='true'] { background: var(--aim-subtle); }
  .ow-srow-body { min-width: 0; flex: 1; }
  .ow-srow-name { color: var(--text-strong); font-weight: 600; }
  .ow-srow-state { margin-top: 2px; color: var(--muted); font-size: 12px; }
  .ow-srow-badge { flex: none; }
  .ow-srow-open { flex: none; }
  .ow-pr-status { color: var(--muted); }
  .ow-pr-status[data-bad='true'] { color: var(--danger); }


  /* The decision inside a list row: flush to the row's own padding. */
  .ow-row .ow-permission { margin: 10px 0 2px; }

  @keyframes ow-expand { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
  .ow-expand { display: grid; animation: ow-expand 160ms ease; }
  .ow-expand-inner { min-height: 0; overflow: hidden; }
  .ow-steps-more { padding: 2px 0; border: 0; background: none; color: var(--muted); font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
  .ow-steps-more:hover { color: var(--text); text-decoration: underline; }
  /*
   * The expanded card's three sections. One rule per section, drawn as part of
   * the LABEL rather than as a separate element, so a section that has no data
   * takes its rule with it when it is not rendered — no stray hairline over a
   * gap.
   */
  .ow-row-detail { display: flex; flex-direction: column; gap: 12px; margin: 12px 0 2px; }
  .ow-detail { display: flex; flex-direction: column; gap: 6px; }
  .ow-detail-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ow-detail-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  /* Indented with a left border: the visual grammar of a quotation, because this
     is the user's own sentence reproduced rather than the app's account of it. */
  .ow-detail-quote {
    margin: 0;
    padding: 2px 0 2px 10px;
    border-left: 2px solid var(--border-strong, var(--border));
    color: var(--text);
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .ow-detail-facts {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text);
    font-size: 13px;
    line-height: 1.45;
  }
  .ow-detail-facts li { position: relative; padding-left: 12px; overflow-wrap: anywhere; }
  .ow-detail-facts li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 8px;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
  }
  /* Each suggestion is one clickable block of three tiers. The accent edge marks
     it as the actionable part of the card — the only thing here that does
     something when clicked. Two classes deep on purpose: .ow-quote-step sets the
     border SHORTHAND further down this sheet, which at equal specificity would
     win on source order and flatten this edge back to a plain hairline. */
  .ow-quote-step.ow-detail-step {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    border-left: 2px solid var(--accent);
    border-radius: 0 8px 8px 0;
  }
  .ow-detail-step-what { color: var(--text); font-size: 13px; font-weight: 400; line-height: 1.45; }
  .ow-detail-step-why { color: var(--muted); font-size: 12px; line-height: 1.45; }
  .ow-detail-step-expect { color: var(--muted); font-size: 12px; font-style: italic; line-height: 1.45; opacity: 0.8; }
  /* Reveal-on-hover, top-right. Hidden and non-interactive at rest so the card
     is clean; shown on hover OR keyboard focus so it is not mouse-only. Floated
     over the corner (not in flow) so appearing shifts no layout. A backing panel
     keeps the labels legible over whatever text sits behind them. */
  /* Management CTAs (Later / Handled) float top-right and appear on hover/focus
     only, so the resting row stays clean. */
  .ow-row-aside {
    position: absolute; top: 8px; right: 10px; z-index: 1;
    display: flex; gap: 2px; padding: 2px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--card);
    opacity: 0; pointer-events: none; transition: opacity 120ms ease;
  }
  .ow-row:hover .ow-row-aside,
  .ow-row:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  .ow-aside-btn {
    padding: 2px 8px; border: 0; background: none; border-radius: 6px;
    color: var(--muted); font: inherit; font-size: 12px; cursor: pointer;
  }
  .ow-aside-btn:hover { background: var(--bg-hover); color: var(--text); }
  /* The primary aside action: quote this goal to the Conductor. */
  .ow-aside-btn--ref { color: var(--accent); font-weight: 600; }
  .ow-aside-btn--ref:hover { background: var(--accent-subtle, var(--bg-hover)); color: var(--accent); }
  .ow-section-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; cursor: pointer; }
  .ow-section-chevron { transition: transform 120ms ease; }
  .ow-section-chevron[data-open='true'] { transform: rotate(90deg); }
  .ow-aside-note {
    margin-top: 6px; padding: 0; border: 0; background: none;
    color: var(--muted); font: inherit; font-size: 12px; cursor: pointer; text-align: left;
  }
  .ow-aside-note:hover { color: var(--text); text-decoration: underline; }
  .ow-retry { margin: 10px 0 2px; }

  .ow-permissions { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px 0; }
  .ow-permission {
    display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border));
    border-radius: var(--radius-lg, 8px);
    background: color-mix(in srgb, var(--accent) 8%, var(--card));
  }
  .ow-permission-body { min-width: 0; flex: 1; }
  .ow-permission-head { display: flex; align-items: center; gap: 6px; }
  .ow-permission-title { color: var(--text-strong); font-size: 13px; font-weight: 650; }
  .ow-permission-what { margin: 4px 0 0; color: var(--text); font-size: 13px; }
  .ow-permission-what code { padding: 1px 4px; border-radius: 4px; background: var(--bg-hover); font-size: 12px; }
  .ow-permission-why { margin: 4px 0 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  .ow-permission-actions { display: flex; flex: none; gap: 6px; }

  .ow-quote {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 10px; border-left: 3px solid var(--accent);
    border-radius: 0 var(--radius-lg, 8px) var(--radius-lg, 8px) 0;
    background: color-mix(in srgb, var(--text) 5%, var(--card));
  }
  /* One line: eyebrow, gap, title. The spans previously abutted ("InstructingCrew…"). */
  .ow-quote-body { display: flex; min-width: 0; flex: 1; align-items: baseline; gap: 8px; }
  /* Rendered in ChatEmbed's aboveComposer slot: normal flow directly above the
     composer, so there is no absolute offset to keep in sync with its height. */
  .ow-quote-docked { margin: 0 0 6px; }
  .ow-quote-title { overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
  /* Full text, wrapped. These are sentences the user is deciding whether to
     SEND — a suggestion cut to "Implement the receipt + scope chip in the Cond…"
     cannot be judged. Rounded rectangle instead of a pill because a wrapped
     two-line pill reads as a blob. */
  .ow-quote-step {
    max-width: 100%; padding: 4px 10px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--card);
    color: var(--text); font-size: 12px; line-height: 1.45; text-align: left;
    white-space: normal; cursor: pointer;
  }
  .ow-quote-step:hover { border-color: var(--accent); color: var(--text-strong); }
    border: 0; background: none; padding: 0; color: var(--muted);
    font: inherit; cursor: pointer;
  }
  .ow-quote-clear { flex: none; }

  .ow-chat-composer { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--border); }
  .ow-chat-composer > :first-child { min-width: 0; flex: 1; }
  .ow-chat-error { padding: 0 12px 10px; color: var(--danger); font-size: 12px; }
  .ow-conductor-receipt { display: flex; align-items: center; gap: 8px; padding: 0 12px 10px; color: var(--ok); font-size: 12px; }
  @media (max-width: 1100px) {
    /* Rows must size to content, not split the viewport height: .ow-main has no
       overflow of its own, so a stretched row let its panels paint over the
       Conductor row below. The whole stack scrolls in .ow-layout instead. */
    .ow-layout {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: min-content min-content;
      align-content: start;
      overflow-y: auto;
    }
    .ow-main { grid-template-columns: minmax(0, 1fr); }
    /* One column, four panels in DOM order. Same specificity as the placement
       rules above and later in the sheet, so these win without !important. */
    .ow-main[data-open-row] { grid-template-rows: auto; grid-auto-rows: min-content; }
    .ow-main > .ow-stack-card[data-primary] { grid-column: 1; grid-row: auto; }
    .ow-main > .ow-stack-card[data-primary='true'] { min-height: 70vh; }
    .ow-main > .ow-stack-card[data-rail-index] { grid-column: 1; grid-row: auto; }
    /* No side-by-side columns to divide once everything stacks. */
    .ow-resizer { display: none; }
    .ow-conductor { min-height: 560px; margin: 0 16px 16px; }
    /* The left rail folds back into a horizontal filter row above the list. */
    .ow-worksplit { flex-direction: column; }
    .ow-railnav {
      flex-direction: row; flex-wrap: wrap; width: auto; overflow: visible;
      border-right: 0; border-bottom: 1px solid var(--border); padding: 0 14px 10px;
    }
    .ow-railnav .ow-railitem { width: auto; }
  }
`
