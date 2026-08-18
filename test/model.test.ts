import { describe, expect, it } from 'vitest'
import type { Artifact, ChatSlot, CronJob, SessionSummary } from '../src/types'
import {
  describeSilence,
  explainRank,
  rankWorkItem,
  ACK_WINDOW_MS,
  BRIEFING_LIMIT,
  applyInstructed,
  applySetAside,
  DONE_WINDOW_MS,
  inDoneWindow,
  pendingPermissions,
  responseVerb,
  fleetBriefing,
  titleOverlap,
  titleWords,
  normalizeWorkItems as normalizeWorkItemsWithCopy,
  searchWorkItems,
  sortWorkItems,
  workCounts,
  type WorkItem,
  type WorkSources,
} from '../src/model'

function normalizeWorkItems(input: WorkSources, summaries: Record<string, SessionSummary> = {}) {
  return normalizeWorkItemsWithCopy(input, (key, values) => (
    [key, ...Object.values(values ?? {})].join(':')
  ), summaries)
}

function sources(overrides: Partial<WorkSources> = {}): WorkSources {
  return {
    slots: [],
    approvals: [],
    agents: [],
    workflows: [],
    crons: [],
    artifacts: [],
    ...overrides,
  }
}

function slot(overrides: Partial<ChatSlot> = {}): ChatSlot {
  return {
    key: 'session-1',
    title: 'Crew Companion polish',
    messages: 4,
    running: false,
    last_ts: '2026-08-10T18:00:00Z',
    ...overrides,
  }
}

