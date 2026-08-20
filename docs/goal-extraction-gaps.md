# Goal extraction — method validation and gap analysis

Assessment of the supplied *Goal Extraction & Session Grouping* method against the
code that would implement it. Two codebases are in scope: this app at version
0.4.13, and the Kiro Crew platform that supplies the intent-based session summary
the method is built on.

Sibling to `docs/audit.md`, and written in the same register: every claim names the
code it rests on. Platform paths are relative to the Kiro Crew source root
(`src/kiro_crew/`); unqualified paths are this repo. **Citations name a symbol
wherever one exists** — line numbers are given for orientation and were correct at
`9c6b963`, but the symbol is the durable reference.

Verdicts on the method's own gap list:

| | Meaning |
|---|---|
| **CONFIRMED** | Real, and as described |
| **OVERSTATED** | Partly real; the gap needs restating before it is scoped |
| **NOT A GAP** | Disproved against code |
| **UNLISTED** | A real gap the method does not name |

---

## 1. What the method gets right

The central claim holds: this is a precedence problem, not a clustering problem.
Three parts are not merely sound but **already built**, which the method appears not
to know.

**Intents are already the unit of assignment.** `normalizeWorkItems` emits one
`WorkItem` per `SummaryIntent` and falls back to a session-level item only when a
session yields zero intents (`src/model.ts:1737`, the `intentItems.length > 0`
branch). §2 does not need implementing.

**Refusal below a confidence floor already exists** at 0.7
(`SEMANTIC_CONFIDENCE_FLOOR`, `src/index.tsx:220`, enforced `:2808`), and the goal
pass is already framed as assignment rather than free-form clustering: the model
sees existing clusters as immutable and may only place a leftover, propose a new
group, or leave it solo (`backend/goalpass.py`, TASK 2 of `build_prompt`). §4's
warning is already respected.

**§2.2's separation of "Unblock" from the summary is correct.** `derive_state`
produces exactly four values and knows nothing about blockers or approvals
(platform `session_summary.py:302-317`). Reading live runtime state for those is the
right call, and having one derivation shared by both surfaces is why they cannot
disagree. Do not add a second.

---

## 2. The supplied gap list, re-assessed

| Gap | Verdict | Finding |
|---|---|---|
| 1 — No stable intent identity | **CONFIRMED** | No `id` is requested, generated, or persisted. Regeneration replaces the array whole (`atomic_write` in `set_cached_intent_summary`, platform `history.py:2153`), after sorting descending by `last_touched_turn` and trimming the tail (`normalize_payload`, `session_summary.py:552-556`). Position is not identity. |
| 2 — No repo / project field | **OVERSTATED** | The session record carries `project`, and the slot payload already exposes `project`, `source_links`, `tags`, `forked_from`, `linked_session_key` (platform `dashboard/state.py:2799-2855`). This app already consumes `project` and `source_links`. What is genuinely absent is a **product descriptor for naming** (repo description / README first paragraph). Restate the gap as that. |
| 3 — No structured artifact references | **CONFIRMED** for intents | Session-level links are extracted mechanically already, but nothing is per-intent. This app compensates with a regex — `mentionsSource`, `/#\s?<n>\b/u` (`src/model.ts:887`) — so an intent naming a PR by branch or full URL produces no edge. |
| 4 — No cross-session provenance | **OVERSTATED** | Captured almost everywhere: loops carry `slot_key` (platform `NudgeLoop`, `autonudge.py:269`, serialized via `asdict`), artifacts carry `session_key` plus a per-event `session_id` (`artifacts.py:438`, `:3108`), crons carry `session_key` — *"session that created this job"* (`cron.py:273`) — subagent runs carry `parent_session_key` (`SubagentInfo`, `subagent.py:1077`), sessions carry `forked_from`. Only **PR→session** is genuinely uncaptured. Two of these are consumption gaps, not capture gaps: see §3. |
| 5 — Coverage holes (dashboard-only) | **NOT A GAP** as written | There is no surface gate. `_should_summarize` checks only enabled / in-flight / incognito / running / clean `end_turn` / min turns / cadence (platform `dashboard/chat_summary.py:136-203`). Slack threads, the task runner, workflow auto-turns and the OpenAI-compat endpoint all summarize. Only cron does not, mechanically: its result is appended into a slot, never run through the turn loop. **Kiro Crew's own `docs/system-specs/modules/session-summary.md` asserts the opposite and calls it "a deliberate cut, not an oversight" — that doc is wrong, and is the likely origin of this gap.** The real coverage problem is different: see §3. |
| 6 — No enumeration endpoint | **CONFIRMED** | Exactly two routes, both per-session (platform `dashboard/chat_handlers.py:907`, `:1018`); the POST docstring states *"there is no batch form: one request summarizes one session."* `POST /api/sessions/summarize` is a different artifact (one-line summaries, `.summaries/` sidecar, MCP-only, capped at 8 keys) and is not a substitute. |
| 7 — Clamping and staleness invisible | **CONFIRMED (truncation) / NOT A GAP (staleness)** | No `truncated` flag is emitted; trimming past `max_intents = 8` is silent. Staleness is already solved: computed at read time by `read_intent_summary` and returned as a top-level `stale` boolean, and this app already reads it (`WorkItem.stale`). |
| 8 — No user-declared goal field | **CONFIRMED**, but cheap | Sessions already carry `tags` end to end, so a reserved `goal:` tag convention needs no schema change and no migration. |
| 9 — Redaction may strip identifiers | **NOT A GAP** | A plain PR URL survives byte-identical. `_exfil_url_warning` returns early for any URL without a query string (platform `security.py:7278`), and the credential patterns need a 40-char base64-like run where a PR path offers 22. Only long query-bearing URLs (search, compare, a token param ≥200 chars) are rewritten. |

