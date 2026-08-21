import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import {
  AlertTriangle as AlertCircle,
  ArrowRight,
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
  SummaryNextStep,
  ErrorLoopFinding,
  StallFinding,
  StallReport,
  AssignedWork,
  AssignedReport,
} from './types'
import {
  applyInstructed,
  clusterBy,
  epoch,
  applySetAside,
  inDoneWindow,
  pendingPermissions,
  responseVerb,
  SNOOZE_MS,
  describeSilence,
  explainRank,
  fleetBriefing,
  goalComposition,
  normalizeWorkItems,
  rankWorkItem,
  workCounts,
  type AgentRow,
  type ApprovalRow,
  type WorkflowRow,
  type WorkCopyKey,
  type InstructedItems,
  type PendingPermission,
  type WorkBlock,
  type WorkItem,
  type WorkReference,
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

/** The three movable panels. Any of them can be the primary; Work has no special
 * status beyond being the default. */
type PanelId = 'work' | 'loops' | 'schedule'

/* Fixed DOM order. Panels are placed by grid coordinates, never by reordering
 * this array in JSX — reordering nodes remounts ChatEmbed and loses the
 * transcript's scroll position and any in-flight stream. */
const PANEL_ORDER: PanelId[] = ['work']

/* Which card inherits the rail's open slot when the open one is promoted. */
const PANEL_PICK_ORDER: PanelId[] = ['work']

const PANEL_LABELS: Record<PanelId, string> = {
  work: 'Sessions',
  loops: 'Loops',
  schedule: 'Scheduled tasks',
}

/* The attributes every panel card carries. Spread onto <details> so the three
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

type FilterKey = 'all' | WorkState | 'follow-up'

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
const OPEN_STACK_KEY = 'crew-manager.stack-open-v2'
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
 * The one-line "what this card is made of" meta, e.g.
 * "3 PRs · last active 2h ago". Built from goalComposition, which counts only
 * members that actually exist — no start date is invented (the model has no
 * per-card creation stamp), so it reports last activity instead.
 */
function goalMetaLine(items: WorkItem[], now: number = Date.now(), omitSessions = false, omitRefs = false): string {
  const c = goalComposition(items)
  const parts = [
    // A session card's meta would always open with "1 session" — say nothing
    // there instead of stating the card's own subject back at the reader.
    omitSessions ? null : countPart(c.sessions, 'session', 'sessions'),
    omitRefs ? null : countPart(c.prs, 'PR', 'PRs'),
    omitRefs ? null : countPart(c.issues, 'issue', 'issues'),
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
  workflow_fact_last_log: 'Got as far as: {{log}}',
  workflow_fact_phase: 'It was in the {{phase}} phase',
  workflow_fact_error: 'It stopped with: {{error}}',
  workflow_fact_agent_errors: '{{count}} of its agents reported an error',
  workflow_fact_partials: '{{count}} agents finished first, so their output survived',
  workflow_step_diagnose: 'Find out why {{name}} stopped, then re-run it',
  workflow_step_why_error: 'it failed with {{error}}, so re-running it as-is repeats that',
  workflow_step_why_generic: 'it has not been re-run, and nothing says the cause is fixed',
  workflow_step_expect_partials: 'a diagnosis, and {{count}} finished agents worth reusing',
  workflow_step_expect_generic: 'a diagnosis you can act on before spending another run',
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
  related_same_topic: 'similar item',
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
  rank_changes_requested: 'a reviewer asked you for changes',
  rank_assigned_to_you: 'assigned to you and nobody has started it',
  rank_merge_ready: 'approved and green — only you can merge it',
  rank_nobody_on_it: 'nobody is on {{count}} unfinished item(s) in this session',
  no_next_step: 'No next step recorded — nobody is on this',
  // Same-session queue only — the platform does not model one session
  // blocking another, so this must not claim it does.
  rank_queued_behind: '{{count}} more prompt(s) queued in this session',
  rank_waiting_a_while: 'waiting {{hours}}h',
  // Owned work: a pull request you authored, or an issue assigned to you. The
  // summary states what is holding it up, because that is the only part that
  // tells you whether to open it now.
  owned_pull_conflict: 'Your pull request has a conflict to resolve.',
  owned_pull_failing: 'Your pull request has {{count}} failing check(s).',
  owned_pull_changes_requested: 'A reviewer has requested changes on your pull request.',
  owned_pull_merge_ready: 'Approved with nothing red. Only you can merge it.',
  owned_pull_awaiting_review: 'Waiting on reviewers, not on you.',
  owned_pull_checks_running: '{{count}} check(s) still running.',
  owned_issue_assigned: 'Assigned to you.',
  owned_provenance: '{{repo}}',
  rank_nothing_pressing: 'nothing pressing — ordered by recency',
  rank_join: ', and ',
  error_loop: '{{tool}} has failed the same way {{repeats}} times in a row',
  untitled_work: 'Untitled work',
  card_asked_for: 'You asked for',
  card_where_it_stands: 'Where it stands',
  card_suggested_next: 'Suggested next',
  // The platform records ONE turn number per goal (`last_touched_turn`), not a
  // span, so this says "turn 7" and never "turns 2-3".
  card_turn: 'turn {{turn}}',
}

function workCopy(key: WorkCopyKey, values: Record<string, string> = {}): string {
  return WORK_COPY[key].replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name] ?? '')
}