describe('normalizeWorkItems', () => {
  it('treats a session as one reference on a work item', () => {
    const [item] = normalizeWorkItems(sources({ slots: [slot()] }))
    expect(item.title).toBe('Crew Companion polish')
    expect(item.references).toContainEqual(expect.objectContaining({ kind: 'session', id: 'session-1' }))
  })

  it('merges approvals and agents into their referenced session instead of duplicating rows', () => {
    const items = normalizeWorkItems(sources({
      slots: [slot()],
      approvals: [{ id: 'approval-1', slot: 'session-1', tool: 'write' }],
      agents: [{ id: 'agent-1', task: 'Fix the footer', done: false, parent: 'session-1', agent: 'kirocrew', started: 10 }],
    }))
    expect(items).toHaveLength(1)
    expect(items[0].state).toBe('needs-you')
    expect(items[0].action).toBe('review-approval')
    expect(items[0].references.map(ref => ref.kind)).toEqual(['session', 'approval', 'agent'])
  })

  it('keeps artifacts as output-centered work items even when they reference a session', () => {
    const artifact: Artifact = {
      slug: 'status-draft',
      name: 'Weekly status draft',
      kind: 'markdown',
      source: 'dashboard',
      session_key: 'session-1',
      description: 'Ready to review',
      tags: [],
      version: 1,
      created_at: '2026-08-10T17:00:00Z',
      updated_at: '2026-08-10T17:30:00Z',
    }
    const items = normalizeWorkItems(sources({ slots: [slot()], artifacts: [artifact] }))
    expect(items.map(item => item.id)).toEqual(expect.arrayContaining(['session:session-1', 'artifact:status-draft']))
    expect(items.find(item => item.id === 'artifact:status-draft')?.sessionKey).toBe('session-1')
  })

  it('keeps failures visible as issues without misclassifying them as user actions', () => {
    const monitor: CronJob = {
      id: 'monitor-1',
      name: 'PR watch',
      message: 'watch',
      enabled: true,
      schedule: 'every 5m',
      last_status: 'error',
      last_error: 'Check failed',
    }
    const items = normalizeWorkItems(sources({
      slots: [slot({ source_links: [{ provider: 'github', number: 2051, url: 'https://github.com/kirodotdev/KiroCrew/pull/2051', ci: 'failed', state: 'open' }] })],
      crons: [monitor],
    }))
    // A failed run is unfinished work, so BOTH are user actions. The old rule
    // said a failed monitor "is not actionable" and parked it in Done wearing an
    // Issue badge — which claimed the outcome had happened and had failed at once.
    // Its last check can simply be run again.
    expect(workCounts(items)['needs-you']).toBe(2)
    expect(items.find(item => item.id === 'session:session-1')?.state).toBe('needs-you')
    const failedMonitor = items.find(item => item.id === 'monitor:monitor-1')
    expect(failedMonitor?.state).toBe('needs-you')
    expect(failedMonitor?.retryPath).toBe('/api/crons/monitor-1/run')
  })

  it('does not treat optional or rhetorical assistant follow-ups as required handoffs', () => {
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'options', has_options: true, options: ['Continue', 'Stop'] }),
        slot({ key: 'optional', waiting_for_input: true, last_message: 'Would you like me to do anything else?' }),
        slot({ key: 'rhetorical', waiting_for_input: true, last_message: 'What changed? I refactored the work model.' }),
      ],
    }))

    expect(items.every(item => item.state === 'done')).toBe(true)
    expect(items.every(item => item.action === 'open')).toBe(true)
  })

  it('keeps unfamiliar but concrete waiting requests visible', () => {
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'confirmation', waiting_for_input: true, last_message: 'Can I proceed with the production deployment?' }),
        slot({ key: 'upload', waiting_for_input: true, last_message: 'Please upload the final logo.' }),
      ],
    }))

    expect(items.every(item => item.state === 'needs-you')).toBe(true)
    expect(items.every(item => item.action === 'reply')).toBe(true)
    expect(items.map(item => item.summary)).toEqual([
      'Can I proceed with the production deployment?',
      'Please upload the final logo.',
    ])
  })

  it('does not demand attention for reported completions in any language', () => {
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'zh', waiting_for_input: true, last_message: '🎉 完成!你的翻译 PR 已合并: https://example.test/pull/2051' }),
        slot({ key: 'en', waiting_for_input: true, last_message: 'Goal completed: one review-ready PR opened.' }),
        slot({ key: 'check', waiting_for_input: true, last_message: '✅ Merged and deployed.' }),
      ],
    }))

    expect(items.every(item => item.state === 'done')).toBe(true)
    expect(items.every(item => item.action === 'open')).toBe(true)
    expect(items.find(item => item.id === 'session:zh')?.summary).toContain('完成')
  })

  it('never presents leaked tool markup as work needing a reply', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({
        waiting_for_input: true,
        last_message: 'count <invoke name="shell"> <parameter name="command">cd /Users/example/Developer',
      })],
    }))

    expect(item.state).toBe('done')
    expect(item.action).toBe('open')
    expect(item.summary).toBe('recent_work_ready')
  })

  it('does not treat a statement without request evidence as needing input', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({ waiting_for_input: true, last_message: 'Here is the finished analysis of the polling loop.' })],
    }))

    expect(item.state).toBe('done')
    expect(item.summary).toBe('Here is the finished analysis of the polling loop.')
  })

  it('shows the concrete assistant request and preserves it across related activity', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({
        waiting_for_input: true,
        last_message: 'Should the notification open the relevant work thread or stay here?',
      })],
      agents: [{
        id: 'agent-1',
        task: 'Inspect notification behavior',
        done: false,
        parent: 'session-1',
        agent: 'kirocrew',
        started: 10,
      }],
      workflows: [{
        run_id: 'workflow-1',
        name: 'Notification review',
        status: 'failed',
        session_key: 'session-1',
        error: 'raw failure',
        event_count: 2,
      }],
    }))

    expect(item.state).toBe('needs-you')
    expect(item.action).toBe('reply')
    expect(item.summary).toBe('Should the notification open the relevant work thread or stay here?')
  })

  it('classifies an explicitly completed goal as Done despite the broad gateway waiting flag', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({
        waiting_for_input: true,
        last_message: 'Goal completed: one review-ready PR opened for notification status.',
      })],
    }))

    expect(item.state).toBe('done')
    expect(item.action).toBe('open')
    expect(item.summary).toBe('Goal completed: one review-ready PR opened for notification status.')
  })

  it('does not use content-only placeholders as the requested action', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({ waiting_for_input: true, last_message: '(code)' })],
    }))

    expect(item.state).toBe('done')
    expect(item.action).toBe('open')
    expect(item.summary).toBe('recent_work_ready')
  })

  it('keeps active recovery running when linked work has failed', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({ running: true })],
      agents: [{
        id: 'agent-1',
        task: 'Repair the build',
        done: true,
        parent: 'session-1',
        agent: 'kirocrew',
        started: 10,
        outcome: 'failed',
      }],
      workflows: [{
        run_id: 'workflow-1',
        name: 'Build recovery',
        status: 'failed',
        session_key: 'session-1',
        error: 'Retrying from the parent session',
        event_count: 3,
      }],
    }))

    expect(item.issue).toBe(true)
    expect(item.state).toBe('running')
  })

  it('replaces missing titles and raw failure details with user-facing copy', () => {
    const items = normalizeWorkItems(sources({
      slots: [slot({ title: undefined })],
      workflows: [{ run_id: 'run-1', name: 'Deploy', status: 'failed', session_key: null, error: '/tmp/raw-error', event_count: 1 }],
    }))
    expect(items.find(item => item.id === 'session:session-1')?.title).toBe('untitled_work')
    expect(items.find(item => item.id === 'workflow:run-1')).toEqual(expect.objectContaining({
      summary: 'workflow_failed_generic',
      action: 'discuss',
    }))
  })

  it('uses a project label instead of exposing its full local path', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({ project: '/Users/example/Developer/crew-companion' })],
    }))
    expect(item.provenance).toBe('crew-companion')
    expect(item.summary).toBe('recent_work_ready')
  })

  it('does not surface incognito sessions or the Conductor as work', () => {
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'private', memory_mode: 'incognito' }),
        slot({ key: 'crew-manager-conductor', title: 'Conductor' }),
      ],
    }))
    expect(items).toEqual([])
  })

  it('uses a readable goal title instead of a raw instruction prompt', () => {
    const [item] = normalizeWorkItems(sources({
      agents: [{
        id: 'agent-1',
        task: 'Read-only local PR review. Do not modify files, index, refs, or HEAD; do not run git commands.',
        done: true,
        parent: '',
        agent: 'reviewer',
        started: 10,
        outcome: 'failed',
      }],
    }))

    expect(item.title).toBe('Read-only local PR review')
    expect(item.title).not.toContain('Do not')
  })

  it('never offers Open toward a session that is not present', () => {
    const items = normalizeWorkItems(sources({
      agents: [{ id: 'agent-1', task: 'Check the build', done: true, parent: 'missing-session', agent: 'kirocrew', started: 10 }],
      workflows: [{ run_id: 'run-1', name: 'Deploy', status: 'finished', session_key: 'missing-session', error: null, event_count: 1 }],
      approvals: [{ id: 'approval-1', slot: 'missing-session', tool: 'shell' }],
      artifacts: [{ slug: 'draft', name: 'Draft', kind: 'markdown', session_key: 'missing-session', updated_at: '2026-08-10T10:00:00Z' }],
    }))

    expect(items.every(item => item.action !== 'open')).toBe(true)
    expect(items.every(item => item.sessionKey === undefined)).toBe(true)
  })
})

