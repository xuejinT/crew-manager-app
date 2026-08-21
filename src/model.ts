import type {
  Artifact,
  AssignedWork,
  ChatSlot,
  CronJob,
  MonitorLoop,
  SessionSummary,
  ErrorLoopFinding,
  StallFinding,
  SummaryIntent,
  SummaryNextStep,
} from './types'

/** Mirrors backend/detect.py's describe_silence so both surfaces read alike. */
export function describeSilence(silentSecs: number): string {
  const minutes = Math.max(1, Math.floor(silentSecs / 60))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours} hour${hours === 1 ? '' : 's'}`
  return `${hours}h ${rest}m`
}

export type WorkState = 'needs-you' | 'running' | 'done'
export type WorkAction = 'reply' | 'review-approval' | 'open' | 'discuss' | 'resume'
export type WorkReferenceKind = 'session' | 'approval' | 'agent' | 'workflow' | 'monitor' | 'artifact' | 'change' | 'issue'
export type WorkCopyKey =
  | 'session'
  | 'approval'
  | 'agent'
  | 'workflow'
  | 'monitor'
  | 'artifact'
  | 'approval_waiting'
  | 'subagent_gate_waiting'
  | 'information_needed'
  | 'decision_ready'
  | 'work_in_progress'
  | 'linked_change_issue'
  | 'recent_work_ready'
  | 'approval_needed_for'
  | 'approval_needed'
  | 'tool_call_waiting'
  | 'agent_work'
  | 'agent_done'
  | 'agent_failed'
  | 'workflow_failed'
  | 'workflow_failed_generic'
  | 'workflow_running'
  | 'workflow_finished'
  | 'workflow_fact_last_log'
  | 'workflow_fact_phase'
  | 'workflow_fact_error'
  | 'workflow_fact_agent_errors'
  | 'workflow_fact_partials'
  | 'workflow_step_diagnose'
  | 'workflow_step_why_error'
  | 'workflow_step_why_generic'
  | 'workflow_step_expect_partials'
  | 'workflow_step_expect_generic'
  | 'monitor_failed'
  | 'monitor_running'
  | 'monitor_next_check'
  | 'loop'
  | 'loop_watching'
  | 'loop_watching_capped'
  | 'artifact_ready'
  | 'stalled_for'
  | 'stalled_because'
  | 'duplicate_same_change'
  | 'duplicate_same_artifact'
  | 'duplicate_same_deliverable'
  | 'duplicate_same_topic'
  | 'duplicate_same_step'
  | 'related_sessions'
  | 'related_same_change'
  | 'related_same_artifact'
  | 'related_same_deliverable'
  | 'related_same_topic'
  | 'related_same_step'
  | 'related_more'
  | 'rank_approval_owed'
  | 'rank_subagent_gate'
  | 'rank_input_requested'
  | 'rank_unverified_completion'
  | 'rank_error_loop'
  | 'rank_changes_requested'
  | 'rank_run_failed'
  | 'rank_stalled'
  | 'rank_assigned_to_you'
  | 'rank_change_blocked'
  | 'rank_merge_ready'
  | 'rank_nobody_on_it'
  | 'owned_pull_conflict'
  | 'owned_pull_failing'
  | 'owned_pull_changes_requested'
  | 'owned_pull_merge_ready'
  | 'owned_pull_awaiting_review'
  | 'owned_pull_checks_running'
  | 'owned_issue_assigned'
  | 'owned_provenance'
  | 'no_next_step'
  | 'rank_queued_behind'
  | 'rank_waiting_a_while'
  | 'rank_nothing_pressing'
  | 'rank_join'
  | 'error_loop'
  | 'untitled_work'
  // The summary card's own chrome. Frontend strings, but kept in the copy table
  // with everything else so display English lives in exactly one file.
  | 'card_asked_for'
  | 'card_where_it_stands'
  | 'card_suggested_next'
  | 'card_turn'

export type WorkCopy = (key: WorkCopyKey, values?: Record<string, string>) => string

export interface WorkReference {
  kind: WorkReferenceKind
  id: string
  label: string
  url?: string
  sessionKey?: string
  /**
   * The PR's OWN status (checks failing / conflict / merged / open) — a different
   * axis from the work item's state. A PR group is organized by the change, so its
   * header shows the change's status, not a needs-you/running/done badge.
   */
  status?: string
}

/** Short, human status for a linked change, or undefined for a plain open PR/issue. */
export function changeStatus(link: { ci?: string; mergeable?: string; state?: string }): string | undefined {
  if (link.state === 'merged') return 'merged'
  if (link.state === 'closed') return 'closed'
  if (link.mergeable === 'conflicting') return 'conflict'
  if (link.ci === 'failed') return 'checks failing'
  if (link.ci === 'pending') return 'checks running'
  return undefined
}

export interface WorkItem {
  id: string
  title: string
  summary: string
  state: WorkState
  issue: boolean
  updatedAt: number
  references: WorkReference[]
  sessionKey?: string
  /**
   * The id of the work item that SPAWNED this one, when the platform knows it: a
   * loop's owning session, an artifact's session, a subagent's parent.
   *
   * Recorded provenance is worth more than every title heuristic, because it is a
   * fact rather than a guess — grouping a spawned item with its parent is a graph
   * edge, not an inference. Absent whenever the parent is not itself on the board;
   * it is deliberately an ITEM id, never a bare session key, so the edge either
   * points at something groupable or is not there at all.
   */
  parentId?: string
  provenance: string
  action?: WorkAction
  /**
   * The request that OPENED this goal, in the user's own words, as the platform
   * recorded it (`SummaryIntent.initial_intent`).
   *
   * Deliberately a field of its own rather than a reuse of `summary`. The two
   * answer different questions: `summary` is the one line describing the item
   * NOW, and it falls back through next step, then latest progress, and only
   * then to this — so reading the original ask out of it is right by accident on
   * some items and wrong on most. This field is only ever the original ask,
   * which is what lets a card quote it verbatim. Present only for summarized
   * intents.
   */
  initialIntent?: string
  /** Suggested next steps, present only for summarized intents. */
  nextSteps?: SummaryNextStep[]
  /** What already happened on this intent, newest last. */
  progress?: string[]
  /** True when the summary predates the session's latest turn. */
  stale?: boolean
  /** Highest user turn this intent covers; orders goals within one session. */
  lastTouchedTurn?: number
  /** Total user turns in this item's session, for the card's "N turns" meta. */
  sessionTurns?: number
  /** Every PR/issue the SESSION touches — for the card's PR line, which is not
   *  limited to the changes this one intent's text happens to name. */
  sessionChanges?: WorkReference[]
  /**
   * True only when work is genuinely in motion right now. A `running` item that
   * is NOT moving is open work nobody is currently on.
   */
  moving?: boolean
  /**
   * True only while an optimistic acknowledgement is standing: the user sent an
   * instruction and the platform has not yet reported the session as running.
   */
  instructed?: boolean
  /** Marks a goal nobody is on: idle work only the user can move forward. */
  unattendedGoals?: number
  /**
   * Other live work that appears to be the same job. Advice only: it never moves
   * the item or changes its state.
   */
  duplicateOf?: { sessionKey: string; title: string; because: GoalMatch }
  /**
   * Other live sessions on the same job, both directions. Advice only: it never
   * moves the item, changes its state, or affects its rank.
   */
  relatedSessions?: RelatedSession[]
  /** How many further related sessions were found beyond the ones named. */
  relatedMore?: number
  /** Seconds of silence, when the backend watcher flagged this as stalled. */
  stalledFor?: number
  /** Repeat count, when the backend watcher flagged a repeating failure. */
  loopRepeats?: number
  /** Which kind of approval is owed, when one is. */
  approvalKind?: 'tool' | 'subagent'
  /**
   * The pending approval blocking this item. Its presence means the item needs a
   * yes or no, not an instruction — so selecting it must offer the decision, not a
   * message box.
   */
  permissionId?: string
  permissionTool?: string
  permissionPurpose?: string
  /** Full formatted tool input, for the formal approval card. */
  permissionInput?: string
  /** A run that ended failed. Unfinished work, so it belongs in the queue. */
  runFailed?: boolean
  /** Where to re-run it. Absent when the platform cannot retry this kind. */
  retryPath?: string
  /**
   * Where to STOP this work, for the kinds that run on their own until told
   * otherwise. Deliberately separate from `retryPath`: retrying is repeatable and
   * harmless, whereas stopping discards a loop's remaining budget and cannot be
   * undone from here, so the two must never share one affordance.
   */
  stopPath?: string
  /** Prompts queued behind this session's active turn (same session only). */
  queuedBehind?: number
  /** A linked change has a failing check or a conflict. */
  changeBlocked?: boolean
  /** Completed but never verified — the platform's own needs-you signal. */
  unverified?: boolean
  /**
   * This item is work the developer personally owns in the forge — their own pull
   * request, or an issue assigned to them — rather than something a session did.
   * Set on a session's item when one of its links turns out to be owned work, so
   * ownership enriches the row that already exists instead of adding a second one.
   */
  owned?: 'pull' | 'issue'
  /** A reviewer asked the developer for changes on their own pull request. */
  changesRequested?: boolean
  /** Approved with nothing red: the only thing left is the developer's merge. */
  mergeReady?: boolean
  /** An issue assigned to the developer that no session has picked up. */
  assignedToYou?: boolean
}

export interface ApprovalRow {
  id: string
  source?: string
  tool?: string
  slot?: string
  ts?: number
  /** The tool's own stated reason. This is what makes an approval decidable here. */
  tool_purpose?: string
  /** The full formatted input — the same detail the session view's card shows. */
  tool_input?: string
}

export interface PendingPermission {
  id: string
  sessionKey: string
  sessionLabel: string
  tool: string
  purpose?: string
}

/**
 * Approvals the Conductor must show, because they are blocking work the user
 * started FROM the Conductor.
 *
 * Sending an instruction and then watching nothing happen is the failure this
 * fixes: the session was not stuck, it was waiting for permission, and the only
 * place saying so was a different view. An approval halts the turn, so it cannot
 * be left to the queue to surface on the next poll.
 *
 * Deliberately narrow. Every pending approval already appears in Needs you; the
 * Conductor shows only the ones it is itself responsible for, so it stays a
 * conversation rather than becoming a second approval inbox.
 */
export function pendingPermissions(
  approvals: ApprovalRow[],
  watched: readonly string[],
  labelFor: (sessionKey: string) => string,
): PendingPermission[] {
  const watching = new Set(watched.filter(Boolean))
  if (watching.size === 0) return []
  const seen = new Set<string>()
  const out: PendingPermission[] = []
  for (const approval of approvals) {
    const slot = approval.slot
    if (!slot || !watching.has(slot) || !approval.id || seen.has(approval.id)) continue
    seen.add(approval.id)
    out.push({
      id: approval.id,
      sessionKey: slot,
      sessionLabel: labelFor(slot),
      tool: approval.tool || 'a tool',
      purpose: approval.tool_purpose,
    })
  }
  return out
}

export interface AgentRow {
  id: string
  task: string
  done: boolean
  parent: string
  agent: string
  started: number
  result?: string
  error?: string
  outcome?: string
  last_tool?: string
  /** Tool calls spent so far, as the platform reports it (`info.turns`). */
  turns?: number
}

export interface WorkflowRow {
  run_id: string
  name: string
  status: 'running' | 'finished' | 'failed' | 'cancelled'
  session_key: string | null
  error: string | null
  event_count: number
  /**
   * The run's own account of itself, all of it already in the LIST response the
   * board fetches — no per-run request needed. These were declared away for a
   * while and the card said "This workflow stopped before finishing" while
   * holding `error: 'timeout'` and a phase name, which is why a stalled workflow
   * read as a dead end instead of a diagnosis.
   *
   * All optional: an older gateway omits them, and a run that never got going
   * has no phase to report.
   */
  phase?: string | null
  /** Last progress line the run emitted — how far it actually got. */
  last_log?: string | null
  /** Agents that reported an error, distinct from the run's own failure. */
  agent_error_count?: number
  /** Agents that DID finish, so their output survived the failure. */
  partial_result_count?: number
}

export interface WorkSources {
  slots: ChatSlot[]
  approvals: ApprovalRow[]
  agents: AgentRow[]
  workflows: WorkflowRow[]
  crons: CronJob[]
  artifacts: Artifact[]
  /**
   * Optional because the platform serves loops from a route this app has only
   * just started asking for: a gateway that answers it with nothing, or an
   * install whose auto-nudge service is off, must still produce a full board
   * rather than an error.
   */
  loops?: MonitorLoop[]
  /**
   * Work the developer owns in the forge — their own pull requests and issues
   * assigned to them. Optional for the same reason `loops` is: the route is
   * served by this app's own backend, which a gateway may not have loaded, and a
   * developer without `gh` gets nothing. Neither may cost them the board.
   */
  assigned?: AssignedWork[]
}

/**
 * How many pieces of owned work may open a row of their own.
 *
 * Enrichment of rows the board already has is unlimited; this bounds only NEW
 * rows, because the attention queue is meant to be a short answer to "what needs
 * me now" and a forge backlog is a different question with a different surface.
 */
export const OWNED_STANDALONE_LIMIT = 5

/** Another live session on the same job. See `markRelatedSessions`. */
export interface RelatedSession {
  sessionKey: string
  title: string
  because: GoalMatch
}

const STATE_RANK: Record<WorkState, number> = {
  'needs-you': 0,
  running: 1,
  done: 2,
}

/**
 * Coerce a host timestamp to epoch milliseconds. The gateway sends float
 * SECONDS for cron timestamps but ISO strings elsewhere, and the 10-billion
 * threshold is what tells the two number forms apart.
 */
export function epoch(value?: string | number | null): number {
  if (typeof value === 'number') return value > 10_000_000_000 ? value : value * 1000
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * How long until a scheduled job runs again, phrased by `describeSilence` so a
 * countdown and a silence duration never read differently on the same screen.
 * Empty when the platform reported no next run, when the job is paused (pausing
 * does not clear the stored time, so a paused job would otherwise advertise a
 * check that is never coming), or when the time has already passed -- a run that
 * is due says nothing rather than claiming it is about to happen.
 */
function nextRunIn(cron: CronJob, now: number): string {
  if (cron.paused) return ''
  const next = epoch(cron.next_run_ts)
  if (!next) return ''
  const seconds = Math.round((next - now) / 1000)
  if (seconds <= 0) return ''
  return describeSilence(seconds)
}

const TITLE_LIMIT = 72

/**
 * Task prompts are instructions, not work titles. Keep the leading clause and
 * drop the constraint tail ("Do not modify files, index, refs, or HEAD; …").
 */
export function deriveWorkTitle(raw: string | undefined, fallback: string): string {
  const text = raw?.replace(/\s+/g, ' ').trim()
  if (!text) return fallback

  const firstClause = text.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim() || text
  const clause = firstClause.replace(/[.;,]$/, '')
  if (clause.length <= TITLE_LIMIT) return clause

  const cut = clause.slice(0, TITLE_LIMIT)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

function sessionIssue(slot: ChatSlot): boolean {
  // Only a change can fail a check or conflict. Reading the whole list worked by
  // accident, because an issue never carries those fields -- but naming the kind
  // says what the rule is instead of relying on absent data.
  return Boolean(slot.source_links?.some(link => (
    link.kind !== 'issue' && (link.ci === 'failed' || link.mergeable === 'conflicting')
  )))
}

const TOOL_MARKUP = /<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i
const PLACEHOLDER_PREVIEW = /^\((?:code|diff|widget|image)\)$/
const COMPLETION_MARKER = /(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i
const OPTIONAL_FOLLOW_UP = /\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i
const EXPLICIT_REQUEST = /\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i
const TRAILING_QUESTION = /[?？]["'”’)\]]*$/

function sessionPreview(slot: ChatSlot): string | null {
  const preview = slot.last_message?.replace(/\s+/g, ' ').trim()
  if (!preview) return null
  if (PLACEHOLDER_PREVIEW.test(preview) || TOOL_MARKUP.test(preview)) return null
  return preview
}

function sessionInputRequest(slot: ChatSlot): string | null {
  if (!slot.waiting_for_input) return null
  const preview = sessionPreview(slot)
  if (!preview) return null

  // An ended assistant turn is not by itself a request. Require positive
  // evidence, and never let a reported completion claim the user's attention.
  if (COMPLETION_MARKER.test(preview) || OPTIONAL_FOLLOW_UP.test(preview)) return null
  if (EXPLICIT_REQUEST.test(preview)) return preview
  return TRAILING_QUESTION.test(preview) ? preview : null
}

function sessionState(slot: ChatSlot): WorkState {
  if (slot.pending_approval || sessionInputRequest(slot)) return 'needs-you'
  // A recovering failure stays Running: the agent is still on it, so the next
  // move is not yet the user's.
  if (slot.running || slot.subagents_running || slot.orchestrating) return 'running'
  /*
   * A failing check or a conflict does NOT promote a session into the queue.
   *
   * It used to. The argument was that a red change is actionable -- open it,
   * re-run it, fix it -- and that letting it sit in Done wearing an Issue badge
   * contradicted the completion model. Both halves were reasonable when the only
   * way a red change could reach the board was through the session that touched
   * it.
   *
   * That is no longer true, and the cost of the old rule was measured on a real
   * fleet: 24 items in Needs you, of which 5 were genuinely owed something. The
   * other 19 were sessions up to 23 days old, promoted solely because a linked
   * pull request was still red, every one of them carrying the identical reason
   * "a linked change is failing or conflicting". A queue that never empties is
   * one nobody reads, and the oldest entries had been there for weeks.
   *
   * A red change now has a surface built for it: owned work reads the developer's
   * own pull requests directly, classifies what is actually blocking each one,
   * ranks them by cost and caps how many open a row. That surface is bounded and
   * current. Promoting the session as well double-counts the same fact and adds
   * the one thing the dedicated surface refuses to add -- unboundedness.
   *
   * The fact is not discarded: `issue` is still set, `change_blocked` still ranks
   * the item wherever it appears, and the card still shows the failing link. What
   * changes is that a quiet session no longer claims the developer's attention on
   * the strength of a check it is not waiting on. Risk still promotes -- that is
   * what the stall and error-loop detectors are for, and they force `needs-you`
   * in `normalizeWorkItems` regardless of this function.
   */
  return 'done'
}

function sessionSummary(slot: ChatSlot, copy: WorkCopy): string {
  if (slot.pending_approval) return copy('approval_waiting')
  const request = sessionInputRequest(slot)
  if (request) return request
  if (slot.running || slot.subagents_running || slot.orchestrating) return copy('work_in_progress')
  if (sessionIssue(slot)) return copy('linked_change_issue')
  return sessionPreview(slot) ?? copy('recent_work_ready')
}

function provenanceLabel(slot: ChatSlot, copy: WorkCopy): string {
  const value = slot.project || slot.workspace || slot.agent
  if (!value) return copy('session')
  const normalized = value.replace(/\\/g, '/').replace(/\/+$/, '')
  return normalized.split('/').pop() || copy('session')
}

function sessionAction(slot: ChatSlot): WorkAction {
  if (slot.pending_approval) return 'review-approval'
  if (sessionInputRequest(slot)) return 'reply'
  return 'open'
}

/** A session's linked change/issue, paired with the number a text can mention. */
interface SourceReference {
  ref: WorkReference
  /** The link's own number, as the provider writes it ("6", "2051"). */
  number: string
}

/**
 * The change/issue references of a session's linked sources.
 *
 * Built in ONE place because the session-level item and each of its intents must
 * describe the same PR identically — two copies of this mapping drifted on the
 * `kind` distinction once already, and a ref that differs by label is a different
 * entity to every consumer that groups on it.
 *
 * The `number` rides along so a caller can scope refs to the ones a given text
 * actually mentions; see `intentSourceRefs`.
 */
function sourceReferences(slot: ChatSlot): SourceReference[] {
  return (slot.source_links ?? []).map(link => ({
    number: String(link.number ?? ''),
    ref: {
      // The spec asks the card to show "the issue behind it". A pull request and an
      // issue arrived here labelled identically, so neither could be told from the
      // other; the platform has always distinguished them via `kind`.
      kind: link.kind === 'issue' ? 'issue' : 'change',
      id: link.url,
      label: link.kind === 'issue'
        ? `issue #${link.number}`
        : `${link.provider === 'gitlab' ? 'MR' : 'PR'} #${link.number}`,
      url: link.url,
      sessionKey: slot.key,
      status: changeStatus(link),
    },
  }))
}