const stateLabels: Record<WorkState, string> = {
  'needs-you': 'Needs you',
  running: 'Running',
  done: 'Done',
}

const filterLabels: Record<FilterKey, string> = {
  all: 'All',
  'needs-you': 'Needs you',
  'follow-up': 'Follow up',
  running: 'Running',
  done: 'Done',
}

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
  // Custom pills (not the SDK Badge) so the four states share one shape and read
  // as a family: a leading dot for the two you-owe states, a spinner for live
  // work, a check for done. Follow up is a lighter amber of Needs you.
  const lane = laneKeyOf(item)
  if (lane === 'unblock') {
    return <span className="ow-rowstate ow-rowstate--need"><span className="ow-rowstate-dot" aria-hidden="true" />Needs you</span>
  }
  if (lane === 'followup') {
    return <span className="ow-rowstate ow-rowstate--follow"><span className="ow-rowstate-dot" aria-hidden="true" />Follow up</span>
  }
  if (lane === 'running') {
    // Only claim motion when there is motion. An open goal nobody is on gets a
    // quieter, truthful label instead of a spinner.
    return item.moving
      ? <span className="ow-rowstate ow-rowstate--run"><span className="ow-rowstate-spin" aria-hidden="true" />Running</span>
      : <span className="ow-rowstate ow-rowstate--queued">Queued</span>
  }
  return <span className="ow-rowstate ow-rowstate--done"><CircleCheck className="ow-icon" aria-hidden="true" />Done</span>
}

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

/**
 * One labelled section inside an expanded card: a rule-separated label, then its
 * body.
 *
 * `role="group"` and NOT a heading, deliberately. The page's headings are its
 * sections — "Needs you", "In progress" — and a card lives inside one of them,
 * so an <h3> per card section would inject three headings per row and turn the
 * document outline into a transcript of the list. A named group gives a screen
 * reader the same "this content belongs to that label" relationship while
 * staying out of the heading order entirely.
 */