describe('intent summaries', () => {
  function summarized(intents: unknown[], extra: Record<string, unknown> = {}) {
    return { 'session-1': { enabled: true, intents, ...extra } } as never
  }

  it('folds finished goals into the Resume card and keeps them out of Done', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: false })] }),
      key => key,
      summarized([
        { title: 'Ship the thing', state: 'in-progress' },
        { title: 'Write the spec', state: 'done' },
        { title: 'Old spike', state: 'dropped' },
      ]),
    )
    // One card for the whole idle session, not three.
    expect(items).toHaveLength(1)
    const resume = items[0]
    expect(resume.state).toBe('needs-you')
    expect(resume.action).toBe('resume')
    expect(resume.goals).toEqual(['Ship the thing'])
    // The finished + dropped goals ride along as done, not as peers in Done.
    expect(resume.doneGoals).toEqual(['Write the spec', 'Old spike'])
    expect(items.some(item => item.state === 'done')).toBe(false)
  })

  it('keeps finished goals as their own Done cards when nothing is unfinished', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: false })] }),
      key => key,
      summarized([
        { title: 'Write the spec', state: 'done' },
        { title: 'Ship the thing', state: 'done' },
      ]),
    )
    expect(items.every(item => item.state === 'done')).toBe(true)
    expect(items).toHaveLength(2)
  })

  it('turns one session into one item per intent', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot()] }),
      key => key,
      summarized([
        { title: 'Ship the notification fix', state: 'done' },
        { title: 'Translate the gallery copy', state: 'needs-you', next_steps: [{ what: 'Run the merged PR once to confirm it works' }] },
      ]),
    )

    expect(items).toHaveLength(2)
    expect(items.map(item => item.title)).toEqual([
      'Translate the gallery copy',
      'Ship the notification fix',
    ])
    expect(items.every(item => item.sessionKey === 'session-1')).toBe(true)
  })

  it('treats a completed but unverified goal as needing the user, with its next step visible', () => {
    const [item] = normalizeWorkItemsWithCopy(
      sources({ slots: [slot()] }),
      key => key,
      summarized([{
        title: 'Merge the translation PR',
        state: 'needs-you',
        status: 'completed',
        verified: false,
        next_steps: [{ what: 'Open the merged PR and confirm the Korean strings render', why: 'Merged but never run' }],
      }]),
    )

    expect(item.state).toBe('needs-you')
    expect(item.summary).toBe('Open the merged PR and confirm the Korean strings render')
    expect(item.nextSteps?.[0].why).toBe('Merged but never run')
  })

  it('surfaces an unverified completion even while the session is busy elsewhere', () => {
    const [item] = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      key => key,
      summarized([{ title: 'Rebuild the bundle', state: 'needs-you', next_steps: [{ what: 'Check the output' }] }]),
    )

    // The session working on something else does not discharge the user's
    // outstanding verification.
    expect(item.state).toBe('needs-you')
  })

  it('leaves an open goal to the agent while the session executes', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      key => key,
      summarized([{ title: 'Explore the layout', state: 'in-progress' }]),
    )

    expect(items).toHaveLength(1)
    expect(items[0].state).toBe('running')
  })

  it('hands an idle session\'s unfinished goals back to the user as one card', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: false })] }),
      key => key,
      summarized([
        { title: 'Explore the layout', state: 'in-progress', last_touched_turn: 9, next_steps: [{ what: 'Pick a direction' }] },
        { title: 'Wire the backend', state: 'in-progress', last_touched_turn: 3 },
      ]),
    )

    // Nobody is executing, so the only actor who can move these is the user —
    // and a stopped session poses ONE decision, so it is ONE card.
    expect(items).toHaveLength(1)
    expect(items[0].state).toBe('needs-you')
    expect(items[0].action).toBe('resume')
    expect(items[0].unattendedGoals).toBe(2)
    // Naming them, not just counting them: a card reading "2 unfinished goals"
    // would force the user to open a thread to learn what is being asked.
    expect(items[0].goals).toEqual(['Explore the layout', 'Wire the backend'])
    // The card states the concrete next step of the goal touched last.
    expect(items[0].summary).toBe('Pick a direction')
  })

  it('says so plainly when a stopped session recorded no next step', () => {
    const [item] = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: false })] }),
      key => key,
      summarized([{ title: 'Explore the layout', state: 'in-progress' }]),
    )

    // Better than dumping the initial-intent paragraph: no next step IS the
    // signal, because that is the state work gets forgotten in.
    expect(item.summary).toBe('no_next_step')
  })

  it('caps how many goals one session contributes, keeping handoffs first', () => {
    const items = normalizeWorkItemsWithCopy(
      // Executing, so open goals stay individual and the cap still applies.
      sources({ slots: [slot({ running: true })] }),
      key => key,
      summarized([
        { title: 'Oldest open goal', state: 'in-progress', last_touched_turn: 2 },
        { title: 'Newest open goal', state: 'in-progress', last_touched_turn: 40 },
        { title: 'Middle open goal', state: 'in-progress', last_touched_turn: 20 },
        { title: 'Fourth open goal', state: 'in-progress', last_touched_turn: 10 },
        { title: 'Needs verifying', state: 'needs-you', last_touched_turn: 1 },
      ]),
    )

    expect(items).toHaveLength(3)
    expect(items.map(item => item.title)).toEqual([
      'Needs verifying',
      'Newest open goal',
      'Middle open goal',
    ])
  })

  it('falls back to the session when summaries are off or absent', () => {
    const off = normalizeWorkItemsWithCopy(
      sources({ slots: [slot()] }),
      key => key,
      { 'session-1': { enabled: false, intents: [{ title: 'Ignored' }] } } as never,
    )
    const missing = normalizeWorkItems(sources({ slots: [slot()] }))

    expect(off[0].id).toBe('session:session-1')
    expect(missing[0].id).toBe('session:session-1')
  })

  it('does not call an abandoned goal an issue', () => {
    const [item] = normalizeWorkItemsWithCopy(
      sources({ slots: [slot()] }),
      key => key,
      summarized([{ title: 'Old spike', state: 'dropped' }]),
    )

    // Dropping a goal is a decision the agent made, often the right one.
    // "Issue" is the wrong word for it.
    expect(item.state).toBe('done')
    expect(item.issue).toBe(false)
  })
})

