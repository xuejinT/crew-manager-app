/**
 * The Conductor panel — the operator surface for autonomous work.
 *
 * Everything the driver does was already reachable over HTTP and observable in
 * its ledger; what was missing was a place to do it from. Without this panel the
 * one part of the product that acts on its own could only be driven by curl,
 * which meant the operator could watch it and not steer it.
 *
 * Three jobs, in the order an operator needs them:
 *
 * 1. **Arm and disarm.** A visible START/STOP, because "it works autonomously
 *    between those two" is the whole contract and a contract you cannot see is
 *    not one you can rely on. HALT is separate and deliberately blunt.
 * 2. **The goal list.** Declare, activate, start, remove. Activation is its own
 *    button rather than part of declaring: writing a goal down should not begin
 *    work, and the plan reserves that transition for a human.
 * 3. **The event stream.** Ledger rows, newest last, refusals shown as loudly as
 *    successes — a supervisor that reports only its wins is the least trustworthy
 *    kind.
 *
 * It polls rather than subscribes. The driver's own cadence is 15s/60s, so a 5s
 * poll is already faster than the thing it watches, and a websocket subscription
 * would add a second liveness story to debug for no visible gain.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Btn, Input } from '@kirocrew/app-sdk/ui'

const BASE = '/api/apps/crew-manager/conductor'
const POLL_MS = 5_000

export interface ConductorApi {
  get<T = unknown>(path: string, init?: RequestInit): Promise<T>
  post<T = unknown>(path: string, body?: unknown): Promise<T>
}

interface LeafRow {
  id?: string
  title?: string
  intent_text?: string
  depends_on?: string[]
  produces?: string
  status?: string
}

interface WorkerRow {
  slot?: string
  title?: string
  running?: boolean
  messages?: number
}

interface GoalRow {
  id?: string
  title?: string
  statement?: string
  status?: string
  dispatchable?: boolean
  why?: string
  scope?: { root?: string; worker_trust?: string }
  leaves?: { total?: number; closed?: number } | unknown
  leaf_rows?: LeafRow[]
  workers?: WorkerRow[]
}

interface StateShape {
  planner_timeout_secs?: number
  planner_timeout_bounds?: number[]
  available?: boolean
  armed?: boolean
  running?: boolean
  holding?: boolean
  mode?: string
  modes?: string[]
  blocking_reason?: string
  goals?: GoalRow[]
  goals_summary?: { total?: number; dispatchable?: number }
}

interface LedgerRow {
  ts?: number
  event_type?: string
  action_class?: string
  verdict?: string
  outcome?: string
  resource?: string
  reason?: string
  detail?: string
  goal_id?: string
}

/** `cm-<goal>-<leaf>` reads as the leaf; anything else stands as it is. */
function shortResource(raw: string): string {
  if (!raw) return ''
  return raw.startsWith('cm-') ? raw.slice(raw.lastIndexOf('-') + 1) : raw
}

function clock(ts?: number): string {
  if (!ts) return ''
  try {
    return new Date(ts * 1000).toLocaleTimeString()
  } catch {
    return ''
  }
}

function leafCount(goal: GoalRow): string {
  const lv = goal.leaves
  if (lv && typeof lv === 'object' && !Array.isArray(lv)) {
    const rec = lv as { total?: number; closed?: number }
    if (typeof rec.total === 'number') return `${rec.closed ?? 0}/${rec.total} leaves`
  }
  return ''
}

/** Which half to render. The two live in different columns on purpose: goals are
 * managed beside the goal list the operator already reads, while the event stream
 * belongs with the chat that narrates the same actions in prose. */
export type ConductorView = 'goals' | 'events'

/** One step of a goal, as the operator fills it in. */
interface StepForm {
  id: string
  title: string
  task: string
  produces: string
  after: string
}

interface GoalForm {
  title: string
  statement: string
  root: string
  trust: string
  steps: StepForm[]
}

const EMPTY_STEP: StepForm = { id: '', title: '', task: '', produces: '', after: '' }

/** What the form omits and fills in for the operator.
 *
 * A goal needs an authority map, budgets and a completion predicate before the
 * driver will touch it, and none of those are things an operator should have to
 * think about to get started. These are the defaults the POC runs proved out:
 * turn-dispatching classes may act (that is the point), writes that leave the
 * machine stay propose-only, and merge is hard-denied regardless. Anything more
 * specific is an edit to the goal after it exists.
 */
/** Statuses only the operator moves a goal out of, and which nothing may edit.
 *  Mirrors `goals.TERMINAL_STATUSES` — the enum has no "paused"; an operator hold
 *  is `holding`, and a ceiling or non-progress stop is `blocked`. */
