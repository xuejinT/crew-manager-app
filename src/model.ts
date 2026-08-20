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

export type PrBucket = 'failing' | 'running' | 'merged' | 'other'

/**
 * Which PR-status chip a change sits under. GitHub's live check counts win over
 * the coarse ci status; a merge conflict is failing because it needs you even
 * when checks are green. `other` (green/open/closed) shows only under All.
 */
/**
 * Which filter chip a PR answers to. A projection of the verdict, not a second
 * opinion: the chips and the row pills have to agree, or a Merged row sits in a
 * list whose Merged chip reads 0.
 */
export function prBucket(pr: PrSignals): PrBucket {
  const verdict = prVerdict(pr)
  if (verdict === 'merged') return 'merged'
  if (verdict === 'conflict' || verdict === 'ci-failing' || verdict === 'changes-requested') return 'failing'
  if (verdict === 'checks-running') return 'running'
  return 'other'
}

/**
 * One verdict per PR, in the order the user should act on them: a conflict has
 * to be cleared before a re-run of CI means anything, and a merged or closed PR
 * outranks everything because nothing about it is actionable.
 */
export type PrVerdict =
  | 'merged' | 'closed' | 'draft' | 'conflict' | 'ci-failing' | 'behind'
  | 'checks-running' | 'changes-requested' | 'comments-open' | 'needs-review'
  | 'ready' | 'open'

export const PR_VERDICT_LABELS: Record<PrVerdict, string> = {
  merged: 'Merged',
  closed: 'Closed',
  draft: 'Draft',
  conflict: 'Conflict',
  'ci-failing': 'CI failing',
  behind: 'Behind base',
  'checks-running': 'Checks running',
  'changes-requested': 'Changes requested',
  'comments-open': 'Comments open',
  'needs-review': 'Needs review',
  ready: 'Ready',
  open: 'Open',
}

/* Pill colour. Blocking-and-yours is red, waiting-on-someone is amber, mergeable
   is green, and anything with no next move is grey. */
export const PR_VERDICT_TONES: Record<PrVerdict, 'err' | 'warn' | 'ok' | 'muted'> = {
  merged: 'muted',
  closed: 'muted',
  draft: 'muted',
  conflict: 'err',
  'ci-failing': 'err',
  behind: 'warn',
  'checks-running': 'warn',
  'changes-requested': 'err',
  'comments-open': 'warn',
  'needs-review': 'warn',
  ready: 'ok',
  open: 'muted',
}

export interface PrSignals {
  /** The platform's coarse status, used when the richer fields are absent. */
  status?: string
  state?: string
  isDraft?: boolean
  /** GitHub mergeStateStatus, or GitLab's mapped onto the same vocabulary. */
  mergeState?: string
  mergeable?: string
  autoMerge?: boolean
  base?: string
  available?: boolean
  total?: number
  passing?: number
  failing?: number
  pending?: number
  unresolved?: number
  review?: 'approved' | 'changes-requested' | 'none'
  updatedAt?: number
}

const STALE_DAYS = 2

/* `status` is the platform's coarse reading and can be stale. Everywhere below it
   is a FALLBACK: when the fetched fields answer the same question, they win. */
function conflicting(pr: PrSignals): boolean {
  if (pr.mergeable === 'conflicting' || pr.mergeState === 'dirty') return true
  if (pr.mergeable || pr.mergeState) return false
  return pr.status === 'conflict'
}

export function prVerdict(pr: PrSignals): PrVerdict {
  const state = (pr.state ?? '').toUpperCase()
  const live = Boolean(pr.available) && (pr.total ?? 0) > 0
  if (state === 'MERGED' || (!state && pr.status === 'merged')) return 'merged'
  if (state === 'CLOSED') return 'closed'
  if (pr.isDraft || pr.mergeState === 'draft') return 'draft'
  if (conflicting(pr)) return 'conflict'
  if ((pr.failing ?? 0) > 0 || (!live && pr.status === 'checks failing')) return 'ci-failing'
  // A person waiting on you outranks bookkeeping: a rebase does not answer a
  // review, and a merge queue often handles being behind on its own.
  if (pr.review === 'changes-requested') return 'changes-requested'
  if ((pr.unresolved ?? 0) > 0) return 'comments-open'
  if (pr.mergeState === 'behind' || pr.mergeState === 'need_rebase') return 'behind'
  if ((pr.pending ?? 0) > 0 || (!live && pr.status === 'checks running')) return 'checks-running'
  if (pr.mergeState === 'blocked') return 'needs-review'
  if (pr.review === 'approved') return 'ready'
  if (pr.mergeState === 'clean' && live && (pr.failing ?? 0) === 0) return 'ready'
  return 'open'
}

const BLOCKER_PIECES = 4

/**
 * The row's one plain-English line: what is actually holding this PR up. Named
 * facts, not a score — "2 checks failing · merge conflict with main" tells the
 * user what to go and do, which a check ratio does not.
 *
 * Nothing here restates the verdict pill: a row reading "Draft — Draft" spends a
 * line saying nothing, so any piece matching the pill's own label is dropped.
 */