describe('stall findings', () => {
  it('promotes a stalled session into the action queue as an issue', () => {
    const [item] = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      (key, values) => [key, ...Object.values(values ?? {})].join(':'),
      {},
      { 'session-1': { key: 'session-1', label: 'Crew Companion polish', silent_secs: 5400 } },
    )

    expect(item.state).toBe('needs-you')
    expect(item.issue).toBe(true)
    expect(item.action).toBe('open')
    expect(item.stalledFor).toBe(5400)
    expect(item.summary).toBe('stalled_for:1h 30m')
  })

  it('ignores a stall for a session that is not on the board', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot()] }),
      key => key,
      {},
      { 'some-other-session': { key: 'some-other-session', label: 'Gone', silent_secs: 900 } },
    )

    expect(items).toHaveLength(1)
    expect(items[0].state).toBe('done')
    expect(items[0].issue).toBe(false)
  })

  it('phrases silence the same way the backend does', () => {
    expect(describeSilence(60)).toBe('1 minute')
    expect(describeSilence(600)).toBe('10 minutes')
    expect(describeSilence(7200)).toBe('2 hours')
    expect(describeSilence(5400)).toBe('1h 30m')
  })

  it('promotes a repeating failure and says which tool', () => {
    const [item] = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      (key, values) => [key, ...Object.values(values ?? {})].join(':'),
      {},
      {},
      { 'session-1': { key: 'session-1', label: 'Fix the build', tool: 'shell', repeats: 4 } },
    )

    expect(item.state).toBe('needs-you')
    expect(item.issue).toBe(true)
    expect(item.loopRepeats).toBe(4)
    expect(item.summary).toBe('error_loop:shell:4')
  })

  it('lets the loop explain a session that is also stalled', () => {
    const [item] = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      (key, values) => [key, ...Object.values(values ?? {})].join(':'),
      {},
      { 'session-1': { key: 'session-1', label: 'Fix the build', silent_secs: 5400 } },
      { 'session-1': { key: 'session-1', label: 'Fix the build', tool: 'shell', repeats: 3 } },
    )

    // The loop is the more specific diagnosis, so its copy wins.
    expect(item.summary).toBe('error_loop:shell:3')
    expect(item.stalledFor).toBe(5400)
  })
})

describe('ordering', () => {
  function item(over: Partial<WorkItem> = {}): WorkItem {
    return {
      id: over.id ?? 'x',
      title: 'work',
      summary: 's',
      state: 'needs-you',
      issue: false,
      updatedAt: 1000,
      provenance: 'p',
      references: [],
      ...over,
    } as WorkItem
  }

  it('puts the longest wait first inside Needs you', () => {
    const sorted = sortWorkItems([
      item({ id: 'recent', updatedAt: 9000 }),
      item({ id: 'oldest', updatedAt: 1000 }),
      item({ id: 'middle', updatedAt: 5000 }),
    ])

    // The thing that has been sitting on the user longest leads.
    expect(sorted.map(i => i.id)).toEqual(['oldest', 'middle', 'recent'])
  })

  it('puts the most recent movement first inside Running', () => {
    const sorted = sortWorkItems([
      item({ id: 'long-running', state: 'running', updatedAt: 1000 }),
      item({ id: 'just-moved', state: 'running', updatedAt: 9000 }),
    ])

    // Running answers "what is happening now". "Looks stuck" is the stall
    // detector's job, and it promotes a wedged session out of this group.
    expect(sorted.map(i => i.id)).toEqual(['just-moved', 'long-running'])
  })

  it('keeps Done newest first, because that section is "Done recently"', () => {
    const sorted = sortWorkItems([
      item({ id: 'stale', state: 'done', updatedAt: 1000 }),
      item({ id: 'fresh', state: 'done', updatedAt: 9000 }),
    ])

    expect(sorted.map(i => i.id)).toEqual(['fresh', 'stale'])
  })

  it('sinks items with no timestamp instead of leading with them', () => {
    // A missing timestamp is unknown, not ancient — ascending order would
    // otherwise float every one of them to the top of the queue.
    const needsYou = sortWorkItems([
      item({ id: 'unknown', updatedAt: 0 }),
      item({ id: 'known', updatedAt: 5000 }),
    ])
    const done = sortWorkItems([
      item({ id: 'unknown', state: 'done', updatedAt: 0 }),
      item({ id: 'known', state: 'done', updatedAt: 5000 }),
    ])

    expect(needsYou.map(i => i.id)).toEqual(['known', 'unknown'])
    expect(done.map(i => i.id)).toEqual(['known', 'unknown'])
  })

  it('keeps state above everything else', () => {
    const sorted = sortWorkItems([
      item({ id: 'done-old', state: 'done', updatedAt: 100 }),
      item({ id: 'needs', state: 'needs-you', updatedAt: 9000 }),
      item({ id: 'running', state: 'running', updatedAt: 200 }),
    ])

    expect(sorted.map(i => i.id)).toEqual(['needs', 'running', 'done-old'])
  })

  it('no longer promotes a bare issue flag inside Needs you', () => {
    // `issue` alone is not a ranking signal any more — it is one reason among
    // several, and the score decides. `changeBlocked` is the real signal.
    const sorted = sortWorkItems([
      item({ id: 'bare-issue', issue: true, updatedAt: 9000 }),
      item({ id: 'real-signal', changeBlocked: true, updatedAt: 9500 }),
    ])

    expect(sorted.map(i => i.id)).toEqual(['real-signal', 'bare-issue'])
  })

  it('still ranks an issue first inside Running and Done', () => {
    // Those groups are not the attention queue, so the older cheap rule stands.
    const sorted = sortWorkItems([
      item({ id: 'done-plain', state: 'done', updatedAt: 9000 }),
      item({ id: 'done-issue', state: 'done', issue: true, updatedAt: 100 }),
    ])

    expect(sorted.map(i => i.id)).toEqual(['done-issue', 'done-plain'])
  })
})

