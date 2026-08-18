import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
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
  Shield,
  Waves as Radar,
  Search,
  Tag,
  Users,
  Zap as Workflow,
} from 'lucide-react'
import { useAppApi, useNavigate, useNavBadge } from '@kirocrew/app-sdk'
import {
  Badge,
  Btn,
  ContentSkeleton,
  EmptyState,
  Input,
  PageHeader,
  SearchInput,
  SendBtn,
} from '@kirocrew/app-sdk/ui'
import type {
  Artifact,
  ChatSlot,
  CronJob,
  SessionSummary,
  ErrorLoopFinding,
  RecallHit,
  RecallReport,
  StallFinding,
  StallReport,
} from './types'
import {
  EMPTY_RECALL,
  RECALL_DEBOUNCE_MS,
  dedupeRecall,
  describeAge,
  readRecallReport,
  recallIsWorthAsking,
  recallUrl,
  type RecallState,
} from './recall'
import {
  applyInstructed,
  applySetAside,
  inDoneWindow,
  pendingPermissions,
  responseVerb,
  SNOOZE_MS,
  explainRank,
  fleetBriefing,
  normalizeWorkItems,
  rankWorkItem,
  searchWorkItems,
  workCounts,
  type AgentRow,
  type ApprovalRow,
  type WorkflowRow,
  type WorkCopyKey,
  type InstructedItems,
  type PendingPermission,
  type ResponseVerb,
  type SentInstruction,
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

type FilterKey = 'all' | WorkState

interface SourcesResponse {
  slots: ChatSlot[]
  approvals: ApprovalRow[]
  agents: AgentRow[]
  workflows: WorkflowRow[]
  crons: CronJob[]
  artifacts: Artifact[]
}

interface ConductorMessage {
  role: string
  content: string
  ts?: string
}

interface ConductorSlotResponse {
  messages?: ConductorMessage[]
  running?: boolean
}

interface ConductorDelivery {
  session: string
  message: string
}

const SNOOZE_KEY = 'crew-manager.snoozed'
const HANDLED_KEY = 'crew-manager.handled'
const DONE_COLLAPSED_KEY = 'crew-manager.done-collapsed'

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

const CONDUCTOR_SLOT = 'crew-manager-conductor'
const SOURCE_POLL_MS = 5_000
const DELIVERY_PATTERN = /<crew-manager-delivery>([\s\S]*?)<\/crew-manager-delivery>/g

function parseConductorDeliveries(content: string): ConductorDelivery[] {
  const deliveries: ConductorDelivery[] = []
  for (const match of content.matchAll(DELIVERY_PATTERN)) {
    try {
      const value = JSON.parse(match[1]) as Partial<ConductorDelivery>
      if (typeof value.session === 'string' && typeof value.message === 'string' && value.message.trim()) {
        deliveries.push({ session: value.session, message: value.message.trim() })
      }
    } catch {
      // Ignore incomplete directives while the Conductor response is streaming.
    }
  }
  return deliveries
}

function visibleConductorContent(content: string): string {
  return content.replace(DELIVERY_PATTERN, '').trim()
}

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
  agent_failed: 'This agent stopped before finishing — nothing to do here',
  workflow_failed: 'This workflow stopped before finishing',
  workflow_failed_generic: 'This workflow stopped before finishing',
  workflow_running: 'Workflow is running',
  workflow_finished: 'Workflow finished',
  monitor_failed: 'The latest check stopped before finishing',
  monitor_running: 'Monitor is checking now',
  artifact_ready: '{{kind}} output is ready',
  stalled_for: 'Check on it — no activity for {{duration}}, still marked running',
  stalled_because: '{{reason}} Silent for {{duration}}.',
  duplicate_same_change: 'Also being worked in “{{title}}” — same linked change',
  duplicate_same_topic: 'Looks like the same work as “{{title}}”',
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
 * Upper case because these are a fixed set of categories, not prose — the same
 * reason a form field label is not a sentence.
 */
const verbLabels: Record<ResponseVerb, string> = {
  decide: 'DECIDE',
  answer: 'ANSWER',
  verify: 'VERIFY',
  resume: 'RESUME',
  unblock: 'UNBLOCK',
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

function PanelSectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="ow-section-header">
      <h2 className="ow-section-title">{label}</h2>
      <span className="ow-section-count">{count}</span>
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

/** One screenful of recalled work. Recall is a sidebar, not an archive browser. */
const RECALL_LIMIT = 8

/**
 * Recalled work, shown only while searching.
 *
 * These rows carry NO state badge on purpose. A finished-and-archived session has
 * no live state to report, and borrowing Done's badge would claim the outcome was
 * verified when all we know is that the transcript mentions the query. What they
 * offer is the one honest action: open it and read.
 */
function PastWorkSection({
  hits,
  now,
  onOpenSession,
}: {
  hits: RecallHit[]
  now: number
  onOpenSession: (slot: string) => void
}) {
  if (hits.length === 0) return null
  return (
    <section className="ow-section" aria-label="From past work">
      <PanelSectionHeader label="From past work" count={hits.length} />
      <div className="ow-section-list">
        {hits.map(hit => (
          <Clickable
            key={hit.session_key}
            className="ow-row ow-recall-row"
            onActivate={() => onOpenSession(hit.session_key)}
            data-testid={`recall-${hit.session_key}`}
          >
            <div className="ow-row-layout">
              <div className="ow-row-content">
                <div className="ow-row-heading">
                  <span className="ow-row-title">{hit.title}</span>
                  <span className="ow-recall-age">{describeAge(hit.modified, now)}</span>
                </div>
                {hit.snippet && <p className="ow-row-summary">{hit.snippet}</p>}
              </div>
              <div className="ow-row-actions">
                <Btn className="ow-primary-action" onClick={event => {
                  event.stopPropagation()
                  onOpenSession(hit.session_key)
                }}>Open</Btn>
                <ChevronRight className="ow-icon" aria-hidden="true" />
              </div>
            </div>
          </Clickable>
        ))}
      </div>
    </section>
  )
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

/** Steps beyond this crowd the composer; the rest stay in the session itself. */
const MAX_QUOTE_STEPS = 3

const actionLabels = {
  reply: 'Reply',
  'review-approval': 'Review approval',
  open: 'Open',
  resume: 'Resume',
  discuss: 'Discuss',
} as const

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
function clusterBySession(items: WorkItem[]): { sessionKey: string | null; items: WorkItem[] }[] {
  const blocks: { sessionKey: string | null; items: WorkItem[] }[] = []
  const bySession = new Map<string, WorkItem[]>()

  items.forEach(item => {
    if (!item.sessionKey) {
      blocks.push({ sessionKey: null, items: [item] })
      return
    }
    const existing = bySession.get(item.sessionKey)
    if (existing) {
      existing.push(item)
      return
    }
    const block = { sessionKey: item.sessionKey, items: [item] }
    bySession.set(item.sessionKey, block.items)
    blocks.push(block)
  })

  return blocks
}

function SessionBlockHeader({
  item,
  onOpen,
}: {
  item: WorkItem
  onOpen: () => void
}) {
  const sessionRef = item.references.find(ref => ref.kind === 'session')
  const changeRefs = item.references.filter(ref => ref.kind !== 'session')
  return (
    // Not a clickable header. One visible Open button is the only way in, so the
    // affordance and the destination are the same thing — a whole-header hit area
    // put an invisible action behind text that reads as a label.
    <div className="ow-block-tab">
      <MessageSquare className="ow-icon" aria-hidden="true" />
      <span className="ow-truncate ow-block-name">{sessionRef?.label ?? item.provenance}</span>
      <span className="ow-block-tab-meta">
        <span aria-hidden="true">·</span>
        <span className="ow-truncate">{item.provenance}</span>
        {changeRefs.slice(0, 2).map(ref => (
          <span key={`${ref.kind}:${ref.id}`} className="ow-truncate">{ref.label}</span>
        ))}
      </span>
      <Btn
        className="ow-block-open"
        onClick={onOpen}
        aria-label={`Open ${sessionRef?.label ?? item.provenance}`}
      >
        Open
      </Btn>
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
  onPickStep,
  onSnooze,
  onHandled,
}: {
  item: WorkItem
  selected: boolean
  onAnswerPermission?: (id: string, approve: boolean) => void
  permissionBusy?: boolean
  onRetry?: (path: string) => void
  retryBusy?: boolean
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
          <div className="ow-row-heading">
            {/*
              Verb first. The badge only earns its keep if it forms a column you
              can run your eye down — trailing the title, each one starts at a
              different x and there is nothing to scan.
            */}
            {stateBadge(item)}
            <span className="ow-row-title">{item.title}</span>
          </div>
          {/* Skip the summary when it just repeats a next-step chip below — the
              resume card's summary is its leading next_step, already a chip. */}
          {item.summary && !(item.nextSteps ?? []).some(step => step.what?.trim() === item.summary) && (
            <p className="ow-row-summary">{item.summary}</p>
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
                  item.duplicateOf.because === 'same_change'
                    ? 'duplicate_same_change'
                    : 'duplicate_same_topic',
                  { title: item.duplicateOf.title },
                )}
              </span>
            </Clickable>
          )}
          {/*
            Name the goals, do not merely count them. This is one card because a
            stopped session poses one decision — but the user still has to see
            WHAT stopped without opening the session to find out.
          */}
          {item.goals && item.goals.length > 0 && (
            <ul className="ow-row-goals">
              {item.goals.slice(0, MAX_LISTED_GOALS).map(goal => (
                <li key={goal} className="ow-truncate">{goal}</li>
              ))}
              {item.goals.length > MAX_LISTED_GOALS && (
                <li className="ow-row-goals-more">
                  +{item.goals.length - MAX_LISTED_GOALS} more
                </li>
              )}
              {/* The session's finished goals, checked, so the card shows the whole
                  ledger: what is done and what is left to resume. */}
              {item.doneGoals?.slice(0, MAX_LISTED_GOALS).map(goal => (
                <li key={`done:${goal}`} className="ow-row-goal-done">
                  <Check className="ow-icon" aria-hidden="true" />
                  <span className="ow-truncate">{goal}</span>
                </li>
              ))}
            </ul>
          )}
          {/*
            Only in Needs you. That is the one group ordered by score rather than
            time, so it is the only group whose order needs explaining — and the
            only place the user has to judge "which of these first". Running and
            Done are plain recency, where this line would cost a row and say
            nothing.
          */}
          {whyRanked && <div className="ow-row-why">{whyRanked}</div>}
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
          {/* Same list, same cap, same overflow as the session summary's "Open
              items" panel — these ARE the summary's open items, so the label and
              the +N more make that explicit and keep the two from disagreeing. */}
          <div className="ow-steps-head">Open items</div>
          {item.nextSteps.slice(0, MAX_QUOTE_STEPS).map((step, index) => (
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
            <div className="ow-steps-more">+{item.nextSteps.length - MAX_QUOTE_STEPS} more in the session</div>
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
      {selected && item.permissionId && onAnswerPermission && (
        <Expand><PermissionDecision
          tool={item.permissionTool || 'a tool'}
          purpose={item.permissionPurpose}
          busy={Boolean(permissionBusy)}
          onAnswer={approve => onAnswerPermission(item.permissionId as string, approve)}
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

function WorkSection({
  title,
  items,
  selectedId,
  onSelect,
  onOpenSession,
  onAnswerPermission,
  permissionBusy,
  onRetry,
  retryBusy,
  onPickStep,
  onSnooze,
  onHandled,
  footer,
  collapsed,
  onToggleCollapsed,
  emptyLabel,
}: {
  title: string
  items: WorkItem[]
  selectedId: string | null
  onSelect: (item: WorkItem) => void
  onOpenSession: (slot: string) => void
  onAnswerPermission?: (id: string, approve: boolean) => void
  permissionBusy?: boolean
  onRetry?: (path: string) => void
  retryBusy?: boolean
  onPickStep?: (what: string) => void
  onSnooze?: (id: string) => void
  onHandled?: (id: string, updatedAt: number) => void
  /** Rendered under the list; the section's own footer line. */
  footer?: ReactNode
  /** When set, the header toggles the list; undefined means always open. */
  collapsed?: boolean
  onToggleCollapsed?: () => void
  emptyLabel: string
}) {
  return (
    <section className="ow-section" aria-label={title}>
      {onToggleCollapsed
        ? (
          <Clickable onActivate={onToggleCollapsed} className="ow-section-toggle">
            <PanelSectionHeader label={title} count={items.length} />
            <ChevronRight
              className="ow-icon ow-section-chevron"
              data-open={collapsed ? undefined : 'true'}
              aria-hidden="true"
            />
          </Clickable>
        )
        : <PanelSectionHeader label={title} count={items.length} />}
      {collapsed ? null : (
      <div className="ow-section-list">
        {items.length === 0
          ? <p className="ow-section-empty">{emptyLabel}</p>
          : clusterBySession(items).map(block => (
            <div
              key={block.sessionKey ?? block.items[0].id}
              className="ow-block"
              // Every card that belongs to a session gets the header, whether it
              // holds one row or five. One row is not a different KIND of thing.
              data-grouped={block.sessionKey ? 'true' : undefined}
            >
              {block.sessionKey && (
                <SessionBlockHeader
                  item={block.items[0]}
                  onOpen={() => onOpenSession(block.sessionKey as string)}
                />
              )}
              {block.items.map((item, index) => (
            <WorkRow
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              // The header owns the session, project and change links, so the
              // row's own meta line would just repeat them. This is a RELOCATION
              // of that line, not an addition — the density cost is zero.
              continuation={Boolean(block.sessionKey)}
              whyRanked={
                item.state === 'needs-you' && item.action !== 'resume'
                  ? explainRank(rankWorkItem(item), workCopy)
                  : undefined
              }
              onSelect={() => onSelect(item)}
              onOpenSession={onOpenSession}
              onAnswerPermission={onAnswerPermission}
              permissionBusy={permissionBusy}
              onRetry={onRetry}
              retryBusy={retryBusy}
              onPickStep={onPickStep}
              onSnooze={onSnooze}
              onHandled={onHandled}
            />
              ))}
            </div>
          ))}
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
function contextMessage(item: WorkItem | null, items: WorkItem[]): string {
  const briefing = fleetBriefing(items, workCopy)
  if (!item) {
    return [
      'Crew Manager context: workspace overview.',
      ...briefing,
      'Act as the Conductor: assess the work and decide whether intervention is warranted.',
      'No referenced session is selected, so discuss only and do not emit a delivery directive.',
      'Always tell the user that you did not intervene and briefly explain why.',
    ].join('\n')
  }
  const references = item.references.map(ref => `${ref.kind}: ${ref.label} (${ref.id})`).join('\n')
  const deliveryRule = item.sessionKey
    ? [
      'You own the decision to intervene in the referenced session. Selection alone does not require intervention.',
      `If intervention is warranted, append exactly one directive: <crew-manager-delivery>{"session":${JSON.stringify(item.sessionKey)},"message":"your instruction"}</crew-manager-delivery>`,
      'Only target that referenced session. The app validates the target, delivers once, and shows the user a receipt.',
      'Always tell the user whether you intervened and briefly explain why.',
    ]
    : ['No referenced session is available, so discuss only and do not emit a delivery directive.']
  return [
    `Crew Manager context: ${item.title}`,
    ...briefing,
    `Selected item: ${item.title}`,
    `State: ${stateLabels[item.state]}`,
    item.issue ? 'Issue detected.' : undefined,
    `Latest meaningful update: ${item.summary}`,
    `Provenance: ${item.provenance}`,
    item.sessionKey ? `Referenced session: ${item.sessionKey}` : 'Referenced session: none',
    `References:\n${references}`,
    'This context was selected silently. Act as the Conductor and decide whether another session needs direction.',
    ...deliveryRule,
  ].filter((line): line is string => Boolean(line)).join('\n')
}

export default function CrewOverviewApp() {
  const api = useAppApi()
  const apiRef = useRef(api)
  apiRef.current = api
  const navigate = useNavigate()
  const setNavBadge = useNavBadge()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deliveryReceipt, setDeliveryReceipt] = useState<string | null>(null)
  const [sources, setSources] = useState<SourcesResponse | null>(null)
  const [summaries, setSummaries] = useState<Record<string, SessionSummary>>({})
  const [summarySupport, setSummarySupport] = useState<SummarySupport>('unknown')
  const summarySupportRef = useRef<SummarySupport>('unknown')
  const summaryStampsRef = useRef(new Map<string, string>())
  const [stalls, setStalls] = useState<Record<string, StallFinding>>({})
  const [instructed, setInstructed] = useState<InstructedItems>({})
  const [isInstructing, setIsInstructing] = useState(false)
  // Sessions instructed from here. Kept beyond the acknowledgement window because
  // an approval can surface well after the instruction lands.
  const [watchedSessions, setWatchedSessions] = useState<string[]>([])
  const [resolvingApproval, setResolvingApproval] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  // Set-aside records live in the browser: the queue is re-derived every poll,
  // so without a persisted record a dismissed item returns within seconds.
  const [snoozed, setSnoozed] = useState<Record<string, number>>(() => readStore(SNOOZE_KEY))
  const [handled, setHandled] = useState<Record<string, number>>(() => readStore(HANDLED_KEY))
  const [doneCollapsed, setDoneCollapsed] = useState<boolean>(() => readStore<boolean | null>(DONE_COLLAPSED_KEY, null) ?? true)
  // Instructions sent from here. They land in ANOTHER session's transcript, so the
  // Conductor has to keep its own record or the conversation loses the user's turn.
  const [sentInstructions, setSentInstructions] = useState<SentInstruction[]>([])
  const [recall, setRecall] = useState<RecallState>(EMPTY_RECALL)
  const [loops, setLoops] = useState<Record<string, ErrorLoopFinding>>({})
  // Flips false the first time the backend route is unreachable.
  const stallProbeRef = useRef(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [sourcesError, setSourcesError] = useState<Error | null>(null)
  const [conductorCreated, setConductorCreated] = useState(false)
  const [conductorMessages, setConductorMessages] = useState<ConductorMessage[]>([])
  const [conductorRunning, setConductorRunning] = useState(false)
  const [conductorInput, setConductorInput] = useState('')
  const [conductorError, setConductorError] = useState<string | null>(null)
  const [isConductorSending, setIsConductorSending] = useState(false)
  const mountedRef = useRef(true)
  const sourceRequestRef = useRef(0)
  const conductorRequestRef = useRef(0)
  const conductorAttemptedRef = useRef(false)
  const conductorHistoryInitializedRef = useRef(false)
  const processedDeliveriesRef = useRef(new Set<string>())
  const pendingDeliveryTargetRef = useRef<string | null>(null)
  const pendingDeliveryTitleRef = useRef<string | null>(null)
  const conductorScrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      sourceRequestRef.current += 1
      conductorRequestRef.current += 1
    }
  }, [])

  const loadSources = useCallback(async () => {
    const request = ++sourceRequestRef.current
    const currentApi = apiRef.current
    try {
      const [slots, approvals, agentEnvelope, workflowEnvelope, cronEnvelope, artifactEnvelope] = await Promise.all([
        currentApi.get<ChatSlot[]>('/api/chat/slots'),
        currentApi.get<ApprovalRow[]>('/api/approvals'),
        currentApi.get<{ agents?: AgentRow[] }>('/api/spawn'),
        currentApi.get<{ runs?: WorkflowRow[] }>('/api/workflows/runs'),
        currentApi.get<{ jobs?: CronJob[] }>('/api/crons'),
        currentApi.get<{ artifacts?: Artifact[] }>('/api/artifacts'),
      ])
      if (!mountedRef.current || request !== sourceRequestRef.current) return
      setSources({
        slots: Array.isArray(slots) ? slots : [],
        approvals: Array.isArray(approvals) ? approvals : [],
        agents: Array.isArray(agentEnvelope.agents) ? agentEnvelope.agents : [],
        workflows: Array.isArray(workflowEnvelope.runs) ? workflowEnvelope.runs : [],
        crons: Array.isArray(cronEnvelope.jobs) ? cronEnvelope.jobs : [],
        artifacts: Array.isArray(artifactEnvelope.artifacts) ? artifactEnvelope.artifacts : [],
      })
      setSourcesError(null)
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
      } catch {
        stallProbeRef.current = false
        if (mountedRef.current) { setStalls({}); setLoops({}) }
      }
    })()
    return () => { cancelled = true }
  }, [sources])

  /*
   * Recall runs on the query, not on the board.
   *
   * Debounced because each call is a transcript scan across many files, and a
   * scan per keystroke would be pure waste. The response is dropped when the
   * query has moved on: without that guard a slow scan for "ac" can land after a
   * fast one for "ack contention" and replace correct results with stale ones.
   *
   * A conclusive `enabled: false` (no history modules on this gateway) stops the
   * probe for good rather than re-asking on every keystroke.
   */
  useEffect(() => {
    if (recall.unsupported) return
    const text = query.trim()
    if (!recallIsWorthAsking(text)) {
      setRecall(current => (current.hits.length ? { ...current, hits: [] } : current))
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const report = await apiRef.current.get<RecallReport>(recallUrl(text, RECALL_LIMIT))
          if (cancelled || !mountedRef.current) return
          setRecall(readRecallReport(report))
        } catch {
          // A route that is not mounted yet (backend hook needs a restart) is not
          // worth retrying on every keystroke.
          if (mountedRef.current) setRecall({ unsupported: true, hits: [] })
        }
      })()
    }, RECALL_DEBOUNCE_MS)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, recall.unsupported])

  const derived = useMemo(
    // Optimistic acknowledgements are applied on top of derived state, never baked
    // into it: real state wins on the next poll, and the ack expires on its own.
    () => applyInstructed(normalizeWorkItems(sources ?? {
      slots: [], approvals: [], agents: [], workflows: [], crons: [], artifacts: [],
    }, workCopy, summaries, stalls, loops), instructed),
    [sources, summaries, stalls, loops, instructed],
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
  const selected = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  )
  const visibleItems = useMemo(() => {
    const searched = searchWorkItems(items, query)
    if (query.trim() || filter === 'all') return searched
    return searched.filter(item => item.state === filter)
  }, [filter, items, query])

  useEffect(() => setNavBadge(counts['needs-you']), [counts, setNavBadge])
  useEffect(() => {
    if (selectedId && !items.some(item => item.id === selectedId)) setSelectedId(null)
  }, [items, selectedId])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase('en-US') === 'k') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('[data-crew-manager-search="true"]')?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const conductorSlot = sources?.slots.find(slot => slot.key === CONDUCTOR_SLOT)
  const conductorAvailable = Boolean(conductorSlot || conductorCreated)
  useEffect(() => {
    if (!sources || conductorSlot || conductorAttemptedRef.current) return
    conductorAttemptedRef.current = true
    /*
     * No `agent` field on purpose.
     *
     * This used to ask for `agent: 'kirocrew'`, which is not a Kiro Crew agent
     * name — it is the underlying kiro-cli agent that the `default` agent happens
     * to be bound to (`kirocrew agent list` shows them in separate columns, and
     * every real session reports `agent=default`). The endpoint's validation is
     * only a charset check, so the wrong name passes it and the slot is created
     * with a binding that resolves to nothing. A Conductor that accepts a message
     * and never answers looks exactly like a Conductor that is broken.
     *
     * The endpoint treats an omitted agent as "bind the default", which is the
     * one answer that cannot be wrong from here.
     */
    void api.post<ChatSlot>('/api/chat/slots', {
      name: CONDUCTOR_SLOT,
      title: 'Conductor',
    }).then(() => {
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

  const processConductorDeliveries = useCallback(async (messages: ConductorMessage[]) => {
    const candidates = messages.flatMap((message, index) =>
      message.role === 'assistant'
        ? parseConductorDeliveries(message.content).map(delivery => ({
          delivery,
          key: `${message.ts ?? index}:${delivery.session}:${delivery.message}`,
        }))
        : [],
    )
    if (!conductorHistoryInitializedRef.current) {
      candidates.forEach(candidate => processedDeliveriesRef.current.add(candidate.key))
      conductorHistoryInitializedRef.current = true
      return
    }
    for (const candidate of candidates) {
      if (processedDeliveriesRef.current.has(candidate.key)) continue
      processedDeliveriesRef.current.add(candidate.key)
      const expectedTarget = pendingDeliveryTargetRef.current
      if (!expectedTarget || candidate.delivery.session !== expectedTarget) {
        setConductorError('Conductor proposed a delivery outside the selected session; Crew Manager blocked it.')
        continue
      }
      try {
        await apiRef.current.post('/api/chat', { message: candidate.delivery.message, slot: candidate.delivery.session })
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          setConductorError(error instanceof Error ? error.message : 'Conductor delivery failed')
          continue
        }
      }
      if (mountedRef.current) {
        setDeliveryReceipt(`Conductor sent direction to ${pendingDeliveryTitleRef.current ?? candidate.delivery.session}`)
      }
    }
  }, [])

  const loadConductor = useCallback(async () => {
    const request = ++conductorRequestRef.current
    try {
      const detail = await apiRef.current.get<ConductorSlotResponse>(
        `/api/chat/slots/${encodeURIComponent(CONDUCTOR_SLOT)}`,
      )
      if (!mountedRef.current || request !== conductorRequestRef.current) return
      const messages = Array.isArray(detail.messages) ? detail.messages : []
      setConductorMessages(messages)
      setConductorRunning(Boolean(detail.running))
      setConductorError(null)
      await processConductorDeliveries(messages)
    } catch (error) {
      if (mountedRef.current && request === conductorRequestRef.current) {
        setConductorError(error instanceof Error ? error.message : 'Unable to load Conductor')
      }
    }
  }, [processConductorDeliveries])

  useEffect(() => {
    if (!conductorAvailable) return
    void loadConductor()
    const interval = window.setInterval(
      () => { void loadConductor() },
      conductorRunning ? 1_000 : SOURCE_POLL_MS,
    )
    return () => window.clearInterval(interval)
  }, [conductorAvailable, conductorRunning, loadConductor])

  useEffect(() => {
    const scroller = conductorScrollerRef.current
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  }, [conductorMessages])

  const sendPrivate = useCallback(async (message: string) => {
    const currentApi = apiRef.current
    pendingDeliveryTargetRef.current = selected?.sessionKey ?? null
    pendingDeliveryTitleRef.current = selected?.title ?? null
    setDeliveryReceipt(null)
    await currentApi.post(`/api/chat/slots/${encodeURIComponent(CONDUCTOR_SLOT)}/context`, {
      content: contextMessage(selected, items),
      source: 'crew-manager',
      ephemeral: true,
    })
    try {
      // Same reason as slot creation: naming an agent we cannot verify is how a
      // send succeeds and no answer ever arrives. An omitted agent binds the
      // platform's default.
      await currentApi.post('/api/chat', { message, slot: CONDUCTOR_SLOT })
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
    }
  }, [selected])

  const submitConductorMessage = useCallback(async (raw: string) => {
    const message = raw.trim()
    if (!message || isConductorSending) return
    setConductorError(null)
    setIsConductorSending(true)
    try {
      await sendPrivate(message)
      await loadConductor()
    } catch (error) {
      if (mountedRef.current) {
        setConductorError(error instanceof Error ? error.message : 'Unable to send your message')
      }
    } finally {
      if (mountedRef.current) setIsConductorSending(false)
    }
  }, [isConductorSending, loadConductor, sendPrivate])

  /**
   * Send the user's instruction to the session behind the QUOTED work item.
   *
   * The quoted item is the target. That is what selection means here: the item is
   * quoted in the Conductor, the user writes, and the instruction lands in the
   * session that item belongs to. No routing decision is left implicit.
   *
   * A user-typed, user-aimed message is the path the spec says stays as it is; the
   * blocked half is the Manager acting on a session by itself.
   *
   * Three things happen after a successful send, and all three are needed: the
   * Conductor records what was sent, the receipt says where it went, and the item
   * is acknowledged as In progress so the queue does not still show it as waiting
   * on the user.
   */
  const instructSelected = useCallback(async (instruction: string) => {
    const message = instruction.trim()
    const target = selected
    if (!message || !target?.sessionKey || isInstructing) return
    setIsInstructing(true)
    setConductorError(null)
    try {
      try {
        await apiRef.current.post('/api/chat', { message, slot: target.sessionKey })
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error
      }
      if (!mountedRef.current) return
      setConductorInput('')
      // The instruction becomes part of the conversation and the quote leaves the
      // box. Keeping it quoted after sending read as "not sent yet", and the
      // message itself went to another session's transcript, so this view showed
      // no trace of what the user had just done.
      setSentInstructions(current => [...current, {
        ts: new Date().toISOString(),
        target: target.title,
        message,
      }])
      setSelectedId(null)
      setInstructed(current => ({ ...current, [target.id]: Date.now() }))
      setWatchedSessions(current => (
        current.includes(target.sessionKey as string) ? current : [...current, target.sessionKey as string]
      ))
      setDeliveryReceipt(`Sent new instructions to ${target.title}`)
      void loadSources()
    } catch (error) {
      if (mountedRef.current) {
        setConductorError(
          error instanceof Error
            ? `Could not send that to the session: ${error.message}`
            : 'Could not send that to the session',
        )
      }
    } finally {
      if (mountedRef.current) setIsInstructing(false)
    }
  }, [isInstructing, loadSources, selected])

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

  const submitConductor = useCallback(async () => {
    const message = conductorInput.trim()
    if (!message || isConductorSending || isInstructing) return
    // A quoted item with a session is an instruction for that session. Nothing
    // quoted is a question for the Conductor about the fleet.
    if (selected?.sessionKey) {
      await instructSelected(message)
      return
    }
    setConductorInput('')
    await submitConductorMessage(message)
  }, [
    conductorInput,
    instructSelected,
    isConductorSending,
    isInstructing,
    selected,
    submitConductorMessage,
  ])

  /**
   * The Conductor's own messages plus the instructions sent from here, in time
   * order. Instructions are the user's turns in this view even though the platform
   * recorded them against the session they were aimed at.
   */
  const visibleConductorMessages = useMemo(() => {
    const own = conductorMessages
      .filter(message => message.content?.trim() && (message.role === 'user' || message.role === 'assistant'))
      .map(message => ({ ...message, sentTo: undefined as string | undefined }))
    const sent = sentInstructions.map(entry => ({
      role: 'user' as const,
      ts: entry.ts,
      content: entry.message,
      sentTo: entry.target,
    }))
    return [...own, ...sent].sort((a, b) => (a.ts ?? '').localeCompare(b.ts ?? ''))
  }, [conductorMessages, sentInstructions])

  const recalled = useMemo(
    // Dedupe against what the live results already show: a session can be both
    // live on the board and a strong history match, and two rows for one thing is
    // the duplication the grouping work just removed.
    () => dedupeRecall(recall.hits, visibleItems),
    [recall.hits, visibleItems],
  )

  const grouped: Record<WorkState, WorkItem[]> = {
    'needs-you': visibleItems.filter(item => item.state === 'needs-you'),
    running: visibleItems.filter(item => item.state === 'running'),
    done: visibleItems.filter(item => item.state === 'done'),
  }
  const openSession = (slot: string) => navigate(`/chat?sid=${encodeURIComponent(slot)}`)
  const selectItem = (item: WorkItem) => {
    // Clicking the selected card again deselects it — selection is a mode, and a
    // mode you can enter but not leave from the same place is a trap.
    setSelectedId(current => (current === item.id ? null : item.id))
    setDeliveryReceipt(null)
  }

  return (
    <div className="ow-root" data-crew-manager-shell="quiet-split">
      <style>{OVERWATCH_STYLES}</style>
      <PageHeader
        title="Crew Manager"
        subtitle="See what needs your input, what is still running, and what finished recently."
      />
      <div className="ow-body">
        <div className="ow-layout">
          <nav className="ow-rail" aria-label="Crew Manager">
            <div className="ow-rail-inner">
              <SearchInput
                data-crew-manager-search="true"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search work and projects… ⌘K"
                aria-label="Search work"
                className="ow-search"
              />
              <div className="ow-filters">
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
            </div>
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
                  : visibleItems.length === 0
                    ? (
                      <EmptyState
                        icon={<Search className="ow-icon" />}
                        title="No matching work"
                        subtitle="Change the filter or search for a session, project, PR, or output."
                      />
                    )
                    : filter === 'all' || query.trim()
                      ? (
                        <>
                          <WorkSection
                            title="Needs you"
                            items={grouped['needs-you']}
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
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onPickStep={what => setConductorInput(what)}
                            emptyLabel="Nothing needs your input right now."
                          />
                          <WorkSection
                            title="In progress"
                            items={grouped.running}
                            selectedId={selectedId}
                            onSelect={selectItem}
                            onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onPickStep={what => setConductorInput(what)}
                            emptyLabel="Nothing is in progress right now."
                          />
                          <WorkSection
                            title="Done recently"
                            items={grouped.done}
                            selectedId={selectedId}
                            onSelect={selectItem}
                            collapsed={doneCollapsed}
                            onToggleCollapsed={toggleDone}
                            onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onPickStep={what => setConductorInput(what)}
                            emptyLabel="No recent completed work."
                          />
                        </>
                      )
                      : (
                        <WorkSection
                          title={filterLabels[filter]}
                          items={visibleItems}
                          selectedId={selectedId}
                          onSelect={selectItem}
                          onOpenSession={openSession}
                onAnswerPermission={(id, approve) => { void resolvePermission(id, approve) }}
                permissionBusy={resolvingApproval !== null}
                onRetry={path => { void retryRun(path) }}
                retryBusy={retrying !== null}
                onPickStep={what => setConductorInput(what)}
                          emptyLabel="No matching work"
                        />
                      )}
                    {/* Only while searching: history has no claim on the resting board. */}
                    {query.trim() && (
                      <PastWorkSection
                        hits={recalled}
                        now={Date.now()}
                        onOpenSession={openSession}
                      />
                    )}
            </div>
          </main>

          <aside className="ow-conductor" aria-label="Conductor">
            <div className="ow-conductor-header">
              <div className="ow-conductor-title">
                <h2>Conductor</h2>
              </div>
              <p className="ow-private-hint">Select work on the left to send it instructions. With nothing selected, ask across your work.</p>
            </div>

            <div className="ow-chat">
              {conductorAvailable
                ? (
                  <div className="ow-chat-panel">
                    <div ref={conductorScrollerRef} className="ow-chat-messages" aria-live="polite">
                      {visibleConductorMessages.length === 0 && !conductorRunning
                        ? <div className="ow-chat-empty">Conductor is ready.</div>
                        : visibleConductorMessages.map((message, index) => (
                          <div
                            className="ow-chat-message"
                            data-role={message.role}
                            key={`${message.ts ?? 'message'}:${index}`}
                          >
                            <div className="ow-chat-role">
                              {message.role === 'user' ? 'You' : 'Conductor'}
                              {/* Says where it went, so a message aimed at another
                                  session is not mistaken for one to the Conductor. */}
                              {message.sentTo && (
                                <span className="ow-chat-sent-to"> → {message.sentTo}</span>
                              )}
                            </div>
                            <div className="ow-chat-content">{visibleConductorContent(message.content)}</div>
                          </div>
                        ))}
                      {conductorRunning && <div className="ow-chat-status">Conductor is working…</div>}
                    </div>
                    {/*
                      Sits between the transcript and the composer, outside the
                      scroller, because an approval that scrolls out of view is
                      indistinguishable from the stall it causes.
                    */}
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
                    <div className="ow-composer">
                      {/*
                        The quote lives IN the composer, attached to the thing being
                        written, and only exists while something is quoted. As a
                        panel above the transcript it displaced the conversation
                        permanently — including when nothing was selected, where it
                        showed a placeholder and cost a whole band of the column.
                      */}
                      {/*
                        A reference, nothing more: who the next message goes to,
                        and a way to let go. Goals, next steps, links and the
                        ranking reason all live on the SELECTED CARD in the list —
                        the quote duplicating them grew taller than the
                        conversation it sat under.
                      */}
                      {quoted && (
                        <div className="ow-quote">
                          <div className="ow-quote-body">
                            <span className="ow-eyebrow">
                              {quoted.sessionKey ? 'Instructing' : 'Quoted'}
                            </span>
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
                      )}
                      <div className="ow-chat-composer">
                      <Input
                        value={conductorInput}
                        onChange={event => setConductorInput(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' && conductorInput.trim()) {
                            event.preventDefault()
                            void submitConductor()
                          }
                        }}
                        placeholder={
                          quoted?.sessionKey
                            ? 'New instructions for this session…'
                            : 'Ask across your work…'
                        }
                        aria-label="Message to Conductor"
                        disabled={isConductorSending || isInstructing}
                      />
                      <SendBtn
                        onClick={() => { void submitConductor() }}
                        disabled={!conductorInput.trim() || isConductorSending || isInstructing}
                        aria-label={
                          quoted?.sessionKey
                            ? 'Send new instructions to the quoted session'
                            : 'Send message to Conductor'
                        }
                      >
                        Send
                      </SendBtn>
                      </div>
                    </div>
                    {deliveryReceipt && (
                      <div className="ow-conductor-receipt" role="status">
                        <CircleCheck className="ow-icon" />{deliveryReceipt}
                      </div>
                    )}
                    {conductorError && <div className="ow-chat-error" role="alert">{conductorError}</div>}
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