export function prBlockers(pr: PrSignals, now: number = Date.now()): string[] {
  const pieces: string[] = []
  const state = (pr.state ?? '').toUpperCase()
  if (state === 'MERGED' || pr.status === 'merged') return []
  if (state === 'CLOSED') return []
  if (pr.isDraft || pr.mergeState === 'draft') pieces.push('Draft')
  if (pr.review === 'changes-requested') pieces.push('Changes requested')
  else if (pr.review === 'approved') pieces.push('Approved')

  const failing = pr.failing ?? 0
  const pending = pr.pending ?? 0
  if (failing > 0) pieces.push(`${failing} check${failing === 1 ? '' : 's'} failing`)
  else if (pending > 0) pieces.push(`${pending} check${pending === 1 ? '' : 's'} running`)
  else if (pr.available && (pr.total ?? 0) > 0) pieces.push('All checks passing')

  if (conflicting(pr)) pieces.push(`merge conflict with ${pr.base || 'the base branch'}`)
  else if (pr.mergeState === 'behind' || pr.mergeState === 'need_rebase') {
    pieces.push(`behind ${pr.base || 'the base branch'}`)
  }

  const unresolved = pr.unresolved ?? 0
  if (unresolved > 0) pieces.push(`${unresolved} unresolved comment${unresolved === 1 ? '' : 's'}`)
  if (pr.mergeState === 'blocked' && pr.review !== 'changes-requested') pieces.push('waiting on review')
  if (pr.autoMerge) pieces.push('auto-merge armed')
  else if (prVerdict(pr) === 'ready') pieces.push('ready to merge')

  // Staleness is the quiet killer: a PR nobody has touched in days shows nothing
  // wrong on any individual field.
  const days = pr.updatedAt ? Math.floor((now - pr.updatedAt) / 86_400_000) : 0
  if (days >= STALE_DAYS) pieces.push(`no activity in ${days} days`)

  const pill = PR_VERDICT_LABELS[prVerdict(pr)].toLowerCase()
  return pieces.filter(piece => piece.toLowerCase() !== pill).slice(0, BLOCKER_PIECES)
}

/** A review comment as the platform PR payload reports it. */
export interface PrReviewComment {
  kind?: string
  state?: string
  author?: string
  createdAt?: string
  threadId?: string
  id?: string
  resolvable?: boolean
  resolved?: boolean
}

/**
 * The PR's review decision. Latest review per author wins: an approval that
 * follows the same person's change request is no longer a block, and counting
 * raw states would leave the PR blocked forever.
 */
export function reviewDecision(comments: PrReviewComment[]): 'approved' | 'changes-requested' | 'none' {
  const latest = new Map<string, { at: number; state: string }>()
  for (const comment of comments) {
    if (comment.kind !== 'review') continue
    const state = (comment.state ?? '').toUpperCase()
    if (state !== 'APPROVED' && state !== 'CHANGES_REQUESTED') continue
    const at = comment.createdAt ? Date.parse(comment.createdAt) || 0 : 0
    const author = comment.author ?? ''
    const prior = latest.get(author)
    if (!prior || at >= prior.at) latest.set(author, { at, state })
  }
  const states = [...latest.values()].map(entry => entry.state)
  if (states.includes('CHANGES_REQUESTED')) return 'changes-requested'
  if (states.includes('APPROVED')) return 'approved'
  return 'none'
}

/** Open review threads, counted once per thread rather than once per comment. */
export function unresolvedThreads(comments: PrReviewComment[]): number {
  const open = new Set<string>()
  for (const comment of comments) {
    if (!comment.resolvable || comment.resolved) continue
    open.add(comment.threadId || comment.id || '')
  }
  return open.size
}

/**
 * The repository a PR url belongs to. The board spans repos, so the row has to
 * say which one — and the url is the PR's identity, so it is the honest source.
 */
export function repoFromUrl(url?: string): string | undefined {
  if (!url) return undefined
  let path: string
  try {
    path = new URL(url).pathname
  } catch {
    return undefined
  }
  const segments = path.split('/').filter(Boolean)
  // GitLab nests groups and separates the project with /-/: .../project/-/merge_requests/12
  const dash = segments.indexOf('-')
  if (dash > 0) return segments[dash - 1]
  const marker = segments.findIndex(segment => segment === 'pull' || segment === 'pulls' || segment === 'merge_requests')
  if (marker > 0) return segments[marker - 1]
  return segments.length > 1 ? segments[1] : undefined
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
        : `${link.provider} #${link.number}`,
      url: link.url,
      sessionKey: slot.key,
      status: changeStatus(link),
    },
  }))
}