describe('actionable issues', () => {
  const summarized = (intents: unknown[]) => (
    { 'session-1': { enabled: true, intents } } as never
  )

  it('puts the model-written stall reason on the card, not just in the bell', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      (key, values) => [key, ...Object.values(values ?? {})].join(':'),
      {},
      { 'session-1': { key: 'session-1', label: 'Work', silent_secs: 900, reason: 'It was running the test suite.' } },
    )

    // The requirement is that the decision happens in the LIST. A card showing
    // only a duration sends the user into the session to find out what stopped.
    expect(items[0].summary).toBe('stalled_because:It was running the test suite.:15 minutes')
  })

  it('falls back to the duration when no reason was generated', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      (key, values) => [key, ...Object.values(values ?? {})].join(':'),
      {},
      { 'session-1': { key: 'session-1', label: 'Work', silent_secs: 900 } },
    )

    expect(items[0].summary).toBe('stalled_for:15 minutes')
  })

  it('tells an issue apart from a change', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({
        source_links: [
          { provider: 'github', number: 3188, url: 'https://github.com/o/r/pull/3188', kind: 'change' },
          { provider: 'github', number: 42, url: 'https://github.com/o/r/issues/42', kind: 'issue' },
        ],
      })],
    }))

    const kinds = item.references.map(ref => ref.kind)
    expect(kinds).toContain('change')
    expect(kinds).toContain('issue')
    expect(item.references.find(ref => ref.kind === 'issue')?.label).toBe('issue #42')
  })

  it('does not read a failing check off an issue', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({
        // An issue never carries ci/mergeable, but naming the kind states the rule
        // rather than relying on the field being absent.
        source_links: [{ provider: 'github', number: 42, url: 'https://github.com/o/r/issues/42', kind: 'issue', ci: 'failed' }],
      })],
    }))

    expect(item.issue).toBe(false)
    expect(item.state).not.toBe('needs-you')
  })

  it('claims motion only for the goal an executing session touched last', () => {
    const summary = {
      slot: 'work',
      enabled: true,
      stale: false,
      intents: [
        { title: 'Ship phase one', state: 'in-progress', last_touched_turn: 9, next_steps: [{ what: 'Land the rename' }] },
        { title: 'Rename the symbol', state: 'in-progress', last_touched_turn: 4, next_steps: [{ what: 'Rename it' }] },
      ],
    }

    const executing = normalizeWorkItems(
      sources({ slots: [slot({ key: 'work', running: true })] }),
      { work: summary as never },
    )
    // A session has one turn, so at most one goal can be moving.
    expect(executing.filter(i => i.state === 'running').length).toBe(2)
    expect(executing.filter(i => i.moving).length).toBe(1)
    expect(executing.find(i => i.moving)?.title).toBe('Ship phase one')

    const idle = normalizeWorkItems(
      sources({ slots: [slot({ key: 'work', running: false })] }),
      { work: summary as never },
    )
    // An idle session is moving nothing at all, whatever its bookkeeping says.
    expect(idle.some(i => i.moving)).toBe(false)
  })

  it('never lets two goals both claim to be running', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      key => key,
      // Joint-highest turn, and a third with none at all — the shape that used
      // to make several cards, or every card, claim motion at once.
      summarized([
        { title: 'Goal A', state: 'in-progress', last_touched_turn: 7 },
        { title: 'Goal B', state: 'in-progress', last_touched_turn: 7 },
        { title: 'Goal C', state: 'in-progress' },
      ]),
    )

    expect(items.filter(i => i.moving)).toHaveLength(1)
  })

  it('claims no motion when nothing carries a turn either', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ running: true })] }),
      key => key,
      summarized([
        { title: 'Goal A', state: 'in-progress' },
        { title: 'Goal B', state: 'in-progress' },
      ]),
    )

    // Exactly one, never all of them.
    expect(items.filter(i => i.moving)).toHaveLength(1)
  })

  it('explains rank only where order is scored', () => {
    // Needs you is the one group ordered by score, so it is the one group whose
    // order needs explaining. Running and Done are plain recency.
    const failing = { provider: 'github' as const, number: 3188, url: 'https://github.com/kirodotdev/KiroCrew/pull/3188', ci: 'failed' as const }
    const needsYou = normalizeWorkItems(sources({
      slots: [slot({ key: 'blocked', source_links: [failing] })],
    }))[0]
    const running = normalizeWorkItems(sources({
      slots: [slot({ key: 'busy', running: true, source_links: [failing] })],
    }))[0]

    expect(needsYou.state).toBe('needs-you')
    expect(explainRank(rankWorkItem(needsYou), key => key)).toContain('rank_change_blocked')
    // Same signal present, but the row renders no explanation because Running
    // is not scored — the gate is the state, not the signal.
    expect(running.state).toBe('running')
  })

  it('sends a failing linked change to Needs you, because it is actionable', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({
        source_links: [{
          provider: 'github',
          number: 3188,
          url: 'https://github.com/kirodotdev/KiroCrew/pull/3188',
          ci: 'failed',
          state: 'open',
        }],
      })],
    }))

    // It used to sit in Done wearing an Issue badge, which contradicted both the
    // completion model and the "an issue is a reason it needs you" rule.
    expect(item.state).toBe('needs-you')
    expect(item.issue).toBe(true)
    expect(item.action).toBe('open')
    expect(item.summary).toBe('linked_change_issue')
  })

  it('keeps a recovering failure in Running, not Needs you', () => {
    const [item] = normalizeWorkItems(sources({
      slots: [slot({
        running: true,
        source_links: [{
          provider: 'github',
          number: 3188,
          url: 'https://github.com/kirodotdev/KiroCrew/pull/3188',
          ci: 'failed',
        }],
      })],
    }))

    // The agent is still on it, so the next move is not yet the user's.
    expect(item.state).toBe('running')
  })

  it('puts a failed agent run in the queue with a way to re-run it', () => {
    const items = normalizeWorkItems(sources({
      agents: [{
        id: 'agent-1',
        task: 'Check the build',
        done: true,
        parent: '',
        agent: 'kirocrew',
        started: 10,
        outcome: 'failed',
      }],
    }))

    // This test used to assert 'done', pinning the belief that a dead run is not
    // actionable. Reading the error and re-running it is the action, and the
    // platform has an endpoint for exactly that.
    expect(items[0].state).toBe('needs-you')
    expect(items[0].retryPath).toBe('/api/spawn/agent-1/retry')
    expect(responseVerb(items[0])).toBe('unblock')
  })

  it('offers no retry for a run the platform cannot re-run', () => {
    const items = normalizeWorkItems(sources({
      agents: [{
        id: 'native:abc', task: 'Inline work', done: true, parent: '',
        agent: 'kirocrew', started: 10, outcome: 'failed',
      }],
    }))

    // Native sub-agents run inside the parent turn; the endpoint refuses them.
    expect(items[0].retryPath).toBeUndefined()
  })
})