const TERMINAL_STATUSES = new Set(['done', 'abandoned'])

/** Statuses a per-goal Start may move back into `active`. */
const RESUMABLE_STATUSES = new Set(['draft', 'ready', 'holding', 'blocked'])

const FORM_AUTHORITY: Record<string, string> = {
  session_create: 'act',
  session_continue: 'act',
  // Recovery for a worker whose turn was killed (a gateway restart mid-tool-call
  // is the observed cause). Absent from this map until the executor existed, and
  // because a goal's authority may only RESTRICT, an unlisted class resolves to
  // OFF — so the driver proposed a resume every tick and the gate refused every
  // one with "tier=off (goal policy)" while the step sat unfinished. Granting it
  // widens nothing: session_create above mints a whole new session and
  // session_continue dispatches a model-composed turn, both strictly more than
  // re-sending a brief the operator already wrote.
  session_resume: 'act',
  context_inject: 'act',
  escalate: 'act',
  operator_notify: 'act',
  narrate: 'act',
  loop_arm: 'propose',
  cron_create: 'propose',
  pr_comment: 'propose',
}

const FORM_BUDGETS = {
  wip: 3,
  turns: 200,
  wall_clock_secs: 21600,
  actions: {
    session_create: 12,
    session_continue: 60,
    context_inject: 120,
    escalate: 20,
    operator_notify: 20,
  },
}