function sessionItem(slot: ChatSlot, copy: WorkCopy): WorkItem {
  // The SESSION-level item keeps every link the session has: the session really
  // is on all of them, and it is the row the PR view fans out from.
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

  /*
   * ONE ITEM PER UNFINISHED GOAL.
   *
   * These used to collapse into a single Resume card, on the theory that a
   * stopped session poses one decision. It does not: two goals in one session
   * are routinely unrelated work ("redesign the cards" and "fix the bugs"), so a
   * shared row claimed they were parts of one thing, gave them one badge, and let
   * a blocker belonging to one of them label both. Each goal is its own item —
   * separately selectable, separately quotable, separately explained.
   */
  unattended.forEach(intent => {
    const index = intents.indexOf(intent)
    const nextSteps = (intent.next_steps ?? []).filter(step => step.what?.trim())
    built.push({
      id: `unattended:${slot.key}:${index}`,
      title: deriveWorkTitle(intent.title, slot.title || copy('untitled_work')),
      summary: nextSteps[0]?.what?.trim() || copy('no_next_step'),
      state: 'needs-you',
      issue: sessionIssue(slot),
      updatedAt: epoch(slot.last_ts || slot.last_activity_ts || slot.created),
      sessionKey: slot.key,
      provenance: provenanceLabel(slot, copy),
      queuedBehind: slot.queue_depth || undefined,
      changeBlocked: sessionIssue(slot) || undefined,
      // Still the nobody_on_it signal — this goal is idle and only the user can
      // move it — but now scoped to THIS goal rather than the whole session.
      unattendedGoals: 1,
      action: 'resume',
      references: [
        { kind: 'session', id: slot.key, label: slot.title || copy('untitled_work'), sessionKey: slot.key },
        ...intentSourceRefs(sources, intent),
      ],
      nextSteps,
      progress: (intent.progress ?? []).filter(entry => entry.trim()),
      stale: Boolean(summary.stale),
      lastTouchedTurn: intent.last_touched_turn ?? 0,
    })
  })

  intents.forEach((intent, index) => {
    // Already its own item above.
    if (unattended.includes(intent)) return
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
        ...intentSourceRefs(sources, intent),
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
 * A recorded provenance edge: this item was spawned by that one.
 *
 * Deliberately NOT part of `sameGoal`. A loop its own session started is the same
 * GOAL but not a duplicate of it, and `sameGoal` also feeds the duplicate warning
 * — so folding provenance in there would warn the user that their session
 * duplicates its own loop. Clustering calls both; the warning calls only sameGoal.
 */
export function provenanceEdge(a: WorkItem, b: WorkItem): 'spawned' | 'references' | null {
  if (a.parentId === b.id || b.parentId === a.id) return 'spawned'
  if (referencedItemIds(a).includes(b.id) || referencedItemIds(b).includes(a.id)) return 'references'
  return null
}

/**
 * The item ids this item's own references point at. A session that folded in an
 * artifact keeps a reference to it, so the edge is readable from either end even
 * when only one side recorded a parent.
 */
function referencedItemIds(item: WorkItem): string[] {
  const out: string[] = []
  for (const ref of item.references) {
    if (ref.kind === 'artifact') out.push(`artifact:${ref.id}`)
    else if (ref.kind === 'workflow') out.push(`workflow:${ref.id}`)
    else if (ref.kind === 'agent') out.push(`agent:${ref.id}`)
    else if (ref.kind === 'monitor') out.push(`monitor:${ref.id}`, `loop:${ref.id}`)
  }
  return out.filter(id => id !== item.id)
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

export type GroupMode = 'session' | 'pr' | 'goal'

export interface SessionRollup {
  sessionKey: string
  label: string
  /** The most-urgent work item of this session on the PR — the quote/select target. */
  leading: WorkItem
  /** How many of this session's work items touch the PR. */
  count: number
}

/**
 * Roll a PR block's work items up to one row per session. Under a PR the useful
 * unit is "which sessions are on this change," not every individual goal — so
 * items are collapsed by session, keeping the most-urgent one (the first, since
 * the list arrives sorted) as the row's representative and select target.
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
  header: 'session' | 'pr' | 'goal' | null
  /** Present for session headers, to wire Open. */
  sessionKey: string | null
  /** Present for PR headers. */
  changeRef: WorkReference | null
}

/**
 * Group the (already ordered) list. Grouping is a lens over the flat list: a
 * group takes the position of its most-urgent member (the first one, since the
 * list arrives sorted), and order within a group is preserved. Nothing is
 * re-scored.
 *
 * SESSION: one block per session.
 *
 * PR: the PR is the primary entity. An item FANS OUT to every PR it references,
 * so a session touching four PRs appears under all four — each PR is its own card
 * with the work underneath it. Work with no PR is NOT shown in the PR view — this
 * view is about PRs, so unlinked work stays in the Session view only.
 *
 * GOAL: the job is the primary entity. Items from DIFFERENT sessions that share a
 * HARD signal (the same change, the same output, the same named deliverable),
 * corrected by the user's verdicts and extended by the optional `semantic` pair
 * set from the model pass, merge into one card — so "S1 is on it, S2 left it
 * open" reads as one thing, not two.
 */
export function clusterBy(
  items: WorkItem[],
  mode: GroupMode,
  verdicts: GoalVerdicts = EMPTY_VERDICTS,
  semantic?: Set<string>,
): WorkBlock[] {
  if (mode === 'pr') return clusterByPr(items)
  if (mode === 'goal') return clusterByGoal(items, verdicts, semantic)
  const blocks: WorkBlock[] = []
  const byKey = new Map<string, WorkBlock>()

  for (const item of items) {
    const key = item.sessionKey
    if (!key) {
      blocks.push({ key: item.id, items: [item], header: null, sessionKey: null, changeRef: null })
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
      changeRef: null,
    }
    byKey.set(key, block)
    blocks.push(block)
  }
  return blocks
}

function clusterByPr(items: WorkItem[]): WorkBlock[] {
  const prBlocks: WorkBlock[] = []
  const byKey = new Map<string, WorkBlock>()

  for (const item of items) {
    const changeRefs = item.references.filter(ref => ref.kind === 'change' || ref.kind === 'issue')
    // Work with no PR is not shown in the PR view — this view is about PRs, not
    // "everything, some of it under a PR". A session with no linked change simply
    // does not appear here; it is in the Session view.
    for (const ref of changeRefs) {
      const key = `${ref.kind}:${ref.id}`
      const existing = byKey.get(key)
      if (existing) {
        existing.items.push(item)
        continue
      }
      const block: WorkBlock = { key, items: [item], header: 'pr', sessionKey: null, changeRef: ref }
      byKey.set(key, block)
      prBlocks.push(block)
    }
  }
  // Most-recently-active first: a PR's recency is its liveliest member's, so a
  // PR any session just touched rises to the top. Insertion order alone tracked
  // the item scan, which read as random.
  prBlocks.sort((a, b) =>
    Math.max(...b.items.map(item => item.updatedAt)) - Math.max(...a.items.map(item => item.updatedAt)))
  return prBlocks
}

/**
 * The `GoalMatch` kinds strong enough to MERGE two items on their own.
 *
 * `same_topic` and `same_step` are deliberately absent. Both are loose word
 * overlap measured against the SMALLER title, so two shared distinctive words
 * are enough to pair items — and clustering is transitive through union-find, so
 * A~B and B~C drags A and C into one card even though nothing links them. Chained
 * far enough, the whole board becomes one goal, which is strictly worse than not
 * grouping at all.
 *
 * They keep earning their place everywhere the judgement is ADVICE rather than a
 * merge: the duplicate warning, the related-sessions list, and the merge hint all
 * still call `sameGoal` and still read them. What used to merge on them is now the
 * semantic pass's job, which supplies its merges as an explicit pair set — a
 * decision per pair, so it cannot chain.
 */
export const HARD_GOAL_MATCHES: readonly GoalMatch[] = ['same_change', 'same_artifact', 'same_deliverable']

/**
 * Merge cross-session items that are the same job into one block. A block takes
 * the position of its most-urgent member; singletons stay plain rows, because
 * every item here already IS a goal — only the cross-session merge is news.
 *
 * `semantic` holds `goalPairKey` strings the model pass judged to be one job.
 * They merge like a deterministic hard match, but they are enumerated pairs
 * rather than a similarity threshold, and the user's `split` still beats them.
 */
function clusterByGoal(
  items: WorkItem[],
  verdicts: GoalVerdicts,
  semantic?: Set<string>,
): WorkBlock[] {
  const ambient = ambientPhrases(items)
  const parent = items.map((_, index) => index)
  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]]
      index = parent[index]
    }
    return index
  }
  const union = (a: number, b: number) => { parent[find(b)] = find(a) }

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i]
      const b = items[j]
      const pair = goalPairKey(a, b)
      // Stage 0 — the user's ruling beats every later stage, in both directions,
      // the model's pairs included.
      if (verdicts.split.includes(pair)) continue
      // Stage 2 — recorded provenance is a fact, not a guess, so it holds even
      // WITHIN one session: a loop and the session that started it are one goal,
      // where two unrelated intents in that same session are not.
      if (provenanceEdge(a, b)) { union(i, j); continue }
      if (verdicts.merged.includes(pair)) { union(i, j); continue }
      // Stage 3 — the model's judgement on this specific pair. The model may
      // rule that two intents WITHIN one session are one goal (e.g. three fixes
      // that are one piece of work), so this is checked BEFORE the same-session
      // guard below — an explicit model pair merges even where the deterministic
      // matcher deliberately would not.
      if (semantic?.has(pair)) { union(i, j); continue }
      // Two intents inside one session are distinct goals for the deterministic
      // matcher; only recorded provenance or an explicit model pair (both above)
      // may overrule that. Everything past here is threshold matching, and stays
      // cross-session only.
      if (!a.sessionKey || !b.sessionKey || a.sessionKey === b.sessionKey) continue
      // Stage 4 — deterministic matching, HARD signals only.
      const match = sameGoal(a, b, ambient)
      if (match && HARD_GOAL_MATCHES.includes(match)) union(i, j)
    }
  }

  const blocks: WorkBlock[] = []
  const byRoot = new Map<number, WorkBlock>()
  for (let index = 0; index < items.length; index += 1) {
    const root = find(index)
    const existing = byRoot.get(root)
    if (existing) {
      existing.items.push(items[index])
      existing.header = 'goal'
      continue
    }
    const block: WorkBlock = {
      key: `goal:${items[index].id}`,
      items: [items[index]],
      header: null,
      sessionKey: null,
      changeRef: null,
    }
    byRoot.set(root, block)
    blocks.push(block)
  }
  // A goal's identity must not move when its members are re-ranked. The lead
  // member is the most-urgent one, so keying on it renamed the card (and dropped
  // its fold state) every time a check went red. Key on the member set instead.
  for (const block of blocks) block.key = intrinsicGoalKey(block.items)
  return blocks
}