describe('conductor briefing', () => {
  it('orders the briefing exactly as the list orders it', () => {
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'quiet', title: 'Quiet one', running: false, source_links: [{ provider: 'github', number: 1, url: 'u1', ci: 'failed', kind: 'change' }] }),
      ],
      approvals: [{ id: 'a1', source: 'tool', tool: 'shell', slot: 'gate', ts: 1 }],
    }))
    const lines = fleetBriefing(items, key => key)

    // Same derivation, not a second summary: the briefing calls sortWorkItems and
    // explainRank, so it cannot describe a different order than the list renders.
    const listOrder = sortWorkItems(items.filter(i => i.state === 'needs-you'))
      .map(i => i.title)
    const briefingOrder = lines
      .filter(line => /^\d+\. /.test(line))
      .map(line => line.replace(/^\d+\. /, '').split(' — ')[0])

    expect(briefingOrder).toEqual(listOrder.slice(0, briefingOrder.length))
  })

  it('says so plainly when nothing is waiting', () => {
    const lines = fleetBriefing([], key => key)
    expect(lines.some(line => line.includes('Nothing is waiting'))).toBe(true)
  })

  it('caps the briefing rather than dumping the queue', () => {
    const many = Array.from({ length: 12 }, (_, n) => ({
      id: `x${n}`, title: `Item ${n}`, summary: 's', state: 'needs-you' as const,
      issue: false, updatedAt: n, sessionKey: `s${n}`, provenance: 'p',
      action: 'open' as const, references: [],
    }))
    const lines = fleetBriefing(many as never, key => key)
    expect(lines.filter(line => /^\d+\. /.test(line))).toHaveLength(BRIEFING_LIMIT)
    expect(lines.some(line => line.includes('7 more waiting'))).toBe(true)
  })
})

describe('live duplicates', () => {
  it('flags two live sessions pointing at the same change', () => {
    const link = { provider: 'github', number: 7, url: 'https://github.com/o/r/pull/7', kind: 'change' as const }
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'first', title: 'Alpha work', running: true, last_ts: 100, source_links: [link] }),
        slot({ key: 'second', title: 'Beta work', running: true, last_ts: 200, source_links: [link] }),
      ],
    }))

    // The NEWER one is marked: advice reaching the session that started first
    // would arrive too late to change anything.
    const second = items.find(i => i.sessionKey === 'second')
    const first = items.find(i => i.sessionKey === 'first')
    expect(second?.duplicateOf?.sessionKey).toBe('first')
    expect(second?.duplicateOf?.because).toBe('same_change')
    expect(first?.duplicateOf).toBeUndefined()
  })

  it('flags two live sessions whose titles say the same thing', () => {
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'first', title: 'Rename the implementation symbol', running: true, last_ts: 100 }),
        slot({ key: 'second', title: 'Rename implementation symbol properly', running: true, last_ts: 200 }),
      ],
    }))

    expect(items.find(i => i.sessionKey === 'second')?.duplicateOf?.because).toBe('same_topic')
  })

  it('does not call two different bugs the same work', () => {
    // "Fix the login bug" vs "Fix the export bug" keep only one distinctive word
    // each in common with nothing. A warning that fires here would make every
    // warning worthless. Note "bug" survives the stopword list — the threshold is
    // what stops it carrying a match on its own (1 of 2 words = 0.5).
    expect(titleWords('Fix the login bug')).toEqual(['login', 'bug'])
    expect(titleOverlap('Fix the login bug', 'Fix the export bug')).toBeLessThan(0.6)
    expect(titleOverlap('Rename the symbol', 'Rename the symbol in tests')).toBeGreaterThanOrEqual(0.6)
  })

  it('never flags finished work', () => {
    const link = { provider: 'github', number: 7, url: 'u7', kind: 'change' as const }
    const items = normalizeWorkItems(sources({
      slots: [
        slot({ key: 'first', title: 'Alpha work', running: false, last_ts: 100, source_links: [link] }),
        slot({ key: 'second', title: 'Alpha work', running: false, last_ts: 200, source_links: [link] }),
      ],
    }))

    expect(items.every(i => !i.duplicateOf)).toBe(true)
  })

  it('never flags a session against itself', () => {
    const items = normalizeWorkItemsWithCopy(
      sources({ slots: [slot({ key: 'one', title: 'Ship the thing', running: true })] }),
      key => key,
      { one: { enabled: true, intents: [
        { title: 'Ship the thing', state: 'in-progress', last_touched_turn: 2 },
        { title: 'Ship the thing', state: 'in-progress', last_touched_turn: 1 },
      ] } } as never,
    )

    expect(items.every(i => !i.duplicateOf)).toBe(true)
  })
})

describe('instruction acknowledgement', () => {
  const NOW_ACK = 1_800_000_000_000
  function waiting(): WorkItem {
    return {
      id: 'session:a', title: 'Alpha', summary: 'waiting', state: 'needs-you',
      issue: false, updatedAt: 1, sessionKey: 'a', provenance: 'p',
      action: 'open', references: [],
    } as WorkItem
  }

  it('moves an instructed item to In progress right away', () => {
    // The platform will not report the session as running for a second or two.
    // Leaving the item in Needs you across that gap tells the user their
    // instruction did nothing.
    const [item] = applyInstructed([waiting()], { 'session:a': NOW_ACK }, NOW_ACK + 500)

    expect(item.state).toBe('running')
    expect(item.moving).toBe(true)
    expect(item.instructed).toBe(true)
  })

  it('lets the acknowledgement expire rather than standing forever', () => {
    // A session that failed to start would otherwise sit in In progress on the
    // strength of one POST, and the item would be lying.
    const [item] = applyInstructed(
      [waiting()], { 'session:a': NOW_ACK }, NOW_ACK + ACK_WINDOW_MS + 1,
    )

    expect(item.state).toBe('needs-you')
    expect(item.instructed).toBeUndefined()
  })

  it('yields to real state once the platform agrees', () => {
    const running = { ...waiting(), state: 'running' as const, moving: true }
    const [item] = applyInstructed([running], { 'session:a': NOW_ACK }, NOW_ACK + 500)

    // Not marked instructed: it is really running, so the optimism is spent.
    expect(item.instructed).toBeUndefined()
  })

  it('touches nothing when no instruction is pending', () => {
    const items = [waiting()]
    expect(applyInstructed(items, {}, NOW_ACK)).toBe(items)
  })

  it('only acknowledges the item that was instructed', () => {
    const other = { ...waiting(), id: 'session:b', sessionKey: 'b' }
    const out = applyInstructed([waiting(), other], { 'session:a': NOW_ACK }, NOW_ACK)

    expect(out[0].state).toBe('running')
    expect(out[1].state).toBe('needs-you')
  })
})