export function ConductorPanel({ api, view = 'goals' }: { api: ConductorApi; view?: ConductorView }) {
  const [state, setState] = useState<StateShape | null>(null)
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [busy, setBusy] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [form, setForm] = useState<GoalForm>({
    title: '', statement: '', root: '', trust: 'trust', steps: [],
  })
  const [showDeclare, setShowDeclare] = useState(false)
  /** Non-empty while editing an existing draft: declaring with an id MERGES onto
   * it (the route is idempotent by id), so edit and create are one code path. */
  const [editing, setEditing] = useState<string>('')
  /** Local edit buffer for the planner ceiling, so typing does not fight the poll. */
  const [timeoutDraft, setTimeoutDraft] = useState<string>('')
  const mounted = useRef(true)
  const apiRef = useRef(api)
  apiRef.current = api

  const load = useCallback(async () => {
    try {
      const [st, led] = await Promise.all([
        apiRef.current.get<StateShape>(`${BASE}/state`),
        apiRef.current.get<{ rows?: LedgerRow[] }>(`${BASE}/ledger?limit=40`),
      ])
      if (!mounted.current) return
      setState(st ?? null)
      setRows(Array.isArray(led?.rows) ? led.rows : [])
    } catch (error) {
      if (mounted.current) setNote(error instanceof Error ? error.message : 'could not read the conductor')
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void load()
    const timer = window.setInterval(() => { void load() }, POLL_MS)
    return () => { mounted.current = false; window.clearInterval(timer) }
  }, [load])

  /** Every mutation goes through here so one in flight cannot race another. */
  const act = useCallback(async (label: string, path: string, body?: unknown) => {
    setBusy(label)
    setNote('')
    try {
      await apiRef.current.post(path, body ?? {})
      setNote(`${label} ok`)
    } catch (error) {
      setNote(error instanceof Error ? `${label} failed: ${error.message}` : `${label} failed`)
    } finally {
      if (mounted.current) setBusy('')
      void load()
    }
  }, [load])

  const setField = useCallback((key: keyof GoalForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }))
  }, [])

  const setStep = useCallback((index: number, key: keyof StepForm, value: string) => {
    setForm(current => ({
      ...current,
      steps: current.steps.map((step, i) => (i === index ? { ...step, [key]: value } : step)),
    }))
  }, [])

  const addStep = useCallback(() => {
    setForm(current => ({ ...current, steps: [...current.steps, { ...EMPTY_STEP }] }))
  }, [])

  const removeStep = useCallback((index: number) => {
    setForm(current => ({ ...current, steps: current.steps.filter((_, i) => i !== index) }))
  }, [])

  /** Build a goal from the form and declare it.
   *
   * Validation happens here rather than at the server so the operator is told
   * which FIELD is wrong instead of reading a normalizer's rejection. The three
   * that matter are the three that fail silently otherwise: no absolute root means
   * every path predicate is unevaluable and the goal can never complete; a step
   * with no instruction is a worker nobody briefed; and a duplicate id makes two
   * steps fight over one slot name.
   */
  /** Validate the form and shape the declare payload, or undefined + a note. */
  const buildPayload = useCallback((): Record<string, unknown> | undefined => {
    const title = form.title.trim()
    const root = form.root.trim()
    if (!title) { setNote('give the goal a name'); return undefined }
    if (!root.startsWith('/')) {
      setNote('the working directory must be an absolute path — it is where "did this step finish" is checked')
      return undefined
    }
    // Zero steps is allowed on purpose: the intended flow is declare the outcome,
    // then press "Decompose to steps" and let the planner propose them. A goal with
    // no steps simply stays a draft, which is exactly what it is.
    const steps = form.steps.filter(s => s.id.trim() || s.task.trim())

    const ids = new Set<string>()
    for (const step of steps) {
      const id = step.id.trim()
      if (!id) { setNote('every step needs a short id'); return undefined }
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(id)) {
        setNote(`step id ${id} may only use letters, digits, dot, dash, underscore or colon`)
        return undefined
      }
      if (ids.has(id)) { setNote(`two steps share the id ${id}`); return undefined }
      ids.add(id)
      if (!step.task.trim()) { setNote(`step ${id} has no instruction — that worker would sit idle`); return undefined }
    }

    const payload: Record<string, unknown> = {
      ...(editing ? { id: editing } : {}),
      title,
      statement: form.statement.trim() || title,
      scope: {
        root,
        worker_trust: form.trust === 'normal' ? '' : form.trust,
        paths_allow: ['**'],
        paths_deny: ['.git/**', '.github/**'],
      },
      authority: FORM_AUTHORITY,
      budgets: FORM_BUDGETS,
      // all_leaves_closed is the honest goal-level predicate for a step list: the
      // goal is done when its steps are, and nothing else has to be invented.
      done_when: [{ kind: 'all_leaves_closed' }],
      leaves: steps.map(step => {
        const produces = step.produces.trim()
        return {
          id: step.id.trim(),
          title: step.title.trim() || step.id.trim(),
          intent_text: step.task.trim(),
          depends_on: step.after.split(',').map(x => x.trim()).filter(Boolean),
          done_when: produces ? [{ kind: 'file_exists', path: produces }] : [],
          predicted_paths: produces ? [produces] : [],
          status: 'open',
        }
      }),
    }
    return payload
  }, [form])

  /** Validate, save, and return the goal's id — '' when anything refused.
   *
   * Split out of the submit handler because "Decompose to steps" from inside the
   * form has to do exactly this first and then plan, and a second copy of the
   * validation would be a second thing to keep in step. The id has to come from the
   * RESPONSE: a new goal's id is minted by the backend, so the caller cannot know
   * it in advance. */
  const submitGoal = useCallback(async (label: string): Promise<string> => {
    const payload = buildPayload()
    if (!payload) return ''
    setBusy(label)
    setNote('')
    try {
      const reply = await apiRef.current.post<{ goal?: { id?: string } }>(`${BASE}/goals`, payload)
      const id = reply?.goal?.id ?? (payload.id as string | undefined) ?? ''
      setNote(id ? `${label} ok` : `${label} ok (no id returned)`)
      return id
    } catch (error) {
      setNote(error instanceof Error ? `${label} failed: ${error.message}` : `${label} failed`)
      return ''
    } finally {
      if (mounted.current) setBusy('')
    }
  }, [buildPayload])

  const declareForm = useCallback(async () => {
    const id = await submitGoal(editing ? 'save' : 'declare')
    if (!id) { void load(); return }
    if (mounted.current) {
      setForm({ title: '', statement: '', root: '', trust: 'trust', steps: [] })
      setShowDeclare(false)
      setEditing('')
    }
    void load()
  }, [submitGoal, editing, load])

  /** Arm the loop AND make the goals it is meant to run runnable.
   *
   * Arming alone was not enough and the silence it produced was indistinguishable
   * from a broken driver: press Start with a planned-but-still-`draft` goal and the
   * loop ticks forever with nothing dispatchable, so the operator sees the approvals
   * note appear and no sessions ever start. The first version of this button was
   * DISABLED in that situation, which stranded the operator the other way. Neither
   * is right — pressing Start IS the human authorising the draft→active transition
   * the plan reserves for them, so it performs it.
   *
   * Only drafts that HAVE steps are activated. A draft with none is not ready, and
   * silently planning several goals behind one click would be a minutes-long
   * operation the operator did not ask for; those are named in the note instead.
   */
  const startAll = useCallback(async () => {
    // `ready` is the normal case after planning; a planned-but-still-`draft` goal
    // only exists for steps written by hand, and both are startable.
    // Read from `state` rather than the derived `goals` const: this callback is
    // declared above it, and closing over the raw response keeps the dependency
    // list honest.
    const all = state?.goals ?? []
    const drafts = all.filter(g => (g.status === 'ready'
      || (g.status === 'draft' && (g.leaf_rows?.length ?? 0) > 0)))
    const unplanned = all.filter(g => g.status === 'draft' && (g.leaf_rows?.length ?? 0) === 0)
    setBusy('start')
    setNote('')
    try {
      for (const goal of drafts) {
        if (!goal.id) continue
        setNote(`activating ${goal.title || goal.id}…`)
        await apiRef.current.post(`${BASE}/goals`, { id: goal.id, status: 'active' })
      }
      setNote('arming…')
      await apiRef.current.post(`${BASE}/start`, { mode: 'autonomous' })
      const ran = drafts.length + all.filter(g => g.status === 'active').length
      const skipped = unplanned.length > 0
        ? ` — ${unplanned.length} goal(s) have no steps yet and were left alone`
        : ''
      setNote(ran > 0
        ? `running ${ran} goal(s)${skipped}`
        : `armed, but nothing is active yet${skipped}`)
    } catch (error) {
      setNote(error instanceof Error ? `start failed: ${error.message}` : 'start failed')
    } finally {
      if (mounted.current) setBusy('')
      void load()
    }
  }, [state, load])

  /** Save the goal AND plan its steps, from inside the form.
   *
   * The planner used to be reachable only from the goal LIST, which meant the flow
   * was: fill the form, submit, find the goal you just made, press a second button.
   * Everything needed to plan is already on screen at the moment the operator is
   * looking at "No steps yet", so the button belongs there too. */
  const declareAndDecompose = useCallback(async () => {
    const id = await submitGoal(editing ? 'save' : 'declare')
    if (!id) { void load(); return }
    if (mounted.current) {
      setForm({ title: '', statement: '', root: '', trust: 'trust', steps: [] })
      setShowDeclare(false)
      setEditing('')
    }
    setBusy('decompose')
    setNote('saved — planning steps, this can take a few minutes…')
    try {
      await apiRef.current.post(`${BASE}/goals/decompose`, { id })
      setNote('steps planned')
    } catch (error) {
      setNote(error instanceof Error ? `planning failed: ${error.message}` : 'planning failed')
    } finally {
      if (mounted.current) setBusy('')
      void load()
    }
  }, [submitGoal, editing, load])

  /** Plan if needed, activate, then arm — the whole sequence behind one button.
   *
   * The global Start only ARMS the driver; it does not activate anything. Pressing
   * it on a draft therefore armed a run with nothing to pursue and produced total
   * silence, which is exactly what happened to the operator: driver running, goal
   * still ``draft``, no events, no explanation. Sequencing it here means Start
   * means go, and the steps stay separately available for anyone who wants them.
   */
  const startGoal = useCallback(async (goal: GoalRow) => {
    const id = goal.id ?? ''
    if (!id) return
    const total = (goal.leaves && typeof goal.leaves === 'object' && !Array.isArray(goal.leaves))
      ? ((goal.leaves as { total?: number }).total ?? 0)
      : 0
    setBusy('start')
    setNote('')
    try {
      if (total === 0) {
        // Their own rule: starting a goal with no steps plans it first.
        setNote('planning steps…')
        await apiRef.current.post(`${BASE}/goals/decompose`, { id })
      }
      if (goal.status === 'draft') {
        setNote('activating…')
        await apiRef.current.post(`${BASE}/goals`, { id, status: 'active' })
      }
      setNote('starting…')
      await apiRef.current.post(`${BASE}/start`, { mode: 'autonomous', goal_ids: [id] })
      setNote('running')
    } catch (error) {
      setNote(error instanceof Error ? `start failed: ${error.message}` : 'start failed')
    } finally {
      if (mounted.current) setBusy('')
      void load()
    }
  }, [load])

  /** Load an existing draft into the form. Edit and create share one submit path
   * because the declare route merges by id, so there is no second write to keep
   * in step with the first. */
  const startEdit = useCallback((goal: GoalRow) => {
    const leaves = Array.isArray(goal.leaf_rows) ? goal.leaf_rows : []
    setForm({
      title: goal.title ?? '',
      statement: goal.statement ?? '',
      root: goal.scope?.root ?? '',
      trust: goal.scope?.worker_trust || 'normal',
      steps: leaves.map(leaf => ({
        id: leaf.id ?? '',
        title: leaf.title ?? '',
        task: leaf.intent_text ?? '',
        produces: leaf.produces ?? '',
        after: (leaf.depends_on ?? []).join(', '),
      })),
    })
    setEditing(goal.id ?? '')
    setShowDeclare(true)
    setNote('')
  }, [])

  const goals = state?.goals ?? []
  const activeGoals = goals.filter(g => g.status === 'active')
  /** Goals a global Start would actually set running: already active, or planned
   *  and waiting. Used for the tooltip so the button says what it will do. */
  const startableGoals = goals.filter(g => g.status === 'active' || g.status === 'ready'
    || (g.status === 'draft' && (g.leaf_rows?.length ?? 0) > 0))
  const running = Boolean(state?.running)
  const mode = state?.mode ?? 'advisory'

  return (
    <div className="ow-stack-body ow-cond">
      <div className="ow-mini" style={{ alignItems: 'center' }}>
        <span
          className="ow-mini-rail"
          style={{ background: running ? 'var(--ok)' : 'var(--muted)' }}
        />
        <div>
          <div className="ow-mini-title">
            {running ? 'Running autonomously' : 'Stopped'}
            <span className="ow-mini-chip">{mode}</span>
            {state?.holding && <span className="ow-mini-chip">holding</span>}
          </div>
          {state?.blocking_reason
            ? <div className="ow-mini-when">{state.blocking_reason}</div>
            : <div className="ow-mini-when">{goals.length} goal(s) declared</div>}
        </div>
        <span className="ow-stack-actions">
          {running
            ? (
              <Btn disabled={busy !== ''} onClick={() => void act('stop', `${BASE}/stop`, { verb: 'drain' })}>
                Stop
              </Btn>
            )
            : (
              // Never disabled while the driver is stopped. Gating this on "some goal
              // is currently active" conflated two different things — whether the LOOP
              // is armed, and whether any goal is presently dispatchable — and it
              // stranded the operator: stop the run, let the goal reach
              // `awaiting_confirmation` or `holding`, and Start went dead with the
              // tooltip "nothing is active yet" and no way forward.
              //
              // `goal_ids` is deliberately omitted rather than pinned to whatever is
              // active this second: empty means "every dispatchable goal", so a goal
              // activated after the loop was armed is picked up instead of being
              // silently excluded from the run.
              <Btn
                disabled={busy !== ''}
                title={startableGoals.length > 0
                  ? `start ${startableGoals.length} goal(s) and arm the loop`
                  : 'arm the loop — no goal is ready, so it will idle until one is'}
                onClick={() => void startAll()}
              >
                Start
              </Btn>
            )}
        </span>
      </div>

      {/* Planning is the one budget whose right value only the operator knows: six
          modules planned in under a minute, a vague objective over an unfamiliar
          tree can take several. It shipped as a 40s constant and timed out on the
          first real goal, so it is a field rather than a number in the source. */}
      <div className="ow-cond-setting">
        <span>Planner may think for</span>
        <Input
          className="ow-cond-secs"
          value={timeoutDraft !== '' ? timeoutDraft : String(state?.planner_timeout_secs ?? 300)}
          inputMode="numeric"
          onChange={event => setTimeoutDraft(event.target.value.replace(/[^0-9]/g, ''))}
        />
        <span>seconds</span>
        <Btn
          disabled={busy !== '' || timeoutDraft === ''}
          onClick={() => {
            void act('settings', `${BASE}/settings`, {
              planner_timeout_secs: Number(timeoutDraft),
            })
            setTimeoutDraft('')
          }}
        >
          Save
        </Btn>
        {(state?.planner_timeout_bounds?.length ?? 0) === 2 && (
          <span className="ow-cond-hint">
            {state?.planner_timeout_bounds?.[0]}–{state?.planner_timeout_bounds?.[1]}s
          </span>
        )}
      </div>

      {note && <p className="ow-stack-sub ow-cond-note">{note}</p>}
      {view === 'goals' && (
        <>

      {/* ---- the goal list ---- */}
      {goals.length === 0
        ? <p className="ow-stack-empty">No goals yet. Declare one below.</p>
        : goals.map(goal => (
          <div className="ow-mini" key={goal.id ?? Math.random()}>
            <span
              className="ow-mini-rail"
              style={{ background: goal.dispatchable ? 'var(--ok)' : 'var(--warn)' }}
            />
            <div>
              <div className="ow-mini-title">
                {goal.title || goal.id}
                <span className="ow-mini-chip">{goal.status}</span>
                {leafCount(goal) && <span className="ow-mini-chip">{leafCount(goal)}</span>}
              </div>
              {goal.why && <div className="ow-mini-desc" title={goal.why}>{goal.why}</div>}
              {/* Shown for EVERY status, not just drafts. Hiding the plan the moment
                  a goal started was exactly backwards: while it runs is when the
                  operator most wants to see which step is open, which closed, and
                  what each is waiting on. */}
              {(goal.leaf_rows?.length ?? 0) > 0 && (
                <ol className="ow-cond-plan">
                  {(goal.leaf_rows ?? []).map(leaf => (
                    <li key={leaf.id} data-closed={leaf.status === 'closed' ? 'true' : undefined}>
                      <code>{leaf.id}</code> {leaf.title}
                      {leaf.status && leaf.status !== 'open' && (
                        <span className="ow-mini-chip">{leaf.status}</span>
                      )}
                      {leaf.produces && <span className="ow-cond-plan-file"> → {leaf.produces}</span>}
                      {(leaf.depends_on?.length ?? 0) > 0 && (
                        <span className="ow-cond-plan-after"> after {leaf.depends_on?.join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              {(goal.workers?.length ?? 0) > 0 && (
                <div className="ow-cond-workers">
                  <span className="ow-cond-workers-head">
                    {goal.workers?.length} worker session(s)
                  </span>
                  {(goal.workers ?? []).map(worker => (
                    <div className="ow-cond-worker" key={worker.slot}>
                      <span className="ow-truncate">{worker.title || worker.slot}</span>
                      {worker.running && <span className="ow-mini-chip">running</span>}
                      <span className="ow-cond-worker-rows">{worker.messages ?? 0} rows</span>
                      <Btn
                        disabled={busy !== ''}
                        title="retire this worker session (its transcript is archived)"
                        onClick={() => {
                          if (!window.confirm(
                            `Remove worker session “${worker.title || worker.slot}”?`
                            + (worker.running ? '\n\nIt is mid-turn and will be stopped.' : '')
                            + '\n\nThe transcript is archived, not deleted.'
                          )) return
                          void act('remove session', `${BASE}/sessions/remove`,
                                   { slot: worker.slot, force: !!worker.running })
                        }}
                      >
                        Remove
                      </Btn>
                    </div>
                  ))}
                </div>
              )}
              <div className="ow-mini-when">{goal.id}</div>
            </div>
            {/* Actions BY STATUS. Every one of these but Remove used to be behind
                `status === 'draft'`, so the moment a goal started the only thing an
                operator could do to it was delete it — including a goal sitting in
                `awaiting_confirmation`, whose whole point is that it is waiting for
                a human to say yes. */}
            <span className="ow-stack-actions">
              {(goal.status === 'draft' || goal.status === 'ready') && (
                <Btn
                  disabled={busy !== ''}
                  title={goal.status === 'ready'
                    ? 'plan it again — nothing has started, so re-planning is safe'
                    : 'ask the planner to break this goal into steps'}
                  onClick={() => void act('decompose', `${BASE}/goals/decompose`, { id: goal.id })}
                >
                  {busy === 'decompose'
                    ? 'Planning…'
                    : goal.status === 'ready' ? 'Re-plan steps' : 'Decompose to steps'}
                </Btn>
              )}
              {/* Editable until it is terminal. `POST /conductor/goals` MERGES on an
                  existing id, so this is an update rather than a second goal. */}
              {!TERMINAL_STATUSES.has(goal.status ?? '') && (
                <Btn
                  disabled={busy !== ''}
                  title={goal.status === 'draft'
                    ? 'edit this draft'
                    : 'edit the objective, scope and steps of this running goal'}
                  onClick={() => startEdit(goal)}
                >
                  Edit
                </Btn>
              )}
              {(goal.status === 'draft' || goal.status === 'ready') && (
                <Btn
                  disabled={busy !== ''}
                  title="mark it active without arming the loop"
                  onClick={() => void act('activate', `${BASE}/goals`, { id: goal.id, status: 'active' })}
                >
                  Activate
                </Btn>
              )}
              {RESUMABLE_STATUSES.has(goal.status ?? '') && (
                <Btn
                  disabled={busy !== ''}
                  title="plan if needed, activate, and start running"
                  onClick={() => void startGoal(goal)}
                >
                  {busy === 'start' ? '…' : (goal.status === 'draft' || goal.status === 'ready') ? 'Start' : 'Resume'}
                </Btn>
              )}
              {/* The driver may never close a goal itself — a machine predicate or the
                  operator does (I8). `awaiting_confirmation` IS the driver asking, so
                  without this button the question it asks has no answer. */}
              {goal.status === 'awaiting_confirmation' && (
                <Btn
                  disabled={busy !== ''}
                  title="every step is finished — confirm the objective is met"
                  onClick={() => void act('confirm', `${BASE}/goals`, { id: goal.id, status: 'done' })}
                >
                  {busy === 'confirm' ? '…' : 'Mark done'}
                </Btn>
              )}
              {/* Removing a goal takes its worker sessions with it — leaving them
                  behind was the leak: a worker is named `cm-<goal>-<leaf>`, so once
                  its goal is gone nothing in the panel can address it again. The
                  dialog names the count, and only then does it force past a turn in
                  flight; killing a running worker as an invisible side effect of
                  tidying a list is not something to do without asking. */}
              <Btn
                disabled={busy !== ''}
                title="remove this goal and its worker sessions"
                onClick={() => {
                  const workers = goal.workers ?? []
                  const live = workers.filter(w => w.running).length
                  const lines = [`Remove “${goal.title || goal.id}”?`]
                  if (workers.length > 0) {
                    lines.push('', `This also removes ${workers.length} worker session(s).`)
                    if (live > 0) lines.push(`${live} of them ${live === 1 ? 'is' : 'are'} mid-turn and will be stopped.`)
                    lines.push('Transcripts are archived, not deleted.')
                  }
                  if (!window.confirm(lines.join('\n'))) return
                  void act('remove', `${BASE}/goals/remove`, { id: goal.id, force: live > 0 })
                }}
              >
                Remove
              </Btn>
            </span>
          </div>
        ))}

      {/* ---- declare ---- */}
      <div className="ow-mini">
        <span className="ow-mini-rail" style={{ background: 'var(--muted)' }} />
        <div style={{ width: '100%' }}>
          <div className="ow-mini-title">
            {editing ? 'Edit goal' : 'Declare a goal'}
            {editing && <span className="ow-mini-chip">{editing}</span>}
          </div>
          {showDeclare
            ? (
              <div className="ow-cond-form">
                <label className="ow-cond-field">
                  <span>Goal</span>
                  <Input
                    value={form.title}
                    placeholder="Chess engine"
                    onChange={event => setField('title', event.target.value)}
                  />
                </label>

                <label className="ow-cond-field">
                  <span>What done looks like</span>
                  <textarea
                    className="ow-cond-text"
                    rows={3}
                    value={form.statement}
                    placeholder="Build a chess engine in pure Python with no dependencies. Every module carries its own runnable tests."
                    onChange={event => setField('statement', event.target.value)}
                  />
                </label>

                <label className="ow-cond-field">
                  <span>Working directory</span>
                  <Input
                    value={form.root}
                    placeholder="/path/to/your/project"
                    onChange={event => setField('root', event.target.value)}
                  />
                </label>

                <label className="ow-cond-field">
                  <span>Worker permissions</span>
                  <select
                    className="ow-cond-select"
                    value={form.trust}
                    onChange={event => setField('trust', event.target.value)}
                  >
                    {/* Without a grant the first tool call parks on an approval and
                        is denied after 180s, so an unattended goal never starts. */}
                    <option value="trust">Full — workers may read, write and run (unattended)</option>
                    <option value="trust_reads">Reads only — writes still ask you</option>
                    <option value="normal">Ask me for everything (will stall unattended)</option>
                  </select>
                </label>

                <div className="ow-cond-steps-head">
                  <span>Steps — write them yourself, or have the planner propose them</span>
                  <span className="ow-cond-step-actions">
                    <Btn onClick={addStep}>+ Add step</Btn>
                    {/* Reachable from HERE, not only from the goal list. Everything the
                        planner needs is already on screen at the moment the operator is
                        reading "No steps yet"; making them submit, hunt for the goal
                        they just made, and press a second button was three actions for
                        one intention. This saves the goal first because the planner
                        works on a stored goal, then plans it. */}
                    <Btn
                      disabled={busy !== ''}
                      title="save this goal, then have the planner break it into steps"
                      onClick={() => void declareAndDecompose()}
                    >
                      {busy === 'decompose' ? 'Planning…' : 'Decompose to steps'}
                    </Btn>
                  </span>
                </div>

                {form.steps.length === 0 && (
                  <p className="ow-cond-hint">
                    No steps yet. Add them by hand, or press “Decompose to steps” — that
                    saves the goal and asks the planner to propose them (it can take a
                    few minutes; progress appears in the Conductor chat).
                  </p>
                )}

                {form.steps.map((step, index) => (
                  <div className="ow-cond-step" key={index}>
                    <div className="ow-cond-step-row">
                      <Input
                        value={step.id}
                        placeholder="id (e.g. board)"
                        onChange={event => setStep(index, 'id', event.target.value)}
                      />
                      <Input
                        value={step.title}
                        placeholder="what this step is"
                        onChange={event => setStep(index, 'title', event.target.value)}
                      />
                      <Btn title="remove this step" onClick={() => removeStep(index)}>×</Btn>
                    </div>
                    <textarea
                      className="ow-cond-text"
                      rows={3}
                      value={step.task}
                      placeholder="The explicit instruction delivered to this worker. Say what to build, which files it owns, and what done means."
                      onChange={event => setStep(index, 'task', event.target.value)}
                    />
                    <div className="ow-cond-step-row">
                      <Input
                        value={step.produces}
                        placeholder="file it must produce (src/board.py)"
                        onChange={event => setStep(index, 'produces', event.target.value)}
                      />
                      <Input
                        value={step.after}
                        placeholder="runs after (comma-separated ids)"
                        onChange={event => setStep(index, 'after', event.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="ow-stack-actions">
                  <Btn disabled={busy !== ''} onClick={() => void declareForm()}>
                    {editing ? 'Save' : 'Declare'}
                  </Btn>
                  <Btn disabled={busy !== ''} onClick={() => { setShowDeclare(false); setEditing(''); setNote('') }}>Cancel</Btn>
                </div>
              </div>
            )
            : <Btn onClick={() => { setEditing(''); setShowDeclare(true) }}>New goal…</Btn>}
        </div>
      </div>

        </>
      )}

      {/* ---- the event stream ---- */}
      {view === 'events' && (<>
      <div className="ow-cond-events-head">
        <span className="ow-stack-sub">Events — newest last</span>
        {/* Clears the CHAT, not this event list. The two are different surfaces and
            the button lives here because this is the part of the chat column the app
            owns. Confirmed first: it drops the agent's conversation as well as the
            visible rows, which is not something to do on a mis-click. */}
        <span className="ow-cond-step-actions">
          <Btn
            disabled={busy !== ''}
            title="empty the Conductor chat and the agent's memory of it (the transcript is archived, not deleted)"
            onClick={() => {
              if (!window.confirm(
                'Clear the Conductor chat?\n\nThis removes the visible messages AND the '
                + "agent's memory of them, so it starts fresh. The transcript is archived "
                + 'rather than deleted.'
              )) return
              void act('clear chat', `${BASE}/chat/clear`)
            }}
          >
            {busy === 'clear chat' ? 'Clearing…' : 'Clear chat'}
          </Btn>
          {/* Clears the EVENT LEDGER, which is the audit trail — so it rolls it into
              the next generation rather than deleting rows, and refuses while an
              action has no recorded outcome (those rows are what the crash-recovery
              pass works from). The 409 comes back with the count, and a second press
              forces it once the operator has seen that. */}
          <Btn
            disabled={busy !== ''}
            title="start a fresh event list; the current rows are kept in the previous ledger generation"
            onClick={async () => {
              if (!window.confirm(
                'Clear the event list?\n\nThe rows are rolled into the previous ledger '
                + 'generation, not deleted, so the audit trail survives.'
              )) return
              setBusy('clear events')
              setNote('')
              try {
                await apiRef.current.post(`${BASE}/events/clear`, {})
                setNote('events cleared')
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                // 409 means actions are still unreconciled — say so plainly and let
                // the operator decide, rather than forcing on their behalf.
                if (/outcome|409/i.test(message) && window.confirm(
                  'Some actions have no recorded outcome yet.\n\n'
                  + 'Clearing now discards what the recovery pass uses to close them. '
                  + 'Clear anyway?'
                )) {
                  try {
                    await apiRef.current.post(`${BASE}/events/clear`, { force: true })
                    setNote('events cleared (forced)')
                  } catch (retry) {
                    setNote(retry instanceof Error ? `clear events failed: ${retry.message}` : 'clear events failed')
                  }
                } else {
                  setNote(`clear events failed: ${message}`)
                }
              } finally {
                if (mounted.current) setBusy('')
                void load()
              }
            }}
          >
            {busy === 'clear events' ? 'Clearing…' : 'Clear events'}
          </Btn>
        </span>
      </div>
      {rows.length === 0
        ? <p className="ow-stack-empty">Nothing yet. Events appear here as the driver acts.</p>
        : (
          <div className="ow-cond-events">
            {rows.filter(r => r.event_type === 'outcome' || r.verdict === 'escalate' || r.verdict === 'refuse')
              .slice(-24)
              .map((row, index) => {
                const ok = row.outcome === 'success'
                return (
                  <div className="ow-cond-event" key={`${row.ts ?? index}-${index}`}>
                    <span className="ow-cond-when">{clock(row.ts)}</span>
                    <Badge variant={ok ? 'ok' : 'warn'}>{row.action_class ?? '?'}</Badge>
                    <span className="ow-cond-target">{shortResource(String(row.resource ?? ''))}</span>
                    <span className="ow-cond-why" title={row.detail || row.reason || ''}>
                      {row.detail || row.reason || ''}
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </>)}
    </div>
  )
}