/**
 * A cluster's own key, derived from its membership rather than its lead. Stable
 * under re-ranking; membership CHANGES are handled by reconcileGoalKeys, which
 * carries the prior key forward so the goal keeps one identity across runs.
 */
function intrinsicGoalKey(items: WorkItem[]): string {
  return `goal:${[...items.map(item => item.id)].sort()[0]}`
}

/** A goal as a previous run left it, for identity reconciliation. */
export interface PriorGoal {
  key: string
  /** goalIdentity() of each member, so the record survives id churn. */
  members: string[]
}

/** How much of the smaller set two runs must share to be the same goal. */
export const GOAL_REUSE_OVERLAP = 0.5

/**
 * Stage 6 — map this run's clusters back onto the previous run's goal keys, so a
 * goal keeps ONE identity as members join and leave.
 *
 * Without this, a goal's key changes the moment its membership does, and every
 * per-goal thing the UI persists against that key — the fold state above all —
 * silently resets. Unstable identity is what makes a board feel untrustworthy.
 *
 * Rules, following the spec: largest overlap wins; reuse the prior key only at
 * >= 50% of the SMALLER set (so a goal absorbing one stray item keeps its key,
 * while a genuinely new cluster does not inherit one); a prior key is claimed at
 * most once, so a split keeps the key for the bigger part and the remainder mints
 * a fresh one.
 */
