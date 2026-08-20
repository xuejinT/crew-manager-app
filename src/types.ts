export interface SourceLink {
  provider: string
  number: string | number
  url: string
  /**
   * "change" for a pull/merge request, "issue" for an issue. The platform buckets
   * these separately and gives each its own chip budget
   * (`state.py::_budgeted_source_links`), so an absent value means change -- the
   * shape that existed before issues were added.
   */
  kind?: 'change' | 'issue'
  ci?: string
  mergeable?: string
  state?: string
}

export interface ChatSlot {
  key: string
  title?: string
  agent?: string
  project?: string
  workspace?: string
  memory_mode?: string
  last_message?: string
  last_ts?: string | number | null
  last_activity_ts?: string | number | null
  created?: string | number | null
  running?: boolean
  subagents_running?: boolean
  orchestrating?: boolean
  pending_approval?: boolean
  waiting_for_input?: boolean
  has_options?: boolean
  options?: string[]
  messages?: number
  /** Prompts queued behind the active turn — SAME session, not other sessions. */
  queue_depth?: number
  source_links?: SourceLink[]
}

/** One suggested next step on an intent (platform: session_summary.NextStep). */
export interface SummaryNextStep {
  what: string
  why?: string
  expect?: string
}

/**
 * A goal the user pursued inside a session, possibly spanning many turns.
 * `state` is the platform's collapse of its two status axes: `needs-you` means
 * the discussion ended while the goal was never verified.
 */
export interface SummaryIntent {
  title: string
  initial_intent?: string
  progress?: string[]
  next_steps?: SummaryNextStep[]
  status?: string
  verified?: boolean | null
  state?: 'needs-you' | 'done' | 'in-progress' | 'dropped'
  last_touched_turn?: number
}

/** GET /api/chat/slots/{slot}/summary */
export interface SessionSummary {
  enabled?: boolean
  stale?: boolean
  intents?: SummaryIntent[]
  constraints?: string[]
  generated_at?: string | number | null
  user_turns?: number
  generate_state?: 'ready' | 'too_few_turns' | 'unavailable'
}

/** One stalled session, from GET /api/apps/crew-manager/stalls. */
export interface StallFinding {
  key: string
  label: string
  silent_secs: number
  private?: boolean
  /**
   * A one-sentence, model-written account of what the session was doing when it
   * went quiet. Absent until the backend has generated it, and absent forever for
   * a private session, so the card must fall back to the duration alone.
   */
  reason?: string
}

/** One session repeating the same tool failure. */
export interface ErrorLoopFinding {
  key: string
  label: string
  tool: string
  repeats: number
  private?: boolean
}

/** The backend watcher's read model. Absent entirely when no backend is loaded. */
/** One past session matching a recall query, as the backend returns it. */
export interface RecallHit {
  session_key: string
  title: string
  snippet?: string
  modified?: number
  created?: string
  /**
   * Which workspace this session belongs to. Load-bearing once a query may reach
   * beyond the current one: an unplaceable result is one the user has to go and
   * identify by hand.
   */
  workspace?: string
}

export interface RecallReport {
  /**
   * False when this gateway does not expose the history modules. The UI hides the
   * section entirely in that case rather than rendering an empty one, which would
   * read as "you never did this" instead of "this cannot be answered here".
   */
  enabled?: boolean
  query?: string
  /** Which scope actually answered: 'workspace' (default) or 'all'. */
  scope?: string
  results?: RecallHit[]
}

export interface StallReport {
  enabled?: boolean
  stall_secs?: number
  renotify_secs?: number
  sweep_secs?: number
  last_sweep?: number | null
  stalls?: StallFinding[]
  error_loops?: ErrorLoopFinding[]
  /**
   * Epoch SECONDS (the backend's clock) at which each live finding was first
   * seen, keyed as findings are. Absent on a gateway whose app backend predates
   * it, so every reader must cope with undefined.
   */
  first_seen?: Record<string, number>
}

export interface CronJob {
  id: string
  name: string
  message?: string
  enabled?: boolean
  schedule?: string
  is_running?: boolean
  last_status?: string
  last_error?: string
  running_since?: string | number | null
  last_run_ts?: string | number | null
  created_ts?: string | number | null
  /**
   * When this job fires next, as the platform computes it
   * (`handlers/cron.py::compute_next_run_ts`). Absent for a job with no future
   * run, so the card must omit the countdown rather than render a blank one.
   */
  next_run_ts?: number | null
  paused?: boolean
  /** The raw 5-field spec, shown as a monospace chip beside the human schedule. */
  cron_expr?: string | null
}

/**
 * One cron execution, from `GET /api/crons/history`. Needed because a job's
 * `last_run_ts` records only its MOST RECENT run — an every-4-hours job would
 * otherwise count as one run today no matter how many times it actually fired,
 * so "N of M done today" cannot be answered from the job record alone.
 */
export interface CronRun {
  run_id?: string
  job_id?: string
  trigger?: string
  started_at?: number
  finished_at?: number
  status?: string
}

/**
 * One auto-nudge loop: a session re-prompting ITSELF on an idle timer until its
 * cycle or runtime budget runs out, or until someone stops it
 * (platform: `autonudge.NudgeLoop`, served by `GET /api/autonudge`).
 *
 * This is the one kind of work on the board that continues without anyone
 * deciding it should. Nothing else here spends budget unattended, which is why a
 * live loop is worth a row even though nobody is waiting on it.
 */
export interface MonitorLoop {
  id: string
  slot_key: string
  message?: string
  idle_secs?: number
  /** 0 means unlimited, which is the case worth surfacing. */
  max_cycles?: number
  cycle_count?: number
  active?: boolean
  last_fire_ts?: number
  created_ts?: number
  /** 0 means unlimited. */
  max_runtime_secs?: number
  agent?: string
}

export interface Artifact {
  slug: string
  name: string
  kind: string
  source?: string
  session_key?: string
  session_title?: string
  description?: string
  tags?: string[]
  version?: number
  updated_at?: string | number | null
  created_at?: string | number | null
}