function DetailSection({ label, children }: { label: string; children: ReactNode }) {
  const labelId = useId()
  return (
    <div className="ow-detail" role="group" aria-labelledby={labelId}>
      <div className="ow-detail-label" id={labelId}>{label}</div>
      {children}
    </div>
  )
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
 * A session card: summary row (chevron, icon, title, Open, state flag), then a
 * meta line, then rows. One card language — a card is one session holding rows,
 * and there is no second shape for it to drift into.
 */
function SessionBlockHeader({
  item,
  items,
  onOpen,
}: {
  item: WorkItem
  items: WorkItem[]
  onOpen: () => void
}) {
  const sessionRef = item.references.find(ref => ref.kind === 'session')
  const label = sessionRef?.label ?? item.provenance
  const comp = goalComposition(items)
  const state: WorkState = comp.needsYou > 0
    ? 'needs-you'
    : items.some(row => row.state === 'running') ? 'running' : 'done'
  // A needs-you card lets its rows speak, so the header shows no redundant count;
  // running / done cards have no per-row state, so the header names it.
  const flag = comp.needsYou > 0 ? null : stateLabels[state]
  // The session IS the card's subject, so its own count is not restated — and
  // provenance here is the bare word "Session", which the icon already says.
  // Forge links and the same-session queue, surfaced on the card itself rather
  // than only inside an expanded row: the PR is where the work lands, and the
  // queue depth says more prompts are already lined up for this session.
  const changeRefs: WorkReference[] = []
  const seenRefUrls = new Set<string>()
  for (const ref of items.flatMap(row => row.references)) {
    if ((ref.kind === 'change' || ref.kind === 'issue') && ref.url && !seenRefUrls.has(ref.url)) {
      seenRefUrls.add(ref.url)
      changeRefs.push(ref)
    }
  }
  const queued = items.reduce((max, row) => Math.max(max, row.queuedBehind ?? 0), 0)
  const queuedText = queued > 0 ? workCopy('rank_queued_behind', { count: String(queued) }) : null
  // Activity leads the line; the forge link and queue depth follow it. The
  // "N PR/issue" counts drop out once real links render.
  const activityText = goalMetaLine(items, Date.now(), true, changeRefs.length > 0)
  return (
    <div className="ow-goalcard-head">
      <div className="ow-goalcard-summary">
        {/* Static, not a hit area: one visible Open button stays the only way in,
            so the title must not hint at an action it does not carry. */}
        <span className="ow-goalcard-header ow-goalcard-static">
          <span className="ow-truncate ow-block-name ow-goalcard-title">{label}</span>
        </span>
        <Btn className="ow-block-open" onClick={onOpen} aria-label={`Open ${label}`}>
          Open
        </Btn>
        {flag && <span className={`ow-goal-flag${comp.needsYou > 0 ? ' ow-goal-flag-warn' : ''}`}>{flag}</span>}
      </div>
      {(changeRefs.length > 0 || activityText || queuedText) && (
        <div className="ow-goal-meta ow-goal-meta-row">
          {activityText && <span>{activityText}</span>}
          {changeRefs.map(ref => (
            <ReferenceChip key={`${ref.kind}:${ref.id}`} reference={ref} onOpenSession={() => onOpen()} />
          ))}
          {queuedText && <span>{queuedText}</span>}
        </div>
      )}
    </div>
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
  compact,
  headless,
  showBadge = true,
  onDecideApproval,
}: {
  item: WorkItem
  selected: boolean
  compact?: boolean
  /** The card header already states this row's badge+title — do not repeat. */
  headless?: boolean
  /** Show the per-row state badge. Off on single-state cards, where the card's
   *  roll-up line carries the state instead. */
  showBadge?: boolean
  /** Answer the formal approval card inside this row. */
  onDecideApproval?: (item: WorkItem, action: string) => void
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
  /*
   * What this card can reveal. Computed up front because it decides three
   * separate things: whether the row claims to be expandable at all
   * (`aria-expanded`), whether the detail block renders, and — per section —
   * whether a label and its rule are drawn. A missing section must leave NO
   * trace, not an empty heading over a gap.
   */
  const detailSteps = (item.nextSteps ?? []).filter(step => step.what?.trim())
  const progressFacts = (item.progress ?? []).filter(entry => entry.trim())
  const askedFor = item.initialIntent?.trim()
  // Steps are the picker: without a handler there is nothing to pick, which is
  // the condition this block has always had.
  // Steps show at the card level now (under the recap), so they don't count
  // toward what EXPANDING a row reveals.
  const hasDetail = Boolean(askedFor) || progressFacts.length > 0
  const badge = stateBadge(item)
  /*
   * ONE number, never a span. The platform records `last_touched_turn` per goal
   * and nothing that could bound the other end, so this reads "turn 7". A range
   * would have to be invented, and 0 means "not recorded" rather than turn zero.
   */
  const turnLabel = item.lastTouchedTurn
    ? workCopy('card_turn', { turn: String(item.lastTouchedTurn) })
    : null
  // Every row carries a one-line plain-language summary at rest, not only the
  // needs-you rows that also get a why line. In a lane the why line wins when
  // present; otherwise the goal summary fills the row, so running and done items
  // read the same way. Expanded, the summary is dropped when the expansion
  // already quotes it (as a next step or the original ask).
  const summaryEchoesDetail = Boolean(item.summary) && (
    detailSteps.some(step => step.what?.trim() === item.summary)
    || (selected && askedFor === item.summary?.trim())
  )
  const showSummary = Boolean(item.summary)
    && (compact && !selected ? !whyRanked : !summaryEchoesDetail)
  // The line-2 status text: the why-you-must-act reason on needs-you rows,
  // otherwise the goal summary. Sits beside the state badge on one line.
  const statusText = whyRanked || (showSummary ? item.summary : null)
  return (
    <Clickable
      onActivate={onSelect}
      className="ow-row"
      /*
       * Short and stable. The row is the disclosure control, and letting its
       * accessible name fall out of its contents meant the name grew to include
       * every revealed section the moment it was expanded. The title is what the
       * control is for; the rest is content, and is read as content.
       */
      aria-label={item.title}
      aria-pressed={selected}
      /*
       * Only on rows that actually disclose something. Claiming expandability on
       * a row with no original ask, no progress and no steps would promise detail
       * that never arrives.
       */
      aria-expanded={hasDetail ? selected : undefined}
      data-selected={selected}
      data-lane={laneKeyOf(item)}
      data-instructed={item.instructed ? 'true' : undefined}
      data-continuation={continuation ? 'true' : undefined}
      data-testid={`work-item-${item.id}`}
    >
      <div className="ow-row-layout">
        <div className="ow-row-content">
          {!headless && (
          <>
          <div className="ow-row-heading">
            <span className="ow-row-title">{item.title}</span>
            {/* Turn rides with the title as its recency metadata, right-aligned. */}
            {turnLabel && <span className="ow-row-turn">{turnLabel}</span>}
            {/*
              The chevron belongs with the title because the title is what it
              opens. Decorative: the row itself carries role=button and
              aria-expanded, so a focusable chevron would be a second tab stop
              for one action.
            */}
            <ChevronRight
              className="ow-icon ow-row-chevron"
              data-expanded={selected ? 'true' : undefined}
              aria-hidden="true"
            />
          </div>
          {/* Status line: the state badge, then the one-line reason — the
              why-you-must-act line on needs-you rows, otherwise the goal summary. */}
          {((showBadge && badge) || statusText) && (
            <div className="ow-row-status">
              {showBadge && badge}
              {statusText && <span className="ow-row-statustext">{statusText}</span>}
            </div>
          )}
          </>
          )}
          {/*
            Advice, not a verdict. It sits above the goals because "someone is
            already on this" changes whether the rest of the card matters, and it
            links straight to the other session so the comparison is one click.
          */}
          {item.duplicateOf && (
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
            Inside a session block the header already carries the session, the
            project and the linked changes, so repeating them per row is noise.
          */}
          {!continuation && (
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
        </div>
        {/*
          No action button on a work item. A row's job is to be SELECTED, which
          quotes it in the Conductor; what happens next is the instruction the user
          types there. Opening a session belongs to the session title above, which
          is the thing a session actually is. An Open button per row also multiplied
          the same destination across every goal in one session.

          The disclosure chevron used to live here, in a column of its own. It now
          sits with the title it opens, so this side of the layout is empty and the
          content takes the full width.
        */}
      </div>
      {/*
        A yes/no is answered where it is asked. Sending this item to the composer
        would ask the user to compose a message when the session wants one bit.
      */}
      {/*
        The card's account of itself, revealed on selection: what was asked for,
        where it stands, what comes next.

        PROGRESSIVE DISCLOSURE, and it is the whole reason this sits behind
        selection rather than in the resting row. This board answers one question
        — what needs me now — and it answers it by being scannable. Three
        labelled sections is most of a paragraph per row, and eight rows of that
        is a document to read before the first decision can be made; a previous
        design was rejected for exactly that length. So the resting row keeps
        title, state, turn and one summary line, and the account appears for the
        ONE row the user picked. Clicking a step still puts it in the Conductor's
        input — chosen on the left, sent on the right.
      */}
      {selected && hasDetail && (
        <Expand><div className="ow-row-detail">
          {askedFor && (
            <DetailSection label={workCopy('card_asked_for')}>
              {/* Verbatim and quoted rather than paraphrased: it is the user's
                  own sentence, and that it has NOT been rewritten is the point
                  of showing it. */}
              <blockquote className="ow-detail-quote">{askedFor}</blockquote>
            </DetailSection>
          )}
          {progressFacts.length > 0 && (
            <DetailSection label={workCopy('card_where_it_stands')}>
              <ul className="ow-detail-facts">
                {progressFacts.map((fact, index) => (
                  <li key={`${index}:${fact}`}>{fact}</li>
                ))}
              </ul>
            </DetailSection>
          )}
        </div></Expand>
      )}
      {/*
        Read the error, then re-run it. The failure line above is the diagnosis;
        this is the response. Retry spawns a fresh run, so a success removes this
        card on the next poll without anyone having to dismiss anything.
      */}
      {item.retryPath && onRetry && (
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
      {item.stopPath && onStop && (
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
      {item.permissionId && onDecideApproval && (
        <Expand><FormalApproval
          item={item}
          busy={Boolean(permissionBusy)}
          onDecide={action => onDecideApproval(item, action)}
        /></Expand>
      )}
      {/*
        Management, not response: taking the item OUT of the queue. On hover (and
        keyboard focus), not on select. Floats over the row's top-right corner so
        the resting row stays clean.
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
function laneKeyOf(item: WorkItem): LaneKey {
  if (item.state === 'done') return 'done'
  if (item.state === 'running') return 'running'
  return responseVerb(item) ?? 'unblock'
}

/** The suggested-next-step CTA — arrow + what + its quieter why, one hit area. */
function NextStepButton({ step, onPick }: { step: SummaryNextStep; onPick?: (what: string) => void }) {
  return (
    <button
      type="button"
      className="ow-card-step"
      title={step.why ?? step.what}
      onClick={event => { event.stopPropagation(); onPick?.(step.what) }}
    >
      <ArrowRight className="ow-icon ow-card-step-arrow" aria-hidden="true" />
      <span className="ow-card-step-body">
        <span className="ow-card-step-what">{step.what}</span>
        {step.why && <span className="ow-card-step-why">{step.why}</span>}
      </span>
    </button>
  )
}

/**
 * One of a session's OTHER items in the expand — same treatment as the headline:
 * status pill, title, its first next step as a CTA, and its OWN expand for the
 * rest of its steps + ask/progress. Reference in chat / Later / Already done on hover.
 */
function MoreItem({
  item,
  selected,
  onSelect,
  onSnooze,
  onHandled,
  onPickStep,
}: {
  item: WorkItem
  selected: boolean
  onSelect: (item: WorkItem) => void
  onSnooze?: (id: string) => void
  onHandled?: (id: string, updatedAt: number) => void
  onPickStep?: (what: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const steps = item.state === 'done' ? [] : (item.nextSteps ?? []).filter(s => s.what?.trim())
  const askedFor = item.initialIntent?.trim()
  const facts = (item.progress ?? []).filter(entry => entry.trim())
  const hasMore = steps.length > 1 || Boolean(askedFor) || facts.length > 0
  return (
    <>
      <div
        className="ow-moreitem"
        data-selected={selected ? 'true' : undefined}
        data-testid={`work-item-${item.id}`}
      >
        <div className="ow-moreitem-head">
          {stateBadge(item)}
          <span className="ow-moreitem-title ow-truncate">{item.title}</span>
        </div>
        {item.summary && <p className="ow-moreitem-summary">{item.summary}</p>}
        {steps[0] && <NextStepButton step={steps[0]} onPick={onPickStep} />}
        {hasMore && (
          <button
            type="button"
            className="ow-goals-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded(show => !show)}
          >
            <ChevronRight className="ow-icon" data-open={expanded ? 'true' : undefined} aria-hidden="true" />
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        <div className="ow-row-aside">
          <button type="button" className="ow-aside-btn ow-aside-btn--ref" onClick={() => onSelect(item)}>Reference in chat</button>
          {item.state === 'needs-you' && onSnooze && (
            <button type="button" className="ow-aside-btn" onClick={() => onSnooze(item.id)}>Later</button>
          )}
          {item.state === 'needs-you' && onHandled && (
            <button type="button" className="ow-aside-btn" onClick={() => onHandled(item.id, item.updatedAt)}>Already done</button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="ow-moreitem-detail">
          {steps.slice(1).map((s, i) => <NextStepButton key={`${item.id}:${i + 1}`} step={s} onPick={onPickStep} />)}
          {askedFor && (
            <DetailSection label={workCopy('card_asked_for')}>
              <blockquote className="ow-detail-quote">{askedFor}</blockquote>
            </DetailSection>
          )}
          {facts.length > 0 && (
            <DetailSection label={workCopy('card_where_it_stands')}>
              <ul className="ow-detail-facts">
                {facts.map((fact, i) => <li key={`${i}:${fact}`}>{fact}</li>)}
              </ul>
            </DetailSection>
          )}
        </div>
      )}
    </>
  )
}

/**
 * One session as a single card: a status / clickable-name / last-active / turns
 * headline, the PRs it touches, the latest goal's summary and its first next step.
 * Everything else — the rest of the steps, the ask + progress, the other goals —
 * lives behind the expand.
 */
function SessionCard({
  items,
  doneTitles,
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
}: {
  items: WorkItem[]
  doneTitles?: string[]
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
}) {
  const [expanded, setExpanded] = useState(false)
  const [showDone, setShowDone] = useState(false)

  // The latest-touched goal is the card's headline; the rest sit behind expand.
  const ordered = [...items].sort((a, b) => (b.lastTouchedTurn ?? 0) - (a.lastTouchedTurn ?? 0))
  const lead = ordered[0]
  const rest = ordered.slice(1)
  const slot = lead.sessionKey as string

  // The status pill reflects the whole session: what you owe first, then motion.
  const statusItem = items.find(item => item.state === 'needs-you')
    ?? items.find(item => item.state === 'running')
    ?? lead

  const comp = goalComposition(items)
  const name = lead.references.find(ref => ref.kind === 'session')?.label ?? lead.provenance
  const active = sinceLabel(comp.lastActivityAt)
  const turns = lead.sessionTurns
    ? `${lead.sessionTurns} ${lead.sessionTurns === 1 ? 'turn' : 'turns'}`
    : null
  const metaParts = [active, turns].filter(Boolean) as string[]

  // Every PR/issue the session touches — the whole set, not just the ones this
  // one intent's text happens to name — deduped, each with its own status.
  const prRefs: WorkReference[] = []
  const seen = new Set<string>()
  for (const ref of lead.sessionChanges ?? []) {
    if (ref.url && !seen.has(ref.url)) {
      seen.add(ref.url)
      prRefs.push(ref)
    }
  }

  // The latest goal's story: progress punctuated and capped at two sentences.
  const prose = (lead.progress ?? [])
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => (/[.!?]$/.test(entry) ? entry : `${entry}.`))
    .join(' ')
  const summaryProse = prose
    ? prose.split(/(?<=[.!?])\s+/).filter(s => s.trim()).slice(0, 2).join(' ')
    : ''
  // A Done goal is finished — it carries no "next step", on the card or in expand.
  const steps = lead.state === 'done'
    ? []
    : (lead.nextSteps ?? []).filter(step => step.what?.trim())
  const askedFor = lead.initialIntent?.trim()
  const facts = (lead.progress ?? []).filter(entry => entry.trim())
  const hasMore = steps.length > 1 || Boolean(askedFor) || facts.length > 0 || rest.length > 0

  const selected = selectedId === lead.id

  return (
    <>
    <div
      className="ow-sessioncard"
      data-selected={selected ? 'true' : undefined}
      data-testid={`work-item-${lead.id}`}
    >
      <div className="ow-card-top">
        {stateBadge(statusItem)}
        <span className="ow-card-meta">
          <button
            type="button"
            className="ow-card-name"
            onClick={event => { event.stopPropagation(); onOpenSession(slot) }}
          >
            {name}
          </button>
          {metaParts.map(part => <span key={part} className="ow-card-metapart">{part}</span>)}
        </span>
      </div>
      <h3 className="ow-card-title">{lead.title}</h3>
      {prRefs.length > 0 && (
        <div className="ow-card-prs">
          {prRefs.map(ref => (
            <a
              key={ref.id}
              className="ow-card-pr"
              data-status={ref.status || undefined}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={event => event.stopPropagation()}
            >
              {ref.label}
              {ref.status && <span className="ow-card-pr-status"> · {ref.status}</span>}
            </a>
          ))}
        </div>
      )}
      {summaryProse && <p className="ow-card-summary">{summaryProse}</p>}
      {steps[0] && (
        <div className="ow-card-nextstep">
          <DetailSection label="Suggested next step">
            <NextStepButton step={steps[0]} onPick={onPickStep} />
          </DetailSection>
        </div>
      )}
      {/* A permission item is answered in the formal approval card, expanded on
          the selected card — the same anatomy as the row-era placement. */}
      {selected && lead.permissionId && onDecideApproval && (
        <Expand><FormalApproval
          item={lead}
          busy={Boolean(permissionBusy)}
          onDecide={action => onDecideApproval(lead, action)}
        /></Expand>
      )}
      {hasMore && (
        <button
          type="button"
          className="ow-goals-toggle"
          aria-expanded={expanded}
          onClick={event => { event.stopPropagation(); setExpanded(show => !show) }}
        >
          <ChevronRight className="ow-icon" data-open={expanded ? 'true' : undefined} aria-hidden="true" />
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      {/* Hover-only actions. Reference in chat quotes this goal to the Conductor
          (the card body itself is inert — quoting is a deliberate click, not a
          stray one). Later / Already done manage a needs-you goal. */}
      <div className="ow-row-aside">
        <button type="button" className="ow-aside-btn ow-aside-btn--ref" onClick={() => onSelect(lead)}>Reference in chat</button>
        {lead.state === 'needs-you' && onSnooze && (
          <button type="button" className="ow-aside-btn" onClick={() => onSnooze(lead.id)}>Later</button>
        )}
        {lead.state === 'needs-you' && onHandled && (
          <button type="button" className="ow-aside-btn" onClick={() => onHandled(lead.id, lead.updatedAt)}>Already done</button>
        )}
      </div>
    </div>
      {/* Expanded content sits OUTSIDE the card: its own hover/click targets. */}
      {expanded && (
        <div className="ow-card-expanded">
          {steps.slice(1).map((step, index) => <NextStepButton key={`${index + 1}:${step.what}`} step={step} onPick={onPickStep} />)}
          {askedFor && (
            <DetailSection label={workCopy('card_asked_for')}>
              <blockquote className="ow-detail-quote">{askedFor}</blockquote>
            </DetailSection>
          )}
          {facts.length > 0 && (
            <DetailSection label={workCopy('card_where_it_stands')}>
              <ul className="ow-detail-facts">
                {facts.map((fact, index) => <li key={`${index}:${fact}`}>{fact}</li>)}
              </ul>
            </DetailSection>
          )}
          {rest.length > 0 && (
            <div className="ow-card-morelabel">
              {lead.state === 'needs-you' ? 'More that needs you'
                : lead.state === 'running' ? 'More in progress'
                : 'More done'}
            </div>
          )}
          {rest.map(item => (
            <MoreItem
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={onSelect}
              onSnooze={onSnooze}
              onHandled={onHandled}
              onPickStep={onPickStep}
            />
          ))}
          {/* This session's finished items, offered as collapsed context. */}
          {doneTitles && doneTitles.length > 0 && (
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
  doneBySession,
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
  /** Per-session finished-goal titles, for the collapsed ledger on a card. */
  doneBySession?: Record<string, string[]>
  /** An optional line under the section title. */
  subtitle?: string
  /**
   * Drop the visible title/count/subtitle band, for a section that is the whole
   * of its card and whose card header already names it. The section keeps
   * `aria-label={title}`, so the region stays named for a screen reader even
   * with nothing drawn.
   */
  hideHeader?: boolean
  emptyLabel: string
}) {
  // Cards ordered by last update, most recent first — a session's freshest item
  // dates the card.
  const blocks = clusterBy(items).sort((a, b) =>
    Math.max(...b.items.map(item => item.updatedAt)) - Math.max(...a.items.map(item => item.updatedAt)),
  )

  const renderBlock = (block: WorkBlock) => {
    return (
      <div
        key={block.key}
        className={`ow-block${block.header === 'session' ? ' ow-goalcard' : ''}`}
        data-grouped={block.header ? 'true' : undefined}
        data-open={block.header === 'session' ? 'true' : undefined}
      >
        {block.header === 'session' && block.sessionKey ? (
          <SessionCard
            items={block.items}
            doneTitles={doneBySession?.[block.sessionKey]}
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
        ) : (
          block.items.map(item => (
            <WorkRow
              key={item.id}
              item={item}
              selected={selectedId === item.id}
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
          ))
        )}
      </div>
    )
  }

  return (
    <section className="ow-section" aria-label={title}>
      {hideHeader
        ? null
        : onToggleCollapsed
        ? (
          <Clickable onActivate={onToggleCollapsed} className="ow-section-toggle">
            <PanelSectionHeader label={title} count={items.length} subtitle={subtitle} />
            <ChevronRight
              className="ow-icon ow-section-chevron"
              data-open={collapsed ? undefined : 'true'}
              aria-hidden="true"
            />
          </Clickable>
        )
        : <PanelSectionHeader label={title} count={items.length} subtitle={subtitle} />}
      {collapsed ? null : (
      <div className="ow-section-list">
        {blocks.length === 0
          ? <p className="ow-section-empty">{emptyLabel}</p>
          : blocks.map(renderBlock)}
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
  /* Column 1 holds exactly one panel, expanded; the other two sit in the
   * column-2 accordion. Conductor is column 3 and never participates. */
  const [primary, setPrimary] = useState<PanelId>(() => {
    const stored = readStore<PanelId | null>(PRIMARY_KEY, null)
    return stored && PANEL_ORDER.includes(stored) ? stored : 'work'
  })
  const [openStack, setOpenStack] = useState<PanelId | null>(() => {
    const stored = readStore<PanelId | null>(OPEN_STACK_KEY, null)
    const valid = stored && PANEL_ORDER.includes(stored) ? stored : null
    // openStack may never name the primary — that card is expanded in column 1,
    // so pointing the rail's open slot at it would leave the rail with none.
    const seed = readStore<PanelId | null>(PRIMARY_KEY, null)
    const current = seed && PANEL_ORDER.includes(seed) ? seed : 'work'
    return valid && valid !== current ? valid : (PANEL_PICK_ORDER.find(id => id !== current) ?? null)
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
  // Done recently always starts collapsed on load, so the panel opens focused on
  // live work. Expanding it lasts only for the current view, not across reloads.
  const [doneCollapsed, setDoneCollapsed] = useState<boolean>(true)
  const [loops, setLoops] = useState<Record<string, ErrorLoopFinding>>({})
  // Work the developer owns in the forge. Kept separate from `sources` because it
  // comes from this app's own backend rather than the platform, and must degrade
  // on its own: no gh, or a gateway without the route, costs this and nothing else.
  const [assigned, setAssigned] = useState<AssignedWork[]>([])
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
    const targets = summaryTargets(
      sources.slots,
      CONDUCTOR_SLOT,
      Date.now(),
      slot => summaryStampsRef.current.get(slot.key) === summaryStamp(slot),
    )
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
        /*
         * Owned work rides the same probe rather than getting its own poll.
         *
         * It is a paid, rate-limited `gh` call behind a 120s server-side cache, so
         * a second timer would spend quota to learn nothing. Failure is swallowed
         * separately from the stalls report above: an older backend that serves
         * /stalls but not /assigned must lose only the owned rows, not the
         * detection the rest of the board depends on.
         */
        try {
          const owned = await apiRef.current.get<AssignedReport>('/api/apps/crew-manager/assigned')
          if (!cancelled && mountedRef.current) {
            setAssigned(owned?.available && Array.isArray(owned.rows) ? owned.rows : [])
          }
        } catch {
          if (mountedRef.current) setAssigned([])
        }
      } catch {
        stallProbeRef.current = false
        if (mountedRef.current) { setStalls({}); setLoops({}); setStallReport(null); setAssigned([]) }
      }
    })()
    return () => { cancelled = true }
  }, [sources])

  const derived = useMemo(
    // Optimistic acknowledgements are applied on top of derived state, never baked
    // into it: real state wins on the next poll, and the ack expires on its own.
    () => applyInstructed(normalizeWorkItems({
      ...(sources ?? {
        slots: [], approvals: [], agents: [], workflows: [], crons: [], artifacts: [], loops: [],
      }),
      assigned,
    }, workCopy, summaries, stalls, loops), instructed),
    [sources, summaries, stalls, loops, instructed, assigned],
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
  // Follow-up is a slice of needs-you (a pick-back-up, not a block on you), shown
  // as its own rail chip; Needs you then counts only the blocking items.
  const followUpCount = useMemo(
    () => items.filter(item => item.state === 'needs-you' && laneKeyOf(item) === 'followup').length,
    [items],
  )
  const railCounts: Record<FilterKey, number> = {
    ...counts,
    'needs-you': Math.max(0, (counts['needs-you'] ?? 0) - followUpCount),
    'follow-up': followUpCount,
  }
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
   * The state filter belongs to the SESSIONS LIST alone.
   *
   * `items` stays the full set and is what the counts, the Conductor briefing and
   * the Loops card read; only the list reads `sessionItems`. Keeping the two named
   * separately is the point: one shared "visibleItems" is what let a list pill
   * quietly reshape the companion cards.
   */
  const sessionItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'follow-up') return items.filter(item => item.state === 'needs-you' && laneKeyOf(item) === 'followup')
    if (filter === 'needs-you') return items.filter(item => item.state === 'needs-you' && laneKeyOf(item) !== 'followup')
    return items.filter(item => item.state === filter)
  }, [filter, items])

  useEffect(() => setNavBadge(counts['needs-you']), [counts, setNavBadge])
  useEffect(() => {
    if (selectedId && !items.some(item => item.id === selectedId)) setSelectedId(null)
  }, [items, selectedId])

  const conductorSlot = sources?.slots.find(slot => slot.key === CONDUCTOR_SLOT)
  const conductorAvailable = Boolean(conductorSlot || conductorCreated)
  /*
   * A Conductor slot that already exists gets bound too, once.
   *
   * The agent is chosen at CREATION, so every Conductor created before the agent
   * shipped is still on the default agent and would stay there forever. The only
   * remedy used to be deleting the session, which throws away its history to pick
   * up a config change — a bad trade, and unnecessary: the platform serves
   * `POST /api/chat/slots/{slot}/agent` for exactly this, and its own comments
   * were written with materialized app agents in mind.
   *
   * Only an EMPTY binding is replaced. A slot naming some other agent was chosen
   * deliberately by the developer, and silently overriding that would be the app
   * taking a decision that is not its own.
   */
  const rebindAttemptedRef = useRef(false)
  useEffect(() => {
    const current = conductorSlot
    if (!current || rebindAttemptedRef.current) return
    if (current.agent) return
    rebindAttemptedRef.current = true
    const api = apiRef.current
    void api.get<{ available?: boolean; agent?: string | null }>(
      '/api/apps/crew-manager/conductor-agent',
    )
      .then(probe => (probe?.available && probe.agent ? probe.agent : null))
      .catch(() => null)
      .then(agent => {
        if (!agent || !mountedRef.current) return
        return api.post(
          `/api/chat/slots/${encodeURIComponent(CONDUCTOR_SLOT)}/agent`,
          { agent },
        ).then(() => { void loadSources() })
      })
      // A refusal costs the manager role and nothing else: the Conductor keeps
      // working on the default agent, which is what it was doing anyway.
      .catch(() => { /* best effort */ })
  }, [conductorSlot, loadSources])
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

  /*
   * Kiro Crew's Loops, named by the session each one drives. A loop is keyed by
   * SLOT, so the label is resolved slot_key -> session reference. Nothing is
   * invented: a loop whose slot matches no board session lists under its raw key.
   */
  const loopRows = useMemo(() => {
    // Reads the SAME payload the board already fetched for its loop rows, so the
    // card costs no extra request and can never disagree with them. Inactive
    // loops are dropped: one that hit max_cycles must leave no residue here.
    const live = (sources?.loops ?? []).filter(loop => loop && loop.active !== false && loop.slot_key)
    if (live.length === 0) return []
    const labelFor = new Map<string, string>()
    for (const item of items) {
      for (const ref of item.references) {
        if (ref.kind !== 'session' || !ref.id) continue
        if (ref.label && !labelFor.has(ref.id)) labelFor.set(ref.id, ref.label)
      }
    }
    return live.map(loop => {
      const cycles = Number(loop.cycle_count) || 0
      const max = Number(loop.max_cycles) || 0
      return {
        key: loop.slot_key,
        // A loop carries no name of its own, so the session it drives names it.
        title: labelFor.get(loop.slot_key) ?? loop.slot_key,
        // max_cycles 0 means unlimited — a fraction would be a lie there.
        progress: max > 0 ? `${cycles}/${max}` : `${cycles} ${cycles === 1 ? 'cycle' : 'cycles'}`,
        remaining: max > 0 ? Math.max(0, max - cycles) : null,
        instruction: (loop.message ?? '').replace(/\s+/g, ' ').trim(),
        lastFire: epoch(loop.last_fire_ts),
      }
    })
  }, [sources, items])

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

  const toggleDone = useCallback(() => {
    setDoneCollapsed(current => !current)
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
  }, [selected, items, loadSources, scope, stallReport, conductorSlot])

  const grouped: Record<WorkState, WorkItem[]> = {
    'needs-you': sessionItems.filter(item => item.state === 'needs-you'),
    running: sessionItems.filter(item => item.state === 'running'),
    done: sessionItems.filter(item => item.state === 'done'),
  }
  // Blocking = waiting on you now; follow-up = pick back up where it left off.
  const blockingItems = grouped['needs-you'].filter(item => laneKeyOf(item) !== 'followup')
  const followUpItems = grouped['needs-you'].filter(item => laneKeyOf(item) === 'followup')

  const openSession = (slot: string) => navigate(`/chat?sid=${encodeURIComponent(slot)}`)
  const selectItem = (item: WorkItem) => {
    // Clicking the selected card again deselects it — selection is a mode, and a
    // mode you can enter but not leave from the same place is a trap.
    setSelectedId(current => (current === item.id ? null : item.id))
    setDeliveryReceipt(null)
    setScope('session')
  }

  // The Conductor's docked quote/reference bar, rendered THROUGH ChatEmbed's
  // aboveComposer slot so it sits in normal flow directly on top of the composer,
  // whatever the composer's height — no brittle absolute offset to keep in sync.
  const conductorQuote = quoted ? (
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
                  {PANEL_LABELS.work}
                  <Badge variant="muted">{counts.all}</Badge>
                </span>
                <span className="ow-stack-actions">
                  {primary === 'work' ? <BoardFreshness lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={refreshSources} /> : <MakePrimary id="work" onPromote={promote} />}
                </span>
              </summary>
              {/* Left rail (layout C): the state filter as a vertical nav beside
                  the list, so the filters hold still while the list scrolls. */}
              <div className="ow-worksplit">
                <nav className="ow-railnav" role="group" aria-label="Filter by state">
                  {(Object.keys(filterLabels) as FilterKey[]).map(key => (
                    <Btn
                      key={key}
                      onClick={() => setFilter(key)}
                      aria-pressed={filter === key}
                      data-selected={filter === key}
                      className="ow-filter ow-railitem"
                    >
                      <span className="ow-railitem-label">{filterLabels[key]}</span>
                      <span className="ow-count">{railCounts[key]}</span>
                    </Btn>
                  ))}
                </nav>
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
                  : sessionItems.length === 0
                    ? (
                      <EmptyState
                        icon={<Search className="ow-icon" />}
                        title="No matching work"
                        subtitle="Change the filter to see sessions in another state."
                      />
                    )
                      : filter === 'all'
                        ? (
                        <>
                          <WorkSection
                            title="Needs you"
                            subtitle="Waiting on a decision or reply from you"
                            items={blockingItems}
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
                            emptyLabel="Nothing needs your input right now."
                          />
                          <WorkSection
                            title="Follow up"
                            subtitle="Pick back up where a session left off"
                            items={followUpItems}
                            doneBySession={doneBySession}
                            selectedId={selectedId}
                            onSelect={selectItem}
                            onSnooze={snoozeItem}
                            onHandled={markHandled}
                            onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                onDecideApproval={(item, action) => { void decideApproval(item, action) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onStop={path => { void stopLoop(path) }}
                stopBusy={stopping !== null}
                onPickStep={what => { void handleConductorSend(what) }}
                            emptyLabel="Nothing to follow up on."
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
                          emptyLabel="No matching work"
                        />
                      )}
                </div>
              </main>
              </div>
            </details>

            {/* Companion surfaces. Neither is a lens on the work list — each is
                its own kind of thing, so they are peers of Work rather than modes
                of it, and either can take column 1. */}
              {PANEL_ORDER.includes('loops') && (<details {...panelShell('loops')}>
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
                              {loop.title}
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
              </details>)}

              {PANEL_ORDER.includes('schedule') && (<details {...panelShell('schedule')}>
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
              </details>)}
            {railOrder.length > 0 && (<ColumnResizer
              side="start"
              containerRef={mainRef}
              min={COLW.workMin}
              reserve={COLW.railReserve}
              max={Infinity}
              value={panelW.work}
              onChange={px => setPanelW(p => ({ ...p, work: px }))}
              label="Resize the work column"
            />)}
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
                      placeholder={quoted?.sessionKey && scope === 'session'
                        ? 'New instructions for this session…'
                        : 'Ask across your work…'}
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