export function reconcileGoalKeys(blocks: WorkBlock[], prior: PriorGoal[]): WorkBlock[] {
  const claimed = new Set<string>()
  // Every key handed out this run, so no two blocks can end up sharing one.
  const used = new Set<string>()
  // Bigger clusters choose first, so a split leaves the key with the larger part.
  const order = [...blocks].sort((a, b) => b.items.length - a.items.length)
  for (const block of order) {
    const members = new Set(block.items.map(goalIdentity))
    let best: { key: string; score: number } | null = null
    for (const record of prior) {
      if (claimed.has(record.key)) continue
      const shared = record.members.filter(member => members.has(member)).length
      if (!shared) continue
      const score = shared / Math.min(members.size, record.members.length)
      if (score < GOAL_REUSE_OVERLAP) continue
      if (!best || score > best.score) best = { key: record.key, score }
    }
    if (best) {
      claimed.add(best.key)
      block.key = best.key
    }
    // Guarantee a unique key per block. A block that KEEPS its intrinsic key can
    // still collide with a prior key ANOTHER block reclaimed (item `x` left that
    // goal and is now this block's smallest-id member, so its intrinsic is
    // `goal:x` while the other block reclaimed the prior `goal:x`). Two blocks
    // sharing a key share the React key and the persisted fold state, so one
    // chevron toggles both. On a collision, suffix until unique -- deterministic
    // given the largest-first order, and it stabilises next run because this key
    // is then remembered and reclaimed directly.
    if (used.has(block.key)) {
      let n = 2
      while (used.has(`${block.key}~${n}`)) n += 1
      block.key = `${block.key}~${n}`
    }
    used.add(block.key)
  }
  return blocks
}

/** This run's goals in the shape reconcileGoalKeys reads next time. */
export function rememberGoals(blocks: WorkBlock[]): PriorGoal[] {
  return blocks.map(block => ({ key: block.key, members: block.items.map(goalIdentity) }))
}

/**
 * The normalized phrase as the title actually writes it, or null when the title
 * does not contain it. Each word may carry the plural the normalizer dropped.
 */
function asWritten(title: string, phrase: string): string | null {
  // Words may be separated by punctuation in the original ("16/20/24/48"),
  // because the normalizer split on it to compare.
  const pattern = phrase.split(' ').map(word => `${escapeForPattern(word)}s?`).join('[\\s/_,-]+')
  return title.match(new RegExp(pattern, 'iu'))?.[0] ?? null
}

function escapeForPattern(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Why these items are on one card, as a sentence the user can read.
 *
 * The grouping reason is a product surface, not a debug string: a card that
 * merges two sessions has to be able to say what it merged them on, or the user
 * has no basis to trust it — or to press Split. Reports the STRONGEST edge in the
 * cluster, since that is the one that would survive if the others went away.
 *
 * `semanticWhy` maps a `goalPairKey` to the model's own one-line reason, used
 * verbatim when no deterministic edge explains the cluster. Only the signals that
 * can actually MERGE are reported: loose topic/step overlap no longer groups
 * anything, so naming it as the reason would credit an edge that did not cause
 * the grouping.
 */
export function explainGoal(
  items: WorkItem[],
  verdicts: GoalVerdicts = EMPTY_VERDICTS,
  semanticWhy?: Map<string, string>,
): string | null {
  if (items.length < 2) return null
  let match: GoalMatch | null = null
  let phrase: string | null = null
  let semantic: string | null = null
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i]
      const b = items[j]
      if (provenanceEdge(a, b)) return `${b.parentId === a.id ? b.title : a.title} was started by this work`
      if (verdicts.merged.includes(goalPairKey(a, b))) return 'you merged these'
      semantic ??= semanticWhy?.get(goalPairKey(a, b)) ?? null
      const because = sameGoal(a, b)
      // Only a hard signal can have caused this cluster.
      if (!because || !HARD_GOAL_MATCHES.includes(because)) continue
      if (!match || GOAL_MATCH_RANK.indexOf(because) < GOAL_MATCH_RANK.indexOf(match)) {
        match = because
        if (because === 'same_deliverable') {
          const shared = deliverablePhrases(b.title)
          const found = deliverablePhrases(a.title).find(candidate => shared.includes(candidate)) ?? null
          // Phrases are normalized to match; the SENTENCE shows the name as the
          // title writes it, so "GitLab Case Study" is not quoted back as
          // "gitlab case study" next to the rows that spell it properly.
          phrase = found ? asWritten(a.title, found) ?? asWritten(b.title, found) ?? found : null
        }
      }
    }
  }
  // A hard deterministic edge outranks the model's sentence: it is a fact about
  // the items, and it is the edge that would survive if the pass went away.
  if (match === 'same_change') return 'these sessions work on the same change'
  if (match === 'same_artifact') return 'these sessions share the same output'
  if (match === 'same_deliverable') return phrase ? `both are about ${phrase}` : 'both name the same deliverable'
  return semantic
}