function sessionItem(slot: ChatSlot, copy: WorkCopy): WorkItem {
  // The SESSION-level item keeps every link the session has: the session really
  // is on all of them, so the row can show which changes it touches.
  const changeRefs: WorkReference[] = sourceReferences(slot).map(entry => entry.ref)
  return {
    id: `session:${slot.key}`,
    title: slot.title || copy('untitled_work'),
    summary: sessionSummary(slot, copy),
    state: sessionState(slot),
    // A session-level item has no goals to distinguish, so `running` and "in
    // motion" are the same fact here.
    moving: sessionState(slot) === 'running' || undefined,
    issue: sessionIssue(slot),
    updatedAt: epoch(slot.last_ts || slot.last_activity_ts || slot.created),
    sessionKey: slot.key,
    provenance: provenanceLabel(slot, copy),
    queuedBehind: slot.queue_depth || undefined,
    changeBlocked: sessionIssue(slot) || undefined,
    action: sessionAction(slot),
    references: [
      { kind: 'session', id: slot.key, label: slot.title || copy('untitled_work'), sessionKey: slot.key },
      ...changeRefs,
    ],
  }
}

function upsertReference(item: WorkItem, reference: WorkReference): void {
  if (!item.references.some(ref => ref.kind === reference.kind && ref.id === reference.id)) {
    item.references.push(reference)
  }
}

