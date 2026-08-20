import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import {
  AlertTriangle as AlertCircle,
  Bot,
  Check,
  ChevronRight,
  Check as CircleCheck,
  Clock as Clock3,
  Package as FileText,
  ExternalLink as GitPullRequest,
  MessageSquare,
  RefreshCw,
  Shield,
  Waves as Radar,
  Search,
  Tag,
  Users,
  Zap as Workflow,
} from 'lucide-react'
import { useAppApi, useNavigate, useNavBadge, ChatEmbed } from '@kirocrew/app-sdk'
import {
  Badge,
  Btn,
  ContentSkeleton,
  EmptyState,
  Input,
  PageHeader,
  SendBtn,
} from '@kirocrew/app-sdk/ui'
import type {
  Artifact,
  ChatSlot,
  CronJob,
  CronRun,
  MonitorLoop,
  SessionSummary,
  ErrorLoopFinding,
  StallFinding,
  StallReport,
} from './types'
import {
  applyInstructed,
  clusterBy,
  epoch,
  prBucket,
  prBlockers,
  prVerdict,
  PR_VERDICT_LABELS,
  PR_VERDICT_TONES,
  repoFromUrl,
  reviewDecision,
  unresolvedThreads,
  rollUpSessions,
  applySetAside,
  inDoneWindow,
  pendingPermissions,
  responseVerb,
  SNOOZE_MS,
  describeSilence,
  explainRank,
  fleetBriefing,
  clusterByInitiative,
  explainGoal,
  goalComposition,
  goalName,
  goalPairKey,
  goalRouteTarget,
  initiativeCandidates,
  memberDot,
  normalizeWorkItems,
  rankWorkItem,
  rememberGoals,
  sameGoal,
  sessionNameMismatch,
  suggestGoalNames,
  titleOverlap,
  workCounts,
  type AgentRow,
  type ApprovalRow,
  type WorkflowRow,
  type WorkCopyKey,
  type GoalVerdicts,
  type Initiative,
  type InitiativeBlock,
  type InstructedItems,
  type MemberDot,
  type PendingPermission,
  type PriorGoal,
  type PrReviewComment,
  type PrSignals,
  type ResponseVerb,
  type WorkBlock,
  type WorkItem,
  type WorkReference,
  type GroupMode,
  type SessionRollup,
  type WorkReferenceKind,
  type WorkState,
} from './model'
import {
  fetchSummaries,
  summaryStamp,
  summaryTargets,
  type SummarySupport,
} from './summaries'
import { OVERWATCH_STYLES } from './styles'

/** The four movable panels. Any of them can be the primary; Work has no special
 * status beyond being the default. */
type PanelId = 'work' | 'prs' | 'loops' | 'schedule'

/* Fixed DOM order. Panels are placed by grid coordinates, never by reordering
 * this array in JSX — reordering nodes remounts ChatEmbed and loses the
 * transcript's scroll position and any in-flight stream. */
const PANEL_ORDER: PanelId[] = ['work', 'prs', 'loops', 'schedule']

/* Which card inherits the rail's open slot when the open one is promoted. */
const PANEL_PICK_ORDER: PanelId[] = ['prs', 'loops', 'schedule', 'work']

const PANEL_LABELS: Record<PanelId, string> = {
  work: 'Goals / Sessions',
  prs: 'PRs',
  loops: 'Loops',
  schedule: 'Scheduled tasks',
}

/* The attributes every panel card carries. Spread onto <details> so the four
 * cards cannot drift apart. */
interface PanelShellProps {
  className: string
  open: boolean
  draggable: true
  'data-panel': PanelId
  'data-primary': 'true' | 'false'
  'data-rail-index': number | undefined
  'data-dragover': 'true' | undefined
  onDragStart: (event: React.DragEvent<HTMLElement>) => void
  onDragOver: ((event: React.DragEvent) => void) | undefined
  onDragLeave: (() => void) | undefined
  onDrop: ((event: React.DragEvent) => void) | undefined
}

/* Drag is not the only route to promotion — this is the keyboard one. Lives in
 * the card header so the action sits on the thing it moves. */
function MakePrimary({ id, onPromote }: { id: PanelId; onPromote: (id: PanelId) => void }) {
  return (
    <Btn
      className="ow-promote"
      aria-label={`Move ${PANEL_LABELS[id]} to the first column`}
      onClick={event => { event.preventDefault(); event.stopPropagation(); onPromote(id) }}
    >
      Make primary
    </Btn>
  )
}

/**
 * When the board last loaded, and a manual re-fetch. The label ages when polling
 * fails, which is the staleness signal.
 *
 * It rides the PRIMARY card's header rather than the Work card's: this is board
 * state, not one panel's, and Work can now be demoted into the rail — which
 * would have taken the only refresh control down with it.
 */
function BoardFreshness({ lastUpdated, refreshing, onRefresh }: {
  lastUpdated: number | null
  refreshing: boolean
  onRefresh: () => void
}) {
  const since = lastUpdated ? sinceLabel(lastUpdated) : null
  return (
    <span className="ow-refreshbar">
      {since && <span className="ow-updated" aria-live="polite">updated {since}</span>}
      <Btn
        className="ow-refresh"
        onClick={event => { event.preventDefault(); event.stopPropagation(); onRefresh() }}
        disabled={refreshing}
        aria-label="Refresh"
        title="Refresh"
      >
        <RefreshCw className={`ow-icon${refreshing ? ' ow-spin' : ''}`} aria-hidden="true" />
      </Btn>
    </span>
  )
}

type FilterKey = 'all' | WorkState

interface SourcesResponse {
  slots: ChatSlot[]
  approvals: ApprovalRow[]
  agents: AgentRow[]
  workflows: WorkflowRow[]
  crons: CronJob[]
  artifacts: Artifact[]
  loops: MonitorLoop[]
}

const SNOOZE_KEY = 'crew-manager.snoozed'
const HANDLED_KEY = 'crew-manager.handled'
const DONE_COLLAPSED_KEY = 'crew-manager.done-collapsed'
const GOAL_VERDICTS_KEY = 'crew-manager.goal-verdicts'
/* Last run's goal membership, so a goal keeps one identity across polls. */
const GOAL_MEMORY_KEY = 'crew-manager.goal-memory'
/* The semantic pass's verdicts: merge pairs, per-pair reasons, and the board
   stamp they were computed against. Cached so an unchanged board never re-pays
   for a model call, and so a reload keeps its grouping. The `.v2` suffix is a
   schema-buster: it discards a cache written by an earlier prompt so an improved
   naming pass actually re-runs instead of short-circuiting on the stale stamp. */
const GOAL_SEMANTIC_KEY = 'crew-manager.goal-semantic.v5'
/* Model-written goal names, keyed by goal key. Sticky by design: a name the
   user has seen must not churn because a member joined. The `.v2` suffix is a
   one-time reset: the prior pass could hand two different goals the same title,
   and those duplicates are already stored; discarding them lets the distinctness-
   enforcing pass re-name cleanly. */
const GOAL_NAMES_KEY = 'crew-manager.goal-names.v2'
/* Below this confidence an assignment is ignored and the item stays ungrouped.
   The spec's core ruling: a wrong grouping is worse than no grouping, because
   it hides an item somewhere the user will not look for it. */
const SEMANTIC_CONFIDENCE_FLOOR = 0.7

/** The semantic pass's verdicts, in memory: merge pairs, per-pair reasons, and
 *  the board stamp they answered. */
interface SemanticPass {
  pairs: Set<string>
  why: Map<string, string>
  stamp: string
}

/** The same, as it sits in localStorage. */
interface StoredSemantic {
  pairs?: string[]
  why?: [string, string][]
  stamp?: string
}

/** What POST /goal-pass answers. `available: false` means the model could not
 *  be reached (no gateway, timeout, junk reply) — deterministic grouping stands. */
interface GoalPassResponse {
  available: boolean
  assignments?: { item_id?: string; cluster?: string; confidence?: number; why?: string }[]
  names?: { cluster?: string; name?: string }[]
}

function persistSemantic(next: SemanticPass): SemanticPass {
  writeStore(GOAL_SEMANTIC_KEY, { pairs: [...next.pairs], why: [...next.why.entries()], stamp: next.stamp })
  return next
}
const INITIATIVE_COLLAPSED_KEY = 'crew-manager.initiative-collapsed'
const OPEN_STACK_KEY = 'crew-manager.stack-open-v2'
const TAB_KEY = 'crew-manager.tab'
/* Which panel holds column 1. A new key: the retired swap flag was a boolean
 * under a different name, so no old value can be misread as a PanelId. */
const PRIMARY_KEY = 'crew-manager.primary-v1'


function readStore<T>(key: string, fallback: T = {} as T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeStore(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable: the feature degrades to session-only.
  }
}

/** "2h ago" / "just now". Null for a missing stamp so callers omit the phrase
 *  entirely rather than printing a fake zero. */
function sinceLabel(ms: number, now: number = Date.now()): string | null {
  if (!ms) return null
  const secs = Math.max(0, Math.round((now - ms) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/** Local wall-clock time, the form a schedule is read in. */
function clockLabel(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** "1 session" / "3 sessions" — a count with its noun, or null at zero so the
 *  composition line drops the part rather than printing "0 PRs". */
function countPart(n: number, one: string, many: string): string | null {
  if (n <= 0) return null
  return `${n} ${n === 1 ? one : many}`
}

/**
 * The one-line "what this goal is made of" meta, e.g.
 * "2 sessions · 3 PRs · last active 2h ago". Built from goalComposition, which
 * counts only members that actually exist — no start date is invented (the model
 * has no per-goal creation stamp), so it reports last activity instead.
 */
function goalMetaLine(items: WorkItem[], now: number = Date.now(), omitSessions = false): string {
  const c = goalComposition(items)
  const parts = [
    // A session card's meta would always open with "1 session" — say nothing
    // there instead of stating the card's own subject back at the reader.
    omitSessions ? null : countPart(c.sessions, 'session', 'sessions'),
    countPart(c.prs, 'PR', 'PRs'),
    countPart(c.issues, 'issue', 'issues'),
    countPart(c.loops, 'loop', 'loops'),
    countPart(c.crons, 'cron', 'crons'),
    countPart(c.agents, 'agent', 'agents'),
  ].filter((part): part is string => Boolean(part))
  const since = sinceLabel(c.lastActivityAt, now)
  if (since) parts.push(`last active ${since}`)
  return parts.join(' · ')
}

const CONDUCTOR_SLOT = 'crew-manager-conductor'
const SOURCE_POLL_MS = 5_000

const WORK_COPY: Record<WorkCopyKey, string> = {
  session: 'Session',
  approval: 'Approval',
  agent: 'Agent',
  workflow: 'Workflow',
  monitor: 'Monitor',
  artifact: 'Artifact',
  approval_waiting: 'Review the pending approval request',
  subagent_gate_waiting: 'Allow or refuse a sub-agent held at the spawn gate',
  information_needed: 'Answer the request in the work thread',
  decision_ready: 'Make the decision this work is waiting on',
  work_in_progress: 'Work is in progress',
  linked_change_issue: 'Open the linked change — a check is failing or it conflicts',
  recent_work_ready: 'Pick this back up, or let it go',
  approval_needed_for: 'Review the pending {{tool}} request',
  approval_needed: 'Approval needed',
  tool_call_waiting: 'Allow or refuse a waiting tool call',
  agent_work: 'Agent work',
  agent_done: 'This agent run finished',
  agent_failed: 'This agent stopped before finishing — nothing to do here',
  workflow_failed: 'This workflow stopped before finishing',
  workflow_failed_generic: 'This workflow stopped before finishing',
  workflow_running: 'Workflow is running',
  workflow_finished: 'Workflow finished',
  monitor_failed: 'The latest check stopped before finishing',
  monitor_running: 'Monitor is checking now',
  monitor_next_check: 'Checks again in {{duration}}.',
  loop: 'Monitor loop',
  loop_watching: 'Re-prompting its own session — {{cycles}} cycles so far, no limit set',
  loop_watching_capped: 'Re-prompting its own session — cycle {{cycles}} of {{cap}}',
  artifact_ready: '{{kind}} output is ready',
  stalled_for: 'Check on it — no activity for {{duration}}, still marked running',
  stalled_because: '{{reason}} Silent for {{duration}}.',
  duplicate_same_change: 'Also being worked in “{{title}}” — same linked change',
  duplicate_same_artifact: 'Also being worked in “{{title}}” — same artifact',
  duplicate_same_deliverable: 'Also being worked in “{{title}}” — same deliverable',
  duplicate_same_topic: 'Looks like the same work as “{{title}}”',
  duplicate_same_step: 'Next step matches “{{title}}” — may be the same work',
  related_sessions: '{{count}} other session(s) on this same work',
  related_same_change: 'same change',
  related_same_artifact: 'same artifact',
  related_same_deliverable: 'same deliverable',
  related_same_topic: 'similar goal',
  related_same_step: 'same next step',
  related_more: 'and {{count}} more',
  rank_approval_owed: 'only you can clear this approval',
  rank_subagent_gate: 'a sub-agent is held at the spawn gate',
  rank_input_requested: 'the agent asked you a question',
  rank_unverified_completion: 'finished but never verified',
  rank_error_loop: 'the same failure has repeated {{repeats}} times',
  rank_run_failed: 'the run failed and has not been retried',
  rank_stalled: 'silent for {{duration}}',
  rank_change_blocked: 'a linked change is failing or conflicting',
  rank_nobody_on_it: 'nobody is on {{count}} unfinished goal(s) in this session',
  no_next_step: 'No next step recorded — nobody is on this',
  // Same-session queue only — the platform does not model one session
  // blocking another, so this must not claim it does.
  rank_queued_behind: '{{count}} more prompt(s) queued in this session',
  rank_waiting_a_while: 'waiting {{hours}}h',
  rank_nothing_pressing: 'nothing pressing — ordered by recency',
  rank_join: ', and ',
  error_loop: '{{tool}} has failed the same way {{repeats}} times in a row',
  untitled_work: 'Untitled work',
}

function workCopy(key: WorkCopyKey, values: Record<string, string> = {}): string {
  return WORK_COPY[key].replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name] ?? '')
}

/**
 * Sentence case so the lane label reads as one family with the "N need you"
 * count pill instead of shouting over it.
 */
const verbLabels: Record<ResponseVerb, string> = {
  followup: 'Follow up',
  unblock: 'Unblock',
}


const stateLabels: Record<WorkState, string> = {
  'needs-you': 'Needs you',
  running: 'Running',
  done: 'Done',
}

const filterLabels: Record<FilterKey, string> = {
  all: 'All',
  'needs-you': 'Needs you',
  running: 'Running',
  done: 'Done',
}

const prFilterLabels = {
  all: 'All',
  failing: 'Failing',
  running: 'Running',
  merged: 'Merged',
} as const
type PrFilterKey = keyof typeof prFilterLabels

const referenceIcon: Record<WorkReferenceKind, typeof MessageSquare> = {
  session: MessageSquare,
  approval: AlertCircle,
  agent: Bot,
  workflow: Workflow,
  monitor: Radar,
  artifact: FileText,
  change: GitPullRequest,
  issue: Tag,
}

function Clickable({
  children,
  onActivate,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & { children: ReactNode; onActivate: () => void }) {
  return (
    <div
      {...props}
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate()
        }
      }}
    >
      {children}
    </div>
  )
}

function PanelSectionHeader({ label, count, subtitle }: { label: string; count: number; subtitle?: string }) {
  return (
    <div className="ow-section-header">
      <div className="ow-section-heading">
        <h2 className="ow-section-title">{label}</h2>
        <span className="ow-section-count">{count}</span>
      </div>
      {subtitle && <p className="ow-section-subtitle">{subtitle}</p>}
    </div>
  )
}

function stateBadge(item: WorkItem) {
  // Needs you is judged BEFORE issue, and the order is the whole point. `issue`
  // and `changeBlocked` are set from the same sessionIssue(slot) call, so with
  // issue first the one item that should read UNBLOCK was the one item guaranteed
  // to read "Issue" — a state, in the place reserved for the action.
  //
  // An issue is a REASON something needs you, not a category beside it. In this
  // queue the reason is already on the summary line and the why line; the badge's
  // one job is naming the response.
  if (item.state === 'needs-you') {
    // Inside a section titled "Needs you", a badge reading "Needs you" says
    // nothing. The verb takes its place rather than joining it, so naming the
    // response costs no extra room on the card.
    const verb = responseVerb(item)
    // Every needs-you item gets one. A missing badge left a hole in the column
    // and pulled that card's title out of line with its neighbours.
    return verb
      ? <Badge variant="warn" className="ow-verb">{verbLabels[verb]}</Badge>
      : null
  }
  // No Issue badge. Nothing reaches Done with an issue any more: a failed run is
  // unfinished work and now sits in the queue with a Retry, a dropped goal is a
  // decision rather than a fault, and a failing linked change belongs to the
  // change. "Done" and "Issue" on one card claimed the outcome both happened and
  // failed.
  if (item.state === 'running') {
    // Only claim motion when there is motion. An open goal nobody is on gets a
    // quieter, truthful label instead of a spinning clock.
    return item.moving
      ? <Badge variant="aim"><Clock3 className="ow-icon" />{stateLabels[item.state]}</Badge>
      // Reachable only inside an EXECUTING session: the agent holds this
      // session but is on a different goal. Not "Idle" (an idle session's goals
      // now go to Needs you) and not "Open" (already the action label on the
      // button beside it).
      : <Badge variant="muted">Queued</Badge>
  }
  return <Badge variant="ok"><CircleCheck className="ow-icon" />{stateLabels[item.state]}</Badge>
}

/** Beyond this the list stops being scannable and starts being a wall. */
const MAX_LISTED_GOALS = 4

/**
 * The permission decision itself. One component, used both in the list row and in
 * the Conductor, so the two cannot drift into asking the same question differently.
 */
function PermissionDecision({ tool, purpose, busy, onAnswer, where }: {
  tool: string
  purpose?: string
  busy: boolean
  onAnswer: (approve: boolean) => void
  where?: string
}) {
  return (
    <div className="ow-permission">
      <div className="ow-permission-body">
        <div className="ow-permission-head">
          <Shield className="ow-icon" aria-hidden="true" />
          <span className="ow-permission-title">Waiting for your permission</span>
        </div>
        <p className="ow-permission-what">
          {where && <span className="ow-truncate">{where}{' '}</span>}
          {where ? 'wants to run ' : 'Wants to run '}<code>{tool}</code>
        </p>
        {purpose && <p className="ow-permission-why">{purpose}</p>}
      </div>
      <div className="ow-permission-actions">
        <Btn onClick={() => onAnswer(true)} disabled={busy}>Approve</Btn>
        <Btn onClick={() => onAnswer(false)} disabled={busy}>Reject</Btn>
      </div>
    </div>
  )
}

/**
 * Mount animation for blocks that appear inside an already-rendered card.
 * Selecting a card used to snap its steps and controls in at full height, which
 * shoved every row below it — the grid-rows 0fr to 1fr keyframe grows the space
 * instead of claiming it all at once.
 */