/**
 * Longest run of words a name may carry. Generous on purpose: a real title runs
 * to ten words ("Icon at 16/20/24/48 on light and dark") and clipping the run
 * drops its leading noun, which is the part that names the thing. The header
 * truncates visually, so length costs nothing here.
 */
const NAME_MAX_WORDS = 12

/**
 * What to CALL a merged goal, derived from what its members actually share.
 *
 * A merged card used to be headed "N sessions, one goal" — true, and useless:
 * it describes the grouping rather than the work, so the one line with the most
 * prominence on the card said the least. Nothing here is invented: the name is a
 * deliverable two members both name, a change they both point at, or the run of
 * words their titles have in common — in the casing a title actually writes.
 *
 * Returns null when the members share no nameable thing, which is a real answer:
 * the caller then falls back to the honest group label rather than to a guess.
 */
export function goalName(items: WorkItem[]): string | null {
  if (items.length < 2) return null

  // A deliverable named by two or more members is the strongest name available.
  const byPhrase = new Map<string, number>()
  for (const item of items) {
    for (const phrase of deliverablePhrases(item.title)) {
      byPhrase.set(phrase, (byPhrase.get(phrase) ?? 0) + 1)
    }
  }
  const deliverable = bestShared(byPhrase)
  if (deliverable) return writtenSomewhere(items, deliverable) ?? deliverable

  // Else the change they are all working on — a shared entity, not a title.
  const byChange = new Map<string, { label: string; members: number }>()
  for (const item of items) {
    for (const ref of item.references) {
      if (ref.kind !== 'change' && ref.kind !== 'issue') continue
      const seen = byChange.get(ref.id)
      byChange.set(ref.id, { label: ref.label, members: (seen?.members ?? 0) + 1 })
    }
  }
  const change = [...byChange.values()].filter(entry => entry.members >= 2)
    .sort((a, b) => b.members - a.members)[0]
  if (change) return change.label

  // Else the words the titles have in common. Same principle as the deliverable
  // rule, without the capitalization requirement — a lowercase phrase repeated
  // across members is still the thing they are all about.
  const byRun = new Map<string, Set<number>>()
  items.forEach((item, index) => {
    for (const run of titleRuns(item.title)) {
      if (!byRun.has(run)) byRun.set(run, new Set())
      byRun.get(run)!.add(index)
    }
  })
  const counts = new Map<string, number>()
  for (const [run, members] of byRun) counts.set(run, members.size)
  const common = bestShared(counts)
  return common ? writtenSomewhere(items, common) ?? common : null
}

/** The phrase with the widest support, longest first on a tie. */
function bestShared(counts: Map<string, number>): string | null {
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] ?? null
}

/**
 * The phrase as a member writes it, preferring a member that capitalizes it — a
 * name is a heading, and "Avatar upload flow" reads as one where the same words
 * lifted from mid-sentence do not.
 */
function writtenSomewhere(items: WorkItem[], phrase: string): string | null {
  let fallback: string | null = null
  for (const item of items) {
    const written = asWritten(item.title, phrase)
    if (!written) continue
    if (/^\p{Lu}/u.test(written)) return written
    fallback ??= written
  }
  return fallback
}

/**
 * Contiguous word runs of a title, longest first, each starting and ending on a
 * distinctive word — an interior stopword is fine ("icon at 16 on light and
 * dark"), a leading or trailing one names nothing ("and dark").
 */
function titleRuns(title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const out: string[] = []
  for (let size = Math.min(words.length, NAME_MAX_WORDS); size >= 2; size -= 1) {
    for (let start = 0; start + size <= words.length; start += 1) {
      const run = words.slice(start, start + size)
      if (DUPLICATE_STOPWORDS.has(run[0]) || DUPLICATE_STOPWORDS.has(run[size - 1])) continue
      if (run[0].length < 2 || run[size - 1].length < 2) continue
      out.push(run.join(' '))
    }
  }
  return out
}

/** One project bucket from the workspace's projects.md, via the backend. */
export interface Initiative {
  name: string
  aliases: string[]
}

/**
 * The Goal view's top level: one big goal holding the deduped work of every
 * session on it. Status is DERIVED from members, never stored — a sub-goal
 * finishing is progress, and the initiative is done only when everything is.
 */
export interface InitiativeBlock {
  key: string
  /** null = the loose tail: items no bucket claimed, rendered without a shell. */
  name: string | null
  status: WorkState
  /** Distinct session labels under this initiative, for the card header. */
  sessions: string[]
  blocks: WorkBlock[]
}

/**
 * Which bucket claims this item. Fields are checked in priority order — the
 * item's OWN title says what it is; the session name only says where it lives.
 * Without this, "Redesign the Crew Manager cards" inside a session called
 * "Crew Companion Open Bugs" lands in Crew Companion.
 */
export function initiativeFor(item: WorkItem, initiatives: Initiative[]): string | null {
  const sessionLabel = item.references.find(ref => ref.kind === 'session')?.label ?? ''
  for (const field of [item.title, sessionLabel, item.provenance]) {
    const bucket = bucketMatching(field, initiatives)
    if (bucket) return bucket
  }
  return null
}