describe('pending permissions in the Conductor', () => {
  const label = (key: string) => (key === 'a' ? 'Alpha' : key)

  it('surfaces an approval blocking a session it instructed', () => {
    // Sending an instruction and then watching nothing happen was the bug: the
    // session was waiting for permission, and the Conductor said nothing.
    const out = pendingPermissions(
      [{ id: 'ap-1', slot: 'a', tool: 'write', tool_purpose: 'Edit the copy file.' }],
      ['a'],
      label,
    )

    expect(out).toHaveLength(1)
    expect(out[0].sessionLabel).toBe('Alpha')
    expect(out[0].tool).toBe('write')
    expect(out[0].purpose).toBe('Edit the copy file.')
  })

  it('ignores approvals for sessions the Conductor never touched', () => {
    // Every pending approval already appears in Needs you. The Conductor shows
    // only what it is responsible for, or it becomes a second approval inbox.
    const out = pendingPermissions(
      [{ id: 'ap-2', slot: 'other', tool: 'write' }],
      ['a'],
      label,
    )

    expect(out).toEqual([])
  })

  it('shows nothing when no session is being watched', () => {
    expect(pendingPermissions([{ id: 'ap-3', slot: 'a' }], [], label)).toEqual([])
  })

  it('names the tool even when the platform omits it', () => {
    const [only] = pendingPermissions([{ id: 'ap-4', slot: 'a' }], ['a'], label)
    expect(only.tool).toBe('a tool')
  })

  it('does not repeat one approval', () => {
    const row = { id: 'ap-5', slot: 'a', tool: 'write' }
    expect(pendingPermissions([row, row], ['a'], label)).toHaveLength(1)
  })
})

describe('response verb', () => {
  function needsYou(extra: Partial<WorkItem> = {}): WorkItem {
    return {
      id: 'x', title: 'X', summary: 's', state: 'needs-you', issue: false,
      updatedAt: 1, provenance: 'p', references: [], ...extra,
    } as WorkItem
  }

  it('names the response for each reason', () => {
    expect(responseVerb(needsYou({ action: 'reply' }))).toBe('answer')
    expect(responseVerb(needsYou({ unverified: true }))).toBe('verify')
    expect(responseVerb(needsYou({ unattendedGoals: 2 }))).toBe('resume')
  })

  it('groups the three interventions under one verb', () => {
    // Redirecting a loop, checking a silent session and fixing a red check are
    // different jobs; the badge names the pass and the card's line says which.
    expect(responseVerb(needsYou({ loopRepeats: 3 }))).toBe('unblock')
    expect(responseVerb(needsYou({ stalledFor: 900 }))).toBe('unblock')
    expect(responseVerb(needsYou({ changeBlocked: true }))).toBe('unblock')
  })

  it('labels an owed approval too, so the column has no holes', () => {
    // Collapsed, an approval card has no Approve/Reject visible. Without a badge
    // it was indistinguishable at a glance and its title fell out of line.
    expect(responseVerb(needsYou({ approvalKind: 'tool', permissionId: 'ap-1' }))).toBe('decide')
    expect(responseVerb(needsYou({ approvalKind: 'subagent', permissionId: 'ap-2' }))).toBe('decide')
  })

  it('gives every needs-you reason a verb', () => {
    // A hole in the column is a card that cannot be read at a glance.
    const reasons: Partial<WorkItem>[] = [
      { approvalKind: 'tool', permissionId: 'a' }, { action: 'reply' },
      { unverified: true }, { loopRepeats: 3 }, { stalledFor: 900 },
      { changeBlocked: true }, { unattendedGoals: 1 },
    ]
    for (const reason of reasons) {
      expect(responseVerb(needsYou(reason)), JSON.stringify(reason)).not.toBeNull()
    }
  })

  it('agrees with the ordering when several reasons apply', () => {
    // Same ranked signals, strongest first, so the badge and the item's position
    // cannot tell different stories.
    const item = needsYou({ action: 'reply', stalledFor: 900, unverified: true })
    const top = rankWorkItem(item).signals[0].signal

    expect(top).toBe('input_requested')
    expect(responseVerb(item)).toBe('answer')
  })

  it('skips amplifiers rather than leaving an item unlabelled', () => {
    // A big queue can outweigh nobody_on_it, but "12 queued" is not a response.
    const item = needsYou({ unattendedGoals: 1, queuedBehind: 12 })
    expect(rankWorkItem(item).signals[0].signal).toBe('queued_behind')
    expect(responseVerb(item)).toBe('resume')
  })

  it('labels nothing outside the needs-you queue', () => {
    expect(responseVerb(needsYou({ state: 'running', stalledFor: 900 }))).toBeNull()
    expect(responseVerb(needsYou({ state: 'done' }))).toBeNull()
  })
})