function Expand({ children }: { children: ReactNode }) {
  return <div className="ow-expand"><div className="ow-expand-inner">{children}</div></div>
}

/** Steps beyond this crowd the composer; the rest stay in the session itself. */
const MAX_QUOTE_STEPS = 3

/** References worth showing: drop ones that only repeat the provenance label. */
function metaReferences(item: WorkItem) {
  const provenance = item.provenance.trim().toLowerCase()
  return item.references.filter(ref => ref.label.trim().toLowerCase() !== provenance)
}

/**
 * Cluster a section's items by session, WITHOUT reordering the sections's own
 * ranking: a session's block sits where its best-placed item already sat, and
 * that item stays first inside the block. Clustering pulls its siblings up to
 * join it rather than letting the sort scatter them.
 *
 * A block gets a header only when the session contributes 2+ items. Giving every
 * single-item session a header would double the row count and say nothing — 16
 * finished items would become 32 rows.
 */


/**
 * The formal approval card, fed from /api/approvals — the SAME data and
 * decisions as the session view. It cannot be reused from the platform (the
 * component is not exported, and a spawn-gate approval never appears in the
 * session transcript the embed renders), so this mirrors its anatomy: the
 * formatted purpose + input detail, Allow once, the tiered Trust menu, Reject.
 * Decisions go to the SLOT approve endpoint — the only one that can express
 * trust; /api/approvals/{id}/approve would silently downgrade Trust to a
 * one-shot approve.
 */
function FormalApproval({ item, busy, onDecide }: {
  item: WorkItem
  busy: boolean
  onDecide: (action: string) => void
}) {
  const [trustOpen, setTrustOpen] = useState(false)
  const command = item.permissionInput || ''
  const baseCommand = command.trim().split(/\s+/)[0] || item.permissionTool || ''
  return (
    // Clicks inside this card must never reach the row's select toggle — the
    // row reads a second click as "deselect" and collapses the card mid-answer.
    // A keyboard-activated button fires click too, so this covers both paths.
    <div
      className="ow-formal-approval"
      role="presentation"
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
    >
      <div className="ow-formal-badge">Waiting for approval</div>
      <div className="ow-formal-detail">
        {item.permissionPurpose && (
          <div className="ow-formal-kv">
            <span className="ow-formal-key">__tool_use_purpose</span>
            <span className="ow-formal-val">{item.permissionPurpose}</span>
          </div>
        )}
        <div className="ow-formal-kv">
          <span className="ow-formal-key">{item.permissionTool || 'tool'}</span>
          <span className="ow-formal-val ow-formal-mono">{command || '(no input details)'}</span>
        </div>
      </div>
      <div className="ow-formal-actions">
        <Btn disabled={busy} onClick={() => onDecide('approved')}>Allow once</Btn>
        <span className="ow-trust-wrap">
          <Btn disabled={busy} onClick={() => setTrustOpen(open => !open)} aria-expanded={trustOpen}>
            Trust <ChevronRight className="ow-icon ow-trust-caret" data-open={trustOpen ? 'true' : undefined} aria-hidden="true" />
          </Btn>
          {trustOpen && (
            <span className="ow-trust-menu" role="menu">
              {command && (
                <button type="button" role="menuitem" className="ow-trust-item" disabled={busy}
                  onClick={() => { setTrustOpen(false); onDecide('trust_command') }}>
                  Trust this exact command
                </button>
              )}
              {baseCommand && (
                <button type="button" role="menuitem" className="ow-trust-item" disabled={busy}
                  onClick={() => { setTrustOpen(false); onDecide('trust_base') }}>
                  Trust “{baseCommand}” commands
                </button>
              )}
              <button type="button" role="menuitem" className="ow-trust-item" disabled={busy}
                onClick={() => { setTrustOpen(false); onDecide('trust') }}>
                Trust everything in this session
              </button>
            </span>
          )}
        </span>
        <Btn className="ow-formal-reject" disabled={busy} onClick={() => onDecide('rejected')}>Reject</Btn>
      </div>
    </div>
  )
}

/**
 * The bootstrap path for big goals. A goal is only useful if it exists, and
 * projects.md is a convention not everyone has — so the view offers to seed it
 * from the projects sessions actually run in, or from a name the user types.
 * Everything lands in projects.md, where Crew Companion reads it too.
 */
function GoalBootstrap({ candidates, prominent, busy, onAdd }: {
  candidates: { name: string; sessions: number }[]
  /** True when no buckets exist at all — the whole top level is missing. */
  prominent: boolean
  busy: boolean
  onAdd: (name: string, aliases?: string[]) => void
}) {
  const [name, setName] = useState('')
  const shown = prominent ? candidates : candidates.filter(entry => entry.sessions >= 2)
  return (
    <div className="ow-bootstrap" data-prominent={prominent ? 'true' : undefined}>
      <div className="ow-bootstrap-head">
        {prominent ? 'No big goals defined yet' : shown.length > 0 ? 'Suggested goals' : 'Add a goal'}
      </div>
      {(prominent || shown.length > 0) && (
        <div className="ow-bootstrap-sub">
          Found in your unassigned work — click one to confirm it as a goal, or name your own.
        </div>
      )}
      {shown.length > 0 && (
        <div className="ow-bootstrap-chips">
          {shown.slice(0, 4).map(entry => (
            <button
              type="button"
              key={entry.name}
              className="ow-bootstrap-chip"
              disabled={busy}
              onClick={() => onAdd(entry.name, [entry.name])}
            >
              {entry.name} <span className="ow-bootstrap-count">{entry.sessions} session{entry.sessions === 1 ? '' : 's'}</span>
            </button>
          ))}
        </div>
      )}
      <div className="ow-bootstrap-custom">
        <Input
          value={name}
          placeholder="Or name a goal yourself…"
          aria-label="New goal name"
          onChange={event => setName(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && name.trim()) { onAdd(name); setName('') }
          }}
        />
        <Btn disabled={busy || !name.trim()} onClick={() => { onAdd(name); setName('') }}>Add goal</Btn>
      </div>
    </div>
  )
}

/**
 * One goal, several sessions. The header names the JOB (the leading item's
 * title); the rows underneath say who is on it. Split undoes a wrong merge:
 * heuristics guess, the user rules.
 */
function GoalDigest({ members }: { members: WorkItem[] }) {
  // The most-urgent member's latest update IS the goal's one-line state — the
  // list arrives sorted, so no extra judgement is needed.
  const lead = members[0]
  const sessions = new Set(members.map(item => item.sessionKey).filter(Boolean)).size
  const needsYou = members.filter(item => item.state === 'needs-you').length
  const running = members.filter(item => item.state === 'running').length
  const done = members.filter(item => item.state === 'done').length
  const parts = [`${sessions} session${sessions === 1 ? '' : 's'}`]
  if (needsYou) parts.push(`${needsYou} need${needsYou === 1 ? 's' : ''} you`)
  if (running) parts.push(`${running} running`)
  if (done) parts.push(`${done} done`)
  return (
    <div className="ow-goal-digest">
      {lead.summary && <p className="ow-digest-line">{lead.summary}</p>}
      <div className="ow-digest-counts">{parts.join(' · ')}</div>
    </div>
  )
}

/**
 * The shared chrome for a goal card, matching the dashboard mockup: a collapse
 * chevron, the goal's name (a plain label for a user bucket, a routing Clickable
 * for an auto cluster or lone goal), an optional trailing `action` (Split), a
 * "N need you" flag, and a one-line composition meta. `children` is whatever the
 * caller renders below — the fold digest, or the member rows. Chevron and header
 * are split so the title can still route to the Conductor while the chevron folds.
 */