function bucketMatching(text: string, initiatives: Initiative[]): string | null {
  const haystack = text.toLowerCase()
  // The LONGEST matching alias wins, not the first bucket in file order: a
  // short generic alias ("Crew") must never shadow a longer, more specific
  // one ("Crew Manager") that also matches.
  let best: { name: string; length: number } | null = null
  for (const bucket of initiatives) {
    for (const alias of bucket.aliases) {
      if (!alias || !haystack.includes(alias.toLowerCase())) continue
      if (!best || alias.length > best.length) best = { name: bucket.name, length: alias.length }
    }
  }
  return best?.name ?? null
}

/**
 * A session whose NAME only mentions some other goal, carrying work that is
 * this goal's. The name was set by the session's first topic and now speaks
 * for work it does not cover — the one case where the goal grouping and the
 * session chip visibly contradict. Renaming the session to mention both
 * topics resolves it, and this returns null once the name covers the work.
 */
export function sessionNameMismatch(
  item: WorkItem,
  initiatives: Initiative[],
): { itemGoal: string; sessionGoal: string } | null {
  const label = item.references.find(ref => ref.kind === 'session')?.label ?? ''
  if (!label) return null
  const itemGoal = bucketMatching(item.title, initiatives)
  if (!itemGoal) return null
  // The name already mentions this work's goal: nothing to flag.
  const covered = initiatives.find(bucket => bucket.name === itemGoal)
  if (covered && covered.aliases.some(alias => alias && label.toLowerCase().includes(alias.toLowerCase()))) {
    return null
  }
  const sessionGoal = bucketMatching(label, initiatives)
  if (!sessionGoal || sessionGoal === itemGoal) return null
  return { itemGoal, sessionGoal }
}

/**
 * Candidate big goals, guessed from the project directories sessions run in.
 * This is the bootstrap path: a user with no projects.md still gets offered
 * their real projects instead of silently missing the whole top level.
 */
export function initiativeCandidates(
  slots: ChatSlot[],
  initiatives: Initiative[],
): { name: string; sessions: number }[] {
  const taken = initiatives.flatMap(bucket => bucket.aliases.map(alias => alias.toLowerCase()))
  // Generic dir names say nothing about WHAT the work is.
  const generic = new Set(['workspace', 'workspaces', 'home', 'src', 'tmp', 'documents', 'desktop'])
  const counts = new Map<string, number>()
  for (const slot of slots) {
    if (!slot.key || CONDUCTOR_SLOT_KEYS.has(slot.key) || slot.memory_mode === 'incognito') continue
    const raw = slot.project
    if (!raw) continue
    const name = raw.replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop()
    if (!name || generic.has(name.toLowerCase())) continue
    // Already covered by a bucket: not a candidate, however many sessions use it.
    if (taken.some(alias => name.toLowerCase().includes(alias) || alias.includes(name.toLowerCase()))) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
}

/**
 * Goal names mined from the titles of UNBUCKETED work: a phrase recurring
 * across sessions ("Crew Manager" in three session titles) IS the goal nobody
 * has defined yet. Suggest it for one-click confirmation instead of making the
 * user type what the board already says.
 */
export function suggestGoalNames(
  items: WorkItem[],
  initiatives: Initiative[],
): { name: string; sessions: number }[] {
  // Sessions of every gram, keyed by the lowercase phrase.
  const support = new Map<string, Set<string>>()
  for (const item of items) {
    if (!item.sessionKey || initiativeFor(item, initiatives) !== null) continue
    const label = item.references.find(ref => ref.kind === 'session')?.label ?? ''
    for (const text of [item.title, label]) {
      const tokens = text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').split(/\s+/).filter(Boolean)
      for (const size of [3, 2]) {
        for (let start = 0; start + size <= tokens.length; start += 1) {
          const gram = tokens.slice(start, start + size)
          // A phrase must start and end on a distinctive word; interior
          // stopwords are fine ("group by goal").
          if (DUPLICATE_STOPWORDS.has(gram[0]) || DUPLICATE_STOPWORDS.has(gram[size - 1])) continue
          if (gram[0].length < 3 || gram[size - 1].length < 3) continue
          const key = gram.join(' ')
          if (!support.has(key)) support.set(key, new Set())
          support.get(key)!.add(item.sessionKey)
        }
      }
    }
  }
  const entries = [...support.entries()]
    .map(([phrase, sessions]) => ({ phrase, sessions: sessions.size }))
    .filter(entry => entry.sessions >= 2)
  // Prefer the longest phrasing: "crew manager group" absorbs "crew manager"
  // only when it carries the SAME support; otherwise the shorter, broader
  // phrase is the real goal.
  const maximal = entries.filter(entry =>
    !entries.some(other => other.phrase !== entry.phrase
      && other.phrase.includes(entry.phrase)
      && other.sessions >= entry.sessions))
  return maximal
    .sort((a, b) => b.sessions - a.sessions || b.phrase.length - a.phrase.length)
    .map(entry => ({
      name: entry.phrase.replace(/\p{L}+/gu, word => word[0].toUpperCase() + word.slice(1)),
      sessions: entry.sessions,
    }))
}

/** Members roll up: anything owed to the user outranks motion outranks done. */
export function rollupStatus(items: WorkItem[]): WorkState {
  if (items.some(item => item.state === 'needs-you')) return 'needs-you'
  if (items.some(item => item.state === 'running')) return 'running'
  return 'done'
}

/**
 * The dot colour a goal member shows, mirroring the card's own state language:
 * a fault (a failing check, a stall, an error loop, a failed run — all carry
 * `issue`) is CRITICAL; a response the user owes is WARN; a quiet follow-up the
 * user could pick up but nothing is broken is IDLE; healthy motion or a finished
 * item is GOOD. Derived from the same fields the badge and ranking read, so the
 * dot can never disagree with the row it sits on.
 */
export type MemberDot = 'crit' | 'warn' | 'good' | 'idle'

/**
 * The leading status dot, derived from the SAME computation as the lane and the
 * badge so the three cannot disagree.
 *
 * It used to lead with `item.issue`, which meant any work whose linked change had
 * a failing check or a conflict was painted critical -- including work that was
 * running perfectly well and needed nobody. On a real account with a dozen red
 * pull requests that painted nearly every row red while only two carried a
 * "needs you" badge, so the dot stopped discriminating and became decoration. A
 * red dot that is always on says nothing.
 *
 * `issue` is a fact about the world, not a measure of what is owed. It still
 * ranks (via `change_blocked`) and still shows on the card; it no longer decides
 * the colour by itself.
 */
export function memberDot(item: WorkItem, now: number = Date.now()): MemberDot {
  if (item.state === 'done') return 'idle'
  if (item.state === 'needs-you') {
    return responseVerb(item, now) === 'followup' ? 'warn' : 'crit'
  }
  return 'good'
}

/**
 * The short kind tag a goal member represents. When the item needs the user, the
 * useful fact is the RESPONSE owed (unblock / follow-up); otherwise it is the
 * ENTITY, read from the item's own id namespace (the prefixes buildWorkItems
 * mints), so a healthy cron reads "cron" and a workflow run reads "loop".
 */
export function memberKind(item: WorkItem, now: number = Date.now()): string {
  if (item.state === 'needs-you') {
    return responseVerb(item, now) === 'followup' ? 'follow-up' : 'unblock'
  }
  if (item.id.startsWith('monitor:')) return 'cron'
  if (item.id.startsWith('workflow:')) return 'loop'
  if (item.id.startsWith('agent:')) return 'agent'
  if (item.id.startsWith('artifact:')) return 'artifact'
  return 'session'
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

/**
 * Where an instruction to a cross-session goal goes: the session actively ON
 * the job — it already holds the context, so it is the cheapest executor. With
 * nobody moving, the most recently touched member (sending resumes it). Never
 * broadcast: two sessions receiving one instruction is the duplicated work this
 * whole view exists to prevent.
 */
export function goalRouteTarget(items: WorkItem[]): WorkItem {
  const moving = items.find(item => item.moving)
  if (moving) return moving
  const running = items.find(item => item.state === 'running')
  if (running) return running
  return [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0]
}

function sessionLabels(items: WorkItem[]): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const key = item.sessionKey
    if (!key || seen.has(key)) continue
    seen.add(key)
    labels.push(item.references.find(ref => ref.kind === 'session')?.label ?? item.provenance)
  }
  return labels
}

