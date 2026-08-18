# Crew Manager — line-by-line audit against `docs/spec.md`

App version 0.4.0. Every row quotes the spec, then names the code and the evidence.
Judgements are one of four, and the fourth is kept separate on purpose: it will not
turn green by working harder.

| | Meaning |
|---|---|
| **MET** | Built, and verified by a test or an observed run |
| **PARTIAL** | Built, but a named clause of the requirement is not satisfied |
| **NOT BUILT** | No implementation |
| **BLOCKED BY PLATFORM** | Cannot be satisfied as written without a change outside this app |

A fifth state is tracked in the Evidence column rather than the verdict: **built but
the live path never exercised**. Offline tests are not a substitute for the thing
having run once.

---

## R1 — Order what needs the developer

> Everything waiting on a person appears in one list whose position is derived from
> the current state of the fleet rather than assigned when a session parked. A block
> only a person can clear, with other work queued behind it, outranks a session that
> has gone quiet, and within any group the longest-stalled comes first. Every item
> can state in one sentence why it is where it is, and the order updates as
> circumstances change rather than as new events arrive.

| Clause | Verdict | Where | Evidence |
|---|---|---|---|
| one list for everything waiting on a person | MET | `src/model.ts` — `needs-you` is the single action queue; an issue is one signal inside it, not a parallel category | `test/model.test.ts` "actionable issues" |
| position derived from current fleet state, not assigned at park time | MET | `rankWorkItem()` recomputes from the live item on every poll; nothing is stored at park time | ordering tests |
| "only a person can clear" outranks "gone quiet" | MET | `SIGNAL_WEIGHT`: `approval_owed` 100, `subagent_gate` 95, `input_requested` 80 vs `stalled` 50 | weight test pins the ceiling |
| **"with other work queued behind it"** | **BLOCKED BY PLATFORM** | approximated by `queued_behind` from `slot.queue_depth` | The platform does not model cross-session dependency. All three candidates checked: `queue_depth` counts prompts queued behind the active turn **within one session**; a subagent's `parent` is one-level parent-waits-for-child; a workflow's `session_key` is ownership, not dependency. The spec's flagship example ("a second session is blocked behind it") is not representable. Copy says "N more prompt(s) queued in this session" and must not claim otherwise. |
| within any group, longest-stalled first | MET | `TIME_DIRECTION['needs-you'] = 1` (oldest first) as the tiebreak under score | ordering tests; `compareByTime` treats `updatedAt === 0` as unknown, not ancient |
| every item states in one sentence why it is where it is | MET | `explainRank()` names the top two signals; rendered on the card in Needs you (`.ow-row-why`) and in the detail pane | "explains rank only where order is scored" |
| order updates as circumstances change, not as events arrive | MET | derived on each render from current state; no event log drives position | — |

**Net: PARTIAL** — one clause is not representable in the platform.

---

## R2 — Explain why work stopped

> Each stalled item carries a short reason, so a developer decides from the list
> instead of opening a session to find out what is being asked. A reason is written
> once per stall rather than repeated while the session stays stuck.

| Clause | Verdict | Where | Evidence |
|---|---|---|---|
| a model-written reason is generated per stall | Built, **live path never exercised** | `backend/detect.py` `build_reason_prompt` / `clean_reason`; `backend/watcher.py` `_explain` via the platform's `run_bg_oneliner` | 11 offline checks; the model call has never executed (needs a real stall) |
| written once per stall, not repeated | MET | `_reasons` write-once cache, cleared when the session recovers so a NEW stall gets a new reason | — |
| private sessions are never explained | MET (beyond spec) | `_explain` skips `private` findings — an incognito transcript must not be sent to a model to be described | — |
| **the reason reaches the LIST, so the decision happens there** | MET | `src/types.ts` `StallFinding.reason`; `src/model.ts` picks `stalled_because` over `stalled_for` when a reason exists | "puts the model-written stall reason on the card, not just in the bell" + a fallback test for when no reason was generated |

**Net: MET as designed; the generated reason has still never been produced by a real
model call** (that needs a live stall). The card path is tested and shipped.

---

## R3 — Answer what everything is doing

> Alongside the list, the same view covers work that is healthy and needs nothing,
> with what each session is working on, the issue behind it, whether its checks are
> passing, and a way into the session. A session with no linked issue or no checks
> appears without those fields rather than with blanks.