/**
 * A spawn gate reads as `source: "subagent"`. Worth distinguishing: the sidebar
 * ranks it as its own state because "4 agents running" while two are blocked on
 * your click is both wrong and the reason the owed approval went unnoticed.
 */
function isSubagentGate(approval: ApprovalRow): boolean {
  return (approval.source || '').toLowerCase() === 'subagent'
}

function mergeApproval(item: WorkItem, approval: ApprovalRow, copy: WorkCopy): void {
  const subagentGate = isSubagentGate(approval)
  item.state = 'needs-you'
  item.updatedAt = Math.max(item.updatedAt, epoch(approval.ts))
  item.summary = copy(subagentGate ? 'subagent_gate_waiting' : 'approval_waiting')
  item.approvalKind = subagentGate ? 'subagent' : 'tool'
  item.action = 'review-approval'
  // The decision travels with the item. Without the id the user had to open the
  // session to answer a yes/no that this view is perfectly able to ask.
  item.permissionId = approval.id
  item.permissionTool = approval.tool || approval.source
  item.permissionPurpose = approval.tool_purpose
  item.permissionInput = approval.tool_input
  upsertReference(item, {
    kind: 'approval',
    id: approval.id,
    label: approval.tool || approval.source || copy('approval'),
    sessionKey: approval.slot || item.sessionKey,
  })
}

function mergeAgent(item: WorkItem, agent: AgentRow, copy: WorkCopy): void {
  item.updatedAt = Math.max(item.updatedAt, epoch(agent.started))
  item.issue ||= Boolean(agent.done && (agent.error || agent.outcome === 'failed'))
  if (!agent.done) {
    if (item.state !== 'needs-you') {
      item.state = 'running'
      item.summary = copy('work_in_progress')
    }
  } else if ((agent.error || agent.outcome === 'failed') && item.state !== 'needs-you') {
    item.summary = copy('agent_failed', { task: agent.task })
  }
  upsertReference(item, {
    kind: 'agent',
    id: agent.id,
    label: agent.agent || copy('agent'),
    sessionKey: agent.parent || item.sessionKey,
  })
}

/**
 * How much of an error message a card shows before it is cut.
 *
 * Sized for two lines at card width. Long enough that the common
 * one-clause failures ("timeout", a missing-port message) arrive whole, short
 * enough that a stack-trace-shaped error cannot push the rest of the card off
 * screen.
 */
const MAX_ERROR_CHARS = 160

/**
 * How far a workflow run actually got, as a list of facts.
 *
 * Every line is a field the platform sent; nothing here is narrated. That
 * constraint is the point — a card that pads three labelled sections with
 * invented prose is worse than one honest line, so a run with nothing to report
 * returns an empty list and the section does not render at all.
 *
 * Ordered by what a person reads first when a run has failed: how far it got,
 * then why it stopped, then what survived. `partial_result_count` is last but is
 * often the most consequential — it says the output of the agents that DID
 * finish is still there, which decides whether a re-run starts from zero.
 */
export function workflowFacts(workflow: WorkflowRow, copy: WorkCopy): string[] {
  const facts: string[] = []
  const lastLog = workflow.last_log?.trim()
  const phase = workflow.phase?.trim()
  if (lastLog) facts.push(copy('workflow_fact_last_log', { log: lastLog }))
  // Only when it adds something. The last log line usually NAMES the phase it
  // was in ("Phase 5: Red-teaming findings"), and printing both then says the
  // same thing twice in adjacent bullets.
  if (phase && !(lastLog && lastLog.toLowerCase().includes(phase.toLowerCase()))) {
    facts.push(copy('workflow_fact_phase', { phase }))
  }
  const error = workflow.error?.trim()
  if (error) facts.push(copy('workflow_fact_error', { error: shortError(error) }))
  const agentErrors = workflow.agent_error_count ?? 0
  if (agentErrors > 0) {
    facts.push(copy('workflow_fact_agent_errors', { count: String(agentErrors) }))
  }
  const partials = workflow.partial_result_count ?? 0
  if (partials > 0) {
    facts.push(copy('workflow_fact_partials', { count: String(partials) }))
  }
  return facts
}

/**
 * A Python exception repr is what the platform stores, and the whole of it is
 * unreadable in a card: `RuntimeError('ctx.nudge is not available for this run
 * (no nudge port wired)')`. Unwrap the message out of the repr and keep the type
 * only when there is no message to show instead.
 *
 * Truncation is last-resort and marked, because a silently cut error message
 * reads as a complete one and sends the reader looking for a cause that is
 * really just off the end of the string.
 */
