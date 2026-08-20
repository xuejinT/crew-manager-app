# The Autonomous Conductor — implementation plan

**Status:** plan, not yet built. Supersedes nothing; amends `docs/spec.md` (R7, R9) and `README.md:12` as a merge gate, not as follow-up.
**Audience:** the top three sections are for the product owner. Everything from "Goal model" down is for the engineer implementing it.

## Summary

Today the Conductor is a chat window that waits for you. This plan turns it into a background
supervisor that drives declared GOALS while you are asleep, and keeps the chat window as the place
you ask it *why*.

The core decision: **the thing that acts is deterministic Python running inside the gateway, not an
LLM.** A goal is a contract with machine-checkable completion criteria. A 15-second loop observes
the fleet, a 60-second loop deliberates, and a single authority table — data, not prose — decides
whether each proposed action executes, waits for your click, or is refused outright. An LLM is
called as a *subroutine* for classification and message wording, in a sandbox with all tools
rejected, and its output is schema-validated before deterministic code reads a single field.

You get a START/STOP button and a STEER box. Between them it works alone, inside per-goal budgets,
and everything it does lands in an append-only log with the reason it was taken.

**What we are saying no to:** the Conductor will not merge pull requests, will not arm auto-merge,
and will not answer tool approvals or "what do you actually want" questions. It stages a landing
proposal with evidence and you click. That is a genuine partial no to the verbatim request
(see [What we are NOT building](#what-we-are-not-building)) and it needs explicit sign-off.

**First shippable thing:** Increment 0, a cross-package KiroCrew change so an app can arm a
background loop at gateway startup at all. Without it nothing else in this plan can reach a session.

---

## The problem

The Conductor is advisory **by construction**, and the construction is load-bearing in three places:

1. **It only learns anything when you type.** Context reaches the Conductor slot on exactly one
   code path — an operator keystroke with nothing session-routable quoted
   (`src/index.tsx:3253-3261`). When you instruct a session directly, the Conductor's transcript has
   a hole in it. There is no periodic or event-driven push.
2. **Everything that knows the state of the fleet lives in your browser.** Every poll
   (`SOURCE_POLL_MS = 5_000`), the whole `model.ts` derivation, every dismissal, and the LLM goal
   clustering pass are client-side. Close the tab and the board does not exist. Even the one
   existing background loop (`backend/watcher.py`) is armed lazily by an HTTP request, so after a
   gateway restart it does not run until somebody opens the app.
3. **Goals are decoration.** `data/goals.json` is a bucket of names and aliases used for read-time
   substring clustering. No goal string is ever sent to any session. The operator's intent is
   written down in a place nothing reads.

The consequence in the owner's terms: the product caps at "a very good list". It cannot keep work
moving overnight, cannot notice that a session has been silent for an hour while still marked
running, and cannot act on the thing you told it you were trying to achieve — because it was never
told, in any form a machine could use.

The restraint text ("This is a conversation, not an action channel", "recommend, do not attempt it")
is nine hardcoded strings in `src/index.tsx`. That deliberate restraint is what this feature
relaxes — but note carefully: **the 53-line agent spec that contains the "you CANNOT" block has
never been in effect.** The Conductor slot is created with no `agent` field and `get_or_create_slot`
does no name inference, so at runtime it is the default agent with default tools. Nobody should
claim this feature "relaxes" a guardrail that was never loaded. The real control today is that the
Conductor has no shell and a human has a finger on a button.

---

## What changes

```
                                    BEFORE
  operator types  ──▶  ephemeral context  ──▶  Conductor chat  ──▶  advice
                       (browser-built)                              (operator acts)


                                    AFTER
  ┌─────────────────────────── operator ────────────────────────────┐
  │  declares GOALS      START / HOLD / STOP / KILL      STEER      │
  └───────┬──────────────────────┬─────────────────────────┬────────┘
          │                      │                         │
          ▼                      ▼                         ▼
  data/conductor/goals/*   data/conductor/control.json   steer.jsonl
          │                      │                         │
          └──────────┬───────────┴────────────┬────────────┘
                     ▼                        │
        ╔════════════════════════════════════════════════════════╗
        ║  THE DRIVER  (in-gateway Python, backend/conductor/)    ║
        ║                                                        ║
        ║  observe 15s ─▶ facts_hash ─▶ deliberate 60s            ║
        ║      │                            │                    ║
        ║      │                            ▼                    ║
        ║      │                    decide.py  (pure)            ║
        ║      │                            │ Proposal[]         ║
        ║      │                            ▼                    ║
        ║      │                    gate.py  ◀── authority table ║
        ║      │                       │  │        (DATA)        ║
        ║      │             allow ◀───┘  └──▶ escalate / refuse ║
        ║      │               ▼                                 ║
        ║      │          act.py  (only module that touches host)║
        ║      │               │                                 ║
        ║      ▼               ▼                                 ║
        ║  judge.py       ledger.jsonl  (intent ─▶ outcome)      ║
        ║  (LLM, REJECT_ALL,                                     ║
        ║   no authority)                                        ║
        ╚═══════════╦═══════════════════════╦════════════════════╝
                    │                       │
       ┌────────────┴──────┐         ┌──────┴──────────────────────┐
       ▼                   ▼         ▼                             ▼
  work sessions      autonudge    crons                   PR reads (2 lanes)
  (create/continue/  loops        (created PAUSED)        + merge PROPOSAL
   inject context)                                          ─▶ operator clicks
                    │
                    ▼
        Conductor chat slot  =  narration + "why did you do X", answered FROM the ledger
```

Three things to notice in that sketch:

- **The chat session holds no authority and gains none.** Its restraint context stays literally
  true. It becomes the explanation surface over the ledger. This is what makes the increment small:
  we are not talking a model out of a rule, we are adding a control loop next to it.
- **`gate.py` is the only path to `act.py`.** There is exactly one place where authority is
  computed: `effective = min(global_mode, goal.authority[class], NOT marker_disabled(class))`.
- **The LLM is downstream of nothing that matters.** `judge.py` reads untrusted worker output and
  holds no credentials and no tools. `act.py` holds authority and reads only named, validated
  fields. If `judge.py` returns `{"kind": "merge_now"}`, `policy.py` has no such field and nothing
  happens.

---

## Invariants (acceptance criteria, written before any mechanism)

These are ship/no-ship gates. **An increment that violates one does not ship.** They exist because a
flat table of failure modes tells you what to worry about; a numbered invariant list tells you when
to stop.

| # | Invariant | Enforced by |
|---|---|---|
| **I1** | **Prose is never a control.** Every restraint that matters is a code branch in one chokepoint. | `backend/conductor/gate.py`, the only module `act.py` may be reached through |
| **I2** | **No irreversible act is autonomous, and there is no approval path to make it autonomous.** Merge, auto-merge arming, tool approval, `ask_question` answer, `trust`/`yolo`, slot delete, archive sweep, shell, `.github/**` writes. | `policy.py` hard-DENY set with no `allow` branch and no config key. A unit test asserts every hard-DENY class has zero reachable execution path. |
| **I3** | **Every action is recorded before it happens and reconciled after.** No side effect exists without a ledger row naming goal, trigger, reason list, tier, and outcome. | `ledger.py` writes `intent` and fsyncs *before* the effect; `act.py` refuses a `Proposal` whose intent row is not durable |
| **I4** | **STOP is idempotent, out-of-band, and never auto-undone.** | `HALT` marker checked **inside** `gate()`, not once per tick; `operator_stopped` vs `auto_stopped` two-flag split; capability-nonce rotation on `kill` |
| **I5** | **The loop cannot be steered by anything an agent wrote.** Transcripts, PR bodies, CI logs are untrusted input. | `judge.py` (untrusted in, schema-constrained enum out, `REJECT_ALL` tools, no authority) is a different module from `act.py` (authority, typed fields only) |
| **I6** | **Budget exhaustion escalates. It never guesses and never silently continues.** | `budget.py` + `breaker.py`; every terminal reason is a named enum value; post-action re-check after each turn completes |
| **I7** | **Operator dismissals are visible to the loop.** A set-aside item is never re-raised; a split goal is never re-clustered. | `backend/operator_state.py` — migration of `localStorage` decisions into `data/` is a **prerequisite**, not a follow-up |
| **I8** | **A model may say "not done". Only a machine predicate or the operator may say "done".** | `goals.py` termination: `judge.py` may veto a completion claim and may close a *leaf*; it can never satisfy a *goal* |
| **I9** | **The tick cannot kill the gateway.** | lint/test failing on `open()`, `subprocess`, `realpath`, `fsync`, `is_sensitive_path` in the tick module set; per-step timeouts; `REASON_TIMEOUT_SECS`-style cap on every LLM call |

I7 is the one people will want to defer. Do not. Today `crew-manager.snoozed`, `.handled`,
`.goal-verdicts`, `.goal-names` exist only in the browser. **A write-through mirror with the browser
as source of truth is stale by construction in the exact overnight scenario this feature exists
for.** Migrate, do not mirror. Extend the same move to `watchedSessions` (today React state,
`src/index.tsx:2253`, and the entire basis for which approvals surface): it becomes durable
task-binding provenance — not "we are watching this slot" but "this approval blocks task T of goal
G, attempt 2 of 3".

I9's mechanism matters more than its statement. `dashboard/loop_watchdog.py` arms
`faulthandler.dump_traceback_later(exit_after=25s, exit=True)`. One un-offloaded `fsync`, `realpath`,
or `gh` subprocess in the tick **hard-exits the operator's entire gateway** — every session, every
approval, every cron. "A review checklist item on every PR" is prose-as-control and this document
forbids that everywhere else. It is a lint rule and a test.

---

## Goal model

### Today: display-only. Explicitly.

`backend/initiatives.py` writes `<app dir>/data/goals.json` as `{goals:[{name, aliases}], imported}`.
`initiativeFor` (`model.ts:2525`) matches item title → session label → provenance against
longest-alias-wins case-insensitive substrings. `clusterByInitiative` groups. `InitiativeBlock.status`
is derived, never stored. **No goal string reaches any session.** That is the whole current
mechanism, and making goals into real drivers is the heart of this feature.

### What the operator declares

One goal, one form, on the existing Goals tab. Stored as **one file per goal** —
`data/conductor/goals/<goal_id>.json`, not one `goals.json`. At 5 goals × 30 sessions the write rate
under a single lock is the contention story, per-goal files make the fcntl lock granular, and a
corrupt goal becomes one skipped entry rather than a total load failure.

| Field | Purpose |
|---|---|
| `title` | display + the alias-clustering key that already works |
| `statement` | prose, ≤2000 chars. The objective in the operator's words. **This is the thing that gets quoted into sessions** — the thing that today propagates nowhere. |
| `done_when[]` | ≥1 predicate from a closed vocabulary (below). **Empty ⇒ the goal stays `draft` and is never dispatched for.** |
| `scope` | `{repos[], paths_allow[], paths_deny[], aliases[], adopt_slots[], report_only_slots[]}`. `paths_deny` defaults include `.github/**`, `CODEOWNERS`, `**/migrations/**` |
| `authority` | per-action-class `off \| propose \| act`. Defaults: `context_inject: act`, `operator_notify: act`, **everything else `off`**. A goal may only narrow the global mode, never widen it. |
| `budgets` | `max_concurrent_sessions`, `wip`, `turns`, `wall_clock_secs`, `usd`, and per-class action caps including **`escalation`** |
| `cadence` | `tick_secs`, `quiet_hours[]` |
| `guidance[]` | accumulated steer prose, timestamped, appended never overwritten |
| `state` | `draft → active → holding → blocked → awaiting_confirmation → done \| abandoned` |

Do **not** move goals into `ctx.storage` (it is `None`; `app.json` declares `storage: false`) and do
not move them into the platform. The value of goals-as-files is that the operator can open one and
fix it. Keep the one-time importer pattern `initiatives.py:92-114` already uses for `projects.md`, so
today's buckets become `scope.aliases[]` and read-time clustering keeps working unchanged.

### `done_when` — closed vocabulary, v1

`pr_merged(url | repo+branch_pattern)` · `checks_green(pr_url)` · `file_exists(path)` ·
`text_present(path, pattern)` · `session_reported_done(slot) AND verified_by(<other predicate>)` ·
`manual(text)`.

**Deliberately excluded from v1: `command_exits_zero(cmd)`.** It is the most useful predicate and the
one that hands the supervisor a shell. It returns later, behind a per-goal allowlist of exact argv,
executed off the gateway loop, never as a free-form string.

### Decomposition

**There is no planner in the first shipped increments.** A goal decomposes into the set of sessions
the existing alias clustering already assigns to it, plus per-session intents. This is the largest
single cost saving in the plan: the AutoGPT/BabyAGI lineage failed at exactly this point — vague goal
→ over-expanded subgoals → circular replanning → budget exhaustion with nothing changing — and a
planner also adds "did the plan drift from execution" as a whole new failure surface.

When a planner does arrive (Increment 6), it is bounded: **depth ≤ 2, ≤ 12 leaves, no recursive
re-expansion, no subtask spawning subtasks.** The plan is written to
`data/conductor/plans/<goal_id>.json` as an artifact and reviewed; it is never re-derived from
context. Schema-invalid planner output moves the goal to `blocked` and fires one escalation —
it never degrades into "the driver decides for itself".

Each leaf carries `{id, intent_text, done_when[], predicted_paths[], depends_on[], attempts}`.
`predicted_paths[]` is load-bearing: two leaves whose declared paths overlap are never dispatched
concurrently. That is the cheapest merge-conflict prevention available, and it is precisely what
worktrees do *not* give you.

`depends_on` **gates dispatch only, is Conductor-local, and must never appear in a "why" sentence as
though the platform enforced it.** The platform has no cross-session dependency model
(`docs/audit.md:34` marks the spec's flagship "a second session is blocked behind it" example as
BLOCKED BY PLATFORM). A Conductor that claimed otherwise would forfeit the property that makes its
reasons trustworthy — that they are derived from platform facts.

### Progress and termination — three independent forms, all required

1. **Verified success.** Every machine-checkable `done_when` predicate passes, evaluated by
   deterministic code. `manual(...)` lines are **never** closed by the driver — the goal moves to
   `awaiting_confirmation`. Where an LLM verdict is unavoidable it may close a *leaf*, never a
   *goal* (I8). And the verifier is never the producer: verification runs in a fresh pass reading
   artifacts, not in the session that did the work.
2. **Non-progress detection.** `facts_hash(goal) = sha256(sorted leaf statuses | member slot keys |
   last_turn_ts | message counts | PR head SHAs | open finding signatures)`. Unchanged across
   `N = 4` consecutive deliberate ticks **while the driver has been acting** ⇒ `state = blocked`,
   stop acting on that goal, escalate with the hash history. Motion is not progress.
3. **Hard ceilings.** `turns`, `wall_clock_secs`, `usd`, per-class action caps. Wall clock anchors on
   the persisted `activated_ts`, so a restart cannot reset it. Each has a distinct terminal reason
   enum (`turn_budget`, `runtime_budget`, `usd_budget`, `action_cap:<class>`) — because elapsed time
   keeps growing after a pause, and without the reason a held goal is indistinguishable from a
   budget-stopped one, so raising the budget would silently resume an explicit hold. This is
   `autonudge.py:288-293`'s `stopped_reason` discipline, copied.

Only the operator moves a goal to `done` or `abandoned` in v1.

---

## The control loop

### Where it runs

**In the gateway process, inside the Crew Manager app backend, as a supervised `asyncio` task armed
by an `on_startup` hook — once the host handle exists (Increment 0).**

Rejected alternatives, with the reason:

- **Browser.** Tab closed ⇒ no board. Non-starter.
- **Separate service.** Strictly *less* capable. App tokens are 403'd by exactly the endpoints
  autonomy needs: `_authorize_owner_request` (`source_providers.py:4066-4096`) rejects any request
  with `request["app"] != ""`, and approve / `followup` / `ask-question` are
  `deny_non_dashboard_caller`. Plus a new process to supervise.
- **The Conductor chat session driving itself** (arm autonudge on it and let the model act). An LLM
  control loop cannot enforce a budget on itself, cannot be deterministically killed, produces no
  pre-hoc auditable decision, and — concretely — `crew-manager-conductor` is in `watcher.py:100`'s
  `SKIP_KEYS`, so it would be the only unmonitored session in the fleet. This is also the "lethal
  trifecta" shape: private data + untrusted content + ability to act, with restraint expressed as
  prose the model can be talked out of.
- **A child-process "brain" with in-gateway "hands"** (`backend.entryPoint`, `apps/backend.py`). The
  sandboxing is genuinely attractive and it would make I9 structural rather than lint-enforced.
  **But the control flow described in the proposal is backwards and does not work:** the spawned
  backend's env is `minimal_env(PORT, KIROCREW_APP_NAME, KIROCREW_HOME, …)` plus
  `KIROCREW_PROXY_SECRET` (`apps/backend.py:763-778`) — no gateway URL, no app token, nothing to
  authenticate an outbound call with — and the HMAC proxy is explicitly gateway-to-child only. A
  child can only *respond*, never *initiate*. If this split is ever adopted, the in-gateway side
  owns the clock and calls the child for deliberation each tick, and the child is a stateless
  advisor. Not in v1.

Files to add under `backend/conductor/`: `loop.py` (driver + supervision), `observe.py` (build the
gateway-side facts), `steps.py` (ordered steps), `intents.py` (typed proposals + tier table),
`policy.py` (authority composition), `gate.py` (the chokepoint), `act.py` (the only side-effecting
module), `judge.py` (LLM, `REJECT_ALL`), `goals.py`, `store.py` (fcntl + atomic JSON, executor-offloaded),
`ledger.py`, `budget.py`, `breaker.py`, `reconcile.py`, `control.py`, `prreg.py`, `tamper.py`.
Plus `backend/hooks.py` and `backend/operator_state.py`.
Changed: `backend/routes.py`, `backend/watcher.py` (demoted from owning a loop to being two steps),
`backend/initiatives.py`, `app.json`, `src/index.tsx`, `src/model.ts`, `src/summaries.ts`,
`docs/spec.md`, `docs/audit.md`, `README.md`.
**Deleted: `backend/prchecks.py`** — dead code (`docs/goal-extraction-gaps.md:234`) that runs `gh`
from ambient PATH with the gateway user's whole environment, no `GH_HOST` pin, no sandbox, no audit,
while `app.json` declares `network: false` and no `dependencies.commands`. Extending it is the single
worst available implementation path. Delete, do not harden.

### Two cadences

- **`observe` tick — 15s.** In-memory reads of `state._slots` and the service objects only. No file
  I/O, no subprocess, no LLM. Builds an immutable `Observation`. **Do not call `slot.to_dict()` per
  slot per tick** — it does source-link projection and `[OPTIONS:]` parsing on every call, and it
  silently drops `ci`/`state`/`mergeable` for a non-owner caller, which is exactly the bug
  `watcher.py:230` has today (it calls `to_dict()` with no arguments, so `include_check_status` is
  `False` and the sweep is blind to CI). Read attributes directly.
- **`deliberate` tick — 60s.** Runs only for goals whose `facts_hash` changed or whose cooldown
  expired. Everything expensive lives here, each behind its own cooldown and circuit breaker. Steady
  state is near zero work.

`tick()` is factored out of the sleep loop so it can be called once, synchronously, from a test or
from `POST /conductor/tick?dry_run=1`. That factoring is borrowed verbatim from batty's
`daemon/poll.rs:246`, including the reason its comment gives, and it is the difference between a
testable supervisor and an untestable one.

### Step order — cheap and high-signal first, generative and irreversible last

```
 0  guard         HALT marker / operator_stopped / holding / per-class markers -> return, log the skip
 1  reconcile     ledger intents with no outcome -> reconcile by observation (never blind retry)
 2  operator      harvest migrated snooze/handled/verdict/report_only state
 3  steer         drain steer.jsonl
 4  observe       build Observation
 5  detect        existing detect.py: detect_stalls, detect_error_loops, failure_signature
 6  classify      [LLM] what is each blocked session asking for
 7  evaluate      done_when predicates; non-progress facts_hash; budgets (incl. post-action re-check)
 8  propose       deterministic: findings x goals x policy -> Proposal[]
 9  gate          authority, cooldowns, signature dedup, envelopes, WIP, path overlap, scope
10  compose       [LLM] message text for approved send-shaped proposals
11  execute       act.py, one host call per proposal, idempotency-keyed
12  prs           PR registry refresh (two lanes) + landing proposals staged
13  report        digest into the Conductor slot; notifications on escalation; persist + heartbeat
```

Three failure-isolation wrappers, ported from batty's `daemon/error_handling.rs:24,45,70`:

- **critical** (0-4, 7): log, continue, never counted.
- **recoverable** (8-11): consecutive-failure counter, WARN at ≥3.
- **optional subsystem** (6, 10, 12, 13): circuit breaker — 5 errors / 600s ⇒ backoff
  `[60, 300, 1800]`s ⇒ disable and notify. Applied to every LLM call, every provider read, the cron
  store (`CronStoreBusy` is retryable by contract), the notification bus. A wedged `gh` or a
  rate-limited model must degrade **one capability**, not stop autonomy and not spin.

### What it observes

Per slot, read directly off `_ChatSlot`: `running`, `stop_state`, `pending_approval` +
`pending_approval_info`, `needs_input` (`_question_pending`), `has_options`/`options`,
`waiting_for_input`, `interrupted`, `queue_depth`, `wait_state`, `last_activity_ts`, `last_turn_ts`,
`todo`, `trust`, `app`, `origin`, `unattended`, `project`, `linked_session_key`, `source_links`.

Per goal: bound sessions/PRs/loops/crons, budget consumed, `facts_hash`.
Per loop: the `NudgeLoop` dataclass including `stopped_reason` — **do not lose the distinction**
between an operator pause (`"manual"`) and a budget stop (`cycle_cap`/`runtime_budget`).
Per cron: `consecutive_failures`, `user_paused`, `auto_paused`, `last_status`.
Per PR: `{ci, state, mergeable}` **plus the age of that cache**, and an explicit `unknown` when
stale or flap-damped — `_CHECK_FLAP_DAMP_THRESHOLD = 3` stops refreshing an oscillating URL, and a
damped URL is *unknown*, never *stable*.
Plus capacity: running-turn count, per-goal WIP, background-turn semaphore headroom.

**What it deliberately does NOT observe: the ranked board.** `rankWorkItem`, `sortWorkItems`,
`explainRank`, `fleetBriefing` stay in TypeScript, one copy, browser-side. Re-implementing them in
Python creates the second version that `model.ts:1105-1117` and the spec's "answers from the same
understanding" clause exist to forbid, and it is the most expensive thing we could do. The driver
reasons over platform facts and `detect.py` findings — a strict subset the UI can render **from the
driver's ledger** rather than re-derive. Acknowledged debt: the eventual right move is derivation in
Python with the UI as a renderer. That is a separate, larger project.

### The decision table

| Decision | Deterministic or LLM | Why |
|---|---|---|
| Is an action class permitted for this goal | **Deterministic** | Authority is data. An LLM near this is the whole failure |
| Has a cooldown elapsed / is a signature a duplicate / is a budget spent | **Deterministic** | Arithmetic |
| Is an action reversible | **Deterministic** | Classified at design time, in a table |
| Is a session stalled / error-looping / repeating a signature | **Deterministic** (`detect.py`) | Already pure functions, already shipped |
| What is a session *structurally* asking for | **Deterministic** | `pending_approval`, `needs_input`, `has_options`, `interrupted`, `wait_state` are platform-derived facts |
| Is a `done_when` predicate satisfied | **Deterministic** | I8. A model may veto, never satisfy |
| Non-progress | **Deterministic** | `facts_hash` comparison |
| Merge eligibility envelope | **Deterministic** | check buckets, diffstat, sensitive paths, head-SHA match, base freshness, soak |
| Every stop / hold / pause transition | **Deterministic** | I4 |
| Does a proposed change touch `paths_deny` or overlap another in-flight leaf | **Deterministic** | glob match on `predicted_paths` |
| **What *kind* of attention a blocked session wants** — `fact \| decision \| approval \| permission \| done \| unclear` | **LLM** | This distinguisher does not exist in code. `item.approvalKind` is a platform *tool name*, not a fact-vs-decision classification, and that missing distinguisher is the entire reason R7's "supplies the fact and the work continues" has never been buildable. Only `fact` unlocks an autonomous continuation; `unclear` escalates |
| Is a session's activity on-goal | **LLM** | Evolution of the existing `goal-pass` (`backend/routes.py:289-390`) |
| The *text* of a continuation message or a context injection | **LLM** | Prose is the one thing a model is actually for. Never the decision to send, only the wording |
| Goal → candidate leaves (Increment 6) | **LLM** | Output re-validated against the closed `done_when` vocabulary; unparseable predicates are dropped, not guessed |
| Did this leaf meet its prose criterion | **LLM, veto-only** | May close a leaf, never a goal (I8) |
| The one-line human "why" appended to an otherwise machine-derived reason list | **LLM** | Display only |

Every LLM call runs in an ephemeral session with `ToolApprovalPolicy.REJECT_ALL` — precedent the app
already ships at `backend/routes.py:357`, including release-and-destroy — with a per-tick call cap
and a hard timeout. Enums are validated against the enum; prose is redacted and length-capped and
only ever used as a message body. **No model output is ever a target, an authority level, or a gate
result.**

---

## Action set

All calls go through `act.py`, in-process via `DashboardState` (the app backend already reaches
`request.app["state"]` at `backend/routes.py:81,90,126`), because the HTTP surface refuses app tokens
for half of this. Every call is preceded by an `intent` ledger row and followed by an `outcome` row
sharing an `action_id`.

| Action class | Real mechanism | Idempotent? | Reversibility | Day-1 authority |
|---|---|---|---|---|
| `context_inject` | `POST /api/chat/slots/{slot}/context` → `chat_handlers.py:5291`, `ephemeral: true`, dedicated `source` | Yes — no turn, no WS event | reversible | **act** (Inc. 4) |
| `session_continue` | `POST /api/chat {message, slot}`, or `slot.queue_insert(0, …)` + `spawn_guarded_turn(state, slot, state.run_background_turn(...))` in-process (`slack/gateway.py:4246-4252`) | **No** — dispatches a real turn | compensatable | **act, narrow** (Inc. 4) |
| `session_resume` | `POST /api/chat/slots/{slot}/continue` → `:2496` | No, but heavily guarded | compensatable | act (Inc. 4). Prefer this: its 409 set (`slot_running`, `slot_orchestrating`, `slot_stopping`, `slot_queue_pending`, `slot_approval_pending`, attached subagents, `slot_empty`) **is** our precondition list — mirror it, do not re-derive it |
| `session_side_ask` | `POST /api/chat/slots/{slot}/side/open\|turn\|close` (`routes/chat.py:95-97`) | unverified | probably reversible | **propose only — semantics unverified, see OQ5.** If it holds it replaces several continuations with something strictly less invasive |
| `session_create` | `state.get_or_create_slot(name=f"cm-{goal}-{n}", agent=…, workspace=…, app=?, origin=…, linked_session_key=f"conductor:{goal_id}")` (`state.py:4817-4830`) | **Yes by name** (`:4857`) — that is the idempotency key | compensatable (close/archive) | **propose** until Inc. 6. Blocked on OQ2 + OQ3 |
| `loop_arm` / `loop_patch` | `authorize_and_add_nudge` (`autonudge_authz.py:209`) — the same chokepoint REST and workflows use, so we inherit redaction, the 8000-char cap, the runtime ceiling, and audit-or-deny | Yes per slot (`_add_locked` replaces) | reversible | propose until Inc. 5, then act **only with mandatory non-zero `max_cycles` and `max_runtime_secs`.** `POST /api/autonudge` defaults `max_cycles = 0` = unlimited (`handlers/autonudge.py:90`); we never inherit that |
| `loop_stop` | `PATCH /api/autonudge/{id} {active:false}` | Yes | **irreversible from this app** (`src/index.tsx:3155` already documents this) | propose. Never over a loop we did not arm — if `_find_by_slot` returns a loop with `stopped_reason != "manual"` that we did not create, that slot is **operator territory**: refuse and escalate |
| `cron_create` | `state.crons.add_job_if_absent_async(pred, …)` (`apps/cron_sdk.py:301`) — existence check + append under one lock. **Not** `POST /api/crons`, which mints a new id per call | Yes | reversible | **propose**, created `user_paused=True`. Message-only. **`command` is hard-DENY** — `_vet_shell_command` (`mcp_cron.py:568`) is a denylist with no executable allowlist, so `gh pr merge` passes it |
| `cron_pause` | `enable_job_async(false)`, ours only (`created_by`) | Yes | reversible | act (Inc. 5) |
| `pr_read` | batch `POST /api/source/pull-request/status` (≤64 urls) + `POST /api/source/pull-request {url, refresh:true}` at decision time | Yes | read | **act** (Inc. 7) |
| `pr_comment` / `pr_reply` / `pr_resolve` | `source_providers.py:4155,4134,4099` | No | compensatable, **externally visible to humans** | **propose** (Inc. 8) |
| `pr_create` | **No host endpoint exists anywhere in the gateway.** Delegated: the owning session opens it as part of its work; the URL is recorded in our PR registry | task binding | compensatable | **not built** |
| `pr_review: APPROVE` | `submit_pull_request_review` | — | irreversible, public | **hard-DENY** |
| `pr_automerge` | `enable_pull_request_auto_merge` (`source_providers.py:3402`) | arming-ish | **irreversible** — and on GitLab it *is* an immediate merge when no pipeline is pending | **hard-DENY, v1** |
| `pr_merge` | no host endpoint | — | irreversible | **hard-DENY.** Driver stages a `MergeProposal`; the operator clicks |
| `approval_answer` | `POST /api/chat/slots/{slot}/approve` | — | irreversible | **hard-DENY, permanently.** Owner-gated by design; in-process would forge owner identity. `approvalKind` is a tool name, not a reversibility class, so there is no honest distinguisher available |
| `question_answer` | `POST /api/ask-question/{id}/answer` | — | irreversible | **hard-DENY.** `deny_non_dashboard_caller` precisely *because it is the operator's voice*. Calling it in-process makes an agent decision indistinguishable from the human's in every downstream consumer including the audit trail. If a fact genuinely needs supplying, supply it as a session message or ephemeral context — separately attributable |
| `escalate` / `operator_notify` | `kiro_crew.notifications.bus` push — already used at `watcher.py:345,412` | needs our own dedup | reversible | **act**, rate-limited. **A first-class action class with its own budget and its own flood guard** |
| `narrate` | `context` + periodic digest turn into the Conductor slot | Yes | reversible | act |

### "A session is asking for the operator" — the routing rule

| Platform signal | Classification | Conductor action |
|---|---|---|
| `pending_approval` | permission | **Never touch. Escalate.** Notify once, cooldown, digest |
| `needs_input` (`ask_question` card up) | explicit question | Escalate. Owner-gated by design; do not route around it |
| `has_options` + `options[]` | bounded choice | **propose** a pick with the derivation. Autonomous only if a `done_when` line or the goal statement determines the answer unambiguously, and even then log the derivation. Off by default per goal |
| `interrupted` / stall finding | stuck, no question | **This is the R7 clause we can actually satisfy.** LLM classifies fact-vs-decision; `fact` grounded in the goal statement ⇒ autonomous continuation. Decision or preference ⇒ escalate |
| second identical `failure_signature` | repeated stall | **Escalate, do not nudge again.** R7 states this explicitly and the machinery is half-built — `failure_signature` (`detect.py:261`) and the write-once `_reasons` memo cleared on recovery (`watcher.py:177-180`) are the right shape but live in process memory and drive a bell, not a nudge budget. Persist them; make the second occurrence escalate |
| marked `running`, silent > threshold | **false-working stall** | A dedicated lane, **explicitly permitted to bypass the idle-grace and pending-input gates**, because idle-only triggers structurally cannot see a session marked running that has been silent for an hour. `interrupted` (`state.py:2763`) was added for exactly this |

### The app-ownership fork for driver-created sessions

`_ChatSlot.unattended = bool(self._app) and not self._human_seen` (`state.py:2420`) drives two
things: `_BACKGROUND_APPROVAL_TIMEOUT_SECS = 180` (deny-fast) instead of a 2h window (`:3570`), and
`MAX_BACKGROUND_TURNS = 4`, ceiling 16 (`:3593-3594`).

**Adopt `app="crew-manager"`, with an explicit escape hatch.** For an unattended overnight run both
of those are *safety features*: a tool wanting approval is denied in three minutes instead of parking
a session and a WIP slot for two hours, and the 4-wide semaphore is a free global concurrency ceiling
that the driver's own accounting cannot defeat. The graceful hand-off is built in — `_human_seen`
flips the moment the operator types into the slot with owner identity (`chat_handlers.py:250-256`,
"an app cannot forge attendance for its own worker"), so an adopted session silently upgrades to
human semantics.

**Unless OQ2 fails.** Nobody has verified whether app-owned (`is_restricted`, `unattended`) slots
render on the operator's board under `permissions.events: ["slots"]` (which is `slots:own` scope).
**An invisible autonomous session is the exact inverse of this feature's purpose.** If the live
round-trip says no and we are forced to `app=""` + `origin=SlotOrigin.SYSTEM`, then two things stop
being notes and become hard requirements: the driver's **own** global concurrency ceiling (6
concurrent driver-started turns, per-goal WIP 2) and the driver's **own** approval-age watchdog.
Either way `origin` is passed explicitly — `request_slot_origin`'s docstring forbids background
callers from relying on inference.

### One exemption predicate, not four copies

The conductor-exclusion rule exists in four places today: `model.ts:1032`, `:1735`, `:2588`, the
`summaryTargets` param at `summaries.ts:25`, and `SKIP_KEYS` at `watcher.py:100`. Collapse to one
predicate fed from `GET /conductor/state`, and generalise it from a hardcoded key pair to a **class**
with `report_only` and `conductor_owned` as first-class flags. This stops being cosmetic the moment
the driver can create helper sessions, and it is a prerequisite for R7's report-only clause.

---

## Authority model

### The table is data, not prose

`policy.py` holds one table. **Effective authority is computed in exactly one place:**

```python
effective(cls, goal) = min(global_mode, goal.authority[cls], NOT marker_disabled(cls))
```

```
ACTION_CLASSES = {
  "context_inject":   reversible,    internal,           default=act
  "operator_notify":  reversible,    operator-facing,    default=act   (rate-limited)
  "escalate":         reversible,    operator-facing,    default=act   (own budget + flood guard)
  "session_continue": compensatable, internal,           default=off -> act (narrow, Inc.4)
  "session_resume":   compensatable, internal,           default=off -> act (Inc.4)
  "session_side_ask": unknown,       internal,           default=propose  (unverified)
  "session_create":   compensatable, internal,           default=propose
  "loop_arm":         reversible,    internal,           default=propose
  "loop_stop":        irreversible,  internal,           default=propose
  "cron_create":      reversible,    internal,           default=propose  (created paused)
  "cron_pause":       reversible,    internal,           default=act
  "pr_read":          read,          internal,           default=act
  "pr_comment":       compensatable, EXTERNALLY VISIBLE, default=propose
  "option_choice":    compensatable, internal,           default=off (per-goal opt-in)
  ---------------- hard DENY: no code path, no config key, no steer, ever ----------------
  "pr_review",  "pr_automerge",  "pr_merge",  "approval_answer",  "question_answer",
  "trust", "trust_command", "yolo", "safety_override",
  "slot_delete", "archive_sweep", "shell", "cron_command", "write .github/**"
}
```

**`DENY (hard)` means there is no execution path and no configuration that turns it on.** Not
"possible with confirmation" — impossible. A unit test enumerates the hard-DENY set and asserts each
has zero reachable path from `gate()`.

Gating is on **parameters and scope, not just class.** "Send into a session" is fine; "send into 14
sessions this tick" is not. Per-class per-goal per-day counters, plus a global
`max_outbound_session_messages_per_hour`, plus a global `max_operator_notifications_per_hour` —
because the scarce resource is the operator's attention, approval fatigue is the dominant real-world
HITL failure, and EU AI Act Art. 14 treats automation bias as a design obligation rather than a
training problem.

### The three-band taxonomy, and why each boundary sits there

**Always-auto** — `context_inject`, `pr_read`, `narrate`, `cron_pause` (ours), `escalate` and
`operator_notify` (rate-limited).
*Boundary justification:* reversible, internal or operator-facing, and no turn is dispatched.
`context_inject` in particular is the lowest-risk possible first action — silent, ephemeral, no turn,
no WS event — and it is the entire difference between an alias bucket and a driver. Escalation is
auto because a system that cannot reach you is worse than one that reaches you too often; it carries
a budget precisely because the failure mode of an honest escalating system is a spammed operator who
then rubber-stamps.

**Auto-with-budget** — `session_continue`, `session_resume`, `loop_arm`, `session_create`,
`option_choice`.
*Boundary justification:* these dispatch real turns and consume real money, but every effect is
**compensatable inside the platform** — a turn can be stopped, a loop deactivated, a session closed —
and none of them is visible outside the operator's own machine. So the control is a *ceiling*, not a
gate: goal membership required, idle + stalled required, one send per `failure_signature`, escalate
on the second, per-day caps, WIP caps, path-overlap check, stabilization delay. `loop_arm` requires
non-zero `max_cycles` **and** `max_runtime_secs` in the same call.

**Always-escalate** — every tool approval; every `ask_question` card; any `decision` or `unclear`
classification; anything outside `goal.scope`; any `report_only` slot; a second stop on the same
slot (which hard-kills regardless of `force`); the same failure signature twice; any budget
exhaustion; a `manual(...)` `done_when` line; a plan that failed schema validation; a PR ready to
land; any diff touching `paths_deny`.
*Boundary justification:* each is either irreversible, externally visible, or **a question about what
the operator actually wants** — and the third category is the one no amount of engineering resolves,
because the answer is not in the system.

### PR merge gets its own paragraph

Merge and auto-merge arming are hard-DENY in v1, and this is the plan's most consequential refusal.
Five independent reasons, each verified:

1. **There is no direct-merge endpoint in the gateway at all.** The only landing path is
   `enable_pull_request_auto_merge`.
2. **On GitLab, `/auto-merge` IS an immediate merge** when no pipeline is pending. "Arming" is not
   reversible there. GitLab is refused outright.
3. **`ConfirmationRequired` degrades into a constant the moment a Python caller passes
   `confirm_immediate_merge=True`.** The guard's own docstring says the acknowledgement "is only ever
   sent in answer to this specific refusal, which keeps the guard live instead of degrading it into a
   constant" — an autonomous driver degrades it by construction. **This is the one clause this
   feature must not quietly break.**
4. **Bare `--auto` waits only on checks marked *required*.** So unless the driver's own verification
   job is a required check, the PR can land *before* the conductor's evidence exists. And if native
   merge queue is unavailable (historically Enterprise Cloud for private repos), the gate reduces to
   exactly that.
5. **A repo-admin `gh` token makes branch protection not a backstop**, so "the provider adjudicates"
   is not a control. Combined with the fact that `submit-review: APPROVE` + `/auto-merge` from one
   identity is a self-approving merge machine, the driver must never hold both. It holds neither.

What we build instead: **`MergeProposal`** — a staged decision record with an evidence envelope
(reason list, never a confidence score), head-SHA pinned at staging time, a soak window (PR open ≥ N
minutes and survived one slow-signal cycle), an allowed-state gate, a single-flight fcntl lock, a
bulk denylist that excludes merge, and a **gate-tampering check** that hard-blocks. A moved head SHA
invalidates the proposal rather than updating it. The operator clicks. That keeps the audit
distinction intact, because the merge genuinely *is* an operator action.

Revisit only after Increment 8 has produced weeks of proposals the operator agreed with, as its own
design doc with its own security review and an ARCC re-query (OQ12).

### Modes, and how the restraint text moves

The restraint strings are a **mode artifact** and today they are scattered across nine call sites
(`src/index.tsx:2072, 2092, 2096, 2097, 2100, 2103, 2117, 3193, 3220`). Consolidate them behind mode
predicates — `injectsRestraintContext()`, `canExecute(actionClass)`, `requiresConfirmation(cls)` —
so there is exactly one place to read and one place to diff. This is batty's `workflow_mode` lesson
(predicates at call sites, never mode-string comparisons) and it is why adding a fourth mode there
was cheap. Cap at three.

| Mode | Behaviour |
|---|---|
| `advisory` | **Byte-identical to today.** Restraint context emitted verbatim. Default for every existing install. **The loop still runs and still writes the ledger** as `would_do` rows |
| `assisted` | The driver computes the same typed proposals and surfaces them to the existing Approve/Reject cards. Nothing executes without a click. **This is where the product lives for weeks.** This is also BSC2's application-level CAZ shape: a second party approving an availability-impacting operation |
| `autonomous` | Allowed classes execute, bounded by `goal.authority`, budgets, and markers. Per class, never global |

Note the batty bug we invert: `record_orchestrator_action` returns early when the orchestrator is
disabled (`telemetry.rs:945-947`, with a test asserting the no-op), which makes the low-trust modes
the *least* observable ones. Backwards. **In `advisory` the ledger is the entire product** — it is
the artifact on which the operator decides to promote the mode.

### Spec reconciliation — a merge gate, not a follow-up

- **R7 "Keep work moving without taking authority."** The clause *"any session can be marked so the
  Manager reports on it without ever touching it"* becomes real (`scope.report_only_slots`). The
  clause *"every action the Manager takes is visible afterward with the reason it was taken"* becomes
  real (the ledger). The clause *"approvals, permissions, anything irreversible, and any question
  about what the developer actually wants go to the developer"* is **kept exactly**, by the hard-DENY
  set. The clause *"can be undone"* **cannot be honoured for external effects and must be amended**
  to *"is reversible, compensatable, or refused"*, with the classification published. No proposal can
  deliver general undo. `stopLoop` already documents that stopping is not undoable from this app.
  Promising undo is the one lie that would destroy trust the first time it was tested.
- **R9 "the developer creates the schedule."** Honoured, no amendment needed, **because conductor
  crons are created `user_paused=True`** and the operator enables them. If that ever changes, R9
  changes with it in the same PR.
- **`README.md:12`** currently claims validated delivery is automatic. It is false today. Fix the
  line in the PR that makes it true (Increment 4), not before.
- **`docs/audit.md`** is stale at 0.4.0 against `app.json` 0.4.13, and its recall row is wrong at
  HEAD (`src/recall.ts` and `GET /recall` are built and unwired). Refresh it in Increment 0.

### ARCC

Queried before design; full reads of **BSC4 Security Event Logging** (`cnt_fYKkCvIIxTRhDF`) and
**BSC2 Contingent Authorization** (`cnt_bYDsSrUhZopQ5d`). Two clauses are directly load-bearing and
are adopted literally rather than invented:

- **BSC4's required log fields** — *user identification, type of event, date and time,
  success/failure indication, origination of event, identity of affected resource* — become the
  ledger record schema below, verbatim.
- **BSC4's anti-pattern**, "never log passwords, secrets, or PII", forces every logged payload
  through the redaction chain `autonudge_authz.py:251-253` already uses, plus `watcher.py:80`'s
  `_redact`.
- **BSC2's application-level CAZ** — *any operation that allows human access to customer data or can
  significantly impact service availability needs 2-person approval* — is the governance name for
  `assisted` mode, and is why merge staging keeps an operator click rather than a config flag.

The corpus returned nothing covering in-gateway autonomous daemons, agent-authored merges, or
non-human principals crossing an authorization boundary. Those parts of this design are standard
practice, not cited guidance, and **Increment 8 requires a dedicated security review with ARCC
re-queried against the concrete implementation** (OQ12).

---

## Start / Stop / Steer

Routes, in `backend/conductor/routes.py`, registered from `backend/routes.py`:

```
POST /api/apps/crew-manager/conductor/start   {mode, goal_ids?}
POST /api/apps/crew-manager/conductor/stop    {verb: "drain"|"hold"|"kill", confirm?}
POST /api/apps/crew-manager/conductor/steer   {kind, goal_id?, text?, intent_id?}
GET  /api/apps/crew-manager/conductor/state
GET  /api/apps/crew-manager/conductor/ledger?goal=&limit=
POST /api/apps/crew-manager/conductor/tick    {dry_run: true}
```

### START

Writes `data/conductor/control.json` `{running: true, mode, started_by, started_ts, epoch: n+1, pid,
heartbeat_ts, capability_nonce}` under lock, then arms the loop.

**Audit-or-deny.** Start writes a `critical=True` SEL event *before* arming and refuses with 503 if
the SEL is unwritable. This is the house bar — `authorize_and_add_nudge` already refuses to arm a
nudge loop when the audit log is unavailable (`autonudge_authz.py:358-378`) and a Conductor start is
a strictly larger grant.

**Idempotent.** A second click is a no-op returning current state, never a 500. batty `bail!`s on a
redundant pause (`session.rs:31-33`); that is a bug, not a precedent — the operator *will*
double-click STOP.

**PID + heartbeat** so a second conductor (a dev gateway and a prod gateway on one machine) refuses
to tick. Note explicitly: **fcntl locks are per-machine only.** Two machines sharing a
network-mounted data dir is out of scope and must be documented as unsupported.

### STOP — three verbs, distinctly implemented

Pause and cancel are different operations and conflating them is how partial state gets orphaned.

- **`drain`** (the button). `running: false`, `epoch++`. No new proposals gated. The in-flight
  proposal completes and writes its outcome. Driver-armed autonudge loops are
  `PATCH active:false, stopped_reason="conductor_stopped"` — **deactivated, not removed**, so they
  stay inspectable and restartable. Loops the *operator* armed are untouched. Driver-created crons
  `enable=false`. **Sessions the driver started are left running** — killing a mid-turn agent
  destroys work the operator wanted — but every in-flight turn the driver initiated is recorded as
  `orphaned_by_stop` and listed in the stop receipt. The observe tick keeps running so the operator
  still has a board.
- **`hold`.** Same, but goals stay `active` and budgets freeze with an explicit `paused_reason`, so a
  later budget raise does not silently resume work the operator paused. Loops keep their deadlines so
  a resume does not restart every countdown.
- **`kill`.** `drain` + `state.sessions.stop_turn(key, force=True)` on driver-created slots only +
  hard-disarm driver loops. **Requires a second explicit confirmation** and logs
  `partial_state: true`. Also **rotates the capability nonce**, so an executor task already past the
  gate fails closed on its next write — this is the mid-flight window that a "check the marker at
  step 0" design leaves open.

Out-of-band, works even if the loop is wedged: **`data/conductor/HALT`**, checked **inside `gate()`**
rather than once per tick. Plus per-class markers `data/conductor/disabled/<class>`. Both are
`ls`-inspectable, survive restarts, and need no API. Marker files are the right idea for *operator
intent*; for *coordination* we use fcntl with a busy contract, because batty's `create_new`
`merge.lock` has no staleness check and a crashed holder wedges merges until manual cleanup.

**Two flags, copied verbatim from the cron store** (`cron.py:232-235`): `operator_stopped` (cleared
only by an explicit operator START) versus `auto_stopped` (set by the circuit breaker, cleared on
backoff expiry or success). **An operator STOP must never be undone by an auto-resume path.** This is
the failure that destroys trust permanently and it is a two-field fix.

### STEER

`POST /conductor/steer` appends to `data/conductor/steer.jsonl` with an epoch and a `consumed_ts`,
and sets an `asyncio.Event` so the driver deliberates within ~1s instead of waiting 60s. The **next
tick** consumes it — a tick is short and interrupting one re-enters half-finished steps.

A steer becomes **two things, and the split is the security boundary**:

1. **Guidance prose** — appended to `goal.guidance[]`, timestamped, never overwriting the statement.
   Injected into subsequent `context_inject` payloads and into every `judge.py` preamble, bounded to
   the last N with TTL expiry. Shapes *content*.
2. **A recognised directive** from a closed set — `pause_goal`, `resume_goal`, `stop_dispatching`,
   `prefer_session <key>`, `raise_budget <field> <value>`, `set_deadline <ts>`, `abandon_goal`,
   `mark_report_only <slot>`, `veto <intent_id>`. Changes *policy*.

Free text matching nothing becomes guidance only. **A steer can never widen authority.** "Just merge
it already" changes the goal statement and nothing else: `policy.py` sees a request for a hard-DENY
class, logs `authority_refused` with the steer text, and surfaces "you asked for X; that requires
you." **This invariant has a unit test.** Widening authority is a separate, explicitly-typed
operation with its own confirmation. Steers are also how the operator *narrows* ("stop touching
chat-7" writes a `report_only` entry) and `veto` kills a specific pending proposal and adds its
signature to a TTL'd suppression list — the affordance operators reach for most.

**Steering does not go through the chat session as a prompt.** That would reintroduce the synchronous
chat this feature replaces, and the chat transcript also contains agent-authored turns, which are
untrusted (I5). Resolution: the composer posts the operator's message to **both** the steer endpoint
and the chat session. The operator gets the conversational feel; the driver reads only the endpoint,
which carries owner identity. **The chat session is narration; the queue is authority.** The chat's
new job is the inverse of today's — the operator asks "why did you do X" and it answers **from the
ledger**. That finally makes `backend/peek.py` reachable (fully built, registered at
`backend/routes.py:412`, zero callers), and requires adding **exact** app paths to
`_MIXED_INTERNAL_API_PATHS` — full paths, never the `/api/apps/crew-manager` prefix, for the reason
spelled out at length in the existing precedent blocks in `dashboard/server.py`.

UI: reuse the existing composer with `scope: 'conductor'`. No new input surface.
`handleConductorSend`'s four branches become five, with the new one first in precedence and an actual
receipt — note branch 4 today has no receipt, no ack, and no reload.

---

## Durability

| Store | Contents | Protocol |
|---|---|---|
| `data/conductor/goals/<id>.json` | one goal + plan + leaf bindings each | fcntl lock, mkstemp → `json.dump` → `flush` → `fsync` → `replace_with_retry`, **all under `run_in_executor`** |
| `data/conductor/control.json` | running, mode, epoch, `operator_stopped`, `auto_stopped`, pid, heartbeat, `capability_nonce` | same |
| `data/conductor/runtime.json` | cooldowns as **absolute** `next_eligible_ts`, signature index, idle epochs, budget ledgers, breaker counters, WIP bindings `{goal→slot→branch→pr}`, plus the watcher's `_notified_at` / `_reasons` / settings moved out of process memory | snapshot **under** the in-memory lock, then write in an executor |
| `data/conductor/ledger.jsonl` | append-only; one `intent` + one `outcome` per action | append + fsync in executor; never rewritten; corrections are new rows referencing the original. Rotate at 8 MB, keep 10, in-memory index of the last 2000 by goal |
| `data/conductor/steer.jsonl` | steers with `consumed_ts` | append-only, idempotent by line offset |
| `data/conductor/operator.json` | migrated `snoozed`, `handled`, `goal-verdicts`, `goal-names`, `goal-semantic`, `report_only`, task-binding provenance | the I7 prerequisite |
| `data/conductor/plans/<goal>.json` | derived plan artifact | regenerable; version-stamped with the statement hash so an amended statement invalidates it |
| `data/conductor/HALT`, `disabled/<class>` | operator intent markers | presence only |
| `data/conductor/merge.lock`, `act.lock` | single-flight | fcntl with a busy contract |
| **localStorage** | pure UI prefs only (fold state, widths, tab, primary column) | decisions have moved out |
| Platform | slots, transcripts, approvals, autonudge (`~/.kiro/crew/autonudge.json`), crons, notifications | not ours, never duplicated |

**Copy `autonudge.py`'s write protocol literally, including the parts that look paranoid**, because
each one is a paid-for bug: `_persist_locked` snapshots under the loop lock then hands the write to
an executor (`:668-685`) — snapshot-outside-lock caused lost updates after restart, `fsync`-on-loop
froze chat and the heartbeat; `asyncio.shield` + a strong ref in an inflight set so a cancelled
caller cannot release the lock mid-write (`:578-617`, `:882-913`); `_load` that is **per-entry
fail-open** — a malformed record is skipped with a warning, never an abort (`:461-463`) — with
`_repair_number` clamping and catching `OverflowError` and `nan/inf` (a persisted `10**400` must not
become `inf`, which `json.dump` would then emit as invalid `Infinity`), and a dirty flag so a repair
is written **once** rather than re-derived every boot.

**Everything time-related is an absolute wall-clock timestamp, never a monotonic instant.** This is
precisely batty's unfixed bug: its intervention dedup state is `Instant`-based and in-memory, so a
daemon restart almost certainly re-fires every intervention once. Autonudge solved the same problem
with a persisted absolute `next_due_ts` and `_arm_from_deadline`'s three cases: fresh deadline when
zero; `delay = min(remaining, interval)` so a clock jump costs at most one interval; a small non-zero
`_OVERDUE_REARM_SECS = 10` beat when overdue so an actively-working session keeps deferring rather
than being hit the instant its turn ends, and a restart storm does not fire everything at t=0.

### Idempotency

`action_id = sha256(goal_id | action_class | target | signature | epoch_bucket)`.

Idempotent by construction: `context` (content-hashed), `get_or_create_slot` (by name),
`add_job_if_absent_async` (by predicate), `authorize_and_add_nudge` (`_add_locked` replaces per
slot), all reads. Not idempotent: `POST /api/chat`, `/continue`, `/run`, `POST /api/crons`,
`POST /api/spawn`. **Message sends have no platform-level dedupe**, so they are guarded by the same
signature-plus-cooldown mechanism that does dedup — one mechanism, two jobs, one place to get right.

For every non-idempotent call: **write the `intent` row and fsync it first, then execute, then write
the `outcome`.** `act.py` refuses a proposal whose intent row is not durable (I3).

### Restart recovery

`on_startup` → load `control.json` in an executor → **if `operator_stopped`, do nothing at all** →
rebuild the cooldown/signature index → **replay the ledger tail for `intent` rows with no
`outcome`** (that set is exactly the crash window) → reconcile each **by observing reality**: does
the slot exist, does `_find_by_slot` return a loop, does the cron predicate match, has the PR head
moved → write a `reconciled:{landed|lost}` outcome → only then arm the tick.

**Never re-dispatch on the assumption a thing did not happen.** An unresolved intent is `unknown`,
and unknown means reconcile.

**Slot-miss is not evidence of death.** The driver arms before the dashboard restores slots, so a
missing slot goes through `rehydrate_slot_from_history_async(state, key, adopt_closed=True)`
(`slack/gateway.py:4185`) before being treated as gone. `adopt_closed=True` because idle archival
also writes `closed`. Skipping this is how a restart orphans every driver session.

Recovery is **artifact-based** by design: read the goal files and the ledger, re-derive intent. That
is the only recovery style that survives a model or prompt change mid-goal, which is why long-horizon
coding agents converge on it. A 60s tick over durable files needs no Temporal and no checkpointer.

### The ledger record — BSC4's fields, adopted literally

```
{ ts,                          # date and time
  actor: "conductor",          # user identification
  actor_epoch, mode, authority_level, capability_nonce,
  phase: "intent"|"outcome"|"would_do"|"reconciled",
  action_id,                   # pairs intent <-> outcome
  action_class,                # type of event
  target: {kind, id},          # identity of affected resource
  goal_id, leaf_id,
  origination: {step, trigger, facts_hash, signature},   # origination of event
  reasons: [...],              # NON-EMPTY. machine-derived, plus at most one model line
  gates: {name: pass|fail|skip},
  idempotency_key,
  outcome: ok|failed|refused|superseded,                 # success/failure indication
  error, compensation_ref }
```

Four enforced invariants: a `Proposal` **cannot be constructed with an empty `reasons` list**;
`act.py` refuses any proposal whose intent is not fsynced; every action produces exactly two rows
sharing an `action_id`; **the ledger is written in every mode, including `advisory`.** Every
authority-carrying action also emits `sel().log_tool_invocation(..., critical=True, ...)` with a
**distinct operation name** (`conductor.session_start`, `conductor.session_continue`,
`conductor.nudge_arm`, `conductor.cron_create`), offloaded to an executor and awaited so ordering and
exception propagation hold. Distinct names are the point: **an autonomous act must never be
indistinguishable in the audit log from an operator's click**, which is exactly what the in-process
import path would otherwise produce.

---

## Guardrails

Borrowing batty's intervention discipline explicitly. Its six typed interventions each run a
**five-layer suppression stack**, in order, and every layer exists because something went wrong once:

```
1  global pause marker            .batty/paused          ->  data/conductor/HALT
2  per-type disable marker        .batty/nudge_X_disabled ->  data/conductor/disabled/<class>
3  idle grace                     intervention_idle_grace_secs (default 60s)
4  no-pending-input gate          ready_for_idle_automation
5  signature dedup, THEN cooldown (signature first: cheaper, and it is the check that
                                   expresses "nothing has changed")
```

Plus the two hard-won subtleties that are worth more than the table:

- **Self-generated messages must not count as "pending inbox."** batty's
  `member_has_pending_inbox` ignores its own `IdleNudge`/`StatusUpdate` classes
  (`interventions/mod.rs:130-152`). Without this the daemon's own nudge sits in the inbox forever and
  **permanently suppresses the gate that would have acted** — autonomy deadlocks itself. Tag every
  conductor-originated turn (`source`, `linked_session_key`, ledger row) and exclude tagged turns
  from liveness and "operator is engaged" computation. Fail **closed** on a read failure: do not
  intervene when uncertain.
- **The stalled lane bypasses layers 3 and 4** (`dispatch.rs:160,172-176`), because idle-only
  triggers structurally cannot see the false-working stall — and that is the most common real
  failure.

On top of that stack:

- **Escalation flood guard.** Key `escalate:<goal>:<target>`, 900s suppression, **and insert into the
  recent set even when suppressing.** batty's `dispatch/guard.rs:39-60` names the exact bug in its
  own comment: infinite escalation → drop → re-queue → escalation flood. Token bucket caps
  operator-facing escalations at ~6/hour; overflow becomes a digest. `group_key` on
  `NotificationPayload` so several collapse into one feed entry.
- **Thrash vs retry, asymmetric.** Signature `(action_class, target, error)`: identical
  tool+args+error ⇒ 1 retry, trip at 3. **Changed args or a changed strategy is allowed.** That
  asymmetry is what distinguishes retry from thrash. On trip, escalate *with the loop evidence*.
- **Cross-goal failure pattern.** Three sessions failing on one signature is a **plan** problem, not
  a session problem. Two thresholds from one counter: 3 ⇒ notify; 5 ⇒ stop dispatching into that
  goal and escalate.
- **Post-action budget re-check** after each turn completes, because budgets gate when turns *start*
  and a slow turn overshoots (`autonudge.py:1267-1284`).
- **Duplicate-work prevention.** `goalRouteTarget` already picks one member and never broadcasts —
  keep that. Add `predicted_paths` overlap and a `git merge-tree` preflight before launching a long
  leaf.
- **Autonudge collision.** One loop per slot is a hard platform limit. Before arming, check
  `_find_by_slot`; a loop we did not create means the slot is operator territory — refuse and
  escalate, never silently replace.
- **Gate-tampering detector** (`tamper.py`) as a hard precondition on any PR-shaped proposal: added
  skip/xfail/`.only` markers, assertion-only deletions, loosened numeric tolerances, raised
  timeouts, retry wrappers around the failing test, `continue-on-error`, removal of a job from the
  required-check matrix, edits to CI config, `.github/**`, or CODEOWNERS. **This is the guardrail no
  off-the-shelf tool provides and the one most specific to agent risk**, because the dangerous loop
  is not "the agent merges a bug", it is **the agent optimising the gate instead of the code**.
- **Flake-first triage.** Before any fix proposal, re-run the failing job once and check the failure
  against a flake history. A fix attempt against a flake is precisely how tests get gamed. A
  flap-damped URL is `unknown`, never `stable`.
- **No confidence score.** batty built one and then set its threshold to `0.0` with the comment
  "trust tests as the merge gate, not heuristic confidence scoring". Self-reported model confidence
  is the least reliable control available and the most over-trusted; the widely quoted 0.70-0.85 band
  has no primary source. Gate on deterministic checks, envelopes, and a reason list.
- **Tune from measurement, not intuition.** batty's own defaults record that its first
  `max_diff_lines` / `max_files_changed` "blocked everything". Increment 1's shadow ledger is the
  artifact we pick envelopes and cooldowns from.
- **Approval fatigue as a design target.** Pick a number — a handful of decisions per hour — and
  measure it off the ledger. Prefer plan-approval plus post-action review over per-call approval.
  If we generate more than a few prompts per run we have built a rubber stamp, and the promotion
  go/no-go should fail.
- **Kill switch:** `HALT` inside `gate()`, per-class markers, capability-nonce rotation on `kill`,
  and `operator_stopped` that no code path clears.
- **Audit:** the ledger, in every mode, with BSC4's fields and distinct SEL operation names.

---

## Failure modes

| Failure | Preventing mechanism |
|---|---|
| Blocking syscall in the tick **hard-exits the gateway** (25s watchdog, `exit=True`) | I9: lint/test failing on `open()`/`subprocess`/`realpath`/`fsync`/`is_sensitive_path` in the tick module set; per-step timeouts; every LLM call under a `REASON_TIMEOUT_SECS`-style cap |
| Nudge spam into one session | Five-layer suppression + one send per `failure_signature`, escalate on the second (R7's own rule) + autonudge's `notify_user_input` discipline (a human turn defers delivery without resetting the schedule) |
| Self-deadlock on its own messages | Tag conductor-authored turns; exclude them from liveness/idle/pending-input. Fail closed on read failure |
| Escalation flood | Suppression key + 900s + **insert even when suppressed** + token bucket + digest overflow |
| Duplicate work across a goal's sessions | `goalRouteTarget` never broadcasts; `predicted_paths` overlap check; `git merge-tree` preflight |
| Two loops acting at once (two goals, two ticks) | Single tick, single-threaded, one action at a time, `act.lock` fcntl with a busy contract |
| Two conductors (dev + prod gateway) | PID + heartbeat in `control.json`; refuse to tick if another epoch is heartbeating. Documented: fcntl is per-machine only |
| Autonudge collision with an operator's babysit loop | `_find_by_slot` check; refuse and escalate; never replace |
| Session spawn storm | per-goal `wip` + global driver cap + platform background semaphore + post-idle stabilization delay with `idle_since is None ⇒ hold` (fail closed) + `session_start` action cap |
| Session's question answered wrongly | Only `fact` grounded in the goal statement is autonomous; `decision`/`preference`/`unclear` escalate; approvals and `ask_question` are hard-DENY |
| Worker output prompt-injects the driver | I5. `judge.py` has `REJECT_ALL` and no authority; `act.py` reads only named validated fields; a hallucinated `fact` costs at most one continuation on a session the driver already owns, inside a budget, in the ledger |
| Steer used to escalate privilege | `policy.py` is the only authority source; hard-DENY request ⇒ `authority_refused` + operator surface. Unit-tested |
| Runaway cost | Four budgets (per-class actions, LLM calls, wall clock, USD) + `facts_hash`-gated deliberation + circuit breakers + non-progress detection. On exhaustion: escalate |
| Budget accounting bug lets it run forever | Wall clock anchored on persisted `activated_ts`; post-action re-check; the platform's own `run_background_turn` semaphore as an independent ceiling the driver cannot defeat |
| Restart re-fires everything | Absolute persisted deadlines + intent/outcome reconciliation by observation + repairs written once |
| Restart orphans every driver session | `rehydrate_slot_from_history_async(..., adopt_closed=True)` before treating a slot-miss as death |
| Operator STOP silently undone | `operator_stopped` vs `auto_stopped`; `HALT` checked inside `gate()`; nonce rotation on `kill` |
| Operator dismissals invisible, items re-raised, split goals re-clustered | I7: **migrated** to `data/`, not mirrored |
| False-working stall never noticed | Dedicated lane bypassing idle-grace and pending-input gates |
| Approval starvation on driver-owned sessions | Approval-age watchdog: escalate at T, stop dispatching into that goal at 2T. Needed regardless of whether `notify_approval_stalled` fires for our slots (OQ8) |
| Goal never terminates | Three independent termination forms, all required; only the operator sets `done` |
| Goal with no termination predicate | Empty `done_when[]` ⇒ stays `draft`, never dispatched for, with a teachable reason shown |
| Motion mistaken for progress | `facts_hash` unchanged for N deliberate ticks ⇒ `blocked` + escalate |
| Premature "done" from a model | I8: a model may veto, never satisfy. LLM verdict may close a leaf, never a goal. Verifier ≠ producer |
| CI flake treated as real, worker "fixes" it by weakening tests | Flake-first triage + `tamper.py` hard block + `paths_deny` defaults |
| Stale-state merge | Merge is hard-DENY. The staged proposal re-reads with `refresh: true` and pins `head_sha`; a moved SHA invalidates rather than updates |
| Self-approving merge machine | `pr_review: APPROVE` and `pr_automerge` are both hard-DENY. The host exposes approve-then-arm from one identity; we refuse to hold both, ever |
| Bulk merge fan-out | Merge excluded from every bulk path, per the existing in-tree precedent ("a merge is irreversible, and 50 of them from one click is a blast radius no confirmation makes reasonable") |
| Audit indistinguishable from an operator click | Distinct SEL operation names + `actor: conductor` + mode + reasons. BSC4's six required fields |
| Secrets in the ledger | `watcher.py:80 _redact` + the `authorize_and_add_nudge` redaction chain on every logged payload. BSC4 anti-pattern |
| Unhardened `gh` foothold | `backend/prchecks.py` **deleted**. All provider reads go through the platform's `_run_json` / `github_runner.py` |
| Unaudited merge path via a scheduled shell command | `cron_command` is hard-DENY; conductor crons are message-only and created paused |
| Board drift: Python ranking vs TypeScript ranking | We never port the ranking. The driver reasons over facts; the UI renders the ledger |
| Conductor context flood | `_MAX_CONTEXT_PER_SOURCE = 10` ⇒ 429. One batched rollup per goal-tick under a dedicated `source`; a 429 is a hard signal to fall back to the bell, never retried |
| Slack/Telegram collision — driver injects while a human is DMing | autonudge's deadline-preserving discipline; never dispatch while `slot.running` or `_in_stage_execution`; honour `binding_key_for`'s refusal to touch `cron:`/`subagent:`/`hook:` sessions |
| SEL unwritable | Audit-or-deny: no audit ⇒ no start, no authority-carrying action. 503 with a named reason |
| Provider / store / bus failure | Optional-subsystem circuit breaker; `CronStoreBusy` retryable by contract |

---

## Delivery plan

Nine increments. **The first four grant zero new authority.** Every one ships something the operator
can see. Rollback for each is "set mode back to `advisory`" or "delete the marker file", except
Increment 0 whose rollback is reverting the manifest hook.

### Increment 0 — Gate zero: give an app a host handle at startup

**This is not a bug fix and must not be framed as one.** `backend/watcher.py:9-12` documents the
lazy arming as *deliberate* — "an app that is installed but never opened costs nothing". Increment 0
is a **behaviour change made for autonomy**, and it should be reviewed as one.

The blocker is real and verified: `AppContext` carries only `name`, `data_dir`, `config`, `logger`,
`cron`, `events`, `storage`, `spawn`, `health` (`apps/context.py:50-67`, `build_app_context` at
`:70-130`). `LifecycleDispatcher.dispatch_startup` builds that same ctx and passes only it
(`apps/lifecycle.py:42-58`). The route-registration function is also called as `register_fn(ctx)`
with no aiohttp app (`apps/route_registry.py:150`). There is no module-global `DashboardState`
anywhere in `dashboard/`. **So an `on_startup`-armed loop can reach cron, events, storage and spawn,
but cannot reach `state._slots`, `get_or_create_slot`, or the autonudge authz chokepoint.** Today's
watcher works only because it captures `state` from `request.app["state"]` on the first HTTP request.

Two candidate seams, either acceptable, both cross-package:

- **A.** Thread the host handle into `build_app_context` behind a new `permissions.host: true`,
  mirroring exactly how `cron`/`spawn`/`storage` are gated. Touches
  `KiroCrew/src/kiro_crew/apps/context.py`, `apps/lifecycle.py`, `apps/hooks_integration.py`,
  `apps/manifest.py`, `dashboard/server.py:2671`.
- **B.** Have `register_app_routes` call an optional `bind_host(app)` symbol on the freshly loaded
  app module. `AppRouteRegistry` already holds `self._app` (`route_registry.py:111-112`) and `state`
  is live in the closure at `dashboard/server.py:2660-2683`.

**Contingency if KiroCrew owners refuse both:** an app-owned cron (`permissions.cron: true`) whose
message pings a conductor-owned session, arming the loop through a real HTTP request. This works and
is ugly — it burns an agent turn to arm a Python loop. **Treat it as temporary, not as the answer.**
Second contingency: `ctx.spawn` is populated from `permissions.spawn` and is reachable from a startup
hook with no state handle, so a spawned subagent is a work primitive of last resort.

Also in this increment, all of which is independently defensible: collapse the four exclusion copies
into one predicate with `report_only` and `conductor_owned` flags; **delete `backend/prchecks.py`**;
wire or delete `backend/peek.py`; refresh `docs/audit.md`; fix the false README claim's phrasing to
match reality until Increment 4 makes it true.

**Acceptance check:** stop the gateway, start it, open nothing. Confirm from the log that the tick
armed and completed at least one observe pass with a live `state` handle, and that stall/error-loop
notices fire with no browser ever opened.

### Increment 1 — Ledger + mode object + shadow tick. Zero actions.

`ledger.py`, `policy.py` (table only), `intents.py`, `decide.py` returning proposals, mode predicates
replacing the nine restraint call sites, `GET /conductor/state` and `/conductor/ledger`, a Conductor
tab timeline. Executes nothing; emits only `would_do` rows. Watcher settings and dedup memory move
from process memory into `runtime.json` via `store.py`. `sweep()` splits into named steps with the
three error wrappers.

**Runs for at least a week before Increment 3 promotes anything.** This is the tuning artifact and
the promotion evidence.

**Acceptance check:** the operator can read "what I would have done, and why" continuously, with a
non-empty reason list on every row, and can call `POST /conductor/tick?dry_run=1` from a test.

### Increment 2 — Goals become declarations, and dismissals move out of the browser

`goals.py` with `done_when` / budgets / authority / `scope`, one file per goal, the `goals.json`
importer, `backend/operator_state.py` and the **localStorage migration** (I7 prerequisite),
`watchedSessions` → durable task-binding provenance, the goal declaration form.
Shadow proposals become goal-scoped and cite the goal statement.

**Acceptance check:** goals stop being display-only before any action exists — the operator's intent
is written somewhere the driver reads. Close the tab, restart the gateway, and confirm no
previously-snoozed item is re-raised and no split goal is re-clustered.

### Increment 3 — START / HOLD / STOP / KILL / STEER + `assisted` mode

`control.py`, `gate.py`, `act.py` executing **only operator-approved** proposals, `HALT` marker
inside `gate()`, capability nonce, `budget.py`, `breaker.py`, proposals rendered as Approve/Reject
cards reusing the existing approval-card component, the steer box, spec/doc amendments.

**One-click execution of driver decisions. Real value, zero autonomy. Live here for weeks.** The
go/no-go for Increment 4 is measured from here, off the ledger: approve rate per class, override
rate, time-to-decide, escalations per hour.

**Acceptance check:** double-clicking STOP is a no-op, not a 500. `touch data/conductor/HALT` stops
an action mid-tick. A steer saying "just merge it" produces `authority_refused` and a visible
"that requires you" message.

### Increment 4 — First autonomy: two classes

`context_inject` and `session_continue` only, with goal membership required, idle + stalled required,
one send per signature, escalate on the second, per-day caps, the false-working-stall lane, the
self-message exclusion, post-action budget re-check. Fix `README.md:12` in this PR.

**This satisfies R7's first clause** ("supplies the fact and the work continues") **and R7's
repeated-stall clause simultaneously**, for the first time.

**Acceptance check:** a session stalled overnight on a fact present in the goal statement is moving
by morning, with two ledger rows and one reason list explaining it. The same session stalling the
same way twice produces an escalation, not a second nudge.

### Increment 5 — Loops and schedules

`loop_arm` via `authorize_and_add_nudge` with mandatory non-zero `max_cycles` and `max_runtime_secs`;
`cron_create` via `add_job_if_absent_async`, created `user_paused=True`; `permissions.cron: true` so
jobs carry `created_by` and get uninstall teardown. Both `propose` initially; `loop_arm` graduates
after a go/no-go.

**Acceptance check:** a driver-armed loop appears in the existing autonudge UI with a visible cap, an
operator's existing loop on the same slot is never replaced, and a driver cron is created disabled.

### Increment 6 — Dispatch: create sessions

`session_create` with per-goal WIP, stabilization delay (`idle_since is None ⇒ hold`), path-overlap
precheck, explicit `origin`, `linked_session_key`, worktree binding, plus the bounded planner
(depth ≤ 2, ≤ 12 leaves). **Blocked on OQ2 and OQ3** — settle both before this increment is
*designed*, not during it. Propose-only at first.

**Acceptance check:** a driver-created session is visible on the operator's board, is attributable to
its goal, and appears in the ledger before it exists.

### Increment 7 — PR monitoring that works headless

Fix the owner-WS-gated status pipeline first (**OQ4**); build `prreg.py`, a PR registry independent
of transcript scanning, because `_SERIALIZED_SOURCE_LINKS_PER_SLOT = 3` makes PRs 4..N of a busy
session invisible to both the board and the refresh scheduler; two-lane refresh — goal-bound PRs on
the deliberate tick, everything else on a 5-minute slow lane, which is what makes the 90-URL vs
64-batch-cap arithmetic work; kill the never-invalidating client cache
(`src/index.tsx:2605` skips any URL already cached, with no invalidation, so detail is frozen until
page reload). Read-only.

**Acceptance check:** with no browser open, the driver reports a PR going red within one deliberate
tick, and a flapping URL reads as `unknown` rather than `stable`.

### Increment 8 — PR writes, propose-only, plus merge staging

`pr_comment` with an envelope and a reason list; `tamper.py`; `MergeProposal` with evidence,
head-SHA pin, soak window, allowed-state gate, single-flight lock, bulk exclusion.
**The operator still clicks.** `pr_review` and `pr_automerge` stay hard-DENY.
**Requires an ARCC re-query and a dedicated security review before implementation** (OQ12).

**Acceptance check:** a PR that went green by adding `@skip` is blocked with the tampering evidence
named. A staged merge proposal whose head SHA moved is invalidated, not silently updated.

### Increment 9 — Digests, retros, verification pass

Per-goal standup digest; goal retro sourced from the ledger with trivial-retro suppression (a goal
completed in four minutes with zero session work generates no report); the cross-goal
failure-pattern tier; and the **independent verification pass via `ctx.spawn`** — `SpawnSDK.run(task,
agent, …)` plus `is_done` (`apps/spawn_sdk.py:76,92`) is the natural home for a verifier that is
structurally not the producer, and it is the only work-creating primitive reachable from a startup
hook with no state handle. Check OQ9 first.

**Acceptance check:** the operator gets one digest per goal per period, not one bell per finding, and
a goal's completion claim is verified by a pass that did not do the work.

---

## What we are NOT building

1. **A Python port of `model.ts` ranking.** Two implementations that drift is exactly what the spec's
   "answers from the same understanding" clause and `model.ts:1105-1117` forbid. The driver reasons
   over facts; the UI renders the ledger. Two objective functions over one fact layer: the board
   ranks for **human attention**, the driver decides for **goal progress**. Those are different
   questions. If ranking is ever needed server-side, move it wholesale and make the UI a renderer —
   a different, larger project.
2. **Autonomous merge, and autonomous auto-merge arming.** The five reasons are in the authority
   section. **This is a genuine partial no to "creating, monitoring, and merging pull requests as
   needed" and needs explicit owner sign-off, not burial in this list.** What is delivered: the
   session opens the PR as part of its work, the driver monitors it and stages a landing proposal
   with evidence, and the operator clicks.
3. **PR creation.** No host endpoint exists anywhere in the gateway. Both in-tree implementations are
   private to other apps. And a PR created out-of-band is invisible to the board because discovery is
   transcript-scanning. The correct answer is that a session creates it and the URL lands naturally.
4. **Answering tool approvals or `ask_question` cards.** Owner-gated by design; in-process would
   forge owner identity and make an agent decision indistinguishable from the human's in every
   downstream consumer. R7 sends these to the developer and we keep it.
5. **Any shell for the driver, cron `command`, or a second `gh` spawner.** Three doors to the same
   room; all three stay shut. `_vet_shell_command` is a denylist with no executable allowlist. A
   wildcard shell allow voids every other rule in the policy.
6. **A separate daemon process, and (in v1) the child-process brain.** The first is strictly less
   capable; the second has no sanctioned outbound channel, so its described control flow is backwards.
7. **Temporal / DBOS / a durable-execution engine.** The binding constraint is a single event loop and
   a JSON+fcntl durability idiom, not throughput. They would also put LLM non-determinism into
   replay-sensitive code.
8. **A new scheduler.** KiroCrew's cron layer is strictly more capable than anything we would write:
   jitter with `strict_schedule` opt-out, `skip_dates`, timezones, result-hash dedup,
   `consecutive_failures` auto-pause at 5, agent sequences, fcntl store with a 409 busy contract. The
   driver **owns cron jobs**; it does not schedule.
9. **A reimplementation of autonudge's timer.** It already solved deadline preservation, restart
   re-arming, cycle/runtime budgets, approval-stall detection, and the fire-window race. One loop per
   slot is a real limitation and the answer is to **yield the slot to the operator**, not fork the
   store.
10. **Recursive decomposition past depth 2, and any subtask spawning subtasks.** The documented
    AutoGPT death spiral.
11. **A heuristic confidence score.** Built and defused in the prior art; poorly calibrated; the
    quoted threshold band has no primary source.
12. **A general "Undo" button.** We ship a *classification* — reversible / compensatable /
    irreversible / refused — and honest labelling, with each compensatable action's compensation
    recorded in the ledger at dispatch time, pre-defined rather than improvised during an incident.
13. **A cross-session dependency model.** The platform has none. `depends_on` gates dispatch, is
    Conductor-local, and never appears in a "why" sentence.
14. **Worktrees beyond leaf binding.** Needed mainly for autonomous PR creation, which we are not
    building. `POST /api/worktree/create` is owner-gated and project-scoped anyway. Note what
    worktrees do *not* give you: semantic conflict avoidance, runtime isolation (ports, DBs, `.env`),
    or a security boundary.
15. **Role theater.** No "QA agent" / "reviewer agent" personas. "Disobey role specification" is a
    measured failure mode; roles are not a reliability mechanism. Split by **task shape** instead:
    isolated parallel workers for independent read-heavy leaves, a single serialized thread for
    anything writing a shared artifact.
16. **Unconditional reflection.** Reflect on trigger only — tool failure, plan deviation, failed
    validation, risky action — with a round cap. Reflect-every-turn is a measured cost and quality
    regression.
17. **Slack/Telegram steering.** Notifications out only. The spec's existing claim about a Slack
    fan-out is factually wrong (`docs/audit.md:138-148`) and should be corrected, not built on.
18. **A general "the Conductor can call arbitrary app HTTP" surface.** Exact paths in
    `_MIXED_INTERNAL_API_PATHS`, never the app prefix.
19. **Binding the shipped agent spec as a control.** The 53-line restraint prompt has never been in
    effect. Bind it later for conversational *tone*, after OQ6 round-trips. It is never load-bearing.

---

## Open questions

Each with the cheapest experiment that settles it. **OQ1 is gate zero. OQ2 and OQ3 block Increment 6.
OQ11 needs an owner decision before any of this is scheduled.**

| # | Question | Cheapest experiment |
|---|---|---|
| **1** | Will KiroCrew owners accept a host handle in `AppContext` (`permissions.host: true` threaded through `build_app_context` / lifecycle / hooks_integration / manifest / `server.py:2671`) or a `bind_host(app)` symbol called from `register_app_routes`? | A 40-line spike implementing seam B (smaller blast radius) plus a one-paragraph design note to the owners. If refused, fall back to the cron-ping contingency and record it as temporary debt |
| **2** | Do app-owned (`unattended`, `is_restricted`) driver slots appear on the operator's board under `permissions.events: ["slots"]` scope? | Create one slot with `app="crew-manager"` by hand from a route handler and look at the board. Ten minutes. **This single answer decides the app-ownership fork and if it is "no" it blocks Increment 6 outright** |
| **3** | Is `state.get_or_create_slot` safe from a background task with no request in flight — hidden request-object assumptions, and does `schedule_eager_spawn` behave sanely? | Call it once from `on_startup` behind a debug route and inspect the resulting slot. Signature verified at `state.py:4817-4830` but nobody has executed it from a background context. **The riskiest single assumption in the dispatch pillar** |
| **4** | Is there **any** browser-independent PR/CI status refresh path? Two confirmed obstacles: `refresh_slot_source_status` early-returns when `_owner_ws_clients` is empty, and `watcher.py:230` calls `to_dict()` with no args so `include_check_status` is `False` | Read `refresh_slot_source_status` / `schedule_check_refresh` internals, then call the batch status endpoint from a background task with no browser open. **If a browser is structurally required, Increment 7 collapses to "propose, and tell the operator to open the tab" — and the owner needs to know that before it is scheduled** |
| **5** | Real semantics, auth model, and turn-budget accounting of `/api/chat/slots/{slot}/side/open\|turn\|close`? | Read `dashboard/handlers/side.py` end to end (one sitting), then open a side turn on a running slot. **If it holds, it replaces several `session_continue` actions with something strictly less invasive, which materially shrinks the day-1 authority grant** |
| **6** | Does `agent: "crew-manager/crew-manager-conductor"` actually resolve on `POST /api/chat/slots`? `bridges.py:921` writes that namespaced name to disk but `resolve_agent_bindings` was never traced, and there is a known precedent where a wrong agent name passes charset validation and silently binds nothing | Create a throwaway slot with that agent and inspect the bound tool surface. Until it round-trips, **the shipped 53-line restraint prompt is dead configuration** — which also means nobody may claim this feature "relaxes" it |
| **7** | Is `stream_and_collect` safe as an ephemeral-session-per-tick pattern at 60s cadence from a background task? The only existing caller is a request-scoped handler (`backend/routes.py:289-390`) | Run it on a 60s timer from a debug route for an hour and watch session count, file handles, and memory. **Load-bearing for every LLM judgement in the design** |
| **8** | Does `notify_approval_stalled` fire for `origin=SYSTEM` slots? | Create one, trigger an approval, let it time out, watch for the loop-stop. If not, the driver needs its own approval-age watchdog — which per this plan it should have regardless, since an approval parked for 2h on a driver-owned session silently consumes a WIP slot all night |
| **9** | Do spawned subagents inherit a shell? If `spawn_run` / `spawn_sub_agents` grant one, **that is an unenforced `gh pr merge` path that exists TODAY**, independent of this feature | Read the spawn tool's tool-inheritance rules, then spawn one and ask it to run `echo`. **Check this whether or not the feature ships.** Also bears directly on the Increment 9 verifier |
| **10** | Which KiroCrew build is actually installed on the operator's gateway? The app passes `slotControls` and `aboveComposer` to `ChatEmbed`, which the checked-out `app-sdk/ChatEmbed.tsx:59` does not accept — TypeScript is satisfied only by the app's own ambient `src/host.d.ts` | Read the installed SDK version off the running gateway. Any new Start/Stop/Steer control's rendering is unverified until this is pinned |
| **11** | **Does the owner accept the scope refusal?** There is no PR-create endpoint anywhere in the gateway, and merge stays an operator click. So "creating, monitoring and merging pull requests as needed" is delivered as: the session opens the PR, the conductor monitors it and stages a landing proposal, and the operator clicks | A five-minute conversation with the owner, before Increment 7 is scheduled. This is a product decision, not an engineering one |
| **12** | ARCC re-query against the concrete implementation at the merge-staging / tamper-detector / `paths_deny` stage | `search_arcc` against the actual diff at Increment 8, plus a security review. BSC4 and BSC2 are already adopted; the gap is that ARCC covers no in-gateway autonomous daemon, so that reasoning is standard practice rather than cited guidance and needs a second look once it is code |

Additional smaller unknowns, flagged rather than scheduled: `state.sessions.stop_turn` /
`SessionManager` internals are inferred from call sites (observed outcomes `"soft"`, `"hard"`,
`"idle"`); `ctx.cron` behaviour after flipping `permissions.cron` (the `CronSDK`'s `_assert_owned`
and `remove_all` teardown are read but not exercised); whether
`sandboxed_spawn_argv(..., mode="standard")` permits a write-shaped `gh api -X PUT`; native GitHub
merge-queue availability for the target repos.

---

## Prior art, credited concretely

**From batty** (`/home/zedmor/workplace/batty`):

- **`tick()` factored out of the sleep loop** so it can be called once from a test
  (`daemon/poll.rs:246`, with its own explanatory comment). The single most portable idea in the
  whole system, and free.
- **Three-tier failure isolation** — critical / recoverable / optional-subsystem with a circuit
  breaker at 5 errors per 600s and backoff `[60, 300, 1800]`s (`daemon/error_handling.rs:24,45,70`).
- **The five-layer suppression stack** on every typed intervention: global pause marker → per-type
  disable marker → idle grace → pending-input gate → signature dedup then cooldown.
- **Self-message exclusion from the pending-inbox signal** (`interventions/mod.rs:130-152`) — its
  hardest-won subtlety, and the bug that makes an autonomous loop deadlock itself.
- **The stalled-lane escape hatch** that bypasses idle-grace and pending-input
  (`dispatch.rs:160,172-176`), because idle-only triggers cannot see a false-working stall.
- **Escalation flood guard that inserts into the recent set even when suppressing**
  (`dispatch/guard.rs:39-60`, whose comment names the exact escalation→drop→requeue→flood bug).
- **`predicted_files` overlap before concurrent dispatch** (`dispatch/queue.rs:265,393,424`) — the
  cheapest merge-conflict prevention available.
- **Post-idle stabilization with `idle_since == None ⇒ hold`** (`dispatch/stabilization.rs:9-19`),
  fail-closed.
- **WIP counting that charges review load against capacity** (`dispatch/wip.rs:10-36`) — easy to
  forget.
- **Auto-merge as a decision *record with a reason list*, not a bool** (`auto_merge.rs:404-524`,
  `explain_auto_merge_decision:558`).
- **`workflow_mode` staging with named predicates at call sites rather than mode-string comparisons**
  (`config/types.rs:679-726`) — why adding a mode later was cheap. We cap at three because its docs
  promise three and its code has four.
- **Marker files for operator intent** (`session.rs:24-90`), including per-type disable granularity.
- **Standups scoped to direct reports, retros with trivial-retro suppression**
  (`standup.rs:219-258`, `retrospective.rs:626-680`).
- **Cross-goal failure-pattern detection with two thresholds from one counter**
  (`failure_patterns.rs:198-262`).
- **Deliberately not copied:** its audit log gated behind the rollout flag (`telemetry.rs:945-947`) —
  we invert it; its heuristic confidence score, built then defused to `0.0`; `bail!` on redundant
  pause/resume; `Instant`-based in-memory dedup state that re-fires on restart; `create_new` lock
  files with no staleness check; markdown-as-database for runtime state; tmux/pane screen-scraping;
  its own cron recurrence model. From its recurrence we take exactly two ideas: **clear transient
  fields on recurrence** (a recurring driver task must reset slot/worktree/PR bindings or run N+1
  inherits run N's state) and **enforce "not yet" in two independent places**.

**From KiroCrew itself** — the reuse discipline that makes this small:

- `autonudge.py`'s **entire write and restart protocol**, copied literally: snapshot-under-lock then
  executor write, `asyncio.shield` + strong ref, per-entry fail-open load with `_repair_number` and a
  once-written dirty flag, absolute `next_due_ts`, `_arm_from_deadline`'s three cases,
  `stopped_reason` vocabulary, `notify_user_input` deferring delivery without moving the deadline,
  and the post-delivery budget re-check.
- `authorize_and_add_nudge` as the **loop chokepoint**, inheriting redaction, the 8000-char cap, the
  runtime ceiling, and audit-or-deny.
- `add_job_if_absent_async` for crons — existence check plus append under one lock, versus
  `POST /api/crons` minting a new id per call.
- The cron store's **`user_paused` vs `auto_paused` split** (`cron.py:232-235`).
- `backend/routes.py:289-390`'s **ephemeral session with `REJECT_ALL` + release-and-destroy** as the
  LLM subroutine pattern.
- `backend/detect.py`'s existing pure detectors and `failure_signature`.
- `slack/gateway.py:4185,4208,4246-4252`'s dispatch discipline: rehydrate before assuming death, skip
  when running, `spawn_guarded_turn` + `run_background_turn`.
- `_BULK_PR_ACTIONS`' deliberate omission of merge, ported rather than re-derived.

**From the external research:**

- **Orchestrator-worker with isolated worker contexts and self-contained task specs**, and its
  ~10-15x token premium — which is why we spend it only on genuinely independent leaves and default
  to a single thread for anything writing a shared artifact.
- **Cognition's counter-position** on context fragmentation, which is the reason work is split by
  *task shape* rather than by role.
- **Anthropic's long-running-harness pattern**: external artifacts are the memory, compaction is a
  supplement. This is why plans are files and recovery is artifact-based.
- **MAST's 14 failure modes** as a free test suite, designed against by name: FM-1.3 step repetition
  (non-progress hash), FM-1.5 unaware of termination (`done_when` required to activate), FM-3.1
  premature termination, FM-3.2/3.3 missing or incorrect verification (I8, verifier ≠ producer).
- **HITL: gate in the tool layer, not the agent's judgment**; risk-tiered gates; the five distinct
  gate shapes; **pause ≠ cancel** and therefore idempotency keys on every side effect; approval
  fatigue as the dominant failure and EU AI Act Art. 14 treating automation bias as a design
  obligation.
- **The lethal trifecta / Rule of Two** — private data, untrusted content, ability to act: at most
  two. This is the split between `judge.py` and `act.py`.
- **Incident record** (Replit/SaaStr, Cursor): valid credentials, excessive authority, and a violated
  constraint that existed only as prompt text. Also: the agent then misreported what it had done, so
  **never trust agent self-report as the audit record** — log at the tool boundary.
- **Autonomous-PR practice**: gate on the *merged result* not the branch; bare `--auto` waits only on
  *required* checks; soak windows (Renovate's `minimumReleaseAge`, transplanted); volume throttles;
  flake quarantine before any autofix; and the gate-gaming catalogue that `tamper.py` implements.
  GitHub Copilot's coding agent — the most resourced real implementation — deliberately keeps two
  mandatory human gates. We keep one.

**From ARCC:** BSC4 Security Event Logging's six required log fields, adopted verbatim as the ledger
schema, and its "never log secrets or PII" anti-pattern, which forces the redaction chain. BSC2
Contingent Authorization's application-level CAZ framing, which is the governance name for
`assisted` mode and the reason merge staging keeps an operator click.