function GoalCard({
  open,
  onToggle,
  label,
  flag,
  flagWarn,
  meta,
  why,
  header,
  action,
  children,
}: {
  open: boolean
  onToggle?: () => void
  /** Names the goal in the fold chevron's aria-label, so it is unique per card. */
  label?: string
  flag: string
  flagWarn?: boolean
  meta: string
  /**
   * Why these items are on one card. Only merged cards carry one: a goal the user
   * named needs no defence, and a lone item was never grouped in the first place.
   */
  why?: string | null
  header: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="ow-block ow-goalcard" data-grouped="true" data-open={open ? 'true' : undefined}>
      <div className="ow-goalcard-summary">
        {onToggle && (
          <button
            type="button"
            className="ow-goalcard-chevron"
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${label ?? 'goal'}`}
            onClick={onToggle}
          >
            <ChevronRight className="ow-icon ow-init-chevron" data-open={open ? 'true' : undefined} aria-hidden="true" />
          </button>
        )}
        {header}
        {action}
        <span className={`ow-goal-flag${flagWarn ? ' ow-goal-flag-warn' : ''}`}>{flag}</span>
      </div>
      <div className="ow-goal-meta">{meta}</div>
      {why && <div className="ow-goal-why">Grouped because {why}.</div>}
      {children}
    </div>
  )
}

function GoalBlockHeader({ block, status, folded, onToggle, onSplit, selected, onSelect }: {
  block: WorkBlock
  status?: WorkState
  folded?: boolean
  onToggle?: () => void
  onSplit?: (pairs: string[]) => void
  selected?: boolean
  onSelect?: () => void
}) {
  const lead = block.items[0]
  const sessions = new Set(block.items.map(item => item.sessionKey).filter(Boolean)).size
  const pairs: string[] = []
  for (let i = 0; i < block.items.length; i += 1) {
    for (let j = i + 1; j < block.items.length; j += 1) {
      if (block.items[i].sessionKey !== block.items[j].sessionKey) {
        pairs.push(goalPairKey(block.items[i], block.items[j]))
      }
    }
  }
  // Selecting the header quotes the GOAL: the Conductor then routes any
  // instruction to the goal's active session, not to a row the user must pick.
  const body = (
    <>
      {onToggle && (
        // The chevron is the universal fold affordance; the header itself keeps
        // its select semantics, so the two gestures never fight.
        <button
          type="button"
          className="ow-goal-fold"
          aria-label={folded ? `Expand ${lead.title}` : `Collapse ${lead.title}`}
          aria-expanded={!folded}
          onClick={event => { event.stopPropagation(); onToggle() }}
        >
          <ChevronRight className="ow-icon ow-init-chevron" data-open={folded ? undefined : 'true'} aria-hidden="true" />
        </button>
      )}
      <Users className="ow-icon" aria-hidden="true" />
      <span className="ow-truncate ow-block-name">{lead.title}</span>
      {status && <span className="ow-init-status" data-status={status}>{stateLabels[status]}</span>}
      <span className="ow-block-tab-meta">
        <span aria-hidden="true">·</span>
        <span className="ow-truncate">{sessions} sessions, one goal</span>
      </span>
      {onSplit && (
        <Btn
          className="ow-block-open ow-goal-split"
          title="Not the same goal — split into separate cards"
          aria-label={`Split ${lead.title}`}
          onClick={event => { event.stopPropagation(); onSplit(pairs) }}
        >
          Split
        </Btn>
      )}
    </>
  )
  if (onSelect) {
    return (
      <Clickable
        onActivate={onSelect}
        className="ow-block-tab ow-goal-tab"
        aria-pressed={selected}
        data-selected={selected ? 'true' : undefined}
      >
        {body}
      </Clickable>
    )
  }
  return <div className="ow-block-tab">{body}</div>
}

/**
 * Merge candidates for a selected lone goal. Ranked by the same matcher the
 * grouping uses, with a lower floor: what scored too low to auto-merge (or was
 * split earlier) is exactly what only the user can rule on.
 */
const MERGE_HINT_FLOOR = 0.3

function GoalMergeHint({ item, items, onMerge }: {
  item: WorkItem
  items: WorkItem[]
  onMerge: (pair: string) => void
}) {
  const candidates = items
    .filter(other => other.id !== item.id && other.sessionKey && item.sessionKey
      && other.sessionKey !== item.sessionKey)
    .map(other => ({ other, score: sameGoal(item, other) ? 1 : titleOverlap(item.title, other.title) }))
    .filter(entry => entry.score >= MERGE_HINT_FLOOR)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
  if (candidates.length === 0) return null
  return (
    <div className="ow-merge-hint">
      <span className="ow-merge-hint-label">Same goal?</span>
      {candidates.map(({ other }) => (
        <button
          type="button"
          key={other.id}
          className="ow-merge-hint-btn ow-truncate"
          onClick={() => onMerge(goalPairKey(item, other))}
        >
          Merge with “{other.title}”
        </button>
      ))}
    </div>
  )
}

/**
 * A session card wears the SAME anatomy as a goal card — summary row (chevron,
 * icon, title, action, state flag), then a meta line, then rows. One card
 * language: a card is either one unit of work or one session holding rows, never
 * a third shape.
 *
 * It carries no "Grouped because" line, on GoalCard's own rule: that line
 * defends a grouping the agent inferred, and a session was never grouped.
 */
function SessionBlockHeader({
  item,
  items,
  folded,
  onToggle,
  onOpen,
}: {
  item: WorkItem
  items: WorkItem[]
  folded?: boolean
  onToggle?: () => void
  onOpen: () => void
}) {
  const sessionRef = item.references.find(ref => ref.kind === 'session')
  const label = sessionRef?.label ?? item.provenance
  const comp = goalComposition(items)
  const state: WorkState = comp.needsYou > 0
    ? 'needs-you'
    : items.some(row => row.state === 'running') ? 'running' : 'done'
  // The header flag would double-label an expanded card: its needs-you rows sit
  // in an UNBLOCK / FOLLOW UP lane whose badge already says the same thing. So
  // show the "N need you" count only while the card is COLLAPSED (the lanes are
  // hidden then, and it is the only signal); once expanded, the lanes speak.
  // The Running / Done state has no lane badge, so that flag always shows.
  const flag = comp.needsYou > 0
    ? (folded ? `${comp.needsYou} need you` : null)
    : stateLabels[state]
  // The session IS the card's subject, so its own count is not restated — and
  // provenance here is the bare word "Session", which the icon already says.
  const meta = goalMetaLine(items, Date.now(), true)
  return (
    <>
      <div className="ow-goalcard-summary">
        {onToggle && (
          <button
            type="button"
            className="ow-goalcard-chevron"
            aria-expanded={!folded}
            aria-label={`${folded ? 'Expand' : 'Collapse'} ${label}`}
            onClick={onToggle}
          >
            <ChevronRight className="ow-icon ow-init-chevron" data-open={folded ? undefined : 'true'} aria-hidden="true" />
          </button>
        )}
        {/* Static, not a hit area: one visible Open button stays the only way in,
            so the title must not hint at an action it does not carry. */}
        <span className="ow-goalcard-header ow-goalcard-static">
          <MessageSquare className="ow-icon" aria-hidden="true" />
          <span className="ow-truncate ow-block-name ow-goalcard-title">{label}</span>
        </span>
        <Btn className="ow-block-open" onClick={onOpen} aria-label={`Open ${label}`}>
          Open
        </Btn>
        {flag && <span className={`ow-goal-flag${comp.needsYou > 0 ? ' ow-goal-flag-warn' : ''}`}>{flag}</span>}
      </div>
      {meta && <div className="ow-goal-meta">{meta}</div>}
    </>
  )
}

/** The platform's own PR payload (the sidebar Changes panel's data source). */
interface PlatformPrSource {
  title?: string
  state?: string
  draft?: boolean
  headBranch?: string
  baseBranch?: string
  author?: string
  updatedAt?: string
  additions?: number
  deletions?: number
  changedFiles?: number
  /** GitHub mergeStateStatus; GitLab's detailed status mapped onto the same set. */
  mergeStateStatus?: string
  mergeable?: string
  autoMerge?: boolean
  checks?: { bucket: 'passed' | 'skipped' | 'failed' | 'pending' }[]
  comments?: PrReviewComment[]
  files?: { path: string; additions: number; deletions: number }[]
}

/** Map the platform payload onto the card shape. One source of truth: the PR
 *  cards show the same data as the sidebar's Changes panel, fetched the same
 *  way — no separate gh backend to drift or fail differently. */
function fromPlatformSource(src: PlatformPrSource): PrChecks {
  const counted = (src.checks ?? []).filter(check => check.bucket !== 'skipped')
  const comments = src.comments ?? []
  return {
    available: true,
    total: counted.length,
    passing: counted.filter(check => check.bucket === 'passed').length,
    failing: counted.filter(check => check.bucket === 'failed').length,
    pending: counted.filter(check => check.bucket === 'pending').length,
    title: src.title,
    state: src.state ? src.state.toUpperCase() : undefined,
    is_draft: Boolean(src.draft),
    head: src.headBranch,
    base: src.baseBranch,
    author: src.author,
    updated_at: src.updatedAt,
    additions: src.additions,
    deletions: src.deletions,
    changed_files: src.changedFiles,
    merge_state: src.mergeStateStatus ? src.mergeStateStatus.toLowerCase() : undefined,
    mergeable: src.mergeable ? src.mergeable.toLowerCase() : undefined,
    auto_merge: Boolean(src.autoMerge),
    review: reviewDecision(comments),
    unresolved: unresolvedThreads(comments),
  }
}

interface PrChecks {
  available: boolean
  total?: number
  passing?: number
  failing?: number
  pending?: number
  /** The sidebar PR view's data — present when the gh overview call succeeded. */
  title?: string
  state?: string
  is_draft?: boolean
  head?: string
  base?: string
  additions?: number
  deletions?: number
  changed_files?: number
  author?: string
  updated_at?: string
  merge_state?: string
  mergeable?: string
  auto_merge?: boolean
  review?: 'approved' | 'changes-requested' | 'none'
  unresolved?: number
}

/* The card's fields, restated as the signals the verdict reads. Both the row's
 * pill and the filter chips go through this, so they cannot disagree. */
function prSignals(reference: { status?: string }, checks?: PrChecks): PrSignals {
  const updatedMs = checks?.updated_at ? Date.parse(checks.updated_at) : 0
  return {
    status: reference.status,
    state: checks?.state,
    isDraft: checks?.is_draft,
    mergeState: checks?.merge_state,
    mergeable: checks?.mergeable,
    autoMerge: checks?.auto_merge,
    base: checks?.base,
    available: checks?.available,
    total: checks?.total,
    passing: checks?.passing,
    failing: checks?.failing,
    pending: checks?.pending,
    unresolved: checks?.unresolved,
    review: checks?.review,
    updatedAt: updatedMs || undefined,
  }
}

function PrBlockHeader({ reference, checks, folded, onToggle, selected, onSelect }: {
  reference: WorkReference
  checks?: PrChecks
  folded?: boolean
  onToggle?: () => void
  selected?: boolean
  onSelect?: () => void
}) {
  // The real PR title when the backend could fetch it; the bare id otherwise.
  const title = checks?.title || reference.label
  const repo = repoFromUrl(reference.url)
  const updatedMs = checks?.updated_at ? Date.parse(checks.updated_at) : 0
  const signals = prSignals(reference, checks)
  const verdict = prVerdict(signals)
  const blockers = prBlockers(signals)
  const updated = updatedMs ? sinceLabel(updatedMs) : null
  const number = reference.label.replace(/^github\s*/, '')
  // The Goal card's meta line, filled with PR facts: repo · #num · author · when
  // · any blockers. The verdict moves up to the flag slot, so it no longer
  // shares (and truncates) the title row.
  const meta = [repo, number, checks?.author, updated ?? undefined, ...blockers]
    .filter(Boolean).join(' · ')
  const titleNode = (
    <>
      <GitPullRequest className="ow-icon" aria-hidden="true" />
      <span className="ow-truncate ow-block-name ow-goalcard-title">{title}</span>
    </>
  )
  return (
    <>
      <div className="ow-goalcard-summary">
        {onToggle && (
          <button
            type="button"
            className="ow-goalcard-chevron"
            aria-expanded={!folded}
            aria-label={`${folded ? 'Expand' : 'Collapse'} ${title}`}
            onClick={onToggle}
          >
            <ChevronRight className="ow-icon ow-init-chevron" data-open={folded ? undefined : 'true'} aria-hidden="true" />
          </button>
        )}
        {/* Selecting the header quotes the PR into the Conductor — the same
            gesture a goal header carries. Without onSelect it is a static label. */}
        {onSelect
          ? (
            <Clickable
              onActivate={onSelect}
              className="ow-goalcard-header ow-pr-header"
              aria-pressed={selected}
              data-selected={selected ? 'true' : undefined}
            >
              {titleNode}
            </Clickable>
          )
          : <span className="ow-goalcard-header ow-goalcard-static">{titleNode}</span>}
        {reference.url && (
          <Btn
            className="ow-block-open"
            aria-label={`Open ${reference.label} on the forge`}
            onClick={event => {
              event.stopPropagation()
              window.open(reference.url, '_blank', 'noopener,noreferrer')
            }}
          >
            Open
          </Btn>
        )}
        <span className="ow-pr-verdict" data-tone={PR_VERDICT_TONES[verdict]}>
          {PR_VERDICT_LABELS[verdict]}
        </span>
      </div>
      {meta && <div className="ow-goal-meta">{meta}</div>}
    </>
  )
}

/**
 * A reference the user can actually follow. These carried an external-link icon
 * while being inert, which promised a destination and then refused to go there.
 */
function ReferenceChip({
  reference,
  onOpenSession,
}: {
  reference: WorkReference
  onOpenSession: (slot: string) => void
}) {
  const RefIcon = referenceIcon[reference.kind]
  const body = (
    <>
      <RefIcon className="ow-icon" />
      <span className="ow-truncate">{reference.label}</span>
    </>
  )

  if (reference.url) {
    return (
      <a
        className="ow-reference ow-reference-link"
        href={reference.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={event => event.stopPropagation()}
      >
        {body}
      </a>
    )
  }
  if (reference.sessionKey) {
    return (
      <Clickable
        className="ow-reference ow-reference-link"
        onActivate={() => onOpenSession(reference.sessionKey as string)}
      >
        {body}
      </Clickable>
    )
  }
  return <span className="ow-reference">{body}</span>
}

function WorkRow({
  item,
  selected,
  continuation,
  whyRanked,
  onSelect,
  onOpenSession,
  onAnswerPermission,
  permissionBusy,
  onRetry,
  retryBusy,
  onStop,
  stopBusy,
  onPickStep,
  onSnooze,
  onHandled,
  hideBadge,
  compact,
  headless,
  dot,
  simple,
  onDecideApproval,
  sessionMismatch,
  onFixSessionName,
}: {
  item: WorkItem
  selected: boolean
  hideBadge?: boolean
  compact?: boolean
  /** The card header already states this row's badge+title — do not repeat. */
  headless?: boolean
  /** Goal mode: a leading status dot echoing the card's state language. */
  dot?: MemberDot
  /**
   * Goal mode: collapse the row to a status dot + label + chevron. Summary, meta,
   * the why line and expansions are hidden until the row is selected. A headless
   * row (its title already in the card header) renders nothing at rest and only
   * its detail on select — so it never leaves a blank strip.
   */
  simple?: boolean
  /** Answer the formal approval card inside this row. */
  onDecideApproval?: (item: WorkItem, action: string) => void
  /** The session's NAME only mentions another goal; offer the rename fix. */
  sessionMismatch?: { itemGoal: string; sessionGoal: string }
  onFixSessionName?: () => void
  onAnswerPermission?: (id: string, approve: boolean) => void
  permissionBusy?: boolean
  onRetry?: (path: string) => void
  retryBusy?: boolean
  /** Stop work that continues on its own. Irreversible from this app. */
  onStop?: (path: string) => void
  stopBusy?: boolean
  /** Fill the Conductor input with a suggested next step, chosen on the card. */
  onPickStep?: (what: string) => void
  onSnooze?: (id: string) => void
  onHandled?: (id: string, updatedAt: number) => void
  /** The one-line reason this item sits where it does. Needs you only. */
  whyRanked?: string
  /**
   * True when the row directly above belongs to the same session.
   *
   * Those rows carry an IDENTICAL meta line (same project, same linked changes),
   * so repeating it reads as duplication. Suppressing it groups them visually
   * without nesting them: each row keeps its own position, because position is
   * per work item and two goals in one session can differ wildly in urgency.
   */
  continuation?: boolean
  onSelect: () => void
  onOpenSession: (slot: string) => void
}) {
  const [showAllSteps, setShowAllSteps] = useState(false)
  return (
    <Clickable
      onActivate={onSelect}
      className="ow-row"
      aria-pressed={selected}
      data-selected={selected}
      data-instructed={item.instructed ? 'true' : undefined}
      data-continuation={continuation ? 'true' : undefined}
      data-testid={`work-item-${item.id}`}
    >
      <div className="ow-row-layout">
        <div className="ow-row-content">
          {!headless && (
          <div className="ow-row-heading">
            {dot && <span className={`ow-dot ow-dot-${dot}`} aria-hidden="true" />}
            {!simple && (hideBadge
              ? (item.state === 'done' && <Check className="ow-icon ow-row-check" aria-hidden="true" />)
              : stateBadge(item))}
            <span className="ow-row-title">{item.title}</span>
          </div>
          )}
          {/* Compact rows show the title only at rest; selecting one expands its
              summary here, so a click always reveals content (every item has a
              summary) rather than only the ones that happen to carry next-steps. */}
          {((!compact && !simple) || selected) && item.summary && !(item.nextSteps ?? []).some(step => step.what?.trim() === item.summary) && (
            <p className="ow-row-summary">{item.summary}</p>
          )}
          {/*
            Advice, not a verdict. It sits above the goals because "someone is
            already on this" changes whether the rest of the card matters, and it
            links straight to the other session so the comparison is one click.
          */}
          {item.duplicateOf && (!simple || selected) && (
            <Clickable
              className="ow-row-duplicate"
              onActivate={() => onOpenSession(item.duplicateOf!.sessionKey)}
            >
              <Users className="ow-icon" aria-hidden="true" />
              <span className="ow-truncate">
                {workCopy(
                  `duplicate_${item.duplicateOf.because}` as WorkCopyKey,
                  { title: item.duplicateOf.title },
                )}
              </span>
            </Clickable>
          )}
          {/*
            Who else is on this, both directions — including for the session that
            started first, which `duplicateOf` deliberately never tells. Each name
            opens that session, because the only useful response to "someone else
            is on this" is to go and look. Advice: it changes no state and no order.
          */}
          {selected && item.relatedSessions && item.relatedSessions.length > 0 && (
            <Expand><div className="ow-related">
              <span className="ow-related-label">
                {workCopy('related_sessions', { count: String(item.relatedSessions.length) })}
              </span>
              {item.relatedSessions.map(related => (
                <Clickable
                  key={related.sessionKey}
                  className="ow-related-row"
                  onActivate={() => onOpenSession(related.sessionKey)}
                >
                  <Users className="ow-icon" aria-hidden="true" />
                  <span className="ow-truncate">{related.title}</span>
                  <span className="ow-related-why">
                    {workCopy(`related_${related.because}` as WorkCopyKey)}
                  </span>
                </Clickable>
              ))}
              {item.relatedMore ? (
                <span className="ow-related-more">
                  {workCopy('related_more', { count: String(item.relatedMore) })}
                </span>
              ) : null}
            </div></Expand>
          )}
          {/*
            Only in Needs you. That is the one group ordered by score rather than
            time, so it is the only group whose order needs explaining — and the
            only place the user has to judge "which of these first". Running and
            Done are plain recency, where this line would cost a row and say
            nothing.
          */}
          {whyRanked && (!simple || selected) && <div className="ow-row-why">{whyRanked}</div>}
          {/*
            Inside a session block the header already carries the session, the
            project and the linked changes, so repeating them per row is noise.
          */}
          {!continuation && (!simple || selected) && (
            <div className="ow-row-meta">
              <span className="ow-truncate">{item.provenance}</span>
              {metaReferences(item).length > 0 && <span aria-hidden="true">·</span>}
              <span className="ow-references">
                {metaReferences(item).slice(0, 3).map(ref => (
                  <ReferenceChip
                    key={`${ref.kind}:${ref.id}`}
                    reference={ref}
                    onOpenSession={onOpenSession}
                  />
                ))}
              </span>
            </div>
          )}
          {/*
            The one case where the goal grouping and the session chip visibly
            contradict: the session's NAME was set by its first topic and now
            speaks for work it does not cover. The fix is the name, not the
            grouping — renaming it to mention both topics makes this vanish.
          */}
          {sessionMismatch && onFixSessionName && (
            <div className="ow-row-mismatch">
              <span className="ow-truncate">
                This session's name only mentions {sessionMismatch.sessionGoal} — this is {sessionMismatch.itemGoal} work
              </span>
              <button
                type="button"
                className="ow-mismatch-fix"
                onClick={event => { event.stopPropagation(); onFixSessionName() }}
              >
                Rename session to cover both
              </button>
            </div>
          )}
        </div>
        {/*
          No action button on a work item. A row's job is to be SELECTED, which
          quotes it in the Conductor; what happens next is the instruction the user
          types there. Opening a session belongs to the session title above, which
          is the thing a session actually is. An Open button per row also multiplied
          the same destination across every goal in one session.
        */}
        <div className="ow-row-actions">
          <ChevronRight className="ow-icon" aria-hidden="true" />
        </div>
      </div>
      {/*
        A yes/no is answered where it is asked. Sending this item to the composer
        would ask the user to compose a message when the session wants one bit.
      */}
      {/*
        Selecting a card expands its next steps HERE, where the content lives.
        Clicking one puts it in the Conductor's input — chosen on the left, sent
        on the right. The quote stays a reference.
      */}
      {selected && onPickStep && item.nextSteps && item.nextSteps.length > 0 && (
        <Expand><div className="ow-row-steps">
          {/* "Suggested" because these are the model's inferences, not a task
              list the user wrote. It was "Open items", which collided with the
              Open button (one word, two meanings) and called them items when the
              cards are the items. */}
          <div className="ow-steps-head">Suggested next steps</div>
          {item.nextSteps.slice(0, showAllSteps ? undefined : MAX_QUOTE_STEPS).map((step, index) => (
            <button
              type="button"
              key={`${index}:${step.what}`}
              className="ow-quote-step"
              title={step.why ?? step.what}
              onClick={event => {
                // Selection already happened; picking a step must not re-toggle it.
                event.stopPropagation()
                onPickStep(step.what)
              }}
            >
              {step.what}
            </button>
          ))}
          {item.nextSteps.length > MAX_QUOTE_STEPS && (
            <button
              type="button"
              className="ow-steps-more"
              onClick={event => { event.stopPropagation(); setShowAllSteps(show => !show) }}
            >
              {showAllSteps
                ? 'Show fewer'
                : `+${item.nextSteps.length - MAX_QUOTE_STEPS} more`}
            </button>
          )}
        </div></Expand>
      )}
      {/*
        Read the error, then re-run it. The failure line above is the diagnosis;
        this is the response. Retry spawns a fresh run, so a success removes this
        card on the next poll without anyone having to dismiss anything.
      */}
      {selected && item.retryPath && onRetry && (
        <Expand><div className="ow-retry">
          <Btn onClick={() => onRetry(item.retryPath as string)} disabled={Boolean(retryBusy)}>
            Retry
          </Btn>
        </div></Expand>
      )}
      {/*
        A loop keeps prompting its own session until a budget runs out, so the
        only intervention it has is to end it. Kept behind selection like Retry,
        and worded as the consequence rather than as "Stop": the remaining cycles
        are discarded and this app cannot put them back.
      */}
      {selected && item.stopPath && onStop && (
        <Expand><div className="ow-retry">
          <Btn onClick={() => onStop(item.stopPath as string)} disabled={Boolean(stopBusy)}>
            {stopBusy ? 'Stopping…' : 'Stop this loop'}
          </Btn>
        </div></Expand>
      )}
      {/*
        A permission request is answered in the FORMAL approval card — the same
        anatomy as the session view (details, Trust options, formatted input) —
        expanded inside the selected card, where the decision belongs.
      */}
      {selected && item.permissionId && onDecideApproval && (
        <Expand><FormalApproval
          item={item}
          busy={Boolean(permissionBusy)}
          onDecide={action => onDecideApproval(item, action)}
        /></Expand>
      )}
      {/*
        Management, not response: taking the item OUT of the queue. On hover (and
        keyboard focus), not on select — deferring something you are scanning past
        should not require entering the quote mode first. Response actions still
        expand on select, above; these float over the row's top-right corner so
        the resting card stays clean.
      */}
      {item.state === 'needs-you' && onSnooze && onHandled && (
        <div className="ow-row-aside">
          <button type="button" className="ow-aside-btn" onClick={event => { event.stopPropagation(); onSnooze(item.id) }}>Later</button>
          <button type="button" className="ow-aside-btn" onClick={event => { event.stopPropagation(); onHandled(item.id, item.updatedAt) }}>Handled</button>
        </div>
      )}
    </Clickable>
  )
}

type LaneKey = 'unblock' | 'followup' | 'running' | 'done'
const LANE_ORDER: LaneKey[] = ['unblock', 'followup', 'running', 'done']
const LANE_BADGE: Record<'unblock' | 'followup', { label: string; cls: string }> = {
  unblock: { label: 'Unblock', cls: 'ow-lane-unblock' },
  followup: { label: 'Follow up', cls: 'ow-lane-followup' },
}

function laneKeyOf(item: WorkItem): LaneKey {
  if (item.state === 'done') return 'done'
  if (item.state === 'running') return 'running'
  return responseVerb(item) ?? 'unblock'
}

/**
 * A session's items, grouped by response. The verb moves OFF each row and onto
 * ONE lane head, so four "verify" items read as one labelled group of four
 * instead of four repeated badges. Rows stay compact and selectable; the badge
 * is a column you scan once, not per row.
 */
function SessionLanes({
  items,
  selectedId,
  onSelect,
  onOpenSession,
  onAnswerPermission,
  onDecideApproval,
  permissionBusy,
  onRetry,
  retryBusy,
  onPickStep,
  onSnooze,
  onHandled,
  doneTitles,
}: {
  items: WorkItem[]
  selectedId: string | null
  onSelect: (item: WorkItem) => void
  onOpenSession: (slot: string) => void
  onAnswerPermission?: (id: string, approve: boolean) => void
  onDecideApproval?: (item: WorkItem, action: string) => void
  permissionBusy?: boolean
  onRetry?: (path: string) => void
  retryBusy?: boolean
  onPickStep?: (what: string) => void
  onSnooze?: (id: string) => void
  onHandled?: (id: string, updatedAt: number) => void
  /** This session's finished goals, listed elsewhere — shown here as context. */
  doneTitles?: string[]
}) {
  const [showDone, setShowDone] = useState(false)
  const byLane = new Map<LaneKey, WorkItem[]>()
  for (const item of items) {
    const key = laneKeyOf(item)
    const list = byLane.get(key)
    if (list) list.push(item)
    else byLane.set(key, [item])
  }
  return (
    <>
      {LANE_ORDER.filter(key => byLane.has(key)).map(laneKey => {
        const laneItems = byLane.get(laneKey) as WorkItem[]
        const badge = laneKey === 'unblock' || laneKey === 'followup' ? LANE_BADGE[laneKey] : null
        // One shared reason on the head only when every item gives the same one;
        // otherwise keep each row's own reason so nothing is flattened away.
        const reasons = badge
          ? laneItems.map(it => (it.action !== 'resume' ? explainRank(rankWorkItem(it), workCopy) : ''))
          : []
        const laneReason = badge && reasons.length > 0 && reasons.every(r => r && r === reasons[0])
          ? reasons[0]
          : undefined
        return (
          <div className="ow-lane" key={laneKey}>
            {badge && (
              <div className="ow-lane-head">
                <span className={`ow-lane-badge ${badge.cls}`}>{badge.label}</span>
                {laneReason && <span className="ow-lane-reason">{laneReason}</span>}
              </div>
            )}
            {laneItems.map(item => (
              <WorkRow
                key={item.id}
                item={item}
                hideBadge
                compact
                selected={selectedId === item.id}
                continuation
                whyRanked={laneReason
                  ? undefined
                  : (item.state === 'needs-you' && item.action !== 'resume'
                    ? explainRank(rankWorkItem(item), workCopy)
                    : undefined)}
                onSelect={() => onSelect(item)}
                onOpenSession={onOpenSession}
                onAnswerPermission={onAnswerPermission}
                onDecideApproval={onDecideApproval}
                permissionBusy={permissionBusy}
                onRetry={onRetry}
                retryBusy={retryBusy}
                onPickStep={onPickStep}
                onSnooze={onSnooze}
                onHandled={onHandled}
              />
            ))}
          </div>
        )
      })}
      {/* This session's finished goals. They are their own items in Done, but the
          card is where you judge what is LEFT — so the ledger is offered here,
          collapsed, rather than making you open another section to see it. */}
      {!byLane.has('done') && doneTitles && doneTitles.length > 0 && (
        <div className="ow-lane ow-lane-done">
          <button
            type="button"
            className="ow-goals-toggle"
            aria-expanded={showDone}
            onClick={() => setShowDone(show => !show)}
          >
            <ChevronRight className="ow-icon" data-open={showDone ? 'true' : undefined} aria-hidden="true" />
            {doneTitles.length} done
          </button>
          {showDone && (
            <ul className="ow-done-list">
              {doneTitles.map(title => (
                <li key={title} className="ow-row-goal-done">
                  <Check className="ow-icon" aria-hidden="true" />
                  <span className="ow-truncate">{title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

function WorkSection({
  title,
  items,
  selectedId,
  onSelect,
  onOpenSession,
  onAnswerPermission,
  onDecideApproval,
  permissionBusy,
  onRetry,
  retryBusy,
  onStop,
  stopBusy,
  onPickStep,
  onSnooze,
  onHandled,
  footer,
  collapsed,
  onToggleCollapsed,
  groupBy,
  prChecks,
  prFilter,
  doneBySession,
  goalVerdicts,
  onSplitGoal,
  onMergeGoal,
  initiativeBlocks,
  initiatives: goalInitiatives,
  onRenameSession,
  semanticWhy,
  goalNames,
  collapsedInitiatives,
  onToggleInitiative,
  selectedGoalKey,
  onSelectGoal,
  selectedPrKey,
  onSelectPr,
  subtitle,
  hideHeader,
  emptyLabel,
}: {
  title: string
  items: WorkItem[]
  selectedId: string | null
  onSelect: (item: WorkItem) => void
  onOpenSession: (slot: string) => void
  onAnswerPermission?: (id: string, approve: boolean) => void
  onDecideApproval?: (item: WorkItem, action: string) => void
  permissionBusy?: boolean
  onRetry?: (path: string) => void
  retryBusy?: boolean
  /** Stop work that continues on its own. Irreversible from this app. */
  onStop?: (path: string) => void
  stopBusy?: boolean
  onPickStep?: (what: string) => void
  onSnooze?: (id: string) => void
  onHandled?: (id: string, updatedAt: number) => void
  /** Rendered under the list; the section's own footer line. */
  footer?: ReactNode
  /** When set, the header toggles the list; undefined means always open. */
  collapsed?: boolean
  onToggleCollapsed?: () => void
  groupBy: GroupMode
  prChecks?: Record<string, PrChecks>
  /** PR-status chip in PR mode; filters whole PR groups. */
  prFilter?: PrFilterKey
  /** Per-session finished-goal titles, for the collapsed ledger on a card. */
  doneBySession?: Record<string, string[]>
  /** Goal mode: the user's same-job rulings, and how to record new ones. */
  goalVerdicts?: GoalVerdicts
  onSplitGoal?: (pairs: string[]) => void
  onMergeGoal?: (pair: string) => void
  /** Goal mode: the two-level initiative clustering, computed by the parent. */
  initiativeBlocks?: InitiativeBlock[]
  initiatives?: Initiative[]
  onRenameSession?: (sessionKey: string, title: string) => void
  /** The semantic pass's one-line reason per merged pair, for the why line. */
  semanticWhy?: Map<string, string>
  /** Model-written names by goal key; sticky, preferred over the derived name. */
  goalNames?: Record<string, string>
  collapsedInitiatives?: Record<string, boolean>
  onToggleInitiative?: (key: string, next: boolean) => void
  selectedGoalKey?: string | null
  onSelectGoal?: (key: string) => void
  selectedPrKey?: string | null
  onSelectPr?: (key: string) => void
  subtitle?: string
  /**
   * Drop the visible title/count/subtitle band. The Goal list already sits under
   * the card's own Goals/Sessions tab header, so a second heading named the same
   * thing the selected tab already says is chrome the user has to read past. The
   * section keeps `aria-label={title}`, so the region stays named for a screen
   * reader even with nothing drawn.
   */
  hideHeader?: boolean
  emptyLabel: string
}) {
  const blocks = clusterBy(items, groupBy, goalVerdicts)
  // PR mode only: drop whole PR groups that do not match the chosen status chip.
  const shownBlocks = groupBy === 'pr' && prFilter && prFilter !== 'all'
    ? blocks.filter(block => block.changeRef
        && prBucket(prSignals(block.changeRef, prChecks?.[block.changeRef.url ?? ''])) === prFilter)
    : blocks
  const initiatives = initiativeBlocks ?? []
  // In PR mode the header counts PRs; in Goal mode it counts big goals (units).
  const headerCount = groupBy === 'goal'
    ? initiatives.length
    : groupBy === 'pr' ? shownBlocks.length : items.length

  const renderBlock = (block: WorkBlock) => {
    const blockChecks = block.changeRef ? prChecks?.[block.changeRef.url ?? ''] : undefined
    // A PR card folds like a goal card. It arrives open only when it needs
    // attention: failing checks, or work on it that waits on the user.
    const prFolded = block.header === 'pr'
      ? collapsedInitiatives?.[block.key]
        ?? !(((blockChecks?.failing ?? 0) > 0) || block.items.some(item => item.state === 'needs-you'))
      : false
    const sessionFolded = block.header === 'session'
      ? Boolean(collapsedInitiatives?.[block.key])
      : false
    return (
            <div
              key={block.key}
              className={`ow-block${block.header === 'session' || block.header === 'pr' ? ' ow-goalcard' : ''}`}
              // Every card that belongs to a group gets the header, whether it
              // holds one row or five. One row is not a different KIND of thing.
              data-grouped={block.header ? 'true' : undefined}
              data-open={(block.header === 'session' && !sessionFolded) || (block.header === 'pr' && !prFolded) ? 'true' : undefined}
            >
              {block.header === 'session' && block.sessionKey && (
                <SessionBlockHeader
                  item={block.items[0]}
                  items={block.items}
                  folded={sessionFolded}
                  onToggle={onToggleInitiative ? () => onToggleInitiative(block.key, !sessionFolded) : undefined}
                  onOpen={() => onOpenSession(block.sessionKey as string)}
                />
              )}
              {block.header === 'pr' && block.changeRef && (
                <PrBlockHeader
                  reference={block.changeRef}
                  checks={blockChecks}
                  folded={prFolded}
                  onToggle={onToggleInitiative ? () => onToggleInitiative(block.key, !prFolded) : undefined}
                  selected={selectedPrKey === block.key}
                  onSelect={onSelectPr ? () => onSelectPr(block.key) : undefined}
                />
              )}
              {block.header === 'goal' && (
                <GoalBlockHeader
                  block={block}
                  onSplit={onSplitGoal}
                  selected={selectedGoalKey === block.key}
                  onSelect={onSelectGoal ? () => onSelectGoal(block.key) : undefined}
                />
              )}
              {block.header === 'pr' ? (
                !prFolded && (
                <>
                  {/* Just the sessions. A session under a PR is a place to jump
                      to, not a second work list — and the diff itself belongs on
                      the forge, which the header links to. */}
                  <div className="ow-pr-sessions">
                    <span className="ow-pr-sublabel-inline">Sessions</span>
                    {rollUpSessions(block.items).map(session => (
                      <button
                        type="button"
                        key={session.sessionKey}
                        className="ow-reference ow-reference-link ow-pr-session-chip"
                        onClick={() => onOpenSession(session.sessionKey)}
                      >
                        <MessageSquare className="ow-icon" aria-hidden="true" />
                        <span className="ow-truncate">{session.label}</span>
                      </button>
                    ))}
                  </div>
                </>
                )
              ) : block.header === 'session' ? (
                !sessionFolded && (
                <SessionLanes
                  items={block.items}
                  doneTitles={block.sessionKey ? doneBySession?.[block.sessionKey] : undefined}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onOpenSession={onOpenSession}
                  onAnswerPermission={onAnswerPermission}
                  onDecideApproval={onDecideApproval}
                  permissionBusy={permissionBusy}
                  onRetry={onRetry}
                  retryBusy={retryBusy}
                  onPickStep={onPickStep}
                  onSnooze={onSnooze}
                  onHandled={onHandled}
                />
                )
              ) : (
              block.items.map((item) => (
            <Fragment key={item.id}>
            <WorkRow
              item={item}
              selected={selectedId === item.id}
              // Session groups state the session in the header, so the row's own
              // meta line would repeat it — suppress it.
              continuation={block.header === 'session'}
              whyRanked={
                item.state === 'needs-you' && item.action !== 'resume'
                  ? explainRank(rankWorkItem(item), workCopy)
                  : undefined
              }
              onSelect={() => onSelect(item)}
              onOpenSession={onOpenSession}
              onAnswerPermission={onAnswerPermission}
              onDecideApproval={onDecideApproval}
              permissionBusy={permissionBusy}
              onRetry={onRetry}
              retryBusy={retryBusy}
              onStop={onStop}
              stopBusy={stopBusy}
              onPickStep={onPickStep}
              onSnooze={onSnooze}
              onHandled={onHandled}
            />
            {groupBy === 'goal' && onMergeGoal && selectedId === item.id && (
              <GoalMergeHint item={item} items={items} onMerge={onMergeGoal} />
            )}
            </Fragment>
              )))}
            </div>
  )
  }

  // Goal mode: every member is a self-labelling simple row (dot + title +
  // chevron), so no item is hidden behind a header and none renders blank. The
  // card header names the GOAL, never a member — so it must not repeat a title.
  const goalRow = (item: WorkItem) => {
    const mismatch = goalInitiatives && onRenameSession
      ? sessionNameMismatch(item, goalInitiatives)
      : null
    const sessionLabel = item.references.find(ref => ref.kind === 'session')?.label ?? ''
    return (
    <Fragment key={item.id}>
      <WorkRow
        item={item}
        selected={selectedId === item.id}
        dot={memberDot(item)}
        simple
        sessionMismatch={mismatch ?? undefined}
        onFixSessionName={mismatch && item.sessionKey
          // The proposed name simply appends the missing topic; the user can
          // refine it later with the normal session rename.
          ? () => onRenameSession!(item.sessionKey as string, `${sessionLabel} & ${mismatch.itemGoal}`.slice(0, 200))
          : undefined}
        whyRanked={
          item.state === 'needs-you' && item.action !== 'resume'
            ? explainRank(rankWorkItem(item), workCopy)
            : undefined
        }
        onSelect={() => onSelect(item)}
        onOpenSession={onOpenSession}
        onAnswerPermission={onAnswerPermission}
        onDecideApproval={onDecideApproval}
        permissionBusy={permissionBusy}
        onRetry={onRetry}
        retryBusy={retryBusy}
        onPickStep={onPickStep}
        onSnooze={onSnooze}
        onHandled={onHandled}
      />
      {onMergeGoal && selectedId === item.id && (
        <GoalMergeHint item={item} items={items} onMerge={onMergeGoal} />
      )}
    </Fragment>
    )
  }

  const renderInitiative = (init: InitiativeBlock) => {
    // A user-defined goal: header names it + a "N need you" flag; a composition
    // meta line sits below; folded shows the digest, open shows simple rows.
    if (init.name) {
      const folded = collapsedInitiatives?.[init.key] ?? (init.status !== 'needs-you')
      const members = init.blocks.flatMap(block => block.items)
      const comp = goalComposition(members)
      return (
        <GoalCard
          key={init.key}
          open={!folded}
          onToggle={() => onToggleInitiative?.(init.key, !folded)}
          label={init.name}
          flag={comp.needsYou > 0 ? `${comp.needsYou} need you` : stateLabels[init.status]}
          flagWarn={comp.needsYou > 0}
          meta={goalMetaLine(members)}
          header={<span className="ow-truncate ow-block-name ow-goalcard-title">{init.name}</span>}
        >
          {folded ? <GoalDigest members={members} /> : members.map(item => goalRow(item))}
        </GoalCard>
      )
    }
    const block = init.blocks[0]
    // An auto-detected cross-session goal: the header keeps the goal's name (the
    // lead item's title) + Split; every member — the lead included — is a simple
    // row (the lead renders headless, so its title is not repeated).
    if (block.header === 'goal') {
      const folded = collapsedInitiatives?.[init.key] ?? (init.status !== 'needs-you')
      const lead = block.items[0]
      const comp = goalComposition(block.items)
      const pairs: string[] = []
      for (let i = 0; i < block.items.length; i += 1) {
        for (let j = i + 1; j < block.items.length; j += 1) {
          // Every pair in the cluster, same-session ones included: provenance can
          // now merge within a session, and a Split that skipped those pairs would
          // leave the card looking splittable while doing nothing.
          pairs.push(goalPairKey(block.items[i], block.items[j]))
        }
      }
      // What to CALL this goal. A model-written name wins: it can say the
      // OUTCOME ("Ship the neutral icon set") where the derived name can only
      // quote a substring the titles share. It is sticky by key, so it does not
      // churn when a member joins. Then the derived name; then the count-label
      // FALLBACK — which describes the grouping rather than the work, so it is
      // what a card says only when the members share nothing nameable. The
      // count is not lost — the composition meta below carries it. A
      // single-session cluster with no shared name falls back to its session,
      // never to "1 sessions, one goal".
      const sessionCount = new Set(block.items.map(i => i.sessionKey).filter(Boolean)).size
      const goalLabel = goalNames?.[block.key] ?? goalName(block.items) ?? (sessionCount > 1
        ? `${sessionCount} sessions, one goal`
        : lead.references.find(ref => ref.kind === 'session')?.label ?? lead.title)
      return (
        <GoalCard
          key={init.key}
          open={!folded}
          onToggle={() => onToggleInitiative?.(init.key, !folded)}
          label={goalLabel}
          flag={comp.needsYou > 0 ? `${comp.needsYou} need you` : stateLabels[init.status]}
          flagWarn={comp.needsYou > 0}
          meta={goalMetaLine(block.items)}
          why={explainGoal(block.items, goalVerdicts, semanticWhy)}
          header={
            <Clickable
              onActivate={() => onSelectGoal?.(block.key)}
              className="ow-goalcard-header ow-goal-tab"
              aria-pressed={selectedGoalKey === block.key}
              data-selected={selectedGoalKey === block.key ? 'true' : undefined}
            >
              <span className="ow-truncate ow-block-name ow-goalcard-title">{goalLabel}</span>
            </Clickable>
          }
          action={onSplitGoal && (
            <Btn
              className="ow-block-open ow-goal-split"
              title="Not the same goal — split into separate cards"
              aria-label={`Split ${lead.title}`}
              onClick={event => { event.stopPropagation(); onSplitGoal(pairs) }}
            >
              Split
            </Btn>
          )}
        >
          {folded
            ? <GoalDigest members={block.items} />
            : block.items.map(item => goalRow(item))}
        </GoalCard>
      )
    }
    // A lone goal. Prefer the MODEL's outcome title (from the semantic pass, keyed
    // by this block) so two lone cards from the same session no longer collide on
    // the session name -- each reads as its own goal. Falls back to the session
    // name, then to a plain row when neither says more than the item's own title.
    //
    // A session with no summarized intents titles its work after the session
    // itself, so header and row would print the identical string twice; such a
    // card renders as a plain row instead. Same for an item with no session and
    // no model name (a bare approval, an orphaned run): there is no group to name.
    const item = block.items[0]
    const modelName = goalNames?.[`item:${item.id}`]
    const sessionName = item.references.find(ref => ref.kind === 'session')?.label
    const loneLabel = modelName ?? sessionName
    if (!loneLabel || loneLabel === item.title) return goalRow(item)
    const comp = goalComposition(block.items)
    return (
      <GoalCard
        key={init.key}
        open
        label={loneLabel}
        flag={comp.needsYou > 0 ? `${comp.needsYou} need you` : stateLabels[item.state]}
        flagWarn={comp.needsYou > 0}
        meta={goalMetaLine(block.items)}
        header={<span className="ow-truncate ow-block-name ow-goalcard-title">{loneLabel}</span>}
      >
        {goalRow(item)}
      </GoalCard>
    )
  }

  return (
    <section className="ow-section" aria-label={title}>
      {hideHeader
        ? null
        : onToggleCollapsed
        ? (
          <Clickable onActivate={onToggleCollapsed} className="ow-section-toggle">
            <PanelSectionHeader label={title} count={headerCount} subtitle={subtitle} />
            <ChevronRight
              className="ow-icon ow-section-chevron"
              data-open={collapsed ? undefined : 'true'}
              aria-hidden="true"
            />
          </Clickable>
        )
        : <PanelSectionHeader label={title} count={headerCount} subtitle={subtitle} />}
      {collapsed ? null : (
      <div className="ow-section-list">
        {groupBy === 'goal'
          ? (initiatives.length === 0
            ? <p className="ow-section-empty">{emptyLabel}</p>
            : initiatives.map(renderInitiative))
          : shownBlocks.length === 0
            ? <p className="ow-section-empty">{emptyLabel}</p>
            : shownBlocks.map(renderBlock)}
      </div>
      )}
      {footer}
    </section>
  )
}

/**
 * The Conductor's context.
 *
 * It always opens with the fleet briefing, whether or not an item is selected.
 * Without it the Conductor knew only what the user had clicked, so it could
 * describe the queue differently from the list on screen; the spec says the two
 * cannot disagree. The briefing is generated by the SAME ordering and explanation
 * functions the list uses, so there is nothing to drift.
 */
function contextMessage(item: WorkItem | null, items: WorkItem[], sinceLastTurn: string[] = []): string {
  const briefing = fleetBriefing(items, workCopy)
  /*
   * What the watcher noticed since the Conductor last spoke.
   *
   * The board is regenerated from `sortWorkItems` every turn, so the Conductor
   * always knows the CURRENT state — but not which parts of it are new to it.
   * Without that, a stall detected while the user was away is indistinguishable
   * from one it has already discussed, so it either repeats itself or stays
   * silent about something that just broke.
   *
   * This is deliberately part of the CONTEXT and not a transcript row. Writing
   * synthetic turns into the conversation — the shape Overwatch uses, a fake
   * `[EVENT]` user message answered by a fabricated `'Noted.'` — would put words
   * in the assistant's mouth and would fight the rule that fleet state is
   * derived per turn rather than stored, so compaction cannot corrupt it.
   */
  const changed = sinceLastTurn.length
    ? [
      `Noticed since you last spoke (${sinceLastTurn.length}):`,
      ...sinceLastTurn.map(line => `- ${line}`),
      'Mention these only if they matter to what the user asked.',
    ]
    : []
  if (!item) {
    return [
      'Crew Manager context: workspace overview.',
      ...briefing,
      ...changed,
      'Answer the user about the state of their work. This is a conversation, not an action channel.',
    ].join('\n')
  }
  const references = item.references.map(ref => `${ref.kind}: ${ref.label} (${ref.id})`).join('\n')
  // The facts that make an item actionable, named rather than left for the
  // Conductor to infer from prose. Before this it received a title and a summary
  // and had to guess whether a card was a stall, a loop, a dead run or a live
  // one, which is exactly the judgement it is being asked to make. Background
  // work -- a failed monitor, a running loop -- has no session to instruct, so
  // WITHOUT these lines there was nothing concrete to reason about at all.
  //
  // Remedies are named but never granted: stopping and retrying are buttons the
  // user presses. The Conductor may recommend one; it cannot perform either.
  const diagnosis = [
    item.stalledFor ? `Silent for ${describeSilence(item.stalledFor)} while still marked running.` : undefined,
    item.loopRepeats ? `The same failure has repeated ${item.loopRepeats} times.` : undefined,
    item.unverified ? 'Reported finished but never verified.' : undefined,
    item.changeBlocked ? 'A linked change is failing or conflicting.' : undefined,
    item.queuedBehind ? `${item.queuedBehind} further prompt(s) are queued in this same session.` : undefined,
    item.approvalKind
      ? `An approval is owed (${item.approvalKind}). Only the user can answer it; recommend, do not attempt it.`
      : undefined,
    item.runFailed
      ? (item.retryPath
        ? 'This run failed. The user has a Retry button on the card.'
        : 'This run failed and the platform cannot re-run it, so there is no retry to recommend.')
      : undefined,
    item.stopPath
      ? 'This is a live monitor loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.'
      : undefined,
    !item.sessionKey
      ? 'This is background work with no session to instruct, so any recommendation must be something the user does on the card.'
      : undefined,
  ].filter((line): line is string => Boolean(line))
  return [
    `Crew Manager context: ${item.title}`,
    ...briefing,
    `Selected item: ${item.title}`,
    `State: ${stateLabels[item.state]}`,
    item.issue ? 'Issue detected.' : undefined,
    `Latest meaningful update: ${item.summary}`,
    `Provenance: ${item.provenance}`,
    item.sessionKey ? `Referenced session: ${item.sessionKey}` : 'Referenced session: none',
    ...(diagnosis.length > 0 ? [`Why it is on the board:\n${diagnosis.join('\n')}`] : []),
    `References:\n${references}`,
    ...changed,
    'This context was selected silently. Answer the user about it; the user sends any instruction to a session themselves.',
  ].filter((line): line is string => Boolean(line)).join('\n')
}

const PANEL_WIDTHS_KEY = 'crew-manager.panel-widths'

/*
 * Findings the watcher first saw AFTER the Conductor's last turn, as one line
 * each.
 *
 * `first_seen` is the backend's clock in epoch SECONDS and `last_ts` is an ISO
 * string from the platform, so both are normalised to ms before comparing. A
 * finding with no first-seen entry is treated as NOT new: a gateway whose app
 * backend predates the field would otherwise report the entire board as fresh
 * news on every single turn, which is worse than saying nothing.
 */
export function noticedSinceLastTurn(
  report: StallReport | null,
  conductorLastTs: string | number | null | undefined,
): string[] {
  const firstSeen = report?.first_seen
  if (!firstSeen) return []
  // No last turn yet means the whole board is new, and announcing all of it is
  // noise on a first message. Say nothing until there is a turn to be newer than.
  // `last_ts` arrives as an ISO string OR a number, and a bare number is
  // ambiguous between seconds and ms — resolved the same way the model's
  // `epoch()` does, since a value that small cannot be a plausible ms timestamp.
  const since = typeof conductorLastTs === 'number'
    ? (conductorLastTs <= 1e10 ? conductorLastTs * 1000 : conductorLastTs)
    : conductorLastTs
      ? Date.parse(conductorLastTs)
      : NaN
  if (!Number.isFinite(since)) return []
  const lines: string[] = []
  for (const finding of report?.stalls ?? []) {
    const seen = firstSeen[finding.key]
    if (typeof seen !== 'number') continue
    if (seen * 1000 <= since) continue
    lines.push(
      finding.reason
        ? `${finding.label} went quiet — ${finding.reason}`
        : `${finding.label} went quiet after ${describeSilence(finding.silent_secs)}`,
    )
  }
  for (const loop of report?.error_loops ?? []) {
    const seen = firstSeen[loop.key]
    if (typeof seen !== 'number') continue
    if (seen * 1000 <= since) continue
    lines.push(`${loop.label} repeated the same ${loop.tool} failure ${loop.repeats} times`)
  }
  // Cap it. This is a nudge toward what changed, not a second board, and an
  // unbounded list would crowd out the briefing it sits beside.
  const CAP = 5
  return lines.length > CAP
    ? [...lines.slice(0, CAP), `and ${lines.length - CAP} more`]
    : lines
}

/* Resize bounds in px. Each handle's `reserve` is the space the panel on the
   OTHER side must keep, so a drag can never collapse it. */
const COLW = { workMin: 300, railReserve: 370, conductorMin: 300, conductorMax: 620, mainReserve: 676 }
type PanelWidths = { work: number | null; conductor: number | null }

/* Keep a size within [min, container - reserve], never above max. */
function clampSize(raw: number, containerW: number, min: number, reserve: number, max: number): number {
  const hi = Math.min(max, Math.max(min, containerW - reserve))
  return Math.max(min, Math.min(hi, raw))
}

/* A draggable/keyboard divider that resizes one neighbouring panel. `side`
   'start' grows the left panel as the divider moves right; 'end' grows the
   right panel as it moves left. Value is that panel's width in px, or null
   while the CSS default still governs. */
function ColumnResizer({ side, containerRef, min, reserve, max, value, onChange, label }: {
  side: 'start' | 'end'
  containerRef: { current: HTMLElement | null }
  min: number
  reserve: number
  max: number
  value: number | null
  onChange: (px: number) => void
  label: string
}) {
  const sizeFromPointer = (clientX: number, el: HTMLElement): number => {
    const rect = el.getBoundingClientRect()
    const raw = side === 'start' ? clientX - rect.left : rect.right - clientX
    return clampSize(raw, el.clientWidth, min, reserve, max)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    e.preventDefault()
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const move = (ev: PointerEvent) => onChange(sizeFromPointer(ev.clientX, el))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const el = containerRef.current
    if (!el) return
    e.preventDefault()
    const step = (e.shiftKey ? 48 : 16) * (e.key === 'ArrowRight' ? 1 : -1)
    const current = value ?? (side === 'start' ? el.clientWidth / 2 : Math.round(el.clientWidth * 0.3))
    onChange(clampSize(current + (side === 'start' ? step : -step), el.clientWidth, min, reserve, max))
  }

  return (
    <div
      className="ow-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    />
  )
}

export default function CrewOverviewApp() {
  const api = useAppApi()
  const apiRef = useRef(api)
  apiRef.current = api
  const navigate = useNavigate()
  const setNavBadge = useNavBadge()
  const [filter, setFilter] = useState<FilterKey>('all')
  /*
   * The list card's tab. Only ever 'goal' or 'session' — 'pr' is still a real
   * GroupMode, but PR grouping now lives permanently in the utility rail's PRs
   * card rather than being a third thing this control switches to.
   *
   * This supersedes the branch's own GROUP_BY_KEY persistence: the choice is
   * still remembered across refreshes (see the writeStore effect below), just
   * under TAB_KEY and without a 'pr' value the tabs can no longer produce.
   */
  /* Column 1 holds exactly one panel, expanded; the other three sit in the
   * column-2 accordion. Conductor is column 3 and never participates. */
  const [primary, setPrimary] = useState<PanelId>(() => {
    const stored = readStore<PanelId | null>(PRIMARY_KEY, null)
    return stored && PANEL_ORDER.includes(stored) ? stored : 'work'
  })
  const [openStack, setOpenStack] = useState<PanelId | null>(() => {
    const stored = readStore<PanelId | null>(OPEN_STACK_KEY, null) ?? 'prs'
    const valid = PANEL_ORDER.includes(stored) ? stored : 'prs'
    // openStack may never name the primary — that card is expanded in column 1,
    // so pointing the rail's open slot at it would leave the rail with none.
    const seed = readStore<PanelId | null>(PRIMARY_KEY, null)
    const current = seed && PANEL_ORDER.includes(seed) ? seed : 'work'
    return valid === current ? PANEL_PICK_ORDER.find(id => id !== current) ?? null : valid
  })
  // One open at a time: opening a card closes the others, and clicking the open
  // card closes it, so "collapse everything" stays reachable.
  const toggleStack = useCallback((card: PanelId) => {
    setOpenStack(current => {
      const next = current === card ? null : card
      writeStore(OPEN_STACK_KEY, next)
      return next
    })
  }, [])

  const [groupBy, setGroupBy] = useState<GroupMode>(() => (
    readStore<GroupMode | null>(TAB_KEY, null) === 'session' ? 'session' : 'goal'
  ))
  const [prFilter, setPrFilter] = useState<PrFilterKey>('all')
  const [prChecks, setPrChecks] = useState<Record<string, PrChecks>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // The send destination is explicit, not inferred from what is quoted, so the
  // user sees and can change it before typing. Only meaningful when a session is quoted.
  const [scope, setScope] = useState<'session' | 'conductor'>('session')
  const [deliveryReceipt, setDeliveryReceipt] = useState<string | null>(null)
  const [sources, setSources] = useState<SourcesResponse | null>(null)
  const [summaries, setSummaries] = useState<Record<string, SessionSummary>>({})
  const [summarySupport, setSummarySupport] = useState<SummarySupport>('unknown')
  const summarySupportRef = useRef<SummarySupport>('unknown')
  const summaryStampsRef = useRef(new Map<string, string>())
  const [stalls, setStalls] = useState<Record<string, StallFinding>>({})
  // The raw report is kept alongside the keyed maps for `first_seen`, which is
  // per-report bookkeeping rather than per-finding and so has no home on either.
  const [stallReport, setStallReport] = useState<StallReport | null>(null)
  const [instructed, setInstructed] = useState<InstructedItems>({})
  // Sessions instructed from here. Kept beyond the acknowledgement window because
  // an approval can surface well after the instruction lands.
  const [watchedSessions, setWatchedSessions] = useState<string[]>([])
  const [resolvingApproval, setResolvingApproval] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [stopping, setStopping] = useState<string | null>(null)
  // Set-aside records live in the browser: the queue is re-derived every poll,
  // so without a persisted record a dismissed item returns within seconds.
  const [snoozed, setSnoozed] = useState<Record<string, number>>(() => readStore(SNOOZE_KEY))
  const [handled, setHandled] = useState<Record<string, number>>(() => readStore(HANDLED_KEY))
  const [goalVerdicts, setGoalVerdicts] = useState<GoalVerdicts>(() => readStore(GOAL_VERDICTS_KEY, { merged: [], split: [] }))
  // User-dragged column widths (px), or null while the CSS default governs.
  const layoutRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const [panelW, setPanelW] = useState<PanelWidths>(() => readStore(PANEL_WIDTHS_KEY, { work: null, conductor: null }))
  useEffect(() => { writeStore(PANEL_WIDTHS_KEY, panelW) }, [panelW])
  // A stored width saved on a wider window can overflow a narrower one; re-clamp
  // on mount AND on resize so the opposite panel never gets squeezed to nothing.
  useEffect(() => {
    const reclamp = () => setPanelW(p => {
      const mainW = mainRef.current?.clientWidth ?? 0
      const layoutW = layoutRef.current?.clientWidth ?? 0
      return {
        work: p.work == null || mainW === 0 ? p.work : clampSize(p.work, mainW, COLW.workMin, COLW.railReserve, Infinity),
        conductor: p.conductor == null || layoutW === 0 ? p.conductor : clampSize(p.conductor, layoutW, COLW.conductorMin, COLW.mainReserve, COLW.conductorMax),
      }
    })
    reclamp()
    window.addEventListener('resize', reclamp)
    return () => window.removeEventListener('resize', reclamp)
  }, [])
  const priorGoals = useRef<PriorGoal[]>(readStore<PriorGoal[]>(GOAL_MEMORY_KEY, []))
  // The semantic pass's verdicts. Pairs merge clusters (always below the user's
  // own Split pins); why lines feed the card's "Grouped because" copy. Cached
  // with the board stamp they answered, so an unchanged board never re-pays for
  // a model call — across reloads too.
  const [semantic, setSemantic] = useState<SemanticPass>(() => {
    const stored = readStore<StoredSemantic | null>(GOAL_SEMANTIC_KEY, null)
    return {
      pairs: new Set(stored?.pairs ?? []),
      why: new Map(stored?.why ?? []),
      stamp: stored?.stamp ?? '',
    }
  })
  // Model-written goal names by goal key. Sticky: once the user has seen a
  // name, a new member joining must not churn it.
  const [goalNames, setGoalNames] = useState<Record<string, string>>(() => readStore(GOAL_NAMES_KEY, {}))
  // Names the pass proposed for clusters that did not exist yet: they resolve
  // to a goal key only after the new pairs have re-clustered the board.
  const pendingNames = useRef<{ ids: string[]; name: string }[]>([])
  const passBusy = useRef(false)
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [collapsedInitiatives, setCollapsedInitiatives] = useState<Record<string, boolean>>(() => readStore(INITIATIVE_COLLAPSED_KEY))
  const [selectedGoalKey, setSelectedGoalKey] = useState<string | null>(null)
  const [selectedPrKey, setSelectedPrKey] = useState<string | null>(null)
  const [doneCollapsed, setDoneCollapsed] = useState<boolean>(() => readStore<boolean | null>(DONE_COLLAPSED_KEY, null) ?? true)
  const [loops, setLoops] = useState<Record<string, ErrorLoopFinding>>({})
  // Today's cron runs. The Loops card reads `sources.loops` (the MonitorLoop
  // payload the board already fetches) rather than requesting /api/autonudge a
  // second time — note `loops` above is detect.py's REPEAT-FAILURE finding, a
  // different thing wearing the same word.
  const [cronRuns, setCronRuns] = useState<CronRun[]>([])
  const [dragOver, setDragOver] = useState(false)
  /* Promotion is a swap of two slots: the dropped card takes column 1 and the
   * card it displaces joins the rail. */
  const promote = useCallback((id: PanelId) => {
    if (id === primary) return
    const nextOpen = openStack === id ? PANEL_PICK_ORDER.find(card => card !== id) ?? null : openStack
    writeStore(PRIMARY_KEY, id)
    writeStore(OPEN_STACK_KEY, nextOpen)
    setPrimary(id)
    setOpenStack(nextOpen)
  }, [primary, openStack])
  const startPanelDrag = useCallback((event: React.DragEvent<HTMLElement>, id: PanelId) => {
    event.dataTransfer.setData('text/x-crew-panel', id)
    event.dataTransfer.effectAllowed = 'move'
    /* Pin the ghost to this card's own header. Left to infer one, the browser
       painted the whole column — so dragging one card looked like moving all
       three, and the header alone reads as "this card is the thing moving". */
    const header = event.currentTarget.querySelector('summary')
    if (!header) return
    const rect = header.getBoundingClientRect()
    event.dataTransfer.setDragImage(
      header,
      Math.min(Math.max(event.clientX - rect.left, 0), rect.width),
      Math.min(Math.max(event.clientY - rect.top, 0), rect.height),
    )
  }, [])
  // Column 1 is the only drop target, and the primary card is what fills it.
  const dropPanel = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    const id = event.dataTransfer.getData('text/x-crew-panel') as PanelId | ''
    if (!id || !PANEL_ORDER.includes(id)) return
    promote(id)
  }, [promote])
  /* Every panel is the same card. Placement, open state and drop-target duty all
   * come from `primary`, so the DOM order below stays fixed. */
  const railOrder = useMemo(() => PANEL_ORDER.filter(id => id !== primary), [primary])
  /* Which of column 2's three rows takes the leftover height. A grid row cannot
   * size itself from the item in it, so the open card's row index has to reach
   * the container. */
  const openRow = openStack && openStack !== primary ? String(railOrder.indexOf(openStack)) : 'none'
  const panelShell = (id: PanelId): PanelShellProps => {
    const isPrimary = id === primary
    return {
      className: 'ow-card ow-stack-card',
      open: isPrimary || openStack === id,
      draggable: true,
      'data-panel': id,
      'data-primary': isPrimary ? 'true' : 'false',
      'data-rail-index': isPrimary ? undefined : railOrder.indexOf(id),
      'data-dragover': isPrimary && dragOver ? 'true' : undefined,
      onDragStart: event => startPanelDrag(event, id),
      onDragOver: isPrimary ? event => { event.preventDefault(); setDragOver(true) } : undefined,
      onDragLeave: isPrimary ? () => setDragOver(false) : undefined,
      onDrop: isPrimary ? dropPanel : undefined,
    }
  }
  // Flips false the first time the backend route is unreachable.
  const stallProbeRef = useRef(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [sourcesError, setSourcesError] = useState<Error | null>(null)
  // When the board's data last loaded successfully, and whether a manual refresh
  // is in flight. Set on success only, so a failing poll lets the label age --
  // that ageing IS the staleness signal the timestamp exists to show.
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [conductorCreated, setConductorCreated] = useState(false)
  const [conductorError, setConductorError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const sourceRequestRef = useRef(0)
  const conductorAttemptedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      sourceRequestRef.current += 1
    }
  }, [])

  const loadSources = useCallback(async () => {
    const request = ++sourceRequestRef.current
    const currentApi = apiRef.current
    try {
      const [slots, approvals, agentEnvelope, workflowEnvelope, cronEnvelope, artifactEnvelope, loopEnvelope, runEnvelope] = await Promise.all([
        currentApi.get<ChatSlot[]>('/api/chat/slots'),
        currentApi.get<ApprovalRow[]>('/api/approvals'),
        currentApi.get<{ agents?: AgentRow[] }>('/api/spawn'),
        currentApi.get<{ runs?: WorkflowRow[] }>('/api/workflows/runs'),
        currentApi.get<{ jobs?: CronJob[] }>('/api/crons'),
        currentApi.get<{ artifacts?: Artifact[] }>('/api/artifacts'),
        // Swallowed on purpose, unlike its six siblings. Auto-nudge is optional
        // in the gateway (it answers `enabled: false` when switched off) and this
        // route is newer than the rest, so an install that cannot serve it must
        // lose the loop rows only — not the whole board.
        currentApi
          .get<{ enabled?: boolean; loops?: MonitorLoop[] }>('/api/autonudge')
          .catch(() => ({ loops: [] as MonitorLoop[] })),
        // Same reasoning: run history is ADDITIVE, so a gateway that cannot serve
        // it loses today's completed counts only, not the board. Needed because a
        // job's own `last_run_ts` records just its most recent fire, so an
        // every-4-hours job would otherwise count as one run today.
        currentApi.get<{ runs?: CronRun[] }>('/api/crons/history?limit=200')
          .catch(() => ({ runs: [] as CronRun[] })),
      ])
      if (!mountedRef.current || request !== sourceRequestRef.current) return
      setSources({
        slots: Array.isArray(slots) ? slots : [],
        approvals: Array.isArray(approvals) ? approvals : [],
        agents: Array.isArray(agentEnvelope.agents) ? agentEnvelope.agents : [],
        workflows: Array.isArray(workflowEnvelope.runs) ? workflowEnvelope.runs : [],
        crons: Array.isArray(cronEnvelope.jobs) ? cronEnvelope.jobs : [],
        artifacts: Array.isArray(artifactEnvelope.artifacts) ? artifactEnvelope.artifacts : [],
        loops: Array.isArray(loopEnvelope?.loops) ? loopEnvelope.loops : [],
      })
      setCronRuns(Array.isArray(runEnvelope?.runs) ? runEnvelope.runs : [])
      setSourcesError(null)
      setLastUpdated(Date.now())
    } catch (error) {
      if (mountedRef.current && request === sourceRequestRef.current) {
        setSourcesError(error instanceof Error ? error : new Error('Unable to load Crew Manager sources'))
      }
    } finally {
      if (mountedRef.current && request === sourceRequestRef.current) setSourcesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSources()
    const interval = window.setInterval(() => { void loadSources() }, SOURCE_POLL_MS)
    return () => window.clearInterval(interval)
  }, [loadSources])

  const retrySources = () => {
    setSourcesLoading(true)
    setSourcesError(null)
    void loadSources()
  }

  // Manual refresh from the tab row. Does not toggle the full-card loading state
  // (that would blank the list); it just spins the icon until the fetch settles.
  const refreshSources = useCallback(() => {
    if (refreshing) return
    setRefreshing(true)
    void loadSources().finally(() => {
      if (mountedRef.current) setRefreshing(false)
    })
  }, [loadSources, refreshing])

  // Intent summaries: read per session, cached on last activity so an
  // unchanged session is never re-read, and abandoned entirely on a gateway
  // that has no summary endpoint.
  useEffect(() => {
    if (!sources || summarySupportRef.current === 'unsupported' || summarySupportRef.current === 'disabled') return
    const targets = summaryTargets(sources.slots, CONDUCTOR_SLOT)
      .filter(slot => summaryStampsRef.current.get(slot.key) !== summaryStamp(slot))
    if (targets.length === 0) return

    let cancelled = false
    void (async () => {
      const { summaries: fresh, support } = await fetchSummaries(
        targets,
        path => apiRef.current.get<SessionSummary>(path),
      )
      if (cancelled || !mountedRef.current) return
      summarySupportRef.current = support
      setSummarySupport(support)
      if (support === 'available') {
        for (const slot of targets) {
          if (fresh[slot.key]) summaryStampsRef.current.set(slot.key, summaryStamp(slot))
        }
        setSummaries(previous => ({ ...previous, ...fresh }))
      }
    })()
    return () => { cancelled = true }
  }, [sources])

  // Stall report from this app's own backend. Absent on a gateway where the
  // backend hook has not loaded yet (it needs a restart or a disable/enable),
  // so a failure disables the probe instead of retrying every poll.
  useEffect(() => {
    if (!sources || !stallProbeRef.current) return
    let cancelled = false
    void (async () => {
      try {
        const report = await apiRef.current.get<StallReport>('/api/apps/crew-manager/stalls')
        if (cancelled || !mountedRef.current) return
        const byKey: Record<string, StallFinding> = {}
        for (const finding of report?.stalls ?? []) {
          if (finding?.key) byKey[finding.key] = finding
        }
        setStalls(byKey)
        const loopsByKey: Record<string, ErrorLoopFinding> = {}
        for (const loop of report?.error_loops ?? []) {
          if (loop?.key) loopsByKey[loop.key] = loop
        }
        setLoops(loopsByKey)
        setStallReport(report ?? null)
      } catch {
        stallProbeRef.current = false
        if (mountedRef.current) { setStalls({}); setLoops({}); setStallReport(null) }
      }
    })()
    return () => { cancelled = true }
  }, [sources])

  // Initiative buckets from projects.md, once per load. A gateway without the
  // backend route just yields no initiative cards — the flat goal list.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const payload = await apiRef.current.get<{ initiatives?: Initiative[] }>('/api/apps/crew-manager/initiatives')
        if (cancelled || !mountedRef.current) return
        setInitiatives((payload?.initiatives ?? []).filter(bucket => bucket?.name))
      } catch {
        // Degrade silently: the Goal view works without buckets.
      }
    })()
    return () => { cancelled = true }
  }, [])

  const derived = useMemo(
    // Optimistic acknowledgements are applied on top of derived state, never baked
    // into it: real state wins on the next poll, and the ack expires on its own.
    () => applyInstructed(normalizeWorkItems(sources ?? {
      slots: [], approvals: [], agents: [], workflows: [], crons: [], artifacts: [], loops: [],
    }, workCopy, summaries, stalls, loops, goalVerdicts), instructed),
    [sources, summaries, stalls, loops, instructed, goalVerdicts],
  )
  const setAside = useMemo(
    () => applySetAside(derived, snoozed, handled),
    [derived, snoozed, handled],
  )
  const items = useMemo(
    () => setAside.items.filter(item => inDoneWindow(item)),
    [setAside],
  )
  const counts = useMemo(() => workCounts(items), [items])
  // Finished goals per session, so a card in Needs you / In progress can offer
  // that session's ledger without the Done section having to be open.
  const doneBySession = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const item of items) {
      if (item.state !== 'done' || !item.sessionKey) continue
      const list = map[item.sessionKey]
      if (list) list.push(item.title)
      else map[item.sessionKey] = [item.title]
    }
    return map
  }, [items])
  const selected = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  )
  /*
   * The state filter belongs to the Sessions list ALONE.
   *
   * `items` stays the full set and is what the Goals list, the PRs card and the
   * Loops card read. Only the Sessions branch reads `sessionItems`. Keeping the
   * two named separately is the point: one shared "visibleItems" is what let a
   * Sessions-tab pill quietly reshape the Goals list and the companion cards.
   */
  const sessionItems = useMemo(() => (
    filter === 'all' ? items : items.filter(item => item.state === filter)
  ), [filter, items])

  // One tally per PR (block), not per item, so the chip counts match the groups.
  // Reads `items`, not the Sessions filter: the PRs card is its own surface, and
  // a "Needs your input" pill in the list must not restate its open-PR count.
  const prCounts = useMemo(() => {
    const tally: Record<PrFilterKey, number> = { all: 0, failing: 0, running: 0, merged: 0 }
    for (const block of clusterBy(items, 'pr')) {
      if (!block.changeRef) continue
      tally.all++
      const bucket = prBucket(prSignals(block.changeRef, prChecks[block.changeRef.url ?? '']))
      if (bucket !== 'other') tally[bucket]++
    }
    return tally
  }, [items, prChecks])

  useEffect(() => {
    // Not gated on a view mode any more: the PRs card is always on screen, so its
    // check counts have to load whichever tab the list is showing.
    // Only GitHub pull URLs; the backend caches per URL and degrades gracefully.
    const urls = new Set<string>()
    for (const item of items) {
      for (const ref of item.references) {
        if ((ref.kind === 'change') && ref.url && /\/pull\/\d|\/merge_requests\/\d/.test(ref.url)) urls.add(ref.url)
      }
    }
    let cancelled = false
    for (const url of urls) {
      if (prChecks[url]) continue
      // The platform's own PR endpoint — the exact data source behind the
      // sidebar Changes panel, including its server-side cache. GitHub and
      // GitLab both work, and there is no app-backend hop to fail separately.
      apiRef.current.post<PlatformPrSource>('/api/source/pull-request', { url })
        .then(payload => {
          // Cache only real data: a transient failure must not stick — the
          // next poll retries it against the platform's warm cache.
          if (!cancelled && mountedRef.current && payload?.title) {
            setPrChecks(cur => ({ ...cur, [url]: fromPlatformSource(payload) }))
          }
        })
        .catch(() => { /* leave unset; header falls back to coarse status */ })
    }
    return () => { cancelled = true }
  }, [items, prChecks])

  useEffect(() => setNavBadge(counts['needs-you']), [counts, setNavBadge])
  useEffect(() => {
    if (selectedId && !items.some(item => item.id === selectedId)) setSelectedId(null)
  }, [items, selectedId])

  /* Persist the selected Goals/Sessions tab across refreshes. */
  useEffect(() => { writeStore(TAB_KEY, groupBy) }, [groupBy])

  const conductorSlot = sources?.slots.find(slot => slot.key === CONDUCTOR_SLOT)
  const conductorAvailable = Boolean(conductorSlot || conductorCreated)
  useEffect(() => {
    if (!sources || conductorSlot || conductorAttemptedRef.current) return
    conductorAttemptedRef.current = true
    /*
     * A previous attempt asked for `agent: 'kirocrew'`, which is not a Kiro Crew
     * agent name at all — it is the underlying kiro-cli agent the `default` agent
     * happens to be bound to. That shipped a dead Conductor, and the fix at the
     * time was to send no agent, because nothing here could tell a good name from
     * a bad one. The backend can, so it is asked.
     */
    /*
     * The `agent` field is sent ONLY when the backend has confirmed the agent is
     * registered on this install, and is omitted otherwise.
     *
     * Two facts make the check load-bearing rather than defensive. The bindable
     * name is the agent's DECLARED name — the platform records `<app>/<agent>` for
     * reporting and writes `<app>--<agent>.json` on disk, but kiro-cli enumerates
     * agents by their `name` field, so only the declared name resolves. And
     * registration is CONDITIONAL: an app's agents are materialized only where the
     * install trusts app-provided agents, so shipping the spec is not evidence
     * that it exists.
     *
     * Getting this wrong is silent. The endpoint validates only the charset, so a
     * name nothing answers to is accepted, the slot is created, and the Conductor
     * accepts a message and never replies — indistinguishable from a broken app.
     * That is why this shipped with no agent at all rather than with a guess.
     *
     * An unavailable agent is not an error: the Conductor still works on the
     * default agent exactly as before, just without the manager role.
     */
    void api.get<{ available?: boolean; agent?: string | null }>(
      '/api/apps/crew-manager/conductor-agent',
    )
      .then(probe => (probe?.available && probe.agent ? probe.agent : null))
      .catch(() => null)
      .then(agent => api.post<ChatSlot>('/api/chat/slots', {
        name: CONDUCTOR_SLOT,
        title: 'Conductor',
        ...(agent ? { agent } : {}),
      }))
      .then(() => {
      if (!mountedRef.current) return
      setConductorCreated(true)
      void loadSources()
    }).catch((error: unknown) => {
      if (!mountedRef.current) return
      // This is the one call whose failure disables the entire panel, and it was
      // the only one that reported nothing: the catch reset the flag and retried
      // forever in silence. Say it out loud instead.
      conductorAttemptedRef.current = false
      setConductorError(
        error instanceof Error
          ? `Conductor session could not be created: ${error.message}`
          : 'Conductor session could not be created',
      )
    })
  }, [api, conductorSlot, loadSources, sources])

  /**
   * Approvals blocking sessions the Conductor instructed.
   *
   * Deliberately NOT the selected item: a permission-blocked item now answers in
   * its own row, so including the selection here would ask the same question twice
   * on one screen. This block exists for the other case — an instruction was sent,
   * the session went quiet, and the reason is a permission the user cannot see.
   */
  const permissions = useMemo<PendingPermission[]>(() => pendingPermissions(
    sources?.approvals ?? [],
    watchedSessions,
    key => items.find(item => item.sessionKey === key)?.title
      ?? sources?.slots?.find(slot => slot.key === key)?.title
      ?? key,
  ), [items, sources, watchedSessions])

  /**
   * The item shown as a quote. A permission-blocked item is excluded: it is
   * answered in place with Approve / Reject, and quoting it would offer a message
   * box for a decision that takes one click.
   */
  const quoted = selected && !selected.permissionId ? selected : null

  // Two-level goal clustering lives in the parent so the Conductor can resolve
  // a selected goal's members for context and routing.
  /*
   * Computed on BOTH tabs and from the full `items`. Not just the Goals list's
   * data any more: the Loops card names a loop by the goal that owns it, so
   * gating this on the Goals tab would leave every loop unattributed on Sessions,
   * and feeding it the filtered set would make goals appear and disappear as a
   * Sessions pill changed.
   */
  const initiativeBlocks = useMemo(
    () => clusterByInitiative(items, initiatives, goalVerdicts, priorGoals.current, semantic.pairs),
    [items, initiatives, goalVerdicts, semantic],
  )
  // A goal's key is what the fold state is stored against, so it has to survive
  // the goal gaining or losing a member. Carrying the previous run's membership
  // forward is what lets reconcileGoalKeys recognise the same goal next poll.
  useEffect(() => {
    const remembered = rememberGoals(
      initiativeBlocks.filter(init => init.name === null).flatMap(init => init.blocks),
    )
    priorGoals.current = remembered
    writeStore(GOAL_MEMORY_KEY, remembered)
  }, [initiativeBlocks])
  // A name the pass proposed for a NEW group can only be spent once that group
  // actually exists on the board (its pairs may have been blocked by a Split pin
  // or the same-session guard, in which case the name must not land anywhere).
  useEffect(() => {
    if (pendingNames.current.length === 0) return
    const looseBlocks = initiativeBlocks
      .filter(init => init.name === null)
      .flatMap(init => init.blocks)
    const resolved: Record<string, string> = {}
    const remaining: { ids: string[]; name: string }[] = []
    for (const entry of pendingNames.current) {
      const block = looseBlocks.find(candidate => candidate.items.length > 1
        && entry.ids.filter(id => candidate.items.some(item => item.id === id)).length >= 2)
      if (block) resolved[block.key] = entry.name
      else remaining.push(entry)
    }
    pendingNames.current = remaining
    if (Object.keys(resolved).length > 0) {
      setGoalNames(prev => {
        const merged = { ...prev, ...resolved }
        writeStore(GOAL_NAMES_KEY, merged)
        return merged
      })
    }
  }, [initiativeBlocks])
  /*
   * Stages 4–5, the semantic pass: ONE scoped model call over what deterministic
   * clustering left ungrouped or unnamed — never over the whole board. It is
   * assignment-framed on the backend (assign each loose item to an existing
   * cluster, propose a new group, or omit it when unsure), so the deterministic
   * stages' work is never overwritten; assignments under the confidence floor
   * are dropped, so an unsure item stays honestly ungrouped rather than
   * misfiled. Named initiative buckets are the user's own map and are not sent.
   */
  useEffect(() => {
    const loose = initiativeBlocks
      .filter(init => init.name === null)
      .flatMap(init => init.blocks)
    const clusters = loose.filter(block => block.items.length > 1).map(block => ({
      key: block.key,
      // A cluster counts as "named" ONLY when the MODEL has named it — a sticky
      // outcome title. A deterministic goalName() (a shared PR ref like
      // "github #6", or the words the titles happen to share) is a display
      // PLACEHOLDER, not a name, so it must NOT suppress the naming pass: send
      // null and let the model write an outcome title. Once the model name is
      // stored it is sent back here as the name, so the model is never asked to
      // rename it — that is the stickiness the user asked for.
      name: goalNames[block.key] ?? null,
      items: block.items.map(item => ({ id: item.id, title: item.title })),
    }))
    const ungrouped = loose.filter(block => block.items.length === 1).map(block => ({
      id: block.items[0].id,
      title: block.items[0].title,
      detail: block.items[0].summary ?? '',
    }))
    // Nothing to assign and nothing to name: no call to make.
    if (ungrouped.length === 0 && clusters.every(cluster => cluster.name)) return
    // The stamp is the QUESTION being asked. An unchanged question keeps its
    // cached answer — including "unavailable", so a gateway without the route
    // is not retried every poll. A changed board asks again.
    const stamp = JSON.stringify([
      clusters.map(cluster => [cluster.key, cluster.name]),
      ungrouped.map(entry => entry.id).sort(),
    ])
    if (stamp === semantic.stamp || passBusy.current) return
    passBusy.current = true
    void (async () => {
      try {
        const payload = await apiRef.current.post<GoalPassResponse>(
          '/api/apps/crew-manager/goal-pass',
          { clusters, ungrouped },
        )
        // NOTE: do NOT cancel this on re-render. initiativeBlocks gets a fresh
        // reference on every board poll (sources -> derived -> items), so a
        // per-render `cancelled` flag flipped by effect cleanup would discard
        // EVERY in-flight pass — the poll cadence always beats the several-second
        // model call, so the names would never land. Applying a slightly-stale
        // result is safe: pairs key on stable item ids, names on stable goal keys
        // (reconcileGoalKeys). Only bail if the component unmounted.
        if (!mountedRef.current) return
        if (!payload?.available) {
          setSemantic(prev => persistSemantic({ pairs: prev.pairs, why: prev.why, stamp }))
          return
        }
        const itemById = new Map<string, WorkItem>()
        for (const block of loose) for (const item of block.items) itemById.set(item.id, item)
        const blockByKey = new Map(loose.map(block => [block.key, block]))
        const pairs = new Set(semantic.pairs)
        const why = new Map(semantic.why)
        const newGroups = new Map<string, WorkItem[]>()
        const whyByItem = new Map<string, string>()
        for (const entry of payload.assignments ?? []) {
          if ((entry.confidence ?? 0) < SEMANTIC_CONFIDENCE_FLOOR) continue
          const item = entry.item_id ? itemById.get(entry.item_id) : undefined
          // The model may merge items WITHIN one session as well as across them:
          // several intents in one session are often one piece of work. The
          // deterministic stages still keep same-session items apart on their
          // own — only an explicit model pair overrules that (see clusterByGoal).
          if (!item?.sessionKey || !entry.cluster) continue
          if (entry.cluster.startsWith('existing:')) {
            const block = blockByKey.get(entry.cluster.slice('existing:'.length))
            const partner = block?.items.find(member => member.id !== item.id)
            if (!partner) continue
            const pair = goalPairKey(item, partner)
            pairs.add(pair)
            if (entry.why) why.set(pair, entry.why)
          } else if (entry.cluster.startsWith('new:')) {
            const group = newGroups.get(entry.cluster) ?? []
            group.push(item)
            newGroups.set(entry.cluster, group)
            if (entry.why) whyByItem.set(item.id, entry.why)
          }
        }
        const namesByCluster = new Map<string, string>()
        for (const entry of payload.names ?? []) {
          if (entry.cluster && entry.name) namesByCluster.set(entry.cluster, entry.name)
        }
        const proposed: { ids: string[]; name: string }[] = []
        for (const [label, members] of newGroups) {
          if (members.length < 2) continue
          for (let i = 0; i < members.length; i += 1) {
            for (let j = i + 1; j < members.length; j += 1) {
              const pair = goalPairKey(members[i], members[j])
              pairs.add(pair)
              const reason = whyByItem.get(members[i].id) ?? whyByItem.get(members[j].id)
              if (reason) why.set(pair, reason)
            }
          }
          const name = namesByCluster.get(label)
          if (name) proposed.push({ ids: members.map(member => member.id), name })
        }
        pendingNames.current = proposed
        const named: Record<string, string> = {}
        for (const [cluster, name] of namesByCluster) {
          if (cluster.startsWith('new:')) continue
          if (cluster.startsWith('item:')) {
            // A solo item the model left ungrouped but still named. Store the
            // name under the SAME `item:<id>` key (NOT the block key): a lone
            // block's intrinsic key is `goal:<min-member-id>`, which collides
            // with a merged block sharing that member -- so a merged card's name
            // would leak onto the member's lone card after a Split. The item: key
            // is a separate namespace from cluster (`goal:...`) keys.
            // STICKINESS: a solo item is re-sent nameless every pass, so only
            // take the FIRST model name -- never overwrite one already stored.
            if (!goalNames[cluster] && itemById.has(cluster.slice('item:'.length))) {
              named[cluster] = name
            }
          } else if (blockByKey.has(cluster)) {
            named[cluster] = name
          }
        }
        if (Object.keys(named).length > 0) {
          setGoalNames(prev => {
            const merged = { ...prev, ...named }
            writeStore(GOAL_NAMES_KEY, merged)
            return merged
          })
        }
        setSemantic(persistSemantic({ pairs, why, stamp }))
      } catch {
        // Degrade silently: deterministic grouping stands, and the stamp is NOT
        // recorded, so a transient failure retries on the next poll.
      } finally {
        passBusy.current = false
      }
    })()
  }, [initiativeBlocks, goalNames, semantic])
  // Re-derived each render: a poll can reshape the clusters, and a quote must
  // describe the board as it is now, not as it was when clicked.
  const selectedGoal = useMemo(() => {
    if (!selectedGoalKey) return null
    for (const init of initiativeBlocks) {
      const block = init.blocks.find(candidate => candidate.key === selectedGoalKey)
      if (block && block.items.length > 0) return block
    }
    return null
  }, [selectedGoalKey, initiativeBlocks])
  const goalTarget = selectedGoal ? goalRouteTarget(selectedGoal.items) : null

  // The quoted PR block, re-resolved each render like selectedGoal so it tracks
  // the live board. A PR is a reference, not a session, so it routes to the
  // Conductor as context rather than to a member session.
  const selectedPr = useMemo(() => {
    if (!selectedPrKey) return null
    const block = clusterBy(items, 'pr', goalVerdicts)
      .find(candidate => candidate.key === selectedPrKey && candidate.header === 'pr')
    return block && block.changeRef ? block : null
  }, [selectedPrKey, items, goalVerdicts])

  /*
   * Kiro Crew's Loops, attributed to the goal that owns them. A loop is keyed by
   * SLOT, and a goal holds work items that each carry a sessionKey, so the join
   * is slot_key -> sessionKey -> goal. Nothing is invented: a loop with no
   * matching member session simply lists under its own session name.
   */
  const loopRows = useMemo(() => {
    // Reads the SAME payload the board already fetched for its loop rows, so the
    // card costs no extra request and can never disagree with them. Inactive
    // loops are dropped: one that hit max_cycles must leave no residue here.
    const live = (sources?.loops ?? []).filter(loop => loop && loop.active !== false && loop.slot_key)
    if (live.length === 0) return []
    const labelFor = new Map<string, string>()
    const goalFor = new Map<string, string>()
    for (const item of items) {
      for (const ref of item.references) {
        if (ref.kind !== 'session' || !ref.id) continue
        if (ref.label && !labelFor.has(ref.id)) labelFor.set(ref.id, ref.label)
      }
    }
    for (const init of initiativeBlocks) {
      if (!init.name) continue
      for (const block of init.blocks) {
        for (const item of block.items) {
          if (item.sessionKey && !goalFor.has(item.sessionKey)) goalFor.set(item.sessionKey, init.name)
        }
      }
    }
    return live.map(loop => {
      const cycles = Number(loop.cycle_count) || 0
      const max = Number(loop.max_cycles) || 0
      return {
        key: loop.slot_key,
        // A loop carries no name of its own, so the session it drives names it.
        title: labelFor.get(loop.slot_key) ?? loop.slot_key,
        goalName: goalFor.get(loop.slot_key) ?? null,
        // max_cycles 0 means unlimited — a fraction would be a lie there.
        progress: max > 0 ? `${cycles}/${max}` : `${cycles} ${cycles === 1 ? 'cycle' : 'cycles'}`,
        remaining: max > 0 ? Math.max(0, max - cycles) : null,
        instruction: (loop.message ?? '').replace(/\s+/g, ' ').trim(),
        lastFire: epoch(loop.last_fire_ts),
      }
    })
  }, [sources, items, initiativeBlocks])

  /*
   * Today's scheduled work. Two different questions, two different sources: what
   * ALREADY RAN comes from run history (a job's own last_run_ts records only its
   * most recent fire, so an every-4-hours job would undercount), and what is
   * STILL COMING comes from each job's computed next_run_ts.
   */
  const cronToday = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const dayStart = start.getTime()
    const dayEnd = dayStart + 86_400_000
    const jobs = sources?.crons ?? []
    const ranByJob = new Map<string, { count: number; failed: number; last: number }>()
    for (const run of cronRuns) {
      const started = epoch(run.started_at)
      if (!run.job_id || started < dayStart || started >= dayEnd) continue
      const seen = ranByJob.get(run.job_id) ?? { count: 0, failed: 0, last: 0 }
      seen.count += 1
      if (run.status && run.status !== 'success') seen.failed += 1
      seen.last = Math.max(seen.last, started)
      ranByJob.set(run.job_id, seen)
    }
    const rows = jobs.map(job => {
      const ran = ranByJob.get(job.id)
      const next = epoch(job.next_run_ts)
      const dueToday = next >= dayStart && next < dayEnd
      return { job, ran, next, dueToday }
    // A job with nothing today is not today's business; the Schedule page owns
    // the full list.
    }).filter(row => row.ran || row.dueToday || row.job.is_running)
    const done = rows.filter(row => row.ran && row.ran.failed === 0).length
    const failed = rows.filter(row => row.ran && row.ran.failed > 0).length
    return { rows, done, failed, total: rows.length, historyKnown: cronRuns.length > 0 }
  }, [sources, cronRuns])

  const [addingGoal, setAddingGoal] = useState(false)
  const goalCandidates = useMemo(() => {
    if (groupBy !== 'goal') return []
    // Two suggestion sources, merged: project dirs sessions run in, and
    // phrases recurring across unbucketed titles. Dedupe by name.
    const fromDirs = initiativeCandidates(sources?.slots ?? [], initiatives)
    const fromTitles = suggestGoalNames(items, initiatives)
    const seen = new Set<string>()
    const merged: { name: string; sessions: number }[] = []
    for (const entry of [...fromTitles, ...fromDirs]) {
      if (seen.has(entry.name.toLowerCase())) continue
      seen.add(entry.name.toLowerCase())
      merged.push(entry)
    }
    return merged.sort((a, b) => b.sessions - a.sessions)
  }, [groupBy, sources, items, initiatives])
  const renameSession = useCallback(async (sessionKey: string, title: string) => {
    try {
      await apiRef.current.patch(`/api/chat/slots/${encodeURIComponent(sessionKey)}/title`, { title })
      void loadSources()
    } catch {
      // The hint stays visible on failure, so the affordance is retryable.
    }
  }, [loadSources])

  const addInitiative = useCallback(async (name: string, aliases: string[] = []) => {
    if (!name.trim()) return
    setAddingGoal(true)
    try {
      const payload = await apiRef.current.post<{ initiatives?: Initiative[] }>(
        '/api/apps/crew-manager/initiatives',
        { name: name.trim(), aliases },
      )
      if (mountedRef.current && payload?.initiatives) {
        setInitiatives(payload.initiatives.filter(bucket => bucket?.name))
      }
    } catch {
      // Gateway without the write route: the panel simply stays.
    } finally {
      if (mountedRef.current) setAddingGoal(false)
    }
  }, [])

  const resolvePermission = useCallback(async (id: string, approve: boolean) => {
    if (resolvingApproval) return
    setResolvingApproval(id)
    setConductorError(null)
    try {
      await apiRef.current.post(`/api/approvals/${encodeURIComponent(id)}/${approve ? 'approve' : 'reject'}`, {})
      void loadSources()
    } catch (error) {
      // A resolved or expired approval answers 404. Saying so beats a dead button.
      setConductorError(
        error instanceof Error
          ? `Could not answer that request: ${error.message}`
          : 'Could not answer that request',
      )
      void loadSources()
    } finally {
      if (mountedRef.current) setResolvingApproval(null)
    }
  }, [loadSources, resolvingApproval])

  // The formal card's decisions. Routed through the SLOT approve endpoint — the
  // only one that can express trust; the /api/approvals path would silently
  // downgrade a Trust click to a one-shot approve.
  const decideApproval = useCallback(async (item: WorkItem, action: string) => {
    if (resolvingApproval || !item.permissionId || !item.sessionKey) return
    setResolvingApproval(item.permissionId)
    setConductorError(null)
    try {
      await apiRef.current.post(`/api/chat/slots/${encodeURIComponent(item.sessionKey)}/approve`, {
        action,
        request_id: item.permissionId,
      })
      // Keep the card selected and in place: the item's state updates on the
      // next poll, and yanking the card out from under the click reads as loss.
      void loadSources()
    } catch (error) {
      setConductorError(
        error instanceof Error
          ? `Could not answer that request: ${error.message}`
          : 'Could not answer that request',
      )
      void loadSources()
    } finally {
      if (mountedRef.current) setResolvingApproval(null)
    }
  }, [loadSources, resolvingApproval])

  const snoozeItem = useCallback((id: string) => {
    setSnoozed(current => {
      // Expired entries are pruned on write so the store cannot grow forever.
      const next = Object.fromEntries(Object.entries(current).filter(([, until]) => until > Date.now()))
      next[id] = Date.now() + SNOOZE_MS
      writeStore(SNOOZE_KEY, next)
      return next
    })
    setSelectedId(null)
  }, [])

  const markHandled = useCallback((id: string, updatedAt: number) => {
    setHandled(current => {
      const next = { ...current, [id]: updatedAt }
      writeStore(HANDLED_KEY, next)
      return next
    })
    setSelectedId(null)
  }, [])

  const restoreSnoozed = useCallback(() => {
    setSnoozed({})
    writeStore(SNOOZE_KEY, {})
  }, [])

  // A ruling in one direction erases the opposite one, so the last call wins.
  const splitGoal = useCallback((pairs: string[]) => {
    setGoalVerdicts(current => {
      const next: GoalVerdicts = {
        merged: current.merged.filter(key => !pairs.includes(key)),
        split: [...new Set([...current.split, ...pairs])],
      }
      writeStore(GOAL_VERDICTS_KEY, next)
      return next
    })
  }, [])

  const mergeGoal = useCallback((pair: string) => {
    setGoalVerdicts(current => {
      const next: GoalVerdicts = {
        merged: [...new Set([...current.merged, pair])],
        split: current.split.filter(key => key !== pair),
      }
      writeStore(GOAL_VERDICTS_KEY, next)
      return next
    })
  }, [])

  const toggleDone = useCallback(() => {
    setDoneCollapsed(current => {
      writeStore(DONE_COLLAPSED_KEY, !current)
      return !current
    })
  }, [])

  const retryRun = useCallback(async (path: string) => {
    if (retrying) return
    setRetrying(path)
    setConductorError(null)
    try {
      await apiRef.current.post(path, {})
      void loadSources()
    } catch (error) {
      // 409 means it is no longer retryable — running again, or stopped on
      // purpose. Saying so beats a button that looks broken.
      setConductorError(
        error instanceof Error ? `Could not re-run it: ${error.message}` : 'Could not re-run it',
      )
      void loadSources()
    } finally {
      if (mountedRef.current) setRetrying(null)
    }
  }, [loadSources, retrying])

  const stopLoop = useCallback(async (path: string) => {
    if (stopping) return
    setStopping(path)
    setConductorError(null)
    try {
      await apiRef.current.del(path)
      // Stopping is not undoable from here, so it gets the same treatment as a
      // delivered instruction: a stated outcome, not just a row that vanishes on
      // the next poll. A silent disappearance is indistinguishable from a
      // rendering glitch, and the user cannot re-arm the loop from this app.
      setDeliveryReceipt('Stopped the monitor loop. Re-arming it is done from the session itself.')
      void loadSources()
    } catch (error) {
      // A loop that already ended on its own answers 404. That is the outcome the
      // user wanted, so it must not read as a failure.
      const message = error instanceof Error ? error.message : ''
      if (/404|not found/i.test(message)) {
        setDeliveryReceipt('That loop had already stopped.')
      } else {
        setConductorError(message ? `Could not stop it: ${message}` : 'Could not stop it')
      }
      void loadSources()
    } finally {
      if (mountedRef.current) setStopping(null)
    }
  }, [loadSources, stopping])

  /**
   * The one composer, routed. A quoted item's message is an instruction to that
   * session; anything else talks to the Conductor, whose transcript the embed
   * shows. ChatEmbed owns the optimistic echo and polling, so we only deliver.
   */
  const handleConductorSend = useCallback(async (message: string) => {
    // A quoted PR is a reference, not a session: it has no single slot to route
    // to, and its work may be done. So the instruction talks to the Conductor,
    // with the PR (and the sessions that produced it) injected as context.
    if (selectedPr && selectedPr.changeRef) {
      const ref = selectedPr.changeRef
      const sessions = rollUpSessions(selectedPr.items)
      const context = [
        `Crew Manager: this concerns the pull request ${ref.label}${ref.url ? ` (${ref.url})` : ''}.`,
        sessions.length
          ? `Sessions that produced it:\n${sessions.map(session => `- ${session.label}`).join('\n')}`
          : undefined,
        'Advise on it — you cannot merge or push, so recommend the session that should act rather than acting.',
      ].filter(Boolean).join('\n')
      await apiRef.current.post(`/api/chat/slots/${encodeURIComponent(CONDUCTOR_SLOT)}/context`, {
        content: context,
        source: 'crew-manager',
        ephemeral: true,
      }).catch(() => { /* context is best-effort */ })
      await apiRef.current.post('/api/chat', { message, slot: CONDUCTOR_SLOT }).catch(error => {
        if (!(error instanceof SyntaxError)) throw error
      })
      if (!mountedRef.current) return
      setDeliveryReceipt(`Asked the Conductor about ${ref.label}`)
      setSelectedPrKey(null)
      return
    }
    // A quoted GOAL routes to the session actively on it — it already holds the
    // context. Never broadcast: duplicated instructions are the duplicated work
    // this view exists to prevent. The quote bar shows the target before send.
    if (selectedGoal && goalTarget?.sessionKey) {
      const slot = goalTarget.sessionKey
      const members = selectedGoal.items
        .map(item => `- ${item.references.find(ref => ref.kind === 'session')?.label ?? item.sessionKey}: ${stateLabels[item.state]}`)
        .join('\n')
      await apiRef.current.post(`/api/chat/slots/${encodeURIComponent(slot)}/context`, {
        content: [
          `Crew Manager: this instruction concerns the goal "${selectedGoal.items[0].title}", which spans sessions:`,
          members,
          'You are the session actively on it, so the instruction is routed to you. Do not duplicate work already done in the other sessions.',
        ].join('\n'),
        source: 'crew-manager',
        ephemeral: true,
      }).catch(() => { /* context is best-effort */ })
      await apiRef.current.post('/api/chat', { message, slot }).catch(error => {
        if (!(error instanceof SyntaxError)) throw error
      })
      if (!mountedRef.current) return
      setInstructed(current => ({ ...current, [goalTarget.id]: Date.now() }))
      setWatchedSessions(current => (current.includes(slot) ? current : [...current, slot]))
      const label = goalTarget.references.find(ref => ref.kind === 'session')?.label ?? goalTarget.title
      setDeliveryReceipt(goalTarget.moving || goalTarget.state === 'running'
        ? `Sent to ${label} — the active session on this goal`
        : `Sent to ${label} — resuming the last session on this goal`)
      setSelectedGoalKey(null)
      void loadSources()
      return
    }
    const target = selected && !selected.permissionId ? selected : null
    if (scope === 'session' && target?.sessionKey) {
      const slot = target.sessionKey
      await apiRef.current.post('/api/chat', { message, slot }).catch(error => {
        if (!(error instanceof SyntaxError)) throw error
      })
      if (!mountedRef.current) return
      setInstructed(current => ({ ...current, [target.id]: Date.now() }))
      setWatchedSessions(current => (current.includes(slot) ? current : [...current, slot]))
      setDeliveryReceipt(`Sent new instructions to ${target.title}`)
      setSelectedId(null)
      void loadSources()
      return
    }
    // Talk to the Conductor: inject the fleet context, then post to its slot.
    await apiRef.current.post(`/api/chat/slots/${encodeURIComponent(CONDUCTOR_SLOT)}/context`, {
      content: contextMessage(
        selected,
        items,
        noticedSinceLastTurn(stallReport, conductorSlot?.last_ts),
      ),
      source: 'crew-manager',
      ephemeral: true,
    }).catch(() => { /* context is best-effort */ })
    await apiRef.current.post('/api/chat', { message, slot: CONDUCTOR_SLOT }).catch(error => {
      if (!(error instanceof SyntaxError)) throw error
    })
  }, [selected, selectedPr, selectedGoal, goalTarget, items, loadSources, scope])

  const grouped: Record<WorkState, WorkItem[]> = {
    'needs-you': sessionItems.filter(item => item.state === 'needs-you'),
    running: sessionItems.filter(item => item.state === 'running'),
    done: sessionItems.filter(item => item.state === 'done'),
  }

  const toggleInitiative = useCallback((key: string, next: boolean) => {
    setCollapsedInitiatives(current => {
      const updated = { ...current, [key]: next }
      writeStore(INITIATIVE_COLLAPSED_KEY, updated)
      return updated
    })
  }, [])

  const selectGoal = useCallback((key: string) => {
    setSelectedGoalKey(current => (current === key ? null : key))
    setSelectedId(null)
    setSelectedPrKey(null)
    setDeliveryReceipt(null)
  }, [])
  const selectPr = useCallback((key: string) => {
    // Selection is a mode you can leave from the same place you entered it.
    setSelectedPrKey(current => (current === key ? null : key))
    setSelectedId(null)
    setSelectedGoalKey(null)
    setDeliveryReceipt(null)
  }, [])
  const openSession = (slot: string) => navigate(`/chat?sid=${encodeURIComponent(slot)}`)
  const selectItem = (item: WorkItem) => {
    // Clicking the selected card again deselects it — selection is a mode, and a
    // mode you can enter but not leave from the same place is a trap.
    setSelectedId(current => (current === item.id ? null : item.id))
    setSelectedGoalKey(null)
    setSelectedPrKey(null)
    setDeliveryReceipt(null)
    setScope('session')
  }

  // The Conductor's docked quote/reference bar, rendered THROUGH ChatEmbed's
  // aboveComposer slot so it sits in normal flow directly on top of the composer,
  // whatever the composer's height — no brittle absolute offset to keep in sync.
  const conductorQuote = selectedPr ? (
    <div className="ow-quote ow-quote-docked">
      <div className="ow-quote-body ow-quote-goal">
        <div className="ow-quote-line">
          <span className="ow-eyebrow">Asking about PR</span>
          <span className="ow-quote-title" title={selectedPr.changeRef?.label}>{selectedPr.changeRef?.label?.replace(/^github\s*/, '')}</span>
        </div>
        <span className="ow-quote-route ow-truncate">→ Conductor</span>
      </div>
      <Btn
        className="ow-quote-clear"
        aria-label="Remove the quoted PR"
        onClick={() => { setSelectedPrKey(null); setDeliveryReceipt(null) }}
      >
        Clear
      </Btn>
    </div>
  ) : selectedGoal && goalTarget ? (
    <div className="ow-quote ow-quote-docked">
      <div className="ow-quote-body ow-quote-goal">
        <div className="ow-quote-line">
          <span className="ow-eyebrow">Instructing goal</span>
          <span className="ow-quote-title" title={selectedGoal.items[0].title}>{selectedGoal.items[0].title}</span>
        </div>
        {/* Name the routing target BEFORE send — visibility is the confirmation. */}
        <span className="ow-quote-route ow-truncate">
          → {goalTarget.references.find(ref => ref.kind === 'session')?.label ?? goalTarget.title}
          {goalTarget.moving || goalTarget.state === 'running' ? ' (active)' : ' (will resume)'}
        </span>
      </div>
      <Btn
        className="ow-quote-clear"
        aria-label="Remove the quoted goal"
        onClick={() => { setSelectedGoalKey(null); setDeliveryReceipt(null) }}
      >
        Clear
      </Btn>
    </div>
  ) : quoted ? (
    <div className="ow-quote ow-quote-docked">
      <div className="ow-quote-body">
        {quoted.sessionKey ? (
          // The destination is a toggle, not an inference: text names the active
          // target, click switches it. No session means Conductor only.
          <button
            type="button"
            className="ow-scope-toggle"
            aria-pressed={scope === 'conductor'}
            aria-label={scope === 'session'
              ? 'Sending to this session. Activate to send to the Conductor instead.'
              : 'Sending to the Conductor. Activate to send to this session instead.'}
            onClick={() => setScope(current => (current === 'session' ? 'conductor' : 'session'))}
          >
            {scope === 'session' ? 'Instructing' : 'To Conductor'}
          </button>
        ) : (
          <span className="ow-eyebrow">Quoted</span>
        )}
        <span className="ow-quote-title" title={quoted.title}>{quoted.title}</span>
      </div>
      <Btn
        className="ow-quote-clear"
        aria-label="Remove the quoted work item"
        onClick={() => { setSelectedId(null); setDeliveryReceipt(null) }}
      >
        Clear
      </Btn>
    </div>
  ) : null

  return (
    <div className="ow-root" data-crew-manager-shell="quiet-split">
      <style>{OVERWATCH_STYLES}</style>
      <div className="ow-titlebar">
        {/* Beta pill inline with the name so the two read as one label. */}
        <PageHeader
          title={<span className="ow-title-line">Crew Manager<span className="ow-beta" aria-label="Beta preview">Beta</span></span>}
          subtitle="See what needs your input, what is still running, and what finished recently."
        />
      </div>
      <div className="ow-body">
        <div
          className="ow-layout"
          ref={layoutRef}
          style={panelW.conductor != null ? ({ '--ow-conductor-w': `${panelW.conductor}px` } as CSSProperties) : undefined}
        >
          <div
            className="ow-main"
            data-open-row={openRow}
            ref={mainRef}
            style={panelW.work != null ? ({ '--ow-work-w': `${panelW.work}px` } as CSSProperties) : undefined}
          >
            <details {...panelShell('work')} aria-label="Work">
              {/* Goals and Sessions were the Group by rail's first two modes.
                  They are the same two lenses, promoted to the card's own header
                  row — the third (PR) is the utility rail's PRs card now. When
                  Work is demoted the tabs give way to a plain label, because a
                  collapsed card has no list for them to switch. */}
              <summary onClick={event => { event.preventDefault(); if (primary !== 'work') toggleStack('work') }}>
                <span className="ow-stack-title">
                  <ChevronRight className="ow-icon ow-stack-chevron" />
                  <Users className="ow-icon" />
                  {primary === 'work'
                    ? (
                      <span className="ow-tabs" role="tablist" aria-label="View">
                        {(['goal', 'session'] as GroupMode[]).map(mode => (
                          <Btn
                            key={mode}
                            role="tab"
                            aria-selected={groupBy === mode}
                            data-selected={groupBy === mode}
                            className="ow-tab"
                            onClick={() => setGroupBy(mode)}
                          >
                            {mode === 'goal' ? 'Goals' : 'Sessions'}
                          </Btn>
                        ))}
                      </span>
                    )
                    : PANEL_LABELS.work}
                </span>
                <span className="ow-stack-actions">
                  <Badge variant="muted">{counts.all}</Badge>
                  {primary === 'work' ? <BoardFreshness lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={refreshSources} /> : <MakePrimary id="work" onPromote={promote} />}
                </span>
              </summary>
                <div className="ow-listcard-tools">
                  <p className="ow-listcard-sub">
                    {groupBy === 'goal'
                      ? 'Sessions consolidated by the goal or topic they share'
                      : 'Grouped by what each session needs from you'}
                  </p>
                  {/* Sessions only. A goal card spans states, so a state filter
                      there would be a control that does nothing. */}
                  {groupBy === 'session' && (
                    <div className="ow-filters" role="group" aria-label="Filter by state">
                      {(Object.keys(filterLabels) as FilterKey[]).map(key => (
                        <Btn
                          key={key}
                          onClick={() => setFilter(key)}
                          aria-pressed={filter === key}
                          data-selected={filter === key}
                          className="ow-filter"
                        >
                          {filterLabels[key]}
                          <span className="ow-count">{counts[key]}</span>
                        </Btn>
                      ))}
                    </div>
                  )}
                </div>

              <main className="ow-work">
                <div className="ow-work-inner">
              {sourcesLoading
                ? <ContentSkeleton rows={7} />
                : sourcesError && !sources
                  ? (
                    <EmptyState
                      icon={<AlertCircle className="ow-icon" />}
                      title="Crew Manager could not load the work view"
                      subtitle={sourcesError.message}
                      action={<Btn onClick={retrySources}>Try again</Btn>}
                    />
                  )
                  : (groupBy === 'goal' ? items.length === 0 : sessionItems.length === 0)
                    ? (
                      <EmptyState
                        icon={<Search className="ow-icon" />}
                        title="No matching work"
                        subtitle={groupBy === 'goal'
                          ? 'No sessions are running yet.'
                          : 'Change the filter to see sessions in another state.'}
                      />
                    )
                    /* Tab first, THEN the filter. The state filter is a Sessions
                       control, so the Goals branch never reads it. */
                    : groupBy === 'goal'
                      ? (
                        (
                          // Goal-primary: one list, a goal card spans states and
                          // sessions — "S1 is on it, S2 left it open" is one thing.
                          <WorkSection
                            title="Work by goal"
                            hideHeader
                            items={items}
                            selectedId={selectedId}
                            onSelect={selectItem}
                            onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                onDecideApproval={(item, action) => { void decideApproval(item, action) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onPickStep={what => { void handleConductorSend(what) }}
                            groupBy={groupBy}
                            goalVerdicts={goalVerdicts}
                            onSplitGoal={splitGoal}
                            onMergeGoal={mergeGoal}
                            initiativeBlocks={initiativeBlocks}
                            initiatives={initiatives}
                            onRenameSession={(key, title) => { void renameSession(key, title) }}
                            semanticWhy={semantic.why}
                            goalNames={goalNames}
                            collapsedInitiatives={collapsedInitiatives}
                            onToggleInitiative={toggleInitiative}
                            selectedGoalKey={selectedGoalKey}
                            onSelectGoal={selectGoal}
                            footer={
                              <GoalBootstrap
                                candidates={goalCandidates}
                                prominent={initiatives.length === 0}
                                busy={addingGoal}
                                onAdd={(name, aliases) => { void addInitiative(name, aliases) }}
                              />
                            }
                            emptyLabel="No matching work"
                          />
                        )
                      )
                      : filter === 'all'
                        ? (
                        <>
                          <WorkSection
                            title="Needs you"
                            subtitle="Waiting on a decision or reply from you"
                            items={grouped['needs-you']}
                            doneBySession={doneBySession}
                            selectedId={selectedId}
                            onSelect={selectItem}
                            onSnooze={snoozeItem}
                            onHandled={markHandled}
                            footer={setAside.snoozedCount > 0
                              ? (
                                <button type="button" className="ow-aside-note" onClick={restoreSnoozed}>
                                  {setAside.snoozedCount} set aside for later — bring back
                                </button>
                              )
                              : undefined}
                            onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                onDecideApproval={(item, action) => { void decideApproval(item, action) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onStop={path => { void stopLoop(path) }}
                stopBusy={stopping !== null}
                onPickStep={what => { void handleConductorSend(what) }}
                            collapsedInitiatives={collapsedInitiatives}
                            onToggleInitiative={toggleInitiative}
                            groupBy={groupBy}
                            emptyLabel="Nothing needs your input right now."
                          />
                          <WorkSection
                            title="In progress"
                            subtitle="Being worked on right now"
                            items={grouped.running}
                            doneBySession={doneBySession}
                            selectedId={selectedId}
                            onSelect={selectItem}
                            onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                onDecideApproval={(item, action) => { void decideApproval(item, action) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onStop={path => { void stopLoop(path) }}
                stopBusy={stopping !== null}
                onPickStep={what => { void handleConductorSend(what) }}
                            collapsedInitiatives={collapsedInitiatives}
                            onToggleInitiative={toggleInitiative}
                            groupBy={groupBy}
                            emptyLabel="Nothing is in progress right now."
                          />
                          <WorkSection
                            title="Done recently"
                            subtitle="Finished in the last few days"
                            items={grouped.done}
                            selectedId={selectedId}
                            onSelect={selectItem}
                            collapsed={doneCollapsed}
                            onToggleCollapsed={toggleDone}
                            onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                onDecideApproval={(item, action) => { void decideApproval(item, action) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onStop={path => { void stopLoop(path) }}
                stopBusy={stopping !== null}
                onPickStep={what => { void handleConductorSend(what) }}
                            collapsedInitiatives={collapsedInitiatives}
                            onToggleInitiative={toggleInitiative}
                            groupBy={groupBy}
                            emptyLabel="No recent completed work."
                          />
                        </>
                        )
                        : (
                        <WorkSection
                          title={filterLabels[filter]}
                          items={sessionItems}
                          selectedId={selectedId}
                          onSelect={selectItem}
                          onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                onDecideApproval={(item, action) => { void decideApproval(item, action) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onStop={path => { void stopLoop(path) }}
                stopBusy={stopping !== null}
                onPickStep={what => { void handleConductorSend(what) }}
                          collapsedInitiatives={collapsedInitiatives}
                          onToggleInitiative={toggleInitiative}
                          groupBy={groupBy}
                          emptyLabel="No matching work"
                        />
                      )}
                </div>
              </main>
            </details>

            {/* Companion surfaces. None of these is a lens on the work list —
                each is its own kind of thing, so they are peers of Work rather
                than modes of it, and any of them can take column 1. */}
              <details {...panelShell('prs')}>
                <summary onClick={event => { event.preventDefault(); if (primary !== 'prs') toggleStack('prs') }}>
                  <span className="ow-stack-title">
                    <ChevronRight className="ow-icon ow-stack-chevron" />
                    <GitPullRequest className="ow-icon" />
                    PRs
                  </span>
                  <span className="ow-stack-actions">
                    <Badge variant="muted">{prCounts.all}</Badge>
                    {primary === 'prs' ? <BoardFreshness lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={refreshSources} /> : <MakePrimary id="prs" onPromote={promote} />}
                  </span>
                </summary>
                <p className="ow-stack-sub">Pull requests your work touches, and what is holding each one up</p>
                {/* Pinned above the scroller, like the work card's filters: a
                    control that scrolls away from the list it filters is only
                    reachable by scrolling back. */}
                {prCounts.all > 0 && (
                  <div className="ow-pr-tools">
                    <div className="ow-filters" role="group" aria-label="Filter by PR status">
                      {(Object.keys(prFilterLabels) as PrFilterKey[]).map(key => (
                        <Btn
                          key={key}
                          onClick={() => setPrFilter(key)}
                          aria-pressed={prFilter === key}
                          data-selected={prFilter === key}
                          className="ow-filter"
                        >
                          {prFilterLabels[key]}
                          <span className="ow-count">{prCounts[key]}</span>
                        </Btn>
                      ))}
                    </div>
                  </div>
                )}
                <div className="ow-stack-body">
                  {prCounts.all === 0
                    ? (
                      <p className="ow-stack-empty">
                        No work is linked to a PR right now. Work links to one when a session
                        mentions its URL.
                      </p>
                    )
                    : (
                      <>
                        {/* The PR lens itself, unchanged — the same WorkSection the
                            rail used to switch to, rendered in its own card. Reads
                            `items`: this card is not downstream of the Sessions
                            filter, and its own status chips do its narrowing. */}
                        <WorkSection
                          title="Work by PR"
                          hideHeader
                          items={items}
                          prChecks={prChecks}
                          prFilter={prFilter}
                          collapsedInitiatives={collapsedInitiatives}
                          onToggleInitiative={toggleInitiative}
                          selectedId={selectedId}
                          onSelect={selectItem}
                          onOpenSession={openSession}
                          onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                          onDecideApproval={(item, action) => { void decideApproval(item, action) }}
                          permissionBusy={resolvingApproval !== null}
                          onRetry={path => { void retryRun(path) }}
                          retryBusy={retrying !== null}
                          onStop={path => { void stopLoop(path) }}
                          stopBusy={stopping !== null}
                          onPickStep={what => { void handleConductorSend(what) }}
                          selectedPrKey={selectedPrKey}
                          onSelectPr={selectPr}
                          groupBy="pr"
                          emptyLabel="No PR matches that status."
                        />
                      </>
                    )}
                </div>
              </details>

              <details {...panelShell('loops')}>
                <summary onClick={event => { event.preventDefault(); if (primary !== 'loops') toggleStack('loops') }}>
                  <span className="ow-stack-title">
                    <ChevronRight className="ow-icon ow-stack-chevron" />
                    <Radar className="ow-icon" />
                    Loops
                  </span>
                  <span className="ow-stack-actions">
                    <Badge variant="muted">{loopRows.length}</Badge>
                    {primary === 'loops' ? <BoardFreshness lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={refreshSources} /> : <MakePrimary id="loops" onPromote={promote} />}
                  </span>
                </summary>
                <p className="ow-stack-sub">Sessions repeating a goal until it is done</p>
                <div className="ow-stack-body">
                  {loopRows.length === 0
                    ? <p className="ow-stack-empty">No loop is running right now.</p>
                    : loopRows.map(loop => {
                      const since = sinceLabel(loop.lastFire)
                      const when = [
                        since && `last tick ${since}`,
                        loop.remaining !== null && `${loop.remaining} remaining`,
                      ].filter(Boolean).join(' · ')
                      return (
                        <div className="ow-mini" key={loop.key}>
                          <span className="ow-mini-rail" style={{ background: 'var(--warn)' }} />
                          <div>
                            <div className="ow-mini-title">
                              {loop.goalName ?? loop.title}
                              <span className="ow-mini-chip">{loop.progress}</span>
                            </div>
                            {/* The loop's own instruction IS its goal statement —
                                there is no separate description field to show. */}
                            {loop.instruction && (
                              <div className="ow-mini-desc" title={loop.instruction}>{loop.instruction}</div>
                            )}
                            {when && <div className="ow-mini-when">{when}</div>}
                          </div>
                          <Badge variant="ok">Active</Badge>
                        </div>
                      )
                    })}
                </div>
              </details>

              <details {...panelShell('schedule')}>
                <summary onClick={event => { event.preventDefault(); if (primary !== 'schedule') toggleStack('schedule') }}>
                  <span className="ow-stack-title">
                    <ChevronRight className="ow-icon ow-stack-chevron" />
                    <Clock3 className="ow-icon" />
                    Scheduled tasks
                  </span>
                  <span className="ow-stack-actions">
                    <Badge variant={cronToday.failed > 0 ? 'err' : 'muted'}>
                      {cronToday.done}/{cronToday.total} today
                    </Badge>
                    {primary === 'schedule' ? <BoardFreshness lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={refreshSources} /> : <MakePrimary id="schedule" onPromote={promote} />}
                  </span>
                </summary>
                <p className="ow-stack-sub">
                  {cronToday.historyKnown
                    ? "Today's runs only — jobs with nothing scheduled today are hidden"
                    : 'Run history is unavailable, so completed counts may be low'}
                </p>
                <div className="ow-stack-body">
                  {cronToday.rows.length === 0
                    ? <p className="ow-stack-empty">Nothing is scheduled for today.</p>
                    : cronToday.rows.map(({ job, ran, next, dueToday }) => {
                      const failed = Boolean(ran && ran.failed > 0)
                      const when = [
                        ran && `ran today ${clockLabel(ran.last)}${ran.count > 1 ? ` (${ran.count}x)` : ''}`,
                        dueToday && next ? `next ${clockLabel(next)}` : null,
                      ].filter(Boolean).join(' · ')
                      return (
                        <div className="ow-mini" key={job.id}>
                          <span
                            className="ow-mini-rail"
                            style={{ background: failed ? 'var(--danger)' : job.enabled === false ? 'var(--muted)' : 'var(--warn)' }}
                          />
                          <div>
                            <div className="ow-mini-title">{job.name}</div>
                            {job.schedule && (
                              <div className="ow-mini-desc">
                                {job.schedule}
                                {job.cron_expr && <span className="ow-mini-chip">{job.cron_expr}</span>}
                              </div>
                            )}
                            {when && <div className="ow-mini-when">{when}</div>}
                          </div>
                          {job.is_running
                            ? <Badge variant="aim">Running</Badge>
                            : failed
                              ? <Badge variant="err">Failed</Badge>
                              : job.enabled === false
                                ? <Badge variant="muted">Paused</Badge>
                                : ran
                                  ? <Badge variant="ok">Success</Badge>
                                  : <Badge variant="warn">Pending</Badge>}
                        </div>
                      )
                    })}
                </div>
              </details>
            <ColumnResizer
              side="start"
              containerRef={mainRef}
              min={COLW.workMin}
              reserve={COLW.railReserve}
              max={Infinity}
              value={panelW.work}
              onChange={px => setPanelW(p => ({ ...p, work: px }))}
              label="Resize the work column"
            />
          </div>

          <ColumnResizer
            side="end"
            containerRef={layoutRef}
            min={COLW.conductorMin}
            reserve={COLW.mainReserve}
            max={COLW.conductorMax}
            value={panelW.conductor}
            onChange={px => setPanelW(p => ({ ...p, conductor: px }))}
            label="Resize the Conductor panel"
          />

          <aside className="ow-conductor" aria-label="Conductor">
            <div className="ow-conductor-header">
              <div className="ow-conductor-title">
                <h2>Conductor</h2>
                {!quoted && <span className="ow-conductor-sub">select work, or ask across all</span>}
              </div>
            </div>

            <div className="ow-chat">
              {conductorAvailable
                ? (
                  <div className="ow-chat-panel">
                    {/* Permissions and the receipt stay ABOVE the embed — they are
                        alerts that must not scroll away. The instructing target
                        instead DOCKS above the composer (ow-quote-docked, after the
                        embed) because it modifies the message about to be typed. */}
                    {permissions.length > 0 && (
                      <div className="ow-permissions" role="alert">
                        {permissions.map(permission => (
                          <PermissionDecision
                            key={permission.id}
                            tool={permission.tool}
                            purpose={permission.purpose}
                            where={permission.sessionLabel}
                            busy={resolvingApproval !== null}
                            onAnswer={approve => { void resolvePermission(permission.id, approve) }}
                          />
                        ))}
                      </div>
                    )}
                    {deliveryReceipt && (
                      <div className="ow-conductor-receipt" role="status">
                        <CircleCheck className="ow-icon" />{deliveryReceipt}
                      </div>
                    )}
                    {conductorError && <div className="ow-chat-error" role="alert">{conductorError}</div>}
                    {/* Native chat: same rendering, markdown, OPTIONS buttons,
                        streaming and persistence as the main chat. onSend routes a
                        quoted message to that session; otherwise it talks to the
                        Conductor, whose transcript the embed shows. Wrapped so it
                        fills the remaining height and scrolls INSIDE its own box —
                        without this the transcript overflowed and the reference
                        banner above it looked like it floated over the chat. */}
                    <div className="ow-embed">
                    <ChatEmbed
                      slotKey={CONDUCTOR_SLOT}
                      frameless
                      startAtBottom
                      slotControls
                      placeholder={selectedPr
                        ? 'Ask the Conductor about this PR…'
                        : selectedGoal
                          ? 'Instruction for this goal…'
                          : quoted?.sessionKey && scope === 'session' ? 'New instructions for this session…' : 'Ask across your work…'}
                      onSend={handleConductorSend}
                      aboveComposer={conductorQuote}
                    />
                    </div>
                  </div>
                )
                : <div className="ow-chat-loading"><ContentSkeleton rows={4} /></div>}
            </div>

          </aside>
        </div>
      </div>
    </div>
  )
}