export function shortError(error: string): string {
  const repr = /^([A-Za-z_][\w.]*)\((['"])([\s\S]*)\2,?\s*\)$/.exec(error.trim())
  const text = (repr ? repr[3] : error).trim() || error.trim()
  return text.length > MAX_ERROR_CHARS ? `${text.slice(0, MAX_ERROR_CHARS - 1)}…` : text
}

/**
 * What to do about a failed run, as a step the Conductor can act on.
 *
 * Deliberately NOT "click Retry": the card already carries a Retry button for
 * that, and a suggestion that duplicates an adjacent control wastes the one
 * section that could say something else. A re-run of a workflow that timed out
 * or hit a wiring error repeats the failure, so the useful step is to find the
 * cause first — which is a question for the Conductor, which is where picking a
 * step sends it.
 */
export function workflowSteps(workflow: WorkflowRow, copy: WorkCopy): SummaryNextStep[] {
  if (workflow.status !== 'failed') return []
  const error = workflow.error?.trim()
  const name = workflow.name || workflow.run_id
  return [{
    what: copy('workflow_step_diagnose', { name }),
    why: error
      ? copy('workflow_step_why_error', { error: shortError(error) })
      : copy('workflow_step_why_generic'),
    expect: (workflow.partial_result_count ?? 0) > 0
      ? copy('workflow_step_expect_partials', {
        count: String(workflow.partial_result_count ?? 0),
      })
      : copy('workflow_step_expect_generic'),
  }]
}

function mergeWorkflow(item: WorkItem, workflow: WorkflowRow, copy: WorkCopy): void {
  item.issue ||= workflow.status === 'failed'
  if (workflow.status === 'running' && item.state !== 'needs-you') item.state = 'running'
  if (workflow.status === 'failed' && item.state !== 'needs-you') {
    item.summary = copy('workflow_failed', { name: workflow.name })
  }
  /*
   * The run's facts, on the SESSION's card too.
   *
   * A session that owns a failed run is the one place the two accounts meet, and
   * the session's own summarized intents may already have filled these. Append
   * rather than replace: both are true, and the run's facts are the more
   * specific of the two.
   */
  const facts = workflowFacts(workflow, copy)
  if (facts.length > 0) {
    item.progress = [...(item.progress ?? []), ...facts.filter(fact => (
      !(item.progress ?? []).includes(fact)
    ))]
  }
  const steps = workflowSteps(workflow, copy)
  if (steps.length > 0) {
    item.nextSteps = [...(item.nextSteps ?? []), ...steps.filter(step => (
      !(item.nextSteps ?? []).some(existing => existing.what === step.what)
    ))]
  }
  upsertReference(item, {
    kind: 'workflow',
    id: workflow.run_id,
    label: workflow.name || workflow.run_id,
    sessionKey: workflow.session_key || item.sessionKey,
  })
}

/**
 * Map one summarized intent onto a work item.
 *
 * The platform already decided the hard part, and Crew Manager trusts its
 * per-intent `state` rather than second-guessing: `needs-you` means the goal was
 * completed but never verified ("merged but never run"). An intent that is merely
 * still in progress is open work, NOT a demand. A pending tool approval is NOT
 * folded in here — it is surfaced precisely, on the one item it belongs to, by
 * mergeApproval; stamping every intent needs-you off the session-level flag
 * inflated the count (one approval read as "3 need your input").
 */
function intentState(intent: SummaryIntent): WorkState | null {
  switch (intent.state) {
    case 'needs-you':
      return 'needs-you'
    case 'done':
    case 'dropped':
      return 'done'
    case 'in-progress':
      return 'running'
    default:
      return null
  }
}

/**
 * Whether this goal is ACTUALLY being worked on right now, as opposed to merely
 * being open.
 *
 * A session has one turn, so at most ONE of its goals can be in motion — and
 * none of them are when the session is idle. `in-progress` is the summary's
 * bookkeeping state, not evidence of motion: it stays set on every goal the
 * session has committed to and not finished. Reading it as "Running" made three
 * cards from one idle session all claim to be executing.
 *
 * So motion requires both: the session is genuinely executing, and this is the
 * goal it touched last. Everything else is open work nobody is on — which is
 * worth saying plainly, because that is the state work gets forgotten in.
 */
function intentMoving(intent: SummaryIntent, slot: ChatSlot, leadingIntent: SummaryIntent | null): boolean {
  const executing = Boolean(slot.running || slot.subagents_running || slot.orchestrating)
  if (!executing) return false
  return intent === leadingIntent
}

/**
 * The single goal an executing session is on.
 *
 * Comparing each goal's turn against the maximum was wrong: a TIE let several
 * goals pass, and when no goal carries a turn at all every one of them compared
 * 0 === 0 and the whole session claimed to be running. Picking one object and
 * comparing identity makes "exactly one" structural rather than hopeful.
 *
 * The tie-break (first of the joint-highest) is a guess about WHICH goal, but the
 * count it produces is never a guess.
 */
function leadingIntentOf(intents: SummaryIntent[]): SummaryIntent | null {
  let leader: SummaryIntent | null = null
  let best = -1
  for (const intent of intents) {
    const turn = intent.last_touched_turn ?? 0
    if (turn > best) {
      best = turn
      leader = intent
    }
  }
  return leader
}

function hasNextStep(intent: SummaryIntent): boolean {
  return Boolean(intent.next_steps?.some(step => step.what?.trim()))
}

function intentSummaryLine(intent: SummaryIntent, copy: WorkCopy): string {
  const nextStep = intent.next_steps?.find(step => step.what?.trim())?.what?.trim()
  if (nextStep) return nextStep
  const lastProgress = [...(intent.progress ?? [])].reverse().find(entry => entry.trim())
  if (lastProgress) return lastProgress.trim()
  return intent.initial_intent?.trim() || copy('work_in_progress')
}

/** Most one session may contribute, newest goal first — a long session holds many. */
const MAX_INTENTS_PER_SESSION = 3

/**
 * Everywhere an intent could name a change it is actually about: its title, the
 * request that opened it, what has happened since, and what comes next.
 */
function intentText(intent: SummaryIntent): string {
  return [
    intent.title ?? '',
    intent.initial_intent ?? '',
    ...(intent.progress ?? []),
    ...(intent.next_steps ?? []).map(step => step.what ?? ''),
  ].join(' ')
}

/**
 * Whether a text names this link by number — "#6", or "# 6" as some summaries
 * write it. Bounded on the right so #6 does not answer for #60.
 */
function mentionsSource(text: string, number: string): boolean {
  if (!number) return false
  const escaped = number.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  return new RegExp(`#\\s?${escaped}\\b`, 'u').test(text)
}

/**
 * The links THIS goal is about, not every link its session happens to carry.
 *
 * A session's `source_links` belong to the session. Copying all of them onto
 * every intent made a shared change ref out of mere co-residency: two sessions
 * that each touch PR #6 then matched `same_change` on EVERY cross-session pair of
 * their intents, so ten unrelated goals collapsed into one card. An intent claims
 * a link only when its own text names it, which is the evidence that the goal is
 * about that change. Unmentioned links stay on the session-level item.
 */
function intentSourceRefs(sources: SourceReference[], intent: SummaryIntent): WorkReference[] {
  if (sources.length === 0) return []
  const text = intentText(intent)
  return sources.filter(entry => mentionsSource(text, entry.number)).map(entry => entry.ref)
}

function intentWorkItems(
  slot: ChatSlot,
  summary: SessionSummary | undefined,
  copy: WorkCopy,
): WorkItem[] {
  if (!summary?.enabled) return []
  const intents = summary.intents ?? []
  if (intents.length === 0) return []

  const sources = sourceReferences(slot)

  const built: WorkItem[] = []
  // The one goal the session touched last is the only one that can be in motion.
  const leadingIntent = leadingIntentOf(intents)
  const executing = Boolean(slot.running || slot.subagents_running || slot.orchestrating)

  intents.forEach((intent, index) => {
    // An IDLE session's unfinished goal belongs to the user: nobody is on it and
    // only they can carry it forward. That is the Follow-up case ("pick back up
    // where a session left off") — mark it so it ranks as `nobody_on_it` and
    // routes to the Follow-up lane, rather than sitting in In-progress as Queued.
    const idleUnfinished = !executing && intent.state === 'in-progress'
    const state = idleUnfinished ? 'needs-you' : intentState(intent)
    // A summary Crew Manager cannot place honestly is skipped, and the
    // session-level fallback describes the session instead.
    if (!state) return
    const nextSteps = (intent.next_steps ?? []).filter(step => step.what?.trim())
    built.push({
      id: `intent:${slot.key}:${index}`,
      title: deriveWorkTitle(intent.title, slot.title || copy('untitled_work')),
      summary: intentSummaryLine(intent, copy),
      state,
      // Not an issue on either count. `dropped` is a decision the agent made,
      // often the right one — calling it a failure is the wrong word. And a
      // failing linked change belongs to the change, which the very next line
      // already records; repeating it per goal marked the same fault N times.
      issue: false,
      updatedAt: epoch(slot.last_ts || slot.last_activity_ts || slot.created),
      sessionKey: slot.key,
      provenance: provenanceLabel(slot, copy),
      queuedBehind: slot.queue_depth || undefined,
      changeBlocked: sessionIssue(slot) || undefined,
      unverified: intent.verified === false || undefined,
      // The idle-left-off marker: raises `nobody_on_it` so the item ranks into
      // the Follow-up lane, and offers Resume rather than a bare Open.
      unattendedGoals: idleUnfinished ? 1 : undefined,
      action: idleUnfinished ? 'resume' : 'open',
      references: [
        { kind: 'session', id: slot.key, label: slot.title || copy('untitled_work'), sessionKey: slot.key },
        ...intentSourceRefs(sources, intent),
      ],
      nextSteps,
      initialIntent: intent.initial_intent?.trim() || undefined,
      progress: (intent.progress ?? []).filter(entry => entry.trim()),
      stale: Boolean(summary.stale),
      lastTouchedTurn: intent.last_touched_turn ?? 0,
      sessionTurns: summary.user_turns || undefined,
      sessionChanges: sources.map(entry => entry.ref),
      moving: intentMoving(intent, slot, leadingIntent) || undefined,
    })
  })

  // Keep what needs the user, then the most recent goals. Without this a
  // session with eight open intents crowds out every other work item.
  const needsYou = built.filter(item => item.state === 'needs-you')
  const rest = built
    .filter(item => item.state !== 'needs-you')
    .sort((a, b) => (b.lastTouchedTurn ?? 0) - (a.lastTouchedTurn ?? 0))
  return [...needsYou, ...rest].slice(0, Math.max(MAX_INTENTS_PER_SESSION, needsYou.length))
}

/**
 * Conductor slots, current and legacy. The app was renamed from Overwatch, and
 * a workspace that ran the old build still has its `overwatch-conductor`
 * session on disk — without this it would surface as ordinary work.
 */
const CONDUCTOR_SLOT_KEYS = new Set(['crew-manager-conductor', 'overwatch-conductor'])

/**
 * Why an item sits where it does.
 *
 * The ranking is a sum of NAMED signals rather than an opaque score, because the
 * product requires every item to state in one sentence why it is where it is. If
 * the score came first and the explanation second, the explanation could only be
 * invented; deriving both from the same named signals makes them agree by
 * construction.
 *
 * Weights are ordinal, not measured: they encode "an owed approval outranks a
 * session that merely went quiet", which is a product decision, not a fact.
 */
export type RankSignal =
  | 'approval_owed'
  | 'subagent_gate'
  | 'input_requested'
  | 'unverified_completion'
  | 'error_loop'
  | 'changes_requested'
  | 'run_failed'
  | 'stalled'
  | 'change_blocked'
  | 'merge_ready'
  | 'assigned_to_you'
  | 'nobody_on_it'
  | 'queued_behind'
  | 'waiting_a_while'

const SIGNAL_WEIGHT: Record<RankSignal, number> = {
  // Only a person can clear these two.
  approval_owed: 100,
  subagent_gate: 95,
  input_requested: 80,
  // Shipped but never confirmed — the work everyone forgets.
  unverified_completion: 70,
  error_loop: 60,
  // A reviewer is waiting on the developer personally. Above a failed run because
  // a person has stopped to ask, and their time is spent while it sits.
  changes_requested: 58,
  run_failed: 55,
  stalled: 50,
  change_blocked: 40,
  // Approved and green: one action, and nobody but the developer can take it.
  // Below a blocked change because a blocked change has someone waiting on it,
  // and above unstarted work because finishing beats starting.
  merge_ready: 34,
  // Assigned in the forge and nobody has begun it -- real work that is invisible
  // to every other source on this board, but not yet in flight, so it sits below
  // everything that IS. An earlier draft put this at 45, above a blocked change,
  // which made an unstarted issue outrank a conflicting pull request.
  assigned_to_you: 32,
  // A stopped session nobody is on: real, but never above an owed decision.
  nobody_on_it: 30,
  // Same-session queue. NOT other sessions blocked behind it: the platform does
  // not model cross-session dependencies, so this is the honest approximation
  // and the copy must not overclaim it.
  queued_behind: 12,
  waiting_a_while: 8,
}

/** Longest-wait credit saturates, so age can never outrank an owed decision. */
const MAX_AGE_CREDIT = 3

export interface RankedSignal {
  signal: RankSignal
  weight: number
  values?: Record<string, string>
}

export interface Ranking {
  score: number
  signals: RankedSignal[]
}

/** Hours since the item last moved, floored. */
function hoursWaiting(item: WorkItem, now: number): number {
  if (!item.updatedAt) return 0
  return Math.max(0, Math.floor((now - item.updatedAt) / 3_600_000))
}

/**
 * How many ranked items the Conductor is told about. Enough to reason about the
 * queue, small enough that the prompt stays a briefing rather than a dump.
 */
export const BRIEFING_LIMIT = 5

/**
 * The fleet, as the LIST understands it.
 *
 * The Conductor used to receive only the selected item, so it could describe the
 * queue differently from the list the user was looking at. The spec forbids
 * exactly that: the two "cannot disagree".
 *
 * Agreement is not achieved by writing a careful summary. It is achieved by
 * calling the SAME functions the list calls -- `sortWorkItems` for the order and
 * `explainRank` for the reason -- so there is one derivation and no second
 * version to drift. If the ordering rules change tomorrow, this changes with
 * them, because it is not a copy.
 */
export function fleetBriefing(items: WorkItem[], copy: WorkCopy, now: number = Date.now()): string[] {
  const counts = workCounts(items)
  const needsYou = sortWorkItems(items.filter(item => item.state === 'needs-you'), now)

  const lines = [
    `Fleet: ${counts['needs-you']} waiting on the user, `
    + `${counts.running} in progress, ${counts.done} finished recently.`,
  ]
  if (needsYou.length === 0) {
    lines.push('Nothing is waiting on the user.')
    return lines
  }

  lines.push(`Waiting on the user, in the order the list shows them (top ${Math.min(BRIEFING_LIMIT, needsYou.length)}):`)
  needsYou.slice(0, BRIEFING_LIMIT).forEach((item, index) => {
    const why = explainRank(rankWorkItem(item, now), copy)
    const where = item.sessionKey ? ` [session ${item.sessionKey}]` : ''
    lines.push(`${index + 1}. ${item.title} — ${item.summary} (${why})${where}`)
  })
  if (needsYou.length > BRIEFING_LIMIT) {
    lines.push(`…and ${needsYou.length - BRIEFING_LIMIT} more waiting.`)
  }
  return lines
}

/**
 * Words too common to mean two sessions are doing the same work.
 *
 * Without this, "Fix the login bug" and "Fix the export bug" overlap on "fix",
 * "the" and "bug" and score as a duplicate. The list is only worth trusting if a
 * duplicate warning is right nearly every time it appears.
 */
const DUPLICATE_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'at', 'is', 'it',
  'this', 'that', 'with', 'from', 'into', 'be', 'do', 'so', 'as', 'by',
  'fix', 'add', 'make', 'update', 'work', 'session', 'app', 'new', 'use', 'run',
  'why', 'what', 'how', 'again', 'still', 'not',
])

/** Below this share of shared distinctive words, two titles are just similar. */
const DUPLICATE_OVERLAP = 0.6

/** A title needs this many distinctive words before overlap means anything. */
const DUPLICATE_MIN_WORDS = 2

/** No board context supplied — every phrase counts as distinctive. */
const NO_AMBIENT: Set<string> = new Set()

export function titleWords(title: string): string[] {
  return [...new Set(
    title.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !DUPLICATE_STOPWORDS.has(word)),
  )]
}

/**
 * How much two titles say the same thing, as a share of the smaller one.
 *
 * Measured against the SMALLER set on purpose: "Rename the symbol" against
 * "Rename the symbol and update the tests and the docs" is the same work
 * described at two lengths, and dividing by the union would score it low.
 */