| Clause | Verdict | Where | Evidence |
|---|---|---|---|
| healthy work appears alongside the queue | MET | `In progress` and `Done recently` sections | — |
| what each session is working on | MET | intent title + next step from `session_summary`; `Running` claimed only for the one goal an executing session touched last | "never lets two goals both claim to be running" |
| **the issue behind it** | MET | `SourceLink.kind` is now declared; an issue becomes a `WorkReferenceKind` of its own, labelled `issue #42` with a distinct icon, and `sessionIssue` reads a failing check only off a change | "tells an issue apart from a change" + "does not read a failing check off an issue" |
| whether its checks are passing | MET | `ci` / `mergeable` drive `changeBlocked`, and a failing check moves the item into Needs you | "sends a failing linked change to Needs you" |
| a way into the session | MET | `Open` / `Resume`, plus clickable session and change chips | — |
| missing fields are absent, not blank | MET | refs are conditionally rendered; no placeholder rows | — |

**Net: MET**

---

## R4 — Know whether the work has been done

> Before new work starts, and on request, the Manager says whether comparable work
> has happened, naming the earlier session, when it ran, and what came of it. Recall
> is advice and never a gate. Duplicates among sessions running right now are caught
> as well as ones in history.

| Clause | Verdict | Where | Evidence |
|---|---|---|---|
| on request | MET | `backend/recall.py` + `GET /recall`; `From past work` section, search-only | Ran against the real transcript store: two queries, 4 hits each, snippets centred on the term. HTTP route itself unverified (see Verification gap). |
| names the earlier session | MET | title + clickable session | — |
| when it ran | MET | `describeAge` — "3 weeks ago", the vagueness a person actually remembers | seconds/milliseconds both handled |
| **what came of it** | **PARTIAL** | a transcript snippet, not a conclusion | A snippet says the session mentioned this; it does not say what the session concluded. The spec's own example ("concluded the flake came from a shared fixture") is an outcome, not a quote. |
| **before new work starts** | **NOT BUILT** | — | nothing runs at session start |
| advice, never a gate | MET | a list section with an Open action; nothing blocks | — |
| **duplicates among sessions running right now** | MET | `markDuplicates` in `src/model.ts`, run last in `normalizeWorkItems` so it sees every item's final links, title and state; surfaced as a clickable line on the card (`.ow-row-duplicate`) | 5 tests. Two signals of unequal strength: the same linked change or issue in two different sessions is a **fact**; matching titles is a heuristic, gated to distinctive words only, measured against the shorter title, 60% floor. The NEWER item is marked and points back at the older, because advice reaching the session that started first arrives too late to matter. It changes neither state nor order — recall is advice, never a gate. |

**Net: PARTIAL** — on request works against real data, and live duplicates are
caught. Two clauses remain: nothing runs before new work starts, and "what came of
it" is still a quote rather than an outcome.

Security invariants copied from the platform's own search path rather than
reinvented, each pinned by a check against a fake log: private sessions never
surface (and their transcripts are never even read), workspace scoping is
fail-closed, deleted files produce no ghost rows, the full ranked set is filtered so
heavy drops cannot starve a query, and output is redacted.

---

## R5 — Be something you can ask

> Asking what needs attention, what is in flight, or whether this has been solved
> before is a conversation with its own history rather than a query box, and it
> answers from the same understanding the list is built on so the two cannot
> disagree.

| Clause | Verdict | Where | Evidence |
|---|---|---|---|
| a conversation with its own history | MET | the Conductor panel is a real session (`crew-manager-conductor`), so it persists | — |
| **answers from the same understanding the list is built on** | MET | `fleetBriefing` in `src/model.ts`; `contextMessage` opens with it whether or not an item is selected | Agreement is not a carefully written summary — that would be a second version, free to drift. The briefing calls the SAME functions the list calls: `sortWorkItems` for the order, `explainRank` for the reason. One derivation, so there is nothing to disagree with. The test compares the briefing's order array against the list's, not the wording. Capped at `BRIEFING_LIMIT = 5` with "…and N more waiting" so the context stays a briefing. |

**Net: MET**

---

## R6 — Reach the developer where they already are

> An item that needs a person arrives through the channels the developer has already
> connected, carrying its reason and the action to take. Nothing is sent to a place
> they have not configured.

| Clause | Verdict | Where | Evidence |
|---|---|---|---|
| arrives through connected channels | **NOT BUILT** | dashboard bell only (`notification_bus`) | — |
| carrying its reason and the action | PARTIAL | the bell note carries a reason and a deep link, but no inline action | — |
| nothing sent to unconfigured places | MET | trivially — only the bell is used | — |

**The spec is factually wrong here, and it changes the cost of this requirement.**
`docs/spec.md` states "the notification bridge fans out to Slack, Discord, Telegram,
Webex, and WeCom". It does not. The bus's delivery sink is
`DashboardState._deliver_note`, which logs, counts, broadcasts over SSE, and persists
to JSONL — there is no outbound channel in it. That is why the built-in
`ops_mission_control` app ships its own `slack_out.py`.