describe('set aside and the done window', () => {
  const NOW_ASIDE = 1_800_000_000_000
  function queued(extra: Partial<WorkItem> = {}): WorkItem {
    return {
      id: 'w1', title: 'W', summary: 's', state: 'needs-you', issue: false,
      updatedAt: NOW_ASIDE - 1000, provenance: 'p', references: [], ...extra,
    } as WorkItem
  }

  it('hides a snoozed item and counts it', () => {
    // The queue is re-derived every poll; without this record a dismissed item
    // returns within seconds.
    const out = applySetAside([queued()], { w1: NOW_ASIDE + 1000 }, {}, NOW_ASIDE)
    expect(out.items).toHaveLength(0)
    expect(out.snoozedCount).toBe(1)
  })

  it('brings a snoozed item back once the window passes', () => {
    const out = applySetAside([queued()], { w1: NOW_ASIDE - 1 }, {}, NOW_ASIDE)
    expect(out.items).toHaveLength(1)
    expect(out.items[0].state).toBe('needs-you')
  })

  it('treats Handled as user closure: the item shows as done', () => {
    const out = applySetAside([queued()], {}, { w1: NOW_ASIDE - 1000 }, NOW_ASIDE)
    expect(out.items[0].state).toBe('done')
    expect(out.items[0].issue).toBe(false)
  })

  it('lets new activity void a Handled mark', () => {
    // A session that comes back with a new question must never stay muted by an
    // old dismissal — the mark stores updatedAt at marking time for this reason.
    const fresh = queued({ updatedAt: NOW_ASIDE - 10 })
    const out = applySetAside([fresh], {}, { w1: NOW_ASIDE - 1000 }, NOW_ASIDE)
    expect(out.items[0].state).toBe('needs-you')
  })

  it('never touches items outside the queue', () => {
    const running = queued({ state: 'running' as const })
    const out = applySetAside([running], { w1: NOW_ASIDE + 1000 }, { w1: NOW_ASIDE }, NOW_ASIDE)
    expect(out.items[0].state).toBe('running')
  })

  it('keeps done items only inside the window, and keeps unknown timestamps', () => {
    const recent = queued({ state: 'done' as const, updatedAt: NOW_ASIDE - DONE_WINDOW_MS + 1000 })
    const old = queued({ id: 'w2', state: 'done' as const, updatedAt: NOW_ASIDE - DONE_WINDOW_MS - 1000 })
    // updatedAt 0 means the platform reported no timestamp; unknown is not
    // ancient, so dropping it would hide the item forever.
    const unknown = queued({ id: 'w3', state: 'done' as const, updatedAt: 0 })

    expect(inDoneWindow(recent, NOW_ASIDE)).toBe(true)
    expect(inDoneWindow(old, NOW_ASIDE)).toBe(false)
    expect(inDoneWindow(unknown, NOW_ASIDE)).toBe(true)
  })
})

describe('ranking', () => {
  const NOW = 1_800_000_000_000

  function ranked(over: Partial<WorkItem> = {}): WorkItem {
    return {
      id: over.id ?? 'x',
      title: 'work',
      summary: 's',
      state: 'needs-you',
      issue: false,
      updatedAt: NOW,
      provenance: 'p',
      references: [],
      ...over,
    } as WorkItem
  }

  it('ranks an owed approval above a session that merely went quiet', () => {
    const approval = rankWorkItem(ranked({ approvalKind: 'tool' }), NOW)
    const quiet = rankWorkItem(ranked({ stalledFor: 3600 }), NOW)

    expect(approval.score).toBeGreaterThan(quiet.score)
  })

  it('lets same-session queue depth raise an item, with a ceiling', () => {
    const alone = rankWorkItem(ranked({ approvalKind: 'tool' }), NOW)
    const queued = rankWorkItem(ranked({ approvalKind: 'tool', queuedBehind: 2 }), NOW)
    const flooded = rankWorkItem(ranked({ approvalKind: 'tool', queuedBehind: 99 }), NOW)

    expect(queued.score).toBeGreaterThan(alone.score)
    // Capped: a huge queue must not outweigh the kind of block it is.
    expect(flooded.score).toBeLessThan(alone.score + 100)
  })

  it('never lets age outrank an owed decision', () => {
    const oldQuiet = rankWorkItem(ranked({ updatedAt: NOW - 100 * 3_600_000 }), NOW)
    const freshApproval = rankWorkItem(ranked({ approvalKind: 'tool' }), NOW)

    expect(freshApproval.score).toBeGreaterThan(oldQuiet.score)
  })

  it('orders the attention queue by cost, not by the bare presence of an issue', () => {
    const sorted = sortWorkItems([
      ranked({ id: 'issue-only', issue: true, changeBlocked: true }),
      ranked({ id: 'approval', approvalKind: 'tool' }),
      ranked({ id: 'quiet', stalledFor: 1800 }),
    ], NOW)

    expect(sorted.map(i => i.id)).toEqual(['approval', 'quiet', 'issue-only'])
  })

  it('explains its position from the same signals that scored it', () => {
    const item = ranked({ approvalKind: 'subagent', queuedBehind: 2 })
    const why = explainRank(rankWorkItem(item, NOW), key => key)

    // Strongest signal first, at most two named.
    expect(why).toBe('rank_subagent_gaterank_joinrank_queued_behind')
  })

  it('says so plainly when nothing is pressing', () => {
    const why = explainRank(rankWorkItem(ranked(), NOW), key => key)
    expect(why).toBe('rank_nothing_pressing')
  })

  it('labels a sub-agent spawn gate differently from a tool approval', () => {
    const [gate] = normalizeWorkItemsWithCopy(
      sources({
        slots: [slot()],
        approvals: [{ id: 'a1', slot: 'session-1', source: 'subagent', tool: 'spawn_run' }],
      }),
      key => key,
    )
    const [tool] = normalizeWorkItemsWithCopy(
      sources({
        slots: [slot()],
        approvals: [{ id: 'a2', slot: 'session-1', source: 'dashboard', tool: 'write' }],
      }),
      key => key,
    )

    expect(gate.approvalKind).toBe('subagent')
    expect(gate.summary).toBe('subagent_gate_waiting')
    expect(tool.approvalKind).toBe('tool')
    expect(tool.summary).toBe('approval_waiting')
  })
})

describe('searchWorkItems', () => {
  it('searches titles, summaries, provenance, and references', () => {
    const items = normalizeWorkItems(sources({
      slots: [slot({ source_links: [{ provider: 'github', number: 2051, url: 'https://github.com/kirodotdev/KiroCrew/pull/2051' }] })],
    }))
    expect(searchWorkItems(items, '#2051')).toHaveLength(1)
    expect(searchWorkItems(items, 'crew companion')).toHaveLength(1)
    expect(searchWorkItems(items, 'missing')).toHaveLength(0)
  })
})