export function titleOverlap(a: string, b: string): number {
  const left = titleWords(a)
  const right = titleWords(b)
  if (left.length < DUPLICATE_MIN_WORDS || right.length < DUPLICATE_MIN_WORDS) return 0
  const smaller = left.length <= right.length ? left : right
  const larger = new Set(left.length <= right.length ? right : left)
  const shared = smaller.filter(word => larger.has(word)).length
  return shared / smaller.length
}

/** Change and issue URLs this item points at. */
function linkedSources(item: WorkItem): string[] {
  return item.references
    .filter(ref => ref.kind === 'change' || ref.kind === 'issue')
    .map(ref => ref.id)
}

/** Artifacts this item points at — a shared output is a fact, like a shared PR. */
function artifactSources(item: WorkItem): string[] {
  return item.references.filter(ref => ref.kind === 'artifact').map(ref => ref.id)
}

/** Next-step texts, for step-level overlap. */
function stepTexts(item: WorkItem): string[] {
  return (item.nextSteps ?? []).map(step => step.what).filter(Boolean)
}

/** Why two items are judged the same job, ordered strongest first. */
export type GoalMatch = 'same_change' | 'same_artifact' | 'same_deliverable' | 'same_topic' | 'same_step'

/**
 * Phrases that read like a deliverable but name none. Without this list, every
 * PR in the board shares "Pull Request" and the whole view collapses to one goal.
 */
const GENERIC_PHRASES = new Set([
  'pull request', 'pull requests', 'status update', 'work in progress',
  'code review', 'follow up', 'next step', 'next steps', 'action item',
  'action items', 'kiro crew', 'in progress', 'needs you',
])

/**
 * The named THING a title is about — a capitalized multi-word phrase such as
 * "Goal Extraction" or "Session Summary Panel". Two items naming the same
 * deliverable are working toward the same outcome, which loose word overlap
 * misses whenever the sentences around the name differ.
 *
 * Capitalization is the signal on purpose: it is what distinguishes a proper
 * deliverable from ordinary prose, needs no model, and is stable. Normalized to
 * lowercase with a trailing plural dropped so "Goal Cards" and "goal card" meet.
 */
export function deliverablePhrases(title: string): string[] {
  const out = new Set<string>()
  // Maximal runs of CONSECUTIVE capitalized words. Deliberately no lowercase
  // joiner: allowing one glued "Restyle the Goal Cards" into a single phrase,
  // which then matched nothing — the run has to be the name itself.
  const runs = title.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu) ?? []
  for (const run of runs) {
    const words = run
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(word => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word))
    // A name starts and ends on a distinctive word: a sentence-leading verb is
    // part of the sentence, not of the thing ("Ship Goal Cards" -> "goal card").
    while (words.length && DUPLICATE_STOPWORDS.has(words[0])) words.shift()
    while (words.length && DUPLICATE_STOPWORDS.has(words[words.length - 1])) words.pop()
    if (words.length < 2) continue
    // Every contiguous phrase inside the run, longest first. Runs are not
    // comparable whole: "Crew Manager PR view" and "Crew Manager cron history"
    // name the same project and would share nothing if only the full run counted
    // — which would also blind the saturation guard to exactly that project name.
    for (let size = words.length; size >= 2; size -= 1) {
      for (let start = 0; start + size <= words.length; start += 1) {
        const phrase = words.slice(start, start + size).join(' ')
        if (GENERIC_PHRASES.has(phrase)) continue
        out.add(phrase)
      }
    }
  }
  return [...out]
}

/**
 * Phrases too common on this board to tell anything apart — a project or product
 * name that nearly every title carries ("Crew Manager"), as opposed to the name
 * of one deliverable.
 *
 * This is the guard the spec asks for against the collapse failure: a name shared
 * by almost everything would merge the whole board into a single goal, which is
 * strictly worse than not grouping at all. The project level is already the
 * initiative bucket's job, so a phrase operating at that level is not a goal.
 *
 * Only computed on a board big enough for "almost everything" to mean something;
 * below that, a shared phrase genuinely is the deliverable.
 */
export function ambientPhrases(items: WorkItem[]): Set<string> {
  const out = new Set<string>()
  if (items.length < AMBIENT_MIN_ITEMS) return out
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const phrase of deliverablePhrases(item.title)) {
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1)
    }
  }
  for (const [phrase, count] of counts) {
    if (count / items.length >= AMBIENT_SHARE) out.add(phrase)
  }
  return out
}

/** Below this many items, a shared name is the deliverable, not the backdrop. */
const AMBIENT_MIN_ITEMS = 4

/** At or above this share of the board, a phrase distinguishes nothing. */
const AMBIENT_SHARE = 0.75

/**
 * The ONE judge of "these two items are the same job". Grouping and the
 * duplicate warning both call it, so the two can never disagree.
 *
 * `ambient` carries the phrases this board is saturated with; pass it from
 * ambientPhrases() so a shared project name cannot pose as a shared deliverable.
 */
export function sameGoal(a: WorkItem, b: WorkItem, ambient: Set<string> = NO_AMBIENT): GoalMatch | null {
  const sharedChange = linkedSources(a).find(url => linkedSources(b).includes(url))
  if (sharedChange) return 'same_change'
  const sharedArtifact = artifactSources(a).find(id => artifactSources(b).includes(id))
  if (sharedArtifact) return 'same_artifact'
  const phrases = deliverablePhrases(b.title).filter(phrase => !ambient.has(phrase))
  if (deliverablePhrases(a.title).some(phrase => phrases.includes(phrase))) return 'same_deliverable'
  if (titleOverlap(a.title, b.title) >= DUPLICATE_OVERLAP) return 'same_topic'
  // Titles are named offhand per session; the concrete next step is what the
  // work actually is, so it catches matches the titles miss.
  for (const left of stepTexts(a)) {
    for (const right of stepTexts(b)) {
      if (titleOverlap(left, right) >= DUPLICATE_OVERLAP) return 'same_step'
    }
  }
  return null
}

/**
 * The user's rulings on "same job" pairs. Heuristics guess; these correct.
 * `split` forbids a pairing, `merged` forces one, and each is keyed by
 * goalPairKey so a ruling survives item ids changing between polls.
 */
export interface GoalVerdicts {
  merged: string[]
  split: string[]
}

export const EMPTY_VERDICTS: GoalVerdicts = { merged: [], split: [] }

/** Stable identity for verdicts: the session plus the title's distinctive words. */
export function goalIdentity(item: WorkItem): string {
  return `${item.sessionKey ?? item.id}|${titleWords(item.title).join(' ')}`
}

export function goalPairKey(a: WorkItem, b: WorkItem): string {
  return [goalIdentity(a), goalIdentity(b)].sort().join('\u0001')
}

/**
 * Live work that duplicates other live work.
 *
 * Recall answers "did we do this before" from history. This answers the other
 * half the spec asks for: two sessions doing the same thing RIGHT NOW, which
 * history cannot see because neither has finished.
 *
 * The judgement itself lives in sameGoal(), shared with goal grouping so the
 * warning and the grouping can never disagree about what "the same job" means.
 *
 * The NEWER item is the one marked, pointing back at the older. The new work is
 * what should be told it may be redundant; telling the session that started first
 * would be advice arriving too late to matter.
 *
 * It never changes state or ordering. The spec says recall is advice and never a
 * gate, and the same restraint applies here.
 */
export function markDuplicates(items: WorkItem[], verdicts: GoalVerdicts = EMPTY_VERDICTS): void {
  const live = items
    .filter(item => item.state !== 'done' && item.sessionKey)
    .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0))
  // The same distinctiveness guard grouping uses, over the same population — so
  // the warning and the goal card can never disagree about what a shared name means.
  const ambient = ambientPhrases(live)

  for (let newer = 1; newer < live.length; newer += 1) {
    const item = live[newer]
    for (let older = 0; older < newer; older += 1) {
      const prior = live[older]
      if (prior.sessionKey === item.sessionKey) continue
      // The user ruled this pair apart; a warning would re-litigate their call.
      if (verdicts.split.includes(goalPairKey(item, prior))) continue

      const because = sameGoal(item, prior, ambient)
      if (because) {
        item.duplicateOf = {
          sessionKey: prior.sessionKey as string,
          title: prior.title,
          because,
        }
        break
      }
    }
  }

  markRelatedSessions(live, verdicts, ambient)
}

/** How many related sessions a card names before it starts counting them. */
export const RELATED_LIMIT = 3

/** `GoalMatch` in its declared strength order, for ranking related rows. */
const GOAL_MATCH_RANK: GoalMatch[] = ['same_change', 'same_artifact', 'same_deliverable', 'same_topic', 'same_step']

/**
 * Which OTHER live sessions are on the same job — the cross-session view.
 *
 * Deliberately not a change to `duplicateOf`, which answers a different question.
 * `duplicateOf` warns the session that arrived SECOND, once, because a warning
 * reaching the session that started first would arrive too late to prevent the
 * overlap. Visibility is the opposite shape: whoever is looking at either card
 * wants to know the other session exists, and the first-arriving session needs it
 * most, since nothing else on its card mentions that company has arrived.
 *
 * So this is SYMMETRIC (both sessions learn about each other), COMPLETE (every
 * match, not the first), and still ADVICE — it changes no state, no order, and no
 * ranking. The platform does not model one session blocking another, so this says
 * only "these are on the same thing", never "this one is waiting for that one".
 *
 * Capped in the model rather than in the view so the list, the card and the
 * Conductor's briefing all name the same sessions.
 */
function markRelatedSessions(live: WorkItem[], verdicts: GoalVerdicts, ambient: Set<string> = NO_AMBIENT): void {
  for (const item of live) {
    const related: RelatedSession[] = []
    const seen = new Set<string>()
    for (const other of live) {
      const key = other.sessionKey as string
      if (key === item.sessionKey || seen.has(key)) continue
      // The user ruled this pair apart. Relating them anyway would re-litigate
      // their call in a second place, which is what one shared judge prevents.
      if (verdicts.split.includes(goalPairKey(item, other))) continue

      const because = sameGoal(item, other, ambient)
      if (!because) continue

      seen.add(key)
      related.push({ sessionKey: key, title: other.title, because })
    }
    if (related.length === 0) continue
    // GoalMatch is declared strongest-first, so a card that names only some of
    // them names the ones most worth opening.
    related.sort((a, b) => GOAL_MATCH_RANK.indexOf(a.because) - GOAL_MATCH_RANK.indexOf(b.because))
    item.relatedSessions = related.slice(0, RELATED_LIMIT)
    if (related.length > RELATED_LIMIT) item.relatedMore = related.length - RELATED_LIMIT
  }
}