---

## 3. Gaps the method does not name

These outrank most of §2 and are where grouping accuracy is actually being lost.

**UNLISTED-A — No coherence check, no size cap, unlimited transitivity.** Every
signal feeds one union-find with no post-validation, no density requirement and no
member bound (`clusterByGoal`, `src/model.ts:2171`). A single 0.7-confidence model
pair can bridge two otherwise unrelated hard clusters. §8's "past roughly a dozen
members it has become an area" is stated in the method but unenforced in code. This
is the largest single source of wrong grouping.

**UNLISTED-B — A split pin does not survive transitivity.** The `verdicts.split`
check inside `clusterByGoal` skips one pair; a later third item re-bridges the two
halves. The correction mechanism §6 calls load-bearing silently undoes itself.

**UNLISTED-C — `same_deliverable` is filed as a fact.**
`HARD_GOAL_MATCHES = ['same_change', 'same_artifact', 'same_deliverable']`
(`src/model.ts:2160`) puts a capitalized-word-run coincidence read off *titles* on
equal footing with a shared PR URL. The method's own ladder ranks deliverable name
as signal 3 — an inference. The code contradicts it.

**UNLISTED-D — The largest gain the method identifies is not implemented.** §3
signal 4 says judging over `initial_intent` rather than titles is "the largest
accuracy gain available, and it comes free from the summary." The goal pass receives
`{id, title}` for grouped items and one derived 200-char line for leftovers (the
request builder's `detail: block.items[0].summary`, `src/index.tsx:2769`). The
stated-intent paragraph is already in the payload and is discarded before the model
sees it.

**UNLISTED-E — Monitoring-loop sessions never produce intents.**
`count_user_turns` counts only non-injected user turns (platform
`session_summary.py:176-178`, injected prefixes at `:40`), excluding auto-nudge
cycles, subagent completions, cron notices and restored webhook context — and
`too_few_turns` holds even under a forced pass. A babysat PR or an autonomous goal
loop can run for days and never cross `min_user_turns = 2`, so it yields no intent
structure at all and collapses to one coarse session item. This is aimed precisely
at the longest-running goal work, and no amount of work in this app compensates for
it.

**UNLISTED-F — `source_links` is truncated before this app sees it.** Budgeted to 3
per kind per serialization (platform `_budgeted_source_links`,
`dashboard/state.py:866-869`), so a genuine shared-PR edge — the strongest signal
the whole ladder rests on — can be silently absent. `source_links_total` reports the
truncation and an unbudgeted expand endpoint exists
(`dashboard/chat_handlers.py:723`); this app calls neither.

**UNLISTED-G — Subagent provenance is available and ignored.** The spawn listing
serializes `parent` from `SubagentInfo.parent_session_key` (platform
`dashboard/handlers/messaging.py:574`). This app mints agent items as orphans with
`action: 'discuss'` and no `parentId` (the agent-row branch of `normalizeWorkItems`,
`src/model.ts:1850`), discarding a rank-1 signal that loops and artifacts already
use.

**UNLISTED-H — Confidence is discarded, so §9 cannot be measured.** It is used once
as a filter and thrown away (`src/index.tsx:2808`); the persisted pass holds only
`{pairs, why, stamp}`. None of the method's metrics — correction rate, rename rate,
ungrouped share, churn — can be computed today.

**UNLISTED-I — `explainGoal` can name a reason that was not the cause.** It calls
`sameGoal` without the ambient set and reports the strongest edge across all pairs
rather than the edge that joined the component. §4 says the reason is a product
surface; today it can be wrong on screen.

**UNLISTED-J — Two hard coverage caps.** `SUMMARY_SESSION_LIMIT = 12`
(`src/summaries.ts:4`) and `MAX_INTENTS_PER_SESSION = 3` (`src/model.ts:868`) bound
the board at roughly 36 intents regardless of what the platform produced.

---

## 4. Required changes in Kiro Crew

Ranked. Items 1-3 improve the panel as well as this app; the rest are primarily for
this app.

**1. Stable intent ids.** Not a field addition. Regeneration must become a
reconciliation against the prior payload — match on `origin_turn` plus earliest
range start, carry the id forward, mint only for genuinely new intents.
*Panel:* card identity stops depending on array position, so per-intent state
(expanded, acknowledged, renamed) and change history ("this became needs-you three
turns ago") become possible at all.
*This app:* `intent_id → goal_id` gains a stable left-hand side — the precondition
for every pin in §6 of the method.
*Cost to flag:* the sidecar exists in its own file specifically to avoid a
read-modify-write race (platform `history.py:2085-2093` says so). A merge
reintroduces it, and the mtime-signature guard must cover the read side.
*Risk to flag:* the reconciliation key is model-authored on both halves; a
re-decided `origin_turn` mints a duplicate. Needs a title-similarity fallback and id
churn tracked as a metric.

**2. Count injected turns toward `min_user_turns`**, or lift `too_few_turns` under a
forced pass. Closes UNLISTED-E.
*Panel:* babysat PRs and long CI watches stop showing an empty panel.
*This app:* the longest-running goals stop arriving without structure.

**3. `artifacts: [{kind, ref}]` per intent, extracted mechanically.** The scraper
that produces `source_links` already exists; run it over each intent's turn ranges.
*Panel:* progress lines gain real PR / branch / commit references instead of prose.
*This app:* converts the ladder's strongest signal from a regex guess into a lookup,
replacing `mentionsSource`.

**4. A reserved `goal:` session tag.** Cheapest high-value item on the list — a
convention over existing `tags`, no schema change. Gives §7 its declared branch, the
one path that is never wrong.

**5. `truncated: true` plus a dropped count** when intents exceed `max_intents`.
*Panel:* "8 of 14 intents" is honest; today a long session silently loses its oldest
goals while implying completeness.
*This app:* a goal anchored on a trimmed intent can be marked incomplete rather than
quietly shedding members.

**6. A read-only enumeration endpoint** returning `{key, sig, stale, generated_at,
user_turns, truncated}`, filterable by activity. Read path only — it does not weaken
the no-batch-*generation* stance. Must carry the same ownership scoping as the
per-session GET, which 404s (not 403s) for a slot the calling app does not own
(platform `dashboard/chat_handlers.py:928-942`).

**7. A cached per-repo descriptor.** The only thing that can supply §5's product
noun. `project` itself is already available.

**8. If summaries are enabled broadly, raise `regenerate_after_turns` from 1.** One
model pass per changed turn is the cost driver. Default-off is the real ceiling on
everything downstream, and lifting it is a product decision rather than code.

---

## 5. Required changes in Crew Manager

### Independent — no platform change needed

1. **Add a coherence check and a size cap to `clusterByGoal`.** Simplest effective
   form: cap transitive chains through soft or model edges at depth 1, so a 0.7 pair
   cannot bridge two hard clusters; cap membership near a dozen and split along
   provenance trees past that. Closes UNLISTED-A.
2. **Demote or gate `same_deliverable`.** Keep it hard only when the phrase appears
   in both members' `initial_intent` and is absent from a **board-wide** ambient set.
   Ambient is currently computed per bucket with a 4-item floor
   (`AMBIENT_MIN_ITEMS`), so identical titles cluster differently depending on which
   bucket they land in. Closes UNLISTED-C.
3. **Send `initial_intent` to the goal pass** and change the prompt to judge over
   the stated outcome rather than member titles. Closes UNLISTED-D.
4. **Wire `parent` → `parentId` for subagent runs**, as loops and artifacts already
   do (`src/model.ts:1937`, `:1972`). Closes UNLISTED-G.
5. **Read `source_links_total` and expand when it exceeds the budget.** Closes
   UNLISTED-F.
6. **Add a rename pin and a move-item pin.** Only split and merge exist today, both
   pair-scoped. Naming is judged separately from grouping in §9, and there is
   currently no way to fix a name at all; move-item is what makes a misfiled blocker
   recoverable.
7. **Make split a persistent negative constraint** on the component, re-applied
   after every stage. Closes UNLISTED-B.
8. **Persist signal and confidence per assignment, and instrument §9's metrics.**
   Closes UNLISTED-H. Without it, round two is guesswork.
9. **Fix `explainGoal`** to report the edge that joined the component, and pass it
   the ambient set. Closes UNLISTED-I.

### Dependent — needs the platform changes first

10. **Re-key pins to stable intent ids.** `goalIdentity()` is
    `sessionKey|titleWords` (`src/model.ts:1367`): it drops every pin, semantic pair
    and reason for an item whose title changes, collides for two same-titled intents
    in one session, and is never garbage-collected.
11. **Consume per-intent `artifacts`** in place of the `#n` regex.
12. **Raise `MAX_INTENTS_PER_SESSION` and `SUMMARY_SESSION_LIMIT`** once enumeration
    exists. Closes UNLISTED-J.

### Hygiene, unrelated to accuracy

Dead surfaces with no caller: `GET /pr-checks` (and all of `backend/prchecks.py`,
superseded by `POST /api/source/pull-request`), `GET /recall` and `src/recall.ts`
(absent from the built bundle), `POST /sweep`, `POST /settings`,
`POST /initiatives/remove`. Also `hasNextStep` (`src/model.ts:855`), defined and
never referenced.

---

## 6. Sequencing

1. **Crew Manager §5 items 1-3.** Largest accuracy gain, no platform coordination,
   independently shippable. Items 1-2 stop wrong groupings; item 3 improves right
   ones.
2. **In parallel, the two cheap platform wins** — counting injected turns, and the
   `goal:` tag convention. Neither needs a schema change, and the first closes a hole
   this app cannot compensate for.
3. **Then stable intent ids**, since everything in §6 of the method is gated on it
   and it is the largest piece of platform work.
4. **Instrument before round two.** Grouping is easy to eyeball and hard to
   evaluate.

A minimal scope exists for stable ids that is worth separating: assign and carry
ids while every intent's *content* still fully regenerates. The panel behaves
exactly as today, this app gains a pinnable identity, and the freeze question below
stays open.

---

## 7. Open decisions

Not derivable from code — these need a product ruling.

**Whether closed intents freeze.** Carrying a closed intent forward verbatim
preserves what the model got right and what it got wrong. The defensible line is to
freeze only `completed` / `abandoned` intents and keep `active` ones fully
regenerated: an active intent is still moving, a closed one is history and should not
be rewritten by a model with less context than the moment it happened in.

**Whether an item may belong to two goals.** §8 is right that retrofitting
multi-membership touches the data model, identity logic and display. Settle it
before the pin work, not after.

**Whether session summaries are enabled by default.** The method's own §9 names
summary coverage as the bound on the quality ceiling of everything else. Today the
feature is off by default, which caps the whole pipeline regardless of how good the
grouping gets.
