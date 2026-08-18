import type {
  Artifact,
  ChatSlot,
  CronJob,
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
  | 'agent_failed'
  | 'workflow_failed'
  | 'workflow_failed_generic'
  | 'workflow_running'
  | 'workflow_finished'
  | 'monitor_failed'
  | 'monitor_running'
  | 'artifact_ready'
  | 'stalled_for'
  | 'stalled_because'
  | 'duplicate_same_change'
  | 'duplicate_same_topic'
  | 'rank_approval_owed'
  | 'rank_subagent_gate'
  | 'rank_input_requested'
  | 'rank_unverified_completion'
  | 'rank_error_loop'
  | 'rank_run_failed'
  | 'rank_stalled'
  | 'rank_change_blocked'
  | 'rank_nobody_on_it'
  | 'no_next_step'
  | 'rank_queued_behind'
  | 'rank_waiting_a_while'
  | 'rank_nothing_pressing'
  | 'rank_join'
  | 'error_loop'
  | 'untitled_work'

export type WorkCopy = (key: WorkCopyKey, values?: Record<string, string>) => string

export interface WorkReference {
  kind: WorkReferenceKind
  id: string
  label: string
  url?: string
  sessionKey?: string
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
  provenance: string
  action?: WorkAction
  /** Suggested next steps, present only for summarized intents. */
  nextSteps?: SummaryNextStep[]
  /** What already happened on this intent, newest last. */
  progress?: string[]
  /** True when the summary predates the session's latest turn. */
  stale?: boolean
  /** Highest user turn this intent covers; orders goals within one session. */
  lastTouchedTurn?: number
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
  /** How many unfinished goals this stopped session left with nobody on them. */
  unattendedGoals?: number
  /**
   * The names of those goals. The card must NAME them, not just count them: a
   * card reading "4 unfinished goals" makes the user open a thread to learn what
   * is being asked, which is the cost this queue exists to remove.
   */
  goals?: string[]
  /** Finished goals of the same session, shown checked on a Resume card. */
  doneGoals?: string[]
  /**
   * Other live work that appears to be the same job. Advice only: it never moves
   * the item or changes its state.
   */
  duplicateOf?: { sessionKey: string; title: string; because: 'same_change' | 'same_topic' }
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
  /** A run that ended failed. Unfinished work, so it belongs in the queue. */
  runFailed?: boolean
  /** Where to re-run it. Absent when the platform cannot retry this kind. */
  retryPath?: string
  /** Prompts queued behind this session's active turn (same session only). */
  queuedBehind?: number
  /** A linked change has a failing check or a conflict. */
  changeBlocked?: boolean
  /** Completed but never verified — the platform's own needs-you signal. */
  unverified?: boolean
}

export interface ApprovalRow {
  id: string
  source?: string
  tool?: string
  slot?: string
  ts?: number
  /** The tool's own stated reason. This is what makes an approval decidable here. */
  tool_purpose?: string
}

export interface SentInstruction {
  ts: string
  target: string
  message: string
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
}

export interface WorkflowRow {
  run_id: string
  name: string
  status: 'running' | 'finished' | 'failed' | 'cancelled'
  session_key: string | null
  error: string | null
  event_count: number
}

export interface WorkSources {
  slots: ChatSlot[]
  approvals: ApprovalRow[]
  agents: AgentRow[]
  workflows: WorkflowRow[]
  crons: CronJob[]
  artifacts: Artifact[]
}

const STATE_RANK: Record<WorkState, number> = {
  'needs-you': 0,
  running: 1,
  done: 2,
}

function epoch(value?: string | number | null): number {
  if (typeof value === 'number') return value > 10_000_000_000 ? value : value * 1000
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
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
  // A failing check or a conflict on this session's own change IS actionable —
  // open it, re-run it, fix it. It used to sit in Done wearing an Issue badge,
  // which contradicted both the completion model (the committed outcome was not
  // reached) and the rule that an issue is one reason something needs you.
  // A dead agent run stays in Done, because nothing can be done about it.
  if (sessionIssue(slot)) return 'needs-you'
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

function sessionItem(slot: ChatSlot, copy: WorkCopy): WorkItem {
  const changeRefs: WorkReference[] = (slot.source_links ?? []).map(link => ({
    // The spec asks the card to show "the issue behind it". A pull request and an
    // issue arrived here labelled identically, so neither could be told from the
    // other; the platform has always distinguished them via `kind`.
    kind: link.kind === 'issue' ? 'issue' : 'change',
    id: link.url,
    label: link.kind === 'issue'
      ? `issue #${link.number}`
      : `${link.provider} #${link.number}`,
    url: link.url,
    sessionKey: slot.key,
  }))
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

function mergeWorkflow(item: WorkItem, workflow: WorkflowRow, copy: WorkCopy): void {
  item.issue ||= workflow.status === 'failed'
  if (workflow.status === 'running' && item.state !== 'needs-you') item.state = 'running'
  if (workflow.status === 'failed' && item.state !== 'needs-you') {
    item.summary = copy('workflow_failed', { name: workflow.name })
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
 * The platform already decided the hard part, and Crew Manager trusts it rather
 * than second-guessing: `needs-you` means the goal was completed but never
 * verified ("merged but never run"). An intent that is merely still in progress
 * is open work, NOT a demand — a real session carries up to 8 of them at once,
 * so promoting them would bury the genuine handoffs.
 */
function intentState(intent: SummaryIntent, slot: ChatSlot): WorkState | null {
  if (slot.pending_approval) return 'needs-you'

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

function intentWorkItems(
  slot: ChatSlot,
  summary: SessionSummary | undefined,
  copy: WorkCopy,
): WorkItem[] {
  if (!summary?.enabled) return []
  const intents = summary.intents ?? []
  if (intents.length === 0) return []

  const changeRefs: WorkReference[] = (slot.source_links ?? []).map(link => ({
    // The spec asks the card to show "the issue behind it". A pull request and an
    // issue arrived here labelled identically, so neither could be told from the
    // other; the platform has always distinguished them via `kind`.
    kind: link.kind === 'issue' ? 'issue' : 'change',
    id: link.url,
    label: link.kind === 'issue'
      ? `issue #${link.number}`
      : `${link.provider} #${link.number}`,
    url: link.url,
    sessionKey: slot.key,
  }))

  const built: WorkItem[] = []
  // The one goal the session touched last is the only one that can be in motion.
  const leadingIntent = leadingIntentOf(intents)
  const executing = Boolean(slot.running || slot.subagents_running || slot.orchestrating)

  /*
   * An IDLE session's unfinished goals belong to the user, not to the agent.
   *
   * While a session executes, responsibility sits with the agent and its goals
   * are Running. The moment it stops, nobody is on them — and the only actor who
   * can move them is the user, which is exactly what Needs you means. They used
   * to sit in Running wearing an invented "Idle" badge: a label for a bucket
   * they should never have been in.
   *
   * They collapse into ONE card because a stopped session poses ONE decision —
   * resume it, or let it go. Three cards would be three demands for one
   * decision, which is the flooding this deliberately avoids.
   */
  const unattended = executing
    ? []
    : intents.filter(intent => intent.state === 'in-progress')

  if (unattended.length > 0) {
    const leading = unattended.reduce(
      (top, i) => ((i.last_touched_turn ?? 0) >= (top.last_touched_turn ?? 0) ? i : top),
      unattended[0],
    )
    const nextStep = leading.next_steps?.find(step => step.what?.trim())?.what?.trim()
    built.push({
      id: `unattended:${slot.key}`,
      title: slot.title || copy('untitled_work'),
      summary: nextStep || copy('no_next_step'),
      state: 'needs-you',
      issue: sessionIssue(slot),
      updatedAt: epoch(slot.last_ts || slot.last_activity_ts || slot.created),
      sessionKey: slot.key,
      provenance: provenanceLabel(slot, copy),
      queuedBehind: slot.queue_depth || undefined,
      changeBlocked: sessionIssue(slot) || undefined,
      unattendedGoals: unattended.length,
      action: 'resume',
      references: [
        { kind: 'session', id: slot.key, label: slot.title || copy('untitled_work'), sessionKey: slot.key },
        ...changeRefs,
      ],
      nextSteps: unattended.flatMap(intent => (intent.next_steps ?? []).filter(step => step.what?.trim())),
      goals: unattended.map(intent => intent.title?.trim()).filter((t): t is string => Boolean(t)),
      // The session's FINISHED goals, shown checked on the same card. Its larger
      // outcome is not done while goals remain, so these are progress, not
      // completions — by the completion rule they do not belong in Done as peers.
      doneGoals: intents
        .filter(intent => intent.state === 'done' || intent.state === 'dropped')
        .map(intent => intent.title?.trim())
        .filter((t): t is string => Boolean(t)),
      progress: [],
      stale: Boolean(summary.stale),
      lastTouchedTurn: leading.last_touched_turn ?? 0,
    })
  }

  intents.forEach((intent, index) => {
    // Already represented by the collapsed card above.
    if (unattended.includes(intent)) return
    // A finished goal of a session that still has unfinished goals is progress,
    // not a standalone completion: it is folded into that session's Resume card
    // as a checked goal, so it must not also stand as its own Done card. A
    // needs-you intent (e.g. a pending approval) is a real separate action and
    // still renders.
    if (unattended.length > 0 && (intent.state === 'done' || intent.state === 'dropped')) return
    const state = intentState(intent, slot)
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
      action: 'open',
      references: [
        { kind: 'session', id: slot.key, label: slot.title || copy('untitled_work'), sessionKey: slot.key },
        ...changeRefs,
      ],
      nextSteps,
      progress: (intent.progress ?? []).filter(entry => entry.trim()),
      stale: Boolean(summary.stale),
      lastTouchedTurn: intent.last_touched_turn ?? 0,
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
  | 'run_failed'
  | 'stalled'
  | 'change_blocked'
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
  run_failed: 55,
  stalled: 50,
  change_blocked: 40,
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

/**
 * Live work that duplicates other live work.
 *
 * Recall answers "did we do this before" from history. This answers the other
 * half the spec asks for: two sessions doing the same thing RIGHT NOW, which
 * history cannot see because neither has finished.
 *
 * Two signals, and they are not equally strong:
 *
 * * **the same linked change or issue** in two different sessions. This is a
 *   fact, not a guess, and it is the one that catches the expensive case;
 * * **the titles say the same thing**, which is a heuristic and gated hard
 *   (distinctive words only, measured against the shorter title, 60% floor).
 *
 * The NEWER item is the one marked, pointing back at the older. The new work is
 * what should be told it may be redundant; telling the session that started first
 * would be advice arriving too late to matter.
 *
 * It never changes state or ordering. The spec says recall is advice and never a
 * gate, and the same restraint applies here.
 */
export function markDuplicates(items: WorkItem[]): void {
  const live = items
    .filter(item => item.state !== 'done' && item.sessionKey)
    .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0))

  for (let newer = 1; newer < live.length; newer += 1) {
    const item = live[newer]
    for (let older = 0; older < newer; older += 1) {
      const prior = live[older]
      if (prior.sessionKey === item.sessionKey) continue

      const shared = linkedSources(item).find(url => linkedSources(prior).includes(url))
      if (shared) {
        item.duplicateOf = {
          sessionKey: prior.sessionKey as string,
          title: prior.title,
          because: 'same_change',
        }
        break
      }
      if (titleOverlap(item.title, prior.title) >= DUPLICATE_OVERLAP) {
        item.duplicateOf = {
          sessionKey: prior.sessionKey as string,
          title: prior.title,
          because: 'same_topic',
        }
        break
      }
    }
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
  if (item.runFailed) add('run_failed')
  if (item.stalledFor) add('stalled', { duration: describeSilence(item.stalledFor) })
  if (item.changeBlocked) add('change_blocked')
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
export type ResponseVerb = 'decide' | 'answer' | 'verify' | 'resume' | 'unblock'

/**
 * Which signals mean which response. `unblock` covers three different
 * interventions — redirect a failing call, check a silent session, fix a red
 * check — because the badge exists for batching, and batching wants few
 * categories. Six verbs stop being a column and become a second sentence.
 */
const VERB_FOR_SIGNAL: Partial<Record<RankSignal, ResponseVerb>> = {
  approval_owed: 'decide',
  subagent_gate: 'decide',
  input_requested: 'answer',
  unverified_completion: 'verify',
  error_loop: 'unblock',
  run_failed: 'unblock',
  stalled: 'unblock',
  change_blocked: 'unblock',
  nobody_on_it: 'resume',
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
    items.set(`agent:${agent.id}`, {
      id: `agent:${agent.id}`,
      title: deriveWorkTitle(agent.task || agent.agent, copy('agent_work')),
      // A failed run is unfinished work, not a closed-out problem. It used to sit
      // in Done wearing an Issue badge, which claimed the outcome happened and
      // that it failed, on one card. The response is to read the error and retry.
      summary: failed
        ? (agent.error?.trim() || copy('agent_failed', { task: agent.task }))
        : agent.done ? copy('recent_work_ready') : copy('work_in_progress'),
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
    items.set(`monitor:${cron.id}`, {
      id: `monitor:${cron.id}`,
      title: cron.name,
      summary: failed ? copy('monitor_failed') : copy('monitor_running'),
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
  markDuplicates(built)
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