/**
 * Work items the user has just instructed, keyed by item id.
 *
 * When an instruction is sent to a session, the platform does not report the
 * session as running until its turn actually starts — usually a second or two,
 * sometimes longer. Leaving the item in Needs you across that gap tells the user
 * their instruction did nothing, which is the one thing this queue must never do.
 *
 * So the acknowledgement is OPTIMISTIC and it is labelled as such in the code:
 * the item moves to In progress on the strength of a successful POST, and real
 * state overwrites it on the next poll. It is a claim about what the user did, not
 * about what the agent has achieved.
 */
export type InstructedItems = Record<string, number>

/** How long an optimistic acknowledgement stands before real state must carry it. */
export const ACK_WINDOW_MS = 30_000

/**
 * Apply pending acknowledgements to freshly derived items.
 *
 * An acknowledgement expires, rather than persisting until contradicted. Without
 * the window a session that failed to start would sit in In progress forever on
 * the strength of one POST — the item would be lying, and the list's whole value is
 * that it does not.
 */
export function applyInstructed(
  items: WorkItem[],
  instructed: InstructedItems,
  now: number = Date.now(),
): WorkItem[] {
  if (Object.keys(instructed).length === 0) return items
  return items.map(item => {
    const at = instructed[item.id]
    if (!at || now - at > ACK_WINDOW_MS) return item
    // Already moving on its own: real state won, drop the optimism.
    if (item.state === 'running') return item
    return { ...item, state: 'running' as WorkState, moving: true, instructed: true }
  })
}

export function rankWorkItem(item: WorkItem, now: number = Date.now()): Ranking {
  const signals: RankedSignal[] = []
  const add = (signal: RankSignal, values?: Record<string, string>, multiplier = 1) => {
    signals.push({ signal, weight: SIGNAL_WEIGHT[signal] * multiplier, values })
  }

  if (item.approvalKind === 'subagent') add('subagent_gate')
  else if (item.approvalKind === 'tool') add('approval_owed')

  if (item.action === 'reply') add('input_requested')
  if (item.unverified) add('unverified_completion')
  if (item.loopRepeats) add('error_loop', { repeats: String(item.loopRepeats) })
  if (item.changesRequested) add('changes_requested')
  if (item.runFailed) add('run_failed')
  if (item.stalledFor) add('stalled', { duration: describeSilence(item.stalledFor) })
  if (item.assignedToYou) add('assigned_to_you')
  if (item.changeBlocked) add('change_blocked')
  if (item.mergeReady) add('merge_ready')
  if (item.unattendedGoals) add('nobody_on_it', { count: String(item.unattendedGoals) })
  if (item.queuedBehind) {
    add('queued_behind', { count: String(item.queuedBehind) }, Math.min(item.queuedBehind, 3))
  }

  const hours = hoursWaiting(item, now)
  if (hours > 0) {
    add('waiting_a_while', { hours: String(hours) }, Math.min(hours, MAX_AGE_CREDIT))
  }

  signals.sort((a, b) => b.weight - a.weight)
  return { score: signals.reduce((total, s) => total + s.weight, 0), signals }
}

/**
 * Which way time runs inside each group. The direction follows what question
 * the group answers, which is not the same question in all three.
 *
 * `needs-you` sorts OLDEST FIRST: responsibility has passed to the user, so the
 * longest wait is the most expensive one. The previous newest-first order was
 * its exact opposite.
 *
 * `running` sorts NEWEST FIRST. This group is healthy work that needs nobody,
 * and it answers "what is happening now" — so the thing that just moved leads.
 * Ordering it oldest-first would imply "this one looks stuck", which is a weaker
 * proxy for a question the stall detector already answers properly by promoting
 * a genuinely wedged session into `needs-you`.
 *
 * `done` sorts NEWEST FIRST too — that section is titled "Done recently", and
 * reversing it would top the list with the stalest finished work.
 */
/**
 * The five kinds of response a person can owe.
 *
 * `decide` was cut in the first draft on the grounds that an owed approval expands
 * Approve / Reject in its row, making a label redundant. That reasoning only held
 * for the EXPANDED row. Collapsed — which is how the card sits until you click it
 * — the item had no badge at all, so at a glance an approval was indistinguishable
 * from anything else, and it left a hole in the column that pulled its title out of
 * line. A category label above its own controls is ordinary; a queue you cannot
 * read at a glance is not.
 */
export type ResponseVerb = 'followup' | 'unblock'

/**
 * Two responses, because the badge exists for batching and batching wants few
 * categories. `unblock` is every item where something is waiting on you or has
 * gone wrong — an approval, a question, a failed or stalled run, a red check, a
 * done-but-unverified result. `followup` is the one calm case: a session went
 * idle with its goal unfinished and just needs you to carry it forward.
 */
const VERB_FOR_SIGNAL: Partial<Record<RankSignal, ResponseVerb>> = {
  approval_owed: 'unblock',
  subagent_gate: 'unblock',
  input_requested: 'unblock',
  unverified_completion: 'unblock',
  error_loop: 'unblock',
  run_failed: 'unblock',
  stalled: 'unblock',
  changes_requested: 'unblock',
  change_blocked: 'unblock',
  // Approved and green: nobody but the developer can clear it, so it is an
  // unblock even though nothing has gone wrong.
  merge_ready: 'unblock',
  // Assigned but unstarted is the calm case the followup lane exists for.
  assigned_to_you: 'followup',
  nobody_on_it: 'followup',
}

/**
 * Derived from the SAME ranked signals the ordering uses, strongest first, so the
 * badge and the item's position can never tell different stories. Age and queue
 * depth are amplifiers rather than reasons, so they are skipped instead of
 * leaving an item unlabelled.
 */
export function responseVerb(item: WorkItem, now: number = Date.now()): ResponseVerb | null {
  if (item.state !== 'needs-you') return null
  for (const ranked of rankWorkItem(item, now).signals) {
    const verb = VERB_FOR_SIGNAL[ranked.signal]
    if (verb) return verb
  }
  return null
}

/**
 * User-driven set-aside, the two ways to take an item out of Needs you by hand:
 *
 * SNOOZE ("Later") hides the item for a fixed window. The queue is derived
 * fresh every poll, so without a record the item would reappear seconds after
 * being dismissed — this map IS the record, held by the caller (persisted in
 * the browser) because the backend keeps no state.
 *
 * HANDLED ("Handled") is the user saying the item no longer needs them. Per the
 * product rule, explicit user closure is one of the two things that establishes
 * Done. The mark stores the item's updatedAt AT THE MOMENT of marking: any new
 * activity bumps updatedAt past it and the mark silently expires, so a session
 * that comes back with a new question is never muted by an old dismissal.
 */
export const SNOOZE_MS = 4 * 60 * 60 * 1000

export function applySetAside(
  items: WorkItem[],
  snoozed: Record<string, number>,
  handled: Record<string, number>,
  now: number = Date.now(),
): { items: WorkItem[]; snoozedCount: number } {
  let snoozedCount = 0
  const out: WorkItem[] = []
  for (const item of items) {
    if (item.state !== 'needs-you') {
      out.push(item)
      continue
    }
    const until = snoozed[item.id]
    if (until && until > now) {
      snoozedCount += 1
      continue
    }
    const markedAt = handled[item.id]
    if (markedAt !== undefined && item.updatedAt <= markedAt) {
      out.push({ ...item, state: 'done' as WorkState, issue: false })
      continue
    }
    out.push(item)
  }
  return { items: out, snoozedCount }
}

/**
 * Done shows a day, not an archive. Older finished work belongs to recall
 * (search), which exists for exactly that question. updatedAt of 0 means the
 * platform reported no timestamp — unknown is not ancient, so those stay.
 */
export const DONE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

export function inDoneWindow(item: WorkItem, now: number = Date.now()): boolean {
  if (item.state !== 'done') return true
  if (item.updatedAt === 0) return true
  return now - item.updatedAt <= DONE_WINDOW_MS
}

const TIME_DIRECTION: Record<WorkState, 1 | -1> = {
  'needs-you': 1,
  running: -1,
  done: -1,
}

/**
 * Compare two items of the same state by time.
 *
 * A missing timestamp means UNKNOWN, not ancient. Sorting ascending without
 * this guard would float every item lacking a timestamp (an orphan workflow
 * run, for instance) straight to the top of the attention queue.
 */
function compareByTime(a: WorkItem, b: WorkItem, direction: 1 | -1): number {
  const aKnown = a.updatedAt > 0
  const bKnown = b.updatedAt > 0
  if (!aKnown && !bKnown) return 0
  if (!aKnown) return 1
  if (!bKnown) return -1
  return (a.updatedAt - b.updatedAt) * direction
}

/**
 * The one-sentence answer to "why is this here".
 *
 * Built from the SAME signals that produced the score, so the sentence and the
 * position cannot disagree. Only the two strongest are named: a sentence listing
 * six reasons is a list, and the user is already reading a list.
 */
export function explainRank(ranking: Ranking, copy: WorkCopy): string {
  const named = ranking.signals.slice(0, 2)
  if (named.length === 0) return copy('rank_nothing_pressing')
  const parts = named.map(s => copy(`rank_${s.signal}` as WorkCopyKey, s.values))
  return parts.join(copy('rank_join'))
}

export function sortWorkItems(items: WorkItem[], now: number = Date.now()): WorkItem[] {
  // Score once per item rather than inside the comparator, which would recompute
  // it O(n log n) times and could see a different `now` between comparisons.
  const ranked = new Map(items.map(item => [item.id, rankWorkItem(item, now)]))

  return [...items].sort((a, b) => {
    const stateDelta = STATE_RANK[a.state] - STATE_RANK[b.state]
    if (stateDelta !== 0) return stateDelta

    // Inside the attention queue, cost decides — not the bare presence of an
    // issue, which is only one of the signals feeding the score.
    if (a.state === 'needs-you') {
      const scoreDelta = (ranked.get(b.id)?.score ?? 0) - (ranked.get(a.id)?.score ?? 0)
      if (scoreDelta !== 0) return scoreDelta
    } else if (a.issue !== b.issue) {
      return a.issue ? -1 : 1
    }

    return compareByTime(a, b, TIME_DIRECTION[a.state])
  })
}