/**
 * The two-level Goal view: initiative buckets on top, same-job dedup inside.
 * An initiative takes the position of its most-urgent member and its internal
 * order is preserved — grouping stays a lens, nothing is re-scored. Items no
 * bucket claims keep their positions as a shell-less tail block (name null),
 * NOT a "No project" dump.
 */
export function clusterByInitiative(
  items: WorkItem[],
  initiatives: Initiative[],
  verdicts: GoalVerdicts = EMPTY_VERDICTS,
  prior: PriorGoal[] = [],
  semantic?: Set<string>,
): InitiativeBlock[] {
  const byName = new Map<string, WorkItem[]>()
  const loose: WorkItem[] = []
  const nameFor = new Map<string, string | null>()

  for (const item of items) {
    const name = initiativeFor(item, initiatives)
    nameFor.set(item.id, name)
    if (name === null) {
      loose.push(item)
      continue
    }
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name)!.push(item)
  }

  // Loose items dedup among THEMSELVES too — same-job across sessions merges
  // whether or not a bucket claims it. Their block key IS the card's identity
  // here (a bucket card is named, these are not), so it is reconciled against
  // the previous run to keep one goal's fold state through membership changes.
  const looseBlocks = reconcileGoalKeys(clusterByGoal(loose, verdicts, semantic), prior)
  const looseByLead = new Map<string, WorkBlock>()
  for (const block of looseBlocks) looseByLead.set(block.items[0].id, block)

  // Walk the ordered flat list: each unit surfaces at its most-urgent member.
  const out: InitiativeBlock[] = []
  const emitted = new Set<string>()
  for (const item of items) {
    const name = nameFor.get(item.id) ?? null
    if (name !== null) {
      if (emitted.has(name)) continue
      emitted.add(name)
      const members = byName.get(name)!
      out.push({
        key: `initiative:${name}`,
        name,
        status: rollupStatus(members),
        sessions: sessionLabels(members),
        blocks: clusterByGoal(members, verdicts, semantic),
      })
      continue
    }
    const block = looseByLead.get(item.id)
    if (!block) continue
    out.push({
      key: block.key,
      name: null,
      status: rollupStatus(block.items),
      sessions: [],
      blocks: [block],
    })
  }
  return out
}