There is a supported route: the gateway's Slack client hangs off state
(`getattr(state, "slack_client", None)`), so an app can send without holding any
credential of its own. So the requirement is buildable — it is just app work, not
free.

**Net: NOT BUILT**

---

## R7 — Keep work moving without taking authority

> Where a session has stalled on a missing fact rather than a missing decision, the
> Manager supplies the fact and the work continues. Approvals, permissions, anything
> irreversible, and any question about what the developer actually wants go to the
> developer. Every action is visible afterward with its reason, can be undone, and
> any session can be marked report-only. A session that stalls the same way twice
> comes to the developer rather than being nudged again.

**NOT BUILT** — every clause. This is the half the spec itself marks as blocked:
widening the orchestrator RFC's per-session scope invariant to fleet scope is a joint
decision with zezhexu. The decision is the blocker, not the code.

---

## R8 — Start work in the shape that fits it

> One session, several parallel sessions, subagents, or a workflow when the work has
> ordered steps and quality gates, then tracks it and brings the results back
> attributed to what was asked.

**NOT BUILT.**

---

## R9 — Propose work and propose schedules

> Candidate work from connected sources such as issues, product logs, and stale
> feature flags, and from what it observes across sessions. When a task keeps
> recurring it proposes a schedule. Every proposal cites where it came from and can
> be dismissed, and the developer creates the schedule.

**NOT BUILT.**

---

## R10 — Stay yours in a shared Crew

> The list and the conversation belong to the individual developer even when several
> people use the same Crew, and work with no clear owner is raised to whoever set it
> up.

**NOT BUILT** — there is no owner concept in the model. Recall is workspace-scoped
fail-closed, which is adjacent but not the same thing: a workspace is not a person.

---

## R11 — Implementation note

> The implementation symbol must not be CrewManager.

**MET** — the default export is `CrewOverviewApp` (`src/index.tsx`). Product name,
slug, route, API paths, notification channels and the Conductor key all remain
"Crew Manager" / `crew-manager`.

---

## "What it does not do" — compliance

| Constraint | Verdict | Note |
|---|---|---|
| does not replace per-session state, the sessions list, or workflow views | MET | the app consumes `/api/chat`, `/api/approvals`, `/api/spawn`, `/api/workflows` and links back into sessions |
| does not show other people's work | Vacuously true | single-user today; no filtering exists, so this is unimplemented rather than satisfied |
| does not change how a DM reaches a session | MET | untouched |

---

## Verification gap

Four things are built but their live path has never run once:

1. stall detection — a real bell has never fired
2. error-loop detection — same
3. the model-written reason — the model call has never executed
4. `GET /recall` — the HTTP route has never served a request

(4) blocks its own verification from the agent side. Unauthenticated probing is
useless: `/api/apps/crew-manager/recall`, `/stalls`, a bogus path under the app, and
a path under an app that does not exist all return an identical `403 Token required`
— measured, not assumed. The internal-secret route is closed too: the allowlist in
`dashboard/server.py` admits exactly one app path (Issue Radar's record endpoint) and
the comment there says the general `/api/apps/` prefix is excluded deliberately, so
that holding the secret cannot reach an app's write routes. So the only door is the
authenticated dashboard.

The risky half of recall — ranking, filtering, snippet quality — was verified
directly against the real transcript store, which is why (4) is "is the wire
connected" rather than "does it work".

---

## Tally

| Verdict | Count | Requirements |
|---|---|---|
| MET | 4 | R2, R3, R5, R11 |
| PARTIAL | 2 | R1, R4 |
| NOT BUILT | 5 | R6, R7, R8, R9, R10 |
| of which BLOCKED BY PLATFORM | 1 clause | R1's "other work queued behind it" |
| of which blocked on a human decision | 1 | R7 (RFC scope invariant, with zezhexu) |

**What is left, in order:**

1. **R4's "before new work starts"** — there is no session-creation hook, so the
   literal form is not available. The reachable form is "flag it the moment new work
   appears", which needs a rule for what counts as new.
2. **R4's "what came of it"** — an outcome rather than a quote. Needs a model pass
   over the recalled session, which is the same machinery as R2's reason.
3. **R1's "other work queued behind it"** — blocked on the platform modelling
   cross-session dependency. Not app work.
4. **R6, R8, R9, R10** — new features, none blocked. R6's cost is now known: borrow
   the gateway's Slack client off state; the app holds no credential.
5. **R7** — blocked on the RFC scope decision with zezhexu, not on code.