export function normalizeWorkItems(
  sources: WorkSources,
  copy: WorkCopy,
  summaries: Record<string, SessionSummary> = {},
  stalls: Record<string, StallFinding> = {},
  loops: Record<string, ErrorLoopFinding> = {},
  verdicts: GoalVerdicts = EMPTY_VERDICTS,
  now: number = Date.now(),
): WorkItem[] {
  const items = new Map<string, WorkItem>()
  const bySession = new Map<string, WorkItem>()

  for (const slot of sources.slots) {
    if (!slot.key || CONDUCTOR_SLOT_KEYS.has(slot.key) || slot.memory_mode === 'incognito') continue

    const intentItems = intentWorkItems(slot, summaries[slot.key], copy)
    if (intentItems.length > 0) {
      for (const item of intentItems) items.set(item.id, item)
      // Related records attach to the intent that most plausibly owns them:
      // the one waiting on the user, else the most recently touched.
      const anchor = intentItems.find(item => item.state === 'needs-you') ?? intentItems[0]
      bySession.set(slot.key, anchor)
      continue
    }

    const item = sessionItem(slot, copy)
    items.set(item.id, item)
    bySession.set(slot.key, item)
  }

  /*
   * Work the developer owns in the forge, folded in.
   *
   * The rule that matters: if a pull request or issue is ALREADY on the board via
   * some session's source links, its ownership facts are written onto that
   * existing row rather than becoming a second row. Anything else re-lists the
   * same work under a different heading, which is the failure the spec names --
   * adding to the view makes it worse, so a new signal joins an existing group
   * instead of opening a section.
   *
   * A standalone row is created only for work NO session touches, which is
   * precisely the gap: a PR waiting on the developer that no session has ever
   * opened is invisible to every other source here.
   */
  if (sources.assigned?.length) {
    const byUrl = new Map<string, WorkItem>()
    for (const existing of items.values()) {
      for (const ref of existing.references) {
        if ((ref.kind === 'change' || ref.kind === 'issue') && ref.url && !byUrl.has(ref.url)) {
          byUrl.set(ref.url, existing)
        }
      }
    }
    /*
     * Standalone rows are CAPPED, and enrichment is not.
     *
     * Enriching a row the board already shows costs nothing -- it is the same
     * card, better described. Adding rows does cost something, and a developer
     * with fifty open pull requests would get a queue that is mostly forge
     * backlog, which is a list to work through rather than a thing that needs
     * them now. The full set stays one click away in the PRs card; what belongs
     * in the attention queue is a few of the most blocking.
     *
     * Ordered by how much the block costs, which is the same principle
     * SIGNAL_WEIGHT encodes: a conflict or a red check outranks a review that has
     * asked for changes, which outranks an approved PR waiting only on a merge,
     * which outranks an unstarted assigned issue.
     */
    /*
     * Cost order, mirroring SIGNAL_WEIGHT so the cap and the queue cannot
     * disagree about what matters most. A reviewer who has stopped to ask for
     * changes is a person waiting on the developer, which outranks a conflict or
     * a red check -- those are mechanical and nobody is idle while they sit.
     */
    const OWNED_RANK: Record<string, number> = {
      changes_requested: 0,
      conflict: 1,
      checks_failing: 2,
      ready_to_merge: 3,
      assigned: 4,
    }
    /*
     * Filled by taking ONE of each kind in cost order, then going round again --
     * not simply the N most blocking.
     *
     * Straight cost order looks right and behaves badly: measured against a real
     * account with six conflicting pull requests, a cap of five filled entirely
     * with conflicts and the developer's single assigned issue never appeared at
     * all. A queue that can only ever show its loudest category is not a summary
     * of what needs you. Round-robin guarantees every kind of block is
     * represented before any kind is represented twice.
     */
    const byStatus = new Map<string, AssignedWork[]>()
    for (const row of sources.assigned) {
      if (!row?.url || byUrl.has(row.url) || !(row.status in OWNED_RANK)) continue
      const bucket = byStatus.get(row.status)
      if (bucket) bucket.push(row)
      else byStatus.set(row.status, [row])
    }
    const queues = [...byStatus.entries()]
      .sort((a, b) => (OWNED_RANK[a[0]] ?? 9) - (OWNED_RANK[b[0]] ?? 9))
      .map(entry => entry[1])
    const standalone: AssignedWork[] = []
    for (let round = 0; standalone.length < OWNED_STANDALONE_LIMIT; round += 1) {
      let tookOne = false
      for (const queue of queues) {
        if (standalone.length >= OWNED_STANDALONE_LIMIT) break
        const row = queue[round]
        if (!row) continue
        standalone.push(row)
        tookOne = true
      }
      if (!tookOne) break
    }
    const standaloneUrls = new Set(standalone.map(row => row.url))
    for (const row of sources.assigned) {
      if (!row?.url) continue
      // Enrichment applies to everything; a standalone row only to the few that
      // survived the cap.
      if (!byUrl.has(row.url) && !standaloneUrls.has(row.url)) continue
      const owned: 'pull' | 'issue' = row.kind === 'issue' ? 'issue' : 'pull'
      // Only these three states are the developer's move. `awaiting_review` and
      // `checks_running` are waiting on someone or something else, so they are
      // recorded as owned but raise no signal and stay out of the queue.
      const blocked = row.status === 'conflict' || row.status === 'checks_failing'
      const changesRequested = row.status === 'changes_requested'
      const mergeReady = row.status === 'ready_to_merge'
      const assignedToYou = owned === 'issue'

      const existing = byUrl.get(row.url)
      if (existing) {
        existing.owned = owned
        if (blocked) { existing.changeBlocked = true; existing.issue = true }
        if (changesRequested) existing.changesRequested = true
        if (mergeReady) existing.mergeReady = true
        // Ownership can only ever RAISE an item into the queue, never demote one
        // out of it: a session already needing a reply does not stop needing it
        // because its PR happens to be green.
        if ((blocked || changesRequested || mergeReady) && existing.state === 'done') {
          existing.state = 'needs-you'
        }
        continue
      }

      const actionable = blocked || changesRequested || mergeReady || assignedToYou
      const summaryKey: WorkCopyKey = owned === 'issue'
        ? 'owned_issue_assigned'
        : row.status === 'conflict' ? 'owned_pull_conflict'
          : row.status === 'checks_failing' ? 'owned_pull_failing'
            : row.status === 'changes_requested' ? 'owned_pull_changes_requested'
              : row.status === 'ready_to_merge' ? 'owned_pull_merge_ready'
                : row.status === 'checks_running' ? 'owned_pull_checks_running'
                  : 'owned_pull_awaiting_review'
      const label = owned === 'issue' ? `issue #${row.number}` : `#${row.number}`
      items.set(`owned:${row.url}`, {
        id: `owned:${row.url}`,
        title: row.title || label,
        summary: copy(summaryKey, {
          count: String(row.status === 'checks_failing' ? row.failing : row.pending),
        }),
        state: actionable ? 'needs-you' : 'running',
        issue: blocked,
        updatedAt: epoch(row.updated_at),
        provenance: copy('owned_provenance', { repo: row.repo }),
        references: [{
          kind: owned === 'issue' ? 'issue' : 'change',
          id: row.url,
          label: `${row.repo} ${label}`,
          url: row.url,
          status: row.status === 'awaiting_review' ? undefined : row.status.replace(/_/g, ' '),
        }],
        // No session, so no action can be offered on the row itself: opening it
        // means opening the forge, which the reference link already does.
        action: undefined,
        owned,
        changeBlocked: blocked || undefined,
        changesRequested: changesRequested || undefined,
        mergeReady: mergeReady || undefined,
        assignedToYou: assignedToYou || undefined,
      })
    }
  }

  // A stalled session is running on paper and wedged in practice. That is a
  // reason the user must step in, so it joins the one action queue as an issue
  // rather than sitting in Running looking healthy.
  for (const [key, finding] of Object.entries(stalls)) {
    const target = bySession.get(key)
    if (!target) continue
    target.state = 'needs-you'
    target.issue = true
    target.stalledFor = finding.silent_secs
    // The whole point of the reason is that the decision happens HERE, in the
    // list. It used to reach only the bell notification, which meant the card
    // still said nothing but a duration and the user had to open the session to
    // learn what had been going on -- exactly the cost this queue removes.
    target.summary = finding.reason
      ? copy('stalled_because', {
        reason: finding.reason,
        duration: describeSilence(finding.silent_secs),
      })
      : copy('stalled_for', { duration: describeSilence(finding.silent_secs) })
    target.action = 'open'
  }

  // Busy but getting nowhere. Same treatment as a stall: it is a reason the user
  // must step in, and it outranks the stall copy because it says WHY.
  for (const [key, loop] of Object.entries(loops)) {
    const target = bySession.get(key)
    if (!target) continue
    target.state = 'needs-you'
    target.issue = true
    target.loopRepeats = loop.repeats
    target.summary = copy('error_loop', { tool: loop.tool, repeats: String(loop.repeats) })
    target.action = 'open'
  }

  for (const approval of sources.approvals) {
    const target = approval.slot ? bySession.get(approval.slot) : undefined
    if (target) {
      mergeApproval(target, approval, copy)
      continue
    }
    // Earlier this sat in Done wearing an Issue badge, on the reasoning that the
    // user had "nowhere to review it". That was wrong: an approval is answerable
    // over its own endpoint, so a missing session costs the user context, not the
    // decision. It is a decision owed, and it can be made from here.
    items.set(`approval:${approval.id}`, {
      id: `approval:${approval.id}`,
      title: deriveWorkTitle(approval.tool || approval.source, copy('approval_needed')),
      summary: approval.tool_purpose || copy('tool_call_waiting'),
      state: 'needs-you',
      issue: false,
      updatedAt: epoch(approval.ts),
      provenance: copy('approval'),
      action: 'review-approval',
      approvalKind: isSubagentGate(approval) ? 'subagent' : 'tool',
      permissionId: approval.id,
      permissionTool: approval.tool || approval.source,
      permissionPurpose: approval.tool_purpose,
      permissionInput: approval.tool_input,
      references: [{
        kind: 'approval',
        id: approval.id,
        label: approval.tool || approval.source || copy('approval'),
      }],
    })
  }

  for (const agent of sources.agents) {
    const target = agent.parent ? bySession.get(agent.parent) : undefined
    if (target) {
      mergeAgent(target, agent, copy)
      continue
    }
    const failed = Boolean(agent.done && (agent.error || agent.outcome === 'failed'))
    // A subagent belongs to its parent session, not the top level. When the
    // parent is on the board it folds in above. When it is NOT, a SUCCESSFUL run
    // is just noise — an implementation detail of a session that is not even
    // here — so it is dropped. A FAILED orphan still surfaces, because a failure
    // nobody can see is the one thing worth keeping visible.
    if (agent.parent && !failed) continue
    items.set(`agent:${agent.id}`, {
      id: `agent:${agent.id}`,
      title: deriveWorkTitle(agent.task || agent.agent, copy('agent_work')),
      // A failed run is unfinished work, not a closed-out problem. It used to sit
      // in Done wearing an Issue badge, which claimed the outcome happened and
      // that it failed, on one card. The response is to read the error and retry.
      summary: failed
        ? (agent.error?.trim() || copy('agent_failed', { task: agent.task }))
        : agent.done ? copy('agent_done') : copy('work_in_progress'),
      state: failed ? 'needs-you' : agent.done ? 'done' : 'running',
      issue: failed,
      runFailed: failed || undefined,
      // Only a terminal FAILED agent is retryable — never a running one (that
      // doubles the work) and never a user-stopped one (they killed it on purpose).
      retryPath: failed && !agent.id.startsWith('native:')
        ? `/api/spawn/${encodeURIComponent(agent.id)}/retry`
        : undefined,
      updatedAt: epoch(agent.started),
      provenance: agent.agent || copy('agent'),
      action: 'discuss',
      references: [{ kind: 'agent', id: agent.id, label: agent.agent || copy('agent') }],
    })
  }

  for (const workflow of sources.workflows) {
    const target = workflow.session_key ? bySession.get(workflow.session_key) : undefined
    if (target) {
      mergeWorkflow(target, workflow, copy)
      continue
    }
    const failed = workflow.status === 'failed'
    items.set(`workflow:${workflow.run_id}`, {
      id: `workflow:${workflow.run_id}`,
      title: deriveWorkTitle(workflow.name, workflow.run_id),
      summary: failed
        ? copy('workflow_failed_generic')
        : workflow.status === 'running'
          ? copy('workflow_running')
          : copy('workflow_finished'),
      state: failed ? 'needs-you' : workflow.status === 'running' ? 'running' : 'done',
      issue: failed,
      runFailed: failed || undefined,
      /*
       * The same account a summarized session gets, built from the run's own
       * fields. A workflow has no user sentence to quote, so it fills two of the
       * three sections rather than inventing an "asked for" — and a run that
       * reported nothing fills none, leaving the card exactly as compact as it
       * was.
       */
      progress: workflowFacts(workflow, copy),
      nextSteps: workflowSteps(workflow, copy),
      retryPath: failed
        ? `/api/workflows/runs/${encodeURIComponent(workflow.run_id)}/rerun`
        : undefined,
      updatedAt: 0,
      provenance: copy('workflow'),
      action: 'discuss',
      references: [{
        kind: 'workflow',
        id: workflow.run_id,
        label: workflow.name || workflow.run_id,
      }],
    })
  }

  for (const cron of sources.crons) {
    if (!cron.is_running && cron.last_status !== 'error') continue
    const failed = cron.last_status === 'error'
    // A failed check that will run again on its own reads very differently from
    // one that will not: the same red card either resolves itself in ten minutes
    // or waits for a person forever. Only shown when the platform gave a time.
    const nextCheck = nextRunIn(cron, now)
    const monitorSummary = failed ? copy('monitor_failed') : copy('monitor_running')
    items.set(`monitor:${cron.id}`, {
      id: `monitor:${cron.id}`,
      title: cron.name,
      summary: nextCheck
        ? `${monitorSummary} ${copy('monitor_next_check', { duration: nextCheck })}`
        : monitorSummary,
      state: failed ? 'needs-you' : 'running',
      issue: failed,
      runFailed: failed || undefined,
      retryPath: failed ? `/api/crons/${encodeURIComponent(cron.id)}/run` : undefined,
      updatedAt: epoch(cron.running_since || cron.last_run_ts || cron.created_ts),
      provenance: copy('monitor'),
      action: failed ? 'discuss' : undefined,
      references: [{ kind: 'monitor', id: cron.id, label: cron.name }],
    })
  }

  // A live auto-nudge loop is the only work here that keeps going without anyone
  // choosing to continue it, so it gets a row while it is active and disappears
  // the moment it is not. It is never `needs-you`: nothing is owed to the user,
  // and putting it in the queue would be asking for a decision nobody requested.
  for (const loop of sources.loops || []) {
    if (!loop.active) continue
    const id = String(loop.id || '')
    if (!id) continue
    const cycles = Math.max(0, Number(loop.cycle_count) || 0)
    const cap = Math.max(0, Number(loop.max_cycles) || 0)
    const onSession = loop.slot_key && bySession.has(loop.slot_key) ? loop.slot_key : undefined
    items.set(`loop:${id}`, {
      id: `loop:${id}`,
      title: deriveWorkTitle(loop.message || '', copy('loop')),
      // An uncapped loop is named as such rather than shown as "3/∞": unbounded
      // is the fact that decides whether to leave it running.
      summary: cap
        ? copy('loop_watching_capped', { cycles: String(cycles), cap: String(cap) })
        : copy('loop_watching', { cycles: String(cycles) }),
      state: 'running',
      issue: false,
      updatedAt: epoch(loop.last_fire_ts || loop.created_ts),
      sessionKey: onSession,
      // The session that armed the loop is its parent, and that is a recorded
      // fact — so the two group as one goal instead of reading as two.
      parentId: onSession ? bySession.get(onSession)?.id : undefined,
      provenance: copy('loop'),
      // Stopping is the whole point of surfacing it, and it is not a retry.
      stopPath: `/api/autonudge/${encodeURIComponent(id)}`,
      action: onSession ? 'open' : undefined,
      references: [
        { kind: 'monitor', id, label: copy('loop'), sessionKey: onSession },
        ...(onSession
          ? [{
            kind: 'session' as const,
            id: onSession,
            label: bySession.get(onSession)?.title || onSession,
            sessionKey: onSession,
          }]
          : []),
      ],
    })
  }

  const newestArtifacts = [...sources.artifacts]
    .sort((a, b) => epoch(b.updated_at) - epoch(a.updated_at))
    .slice(0, 8)
  for (const artifact of newestArtifacts) {
    const reachableSession = artifact.session_key && bySession.has(artifact.session_key)
      ? artifact.session_key
      : undefined
    items.set(`artifact:${artifact.slug}`, {
      id: `artifact:${artifact.slug}`,
      title: deriveWorkTitle(artifact.name, copy('artifact')),
      summary: artifact.description || copy('artifact_ready', { kind: artifact.kind }),
      state: 'done',
      issue: false,
      updatedAt: epoch(artifact.updated_at || artifact.created_at),
      sessionKey: reachableSession,
      // An output belongs to the work that produced it, when the platform says so.
      parentId: reachableSession ? bySession.get(reachableSession)?.id : undefined,
      provenance: artifact.session_title || artifact.source || copy('artifact'),
      action: reachableSession ? 'open' : undefined,
      references: [
        { kind: 'artifact', id: artifact.slug, label: artifact.name, sessionKey: reachableSession },
        ...(reachableSession
          ? [{ kind: 'session' as const, id: reachableSession, label: artifact.session_title || reachableSession, sessionKey: reachableSession }]
          : []),
      ],
    })
  }

  const built = [...items.values()]
  // Last, so it sees the finished shape of every item -- its links, its title
  // after intent derivation, and its final state.
  markDuplicates(built, verdicts)
  return sortWorkItems(built)
}

export function workCounts(items: WorkItem[]): Record<'all' | WorkState, number> {
  return {
    all: items.length,
    'needs-you': items.filter(item => item.state === 'needs-you').length,
    running: items.filter(item => item.state === 'running').length,
    done: items.filter(item => item.state === 'done').length,
  }
}

export function searchWorkItems(items: WorkItem[], query: string): WorkItem[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return items
  return items.filter(item => {
    const haystack = [
      item.title,
      item.summary,
      item.provenance,
      ...item.references.flatMap(ref => [ref.label, ref.id, ref.url]),
    ].join(String.fromCharCode(10)).toLowerCase()
    return haystack.includes(needle)
  })
}

export interface SessionRollup {
  sessionKey: string
  label: string
  /** The most-urgent work item of this session in the group — the select target. */
  leading: WorkItem
  /** How many of this session's work items are in the group. */
  count: number
}

/**
 * Collapse a set of work items to one row per session, keeping the most-urgent
 * one (the first, since the list arrives sorted) as the row's representative and
 * select target.
 *
 * Retained deliberately after the PR view was removed: it is the session-identity
 * primitive — "which sessions are behind this set of items" — and the deleted
 * PR card was one caller of it, not its definition.
 */
export function rollUpSessions(items: WorkItem[]): SessionRollup[] {
  const out: SessionRollup[] = []
  const byKey = new Map<string, SessionRollup>()
  for (const item of items) {
    const key = item.sessionKey
    if (!key) continue
    const existing = byKey.get(key)
    if (existing) {
      existing.count += 1
      continue
    }
    const label = item.references.find(ref => ref.kind === 'session')?.label ?? item.provenance
    const rollup: SessionRollup = { sessionKey: key, label, leading: item, count: 1 }
    byKey.set(key, rollup)
    out.push(rollup)
  }
  return out
}

export interface WorkBlock {
  key: string
  items: WorkItem[]
  /** Header kind. null renders no header (ungrouped item). */
  header: 'session' | null
  /** Present for session headers, to wire Open. */
  sessionKey: string | null
}

/**
 * Group the (already ordered) list into one block per session. Grouping is a lens
 * over the flat list: a group takes the position of its most-urgent member (the
 * first one, since the list arrives sorted), and order within a group is
 * preserved. Nothing is re-scored.
 *
 * Session is the ONLY grouping. The Goals lens and the PR lens were two further
 * answers to the question this app asks once, and are archived on
 * `archive/goal-and-pr-views`.
 */
export function clusterBy(items: WorkItem[]): WorkBlock[] {
  const blocks: WorkBlock[] = []
  const byKey = new Map<string, WorkBlock>()

  for (const item of items) {
    const key = item.sessionKey
    if (!key) {
      blocks.push({ key: item.id, items: [item], header: null, sessionKey: null })
      continue
    }
    const existing = byKey.get(key)
    if (existing) {
      existing.items.push(item)
      continue
    }
    const block: WorkBlock = {
      key,
      items: [item],
      header: 'session',
      sessionKey: item.sessionKey ?? null,
    }
    byKey.set(key, block)
    blocks.push(block)
  }
  return blocks
}

/**
 * What a goal is MADE OF, for the card's one-line composition meta. Counts only
 * the entities its members actually represent — distinct sessions, the PRs and
 * issues they link, and any loop / cron / agent members — plus the most recent
 * activity across them. Every field is read from real data; there is no per-goal
 * creation timestamp, so the meta reports last activity rather than a start date.
 */
export interface GoalComposition {
  sessions: number
  prs: number
  issues: number
  loops: number
  crons: number
  agents: number
  needsYou: number
  lastActivityAt: number
}

export function goalComposition(items: WorkItem[]): GoalComposition {
  const sessions = new Set<string>()
  const prs = new Set<string>()
  const issues = new Set<string>()
  let loops = 0
  let crons = 0
  let agents = 0
  let needsYou = 0
  let lastActivityAt = 0
  for (const item of items) {
    if (item.sessionKey) sessions.add(item.sessionKey)
    for (const ref of item.references) {
      if (ref.kind === 'change') prs.add(ref.id)
      else if (ref.kind === 'issue') issues.add(ref.id)
    }
    if (item.id.startsWith('workflow:')) loops += 1
    else if (item.id.startsWith('monitor:')) crons += 1
    else if (item.id.startsWith('agent:')) agents += 1
    if (item.state === 'needs-you') needsYou += 1
    if (item.updatedAt > lastActivityAt) lastActivityAt = item.updatedAt
  }
  return { sessions: sessions.size, prs: prs.size, issues: issues.size, loops, crons, agents, needsYou, lastActivityAt }
}

