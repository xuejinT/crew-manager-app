import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CrewOverviewApp from '../src/index'
import { appSdkMocks } from './mocks/app-sdk'

function renderApp() {
  return render(<CrewOverviewApp />)
}

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  // The view mode persists now, so a prior test's Goal click must not leak
  // into tests that assume the default Session view.
  localStorage.clear()
  appSdkMocks.get.mockImplementation(async (path: string) => {
    if (path === '/api/chat/slots') {
      return [
        {
          key: 'session-1',
          title: 'Crew Companion polish',
          messages: 4,
          running: false,
          last_ts: '2026-08-10T18:00:00Z',
        },
        {
          key: 'session-2',
          title: 'Docs cleanup',
          messages: 6,
          // Running, so it is stably present regardless of the Done 24h window
          // and needs no pending approval — a clean target for quote/instruct.
          running: true,
          last_ts: '2026-08-10T17:00:00Z',
        },
        {
          key: 'crew-manager-conductor',
          title: 'Conductor',
          messages: 0,
          running: false,
          last_ts: '2026-08-10T18:00:00Z',
        },
      ]
    }
    if (path === '/api/chat/slots/crew-manager-conductor') return { messages: [], running: false }
    if (path === '/api/approvals') return [{ id: 'approval-1', slot: 'session-1', tool: 'write' }]
    if (path === '/api/spawn') return { agents: [] }
    if (path === '/api/workflows/runs') return { runs: [] }
    if (path === '/api/crons') return { jobs: [] }
    if (path === '/api/artifacts') return { artifacts: [] }
    throw new Error(`Unexpected GET ${path}`)
  })
  appSdkMocks.post.mockResolvedValue({})
})

describe('Crew Manager Conductor boundaries', () => {
  it('goal view merges same-titled sessions into one card and split undoes it', async () => {
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.goal-memory')
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
    // Two sessions whose slot titles say the same job in DIFFERENT words. That is
    // no longer a deterministic merge (loose overlap chained the board into
    // blobs); it is the semantic pass's job, so the test stages the pass's
    // answer and asserts the whole loop: pairs merge the card, the model's name
    // labels it, its why line explains it, and the user's Split still wins.
    const now = new Date().toISOString()
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [
          { key: 's1', title: 'Ship the avatar upload flow', messages: 4, running: true, last_ts: now },
          { key: 's2', title: 'Avatar upload flow shipping', messages: 2, running: false, last_ts: now },
        ]
      }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      throw new Error(`Unexpected GET ${path}`)
    })
    appSdkMocks.post.mockImplementation(async (path: string) => {
      if (path === '/api/apps/crew-manager/goal-pass') {
        return {
          available: true,
          assignments: [
            { item_id: 'session:s1', cluster: 'new:avatar', confidence: 0.9, why: 'both ship the avatar upload flow' },
            { item_id: 'session:s2', cluster: 'new:avatar', confidence: 0.9, why: 'both ship the avatar upload flow' },
          ],
          names: [{ cluster: 'new:avatar', name: 'Avatar upload flow' }],
        }
      }
      return {}
    })
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // One merged card, folded by default (nothing needs the user): digest shows.
    // It carries the NAME the pass wrote, not the members' count.
    expect(await screen.findByText('Avatar upload flow', { selector: '.ow-goalcard-title' }))
      .toBeInTheDocument()
    expect(screen.queryByText('2 sessions, one goal')).not.toBeInTheDocument()
    // A merged card has to say what it merged on: the reason is what Split is
    // judged against, so an unexplained merge is one the user cannot check. A
    // semantic merge quotes the model's own one-line rationale.
    expect(screen.getByText('Grouped because both ship the avatar upload flow.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Avatar upload flow' }))
    // Member rows carry a status dot + title; the lead is a row too (the header
    // names the GROUP, not a member, so nothing is duplicated).
    expect(await screen.findByTestId('work-item-session:s1')).toBeInTheDocument()
    expect(screen.getByTestId('work-item-session:s2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Split Ship the avatar upload flow' }))
    // The ruling takes effect immediately AND outranks the semantic pair: two
    // plain cards, no merged header, even though the pass still says "merge".
    await waitFor(() => expect(
      screen.queryByText('Avatar upload flow', { selector: '.ow-goalcard-title' }),
    ).not.toBeInTheDocument())
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
  })

  it('gives a deterministically-merged card the model outcome name over the derived label', async () => {
    // Two sessions on the same PR merge deterministically (same_change), so the
    // derived name would be the bare ref label "github #6". The naming rework
    // sends even an already-derived-named cluster to the pass so the model can
    // write an OUTCOME title — and it wins over the quote.
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.goal-memory')
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
    localStorage.removeItem('crew-manager.initiative-collapsed')
    const now = new Date().toISOString()
    const link = { kind: 'change', url: 'https://github.com/o/r/pull/6', number: 6, provider: 'github' }
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [
          { key: 's1', title: 'Open a PR for the art', messages: 4, running: true, last_ts: now, source_links: [link] },
          { key: 's2', title: 'Rebase after 8 merged', messages: 2, running: true, last_ts: now, source_links: [link] },
        ]
      }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      throw new Error(`Unexpected GET ${path}`)
    })
    // The pass echoes the unnamed existing cluster's own key back with an
    // outcome name; a static name string cannot, since the key is derived.
    appSdkMocks.post.mockImplementation(async (path: string, body?: any) => {
      if (path === '/api/apps/crew-manager/goal-pass') {
        const key = body?.clusters?.[0]?.key
        return key
          ? { available: true, assignments: [], names: [{ cluster: key, name: 'Ship the app store art' }] }
          : { available: false }
      }
      return {}
    })
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // The model's outcome title, not the derived "github #6" ref label. Scoped
    // to the Goals region: the PR rail now shares the .ow-goalcard-title class.
    expect(await screen.findByText('Ship the app store art', { selector: 'section[aria-label="Work by goal"] .ow-goalcard-title' }))
      .toBeInTheDocument()
    expect(screen.queryByText('github #6', { selector: 'section[aria-label="Work by goal"] .ow-goalcard-title' })).not.toBeInTheDocument()
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
    localStorage.removeItem('crew-manager.goal-memory')
  })

  it('groups a session with the loop it started, naming the card by the session', async () => {
    // Recorded provenance is a fact, so it groups even inside one session — and
    // such a card must not be named by counting sessions ("1 sessions, one goal").
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.goal-memory')
    localStorage.removeItem('crew-manager.initiative-collapsed')
    const now = new Date().toISOString()
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [{ key: 's1', title: 'Ship the avatar upload flow', messages: 4, running: true, last_ts: now }]
      }
      if (path === '/api/autonudge') {
        return {
          loops: [{
            id: 'nudge-1',
            slot_key: 's1',
            active: true,
            message: 'watch the upload PR until checks pass',
            cycle_count: 2,
            max_cycles: 8,
            last_fire_ts: now,
          }],
        }
      }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      throw new Error(`Unexpected GET ${path}`)
    })
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // One card, named by its session — never "1 sessions, one goal".
    expect(await screen.findByText('Ship the avatar upload flow', { selector: '.ow-goalcard-title' }))
      .toBeInTheDocument()
    expect(screen.queryByText('1 sessions, one goal')).not.toBeInTheDocument()
    expect(screen.getByText('Grouped because watch the upload PR until checks pass was started by this work.'))
      .toBeInTheDocument()
    // Both the session's work and its loop are members of that one card.
    fireEvent.click(screen.getByRole('button', { name: 'Expand Ship the avatar upload flow' }))
    expect(await screen.findByTestId('work-item-session:s1')).toBeInTheDocument()
    expect(screen.getByTestId('work-item-loop:nudge-1')).toBeInTheDocument()
    localStorage.removeItem('crew-manager.goal-memory')
  })

  it('names a lone goal card by its session, and drops the shell when that would repeat the row', async () => {
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.goal-memory')
    localStorage.removeItem('crew-manager.initiative-collapsed')
    const now = new Date().toISOString()
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [
          // Summarized: the intent's own work title differs from the session name,
          // so the session names the card above it.
          { key: 's1', title: 'Avatar upload work', messages: 6, running: true, last_ts: now },
          // Not summarized: the item is titled after the session, so a header
          // would print the same string twice.
          { key: 's2', title: 'Irrigation timer planning', messages: 2, running: true, last_ts: now },
        ]
      }
      if (path === '/api/chat/slots/s1/summary') {
        return {
          enabled: true,
          intents: [{
            id: 'i1',
            title: 'Ship the cropping step',
            state: 'in-progress',
            progress: ['picked a library'],
          }],
        }
      }
      if (path === '/api/chat/slots/s2/summary') return { enabled: true, intents: [] }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      throw new Error(`Unexpected GET ${path}`)
    })
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // The summarized session names its card; the row keeps the work's own title.
    expect(await screen.findByText('Avatar upload work', { selector: '.ow-goalcard-title' }))
      .toBeInTheDocument()
    expect(screen.getByText('Ship the cropping step')).toBeInTheDocument()
    // The unsummarized one renders as a plain row: its title appears, but never
    // twice, and it is not wrapped in a goal card.
    expect(screen.getAllByText('Irrigation timer planning')).toHaveLength(1)
    expect(screen.queryByText('Irrigation timer planning', { selector: '.ow-goalcard-title' }))
      .not.toBeInTheDocument()
    localStorage.removeItem('crew-manager.goal-memory')
  })

  it('titles a lone card by the model outcome name, distinguishing same-session cards', async () => {
    // Two lone cards from ONE session used to collide on the session name. Now
    // each solo item gets its own model outcome title (names entry item:<id>),
    // so two goals in one session read distinctly.
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.goal-memory')
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
    localStorage.removeItem('crew-manager.initiative-collapsed')
    const now = new Date().toISOString()
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [{ key: 's1', title: 'Local debug and Git requests', messages: 6, running: true, last_ts: now }]
      }
      if (path === '/api/chat/slots/s1/summary') {
        return {
          enabled: true,
          intents: [
            { id: 'i1', title: 'Make a DMG build from latest main', state: 'in-progress', progress: [] },
            { id: 'i2', title: 'Restore SSH access to the remote box', state: 'in-progress', progress: [] },
          ],
        }
      }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      throw new Error(`Unexpected GET ${path}`)
    })
    // The pass names each solo item by its own id -- distinct titles for two
    // goals that share one session.
    appSdkMocks.post.mockImplementation(async (path: string) => {
      if (path === '/api/apps/crew-manager/goal-pass') {
        return {
          available: true,
          assignments: [],
          names: [
            { cluster: 'item:intent:s1:0', name: 'Build a fresh DMG from main' },
            { cluster: 'item:intent:s1:1', name: 'Restore remote SSH access' },
          ],
        }
      }
      return {}
    })
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // Each lone card carries its own model outcome title, not the shared session
    // name -- and neither is titled "Local debug and Git requests".
    expect(await screen.findByText('Build a fresh DMG from main', { selector: '.ow-goalcard-title' }))
      .toBeInTheDocument()
    expect(await screen.findByText('Restore remote SSH access', { selector: '.ow-goalcard-title' }))
      .toBeInTheDocument()
    expect(screen.queryByText('Local debug and Git requests', { selector: '.ow-goalcard-title' }))
      .not.toBeInTheDocument()
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
    localStorage.removeItem('crew-manager.goal-memory')
  })

  it('initiative buckets and auto clusters share one card anatomy; goal quote routes to the active session', async () => {
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.initiative-collapsed')
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
    const now = new Date().toISOString()
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [
          // An unbucketed same-job pair: becomes a standalone cluster card.
          { key: 's1', title: 'Ship the avatar upload flow', messages: 4, running: true, last_ts: now },
          { key: 's2', title: 'Avatar upload flow shipping', messages: 2, running: false, last_ts: now },
          // A bucketed session: folds into the Crew Companion goal card.
          { key: 's3', title: 'Mochi bug triage', messages: 1, running: true, last_ts: now },
        ]
      }
      if (path === '/api/apps/crew-manager/initiatives') {
        return { initiatives: [{ name: 'Crew Companion', aliases: ['Crew Companion', 'mochi'] }] }
      }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      throw new Error(`Unexpected GET ${path}`)
    })
    // The s1/s2 pair shares no hard signal — the merge is the semantic pass's.
    appSdkMocks.post.mockImplementation(async (path: string) => {
      if (path === '/api/apps/crew-manager/goal-pass') {
        return {
          available: true,
          assignments: [
            { item_id: 'session:s1', cluster: 'new:avatar', confidence: 0.9, why: 'both ship the avatar upload flow' },
            { item_id: 'session:s2', cluster: 'new:avatar', confidence: 0.9, why: 'both ship the avatar upload flow' },
          ],
          names: [{ cluster: 'new:avatar', name: 'Avatar upload flow' }],
        }
      }
      return {}
    })
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // The bucket card: name + a status flag in its header.
    expect(await screen.findByText('Crew Companion')).toBeInTheDocument()
    // The auto cluster arrives once the semantic pass answers: same card chrome,
    // named by the pass rather than labelled by the members' count. It arrives
    // FOLDED (nothing needs the user) showing the digest, not the rows — and the
    // count lives in the meta. Both cards share one chrome, so two "Running"
    // flags render.
    expect(await screen.findByText('Avatar upload flow', { selector: '.ow-goalcard-title' })).toBeInTheDocument()
    expect(screen.getAllByText('Running', { selector: '.ow-goal-flag' })).toHaveLength(2)
    expect(screen.queryByText('2 sessions, one goal')).not.toBeInTheDocument()
    expect(screen.getByText('2 sessions · 1 running · 1 done')).toBeInTheDocument()
    expect(screen.queryByTestId('work-item-session:s2')).not.toBeInTheDocument()
    // The chevron unfolds to the member rows.
    fireEvent.click(screen.getByRole('button', { name: 'Expand Avatar upload flow' }))
    expect(await screen.findByTestId('work-item-session:s2')).toBeInTheDocument()
    // The add-goal entry is ALWAYS reachable — buckets existing must not hide it.
    expect(screen.getByLabelText('New goal name')).toBeInTheDocument()

    // Selecting the cluster header quotes the GOAL and names the routing target —
    // the ACTIVE session — before anything is sent. The header names the group.
    fireEvent.click(screen.getByRole('button', { name: 'Avatar upload flow' }))
    expect(await screen.findByText('Instructing goal')).toBeInTheDocument()
    expect(screen.getByText(/→ Ship the avatar upload flow \(active\)/)).toBeInTheDocument()
    expect(appSdkMocks.post).not.toHaveBeenCalledWith('/api/chat', expect.anything())
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.initiative-collapsed')
    localStorage.removeItem('crew-manager.goal-semantic')
    localStorage.removeItem('crew-manager.goal-names')
  })

  it('keeps the state filter inside the Sessions tab', async () => {
    renderApp()
    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }))
    await screen.findByTestId('work-item-session:session-1')

    // Narrow Sessions to Running. session-1 is needs-you (it owns the pending
    // approval), so its work leaves the Sessions list.
    fireEvent.click(screen.getByRole('button', { name: /^Running/ }))
    await waitFor(() => {
      expect(screen.queryByTestId('work-item-session:session-1')).not.toBeInTheDocument()
    })

    // Switching to Goals with Running STILL selected must render the goal view,
    // not the flat "Running" list. This is the regression: the render branch used
    // to test the filter before the tab, so any active pill sent the Goals tab
    // into the single filtered section and its goal cards vanished.
    fireEvent.click(screen.getByRole('tab', { name: 'Goals' }))
    // The goal list carries no visible heading — the card's own Goals tab already
    // names it — so the region's accessible name is what proves the branch rendered.
    expect(await screen.findByRole('region', { name: 'Work by goal' })).toBeInTheDocument()
    expect(screen.queryByText('Work by goal')).not.toBeInTheDocument()
    // And the full set is back, unnarrowed by the pill left behind on Sessions.
    await screen.findByTestId('work-item-session:session-1')
  })

  it('quotes a work item on selection without sending anything', async () => {
    renderApp()

    const row = await screen.findByTestId('work-item-session:session-2')
    fireEvent.click(row)

    expect(row).toHaveAttribute('aria-pressed', 'true')
    // The quote bar sits above the embedded chat as a reference to the target.
    const quote = document.querySelector('.ow-chat-panel .ow-quote')
    expect(quote).not.toBeNull()
    expect(quote?.textContent).toContain('Instructing')
    expect(screen.queryByText('Private')).not.toBeInTheDocument()
    // Selecting a quote sends no conductor message. (A background goal-pass POST
    // may fire on the Goals tab -- that is not "sending", so scope to /api/chat.)
    expect(appSdkMocks.post).not.toHaveBeenCalledWith('/api/chat', expect.anything())
  })

  it('shows no quote and no placeholder panel when nothing is selected', async () => {
    renderApp()
    await screen.findByTestId('work-item-session:session-1')

    // The old panel occupied a band of the column even with nothing selected.
    expect(document.querySelector('.ow-quote')).toBeNull()
    expect(screen.queryByText('Workspace overview')).not.toBeInTheDocument()
  })

  it('opens a session only through the one Open button on its title', async () => {
    renderApp()
    // Goals is the card's default tab now, so a test about session headers has to
    // ask for the Sessions lens explicitly.
    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }))
    await screen.findByTestId('work-item-session:session-1')

    // Exactly one visible way in per session header, and it is a button rather
    // than a hit area behind text that reads as a label.
    const opens = screen.getAllByRole('button', { name: /^Open / })
    expect(opens.length).toBeGreaterThan(0)
    expect(document.querySelectorAll('.ow-block-open').length).toBe(opens.length)
  })

  it('carries no action button on the work item itself', async () => {
    renderApp()
    await screen.findByTestId('work-item-session:session-1')

    // A row is selectable; what happens next is the instruction the user types.
    // Opening a session belongs to the session title, not to each of its goals.
    expect(screen.queryByRole('button', { name: 'Review approval' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resume' })).not.toBeInTheDocument()
  })

  it('sends the instruction to the quoted item\'s session, then acknowledges it', async () => {
    renderApp()
    fireEvent.click(await screen.findByTestId('work-item-session:session-2'))

    const input = await screen.findByLabelText('Message to Conductor')
    fireEvent.change(input, { target: { value: 'Apply the approved copy.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      // Routed straight to the quoted item's session by the embed's onSend.
      expect(appSdkMocks.post).toHaveBeenCalledWith('/api/chat', {
        message: 'Apply the approved copy.',
        slot: 'session-2',
      })
      // The receipt names where it went, so the send is not silent.
      expect(screen.getByRole('status')).toHaveTextContent('Sent new instructions to')
    })

    // Selection clears after sending, so the quote leaves the panel.
    await waitFor(() => {
      expect(document.querySelector('.ow-quote')).toBeNull()
    })
  })

  it('routes to the Conductor, not the session, when the scope toggle is switched', async () => {
    renderApp()
    fireEvent.click(await screen.findByTestId('work-item-session:session-2'))

    // The quote bar names the session by default; switching the toggle changes
    // the destination explicitly before anything is typed.
    const toggle = await screen.findByRole('button', { name: /Activate to send to the Conductor/ })
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: /Activate to send to this session/ })).toHaveTextContent('To Conductor')

    const input = screen.getByLabelText('Message to Conductor')
    fireEvent.change(input, { target: { value: 'What is blocking this?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      // The message reaches the Conductor slot even though a session is quoted.
      expect(appSdkMocks.post).toHaveBeenCalledWith('/api/chat', {
        message: 'What is blocking this?',
        slot: 'crew-manager-conductor',
      })
    })
    expect(appSdkMocks.post).not.toHaveBeenCalledWith('/api/chat', {
      message: 'What is blocking this?',
      slot: 'session-2',
    })
  })

  it('selecting a permission item expands the formal approval card inside it', async () => {
    renderApp()
    // session-1 is blocked on an approval. Selecting it must expand the SAME
    // approval UI as the session view — details, Allow once, Trust, Reject —
    // INSIDE the card, never a stripped-down pair, never a quote for a yes/no.
    fireEvent.click(await screen.findByTestId('work-item-session:session-1'))

    await waitFor(() => {
      expect(document.querySelector('.ow-row .ow-formal-approval')).not.toBeNull()
    })
    const card = within(document.querySelector('.ow-formal-approval') as HTMLElement)
    expect(card.getByText('Waiting for approval')).toBeInTheDocument()
    expect(card.getByRole('button', { name: /Trust/ })).toBeInTheDocument()
    expect(document.querySelector('.ow-quote')).toBeNull()
    // The Conductor stays put — the approval never hijacks the side panel.
    expect(screen.queryByText(/Approval in/)).not.toBeInTheDocument()

    // Allow once resolves through the SLOT endpoint — the one that can also
    // express trust — not the bare approvals path.
    fireEvent.click(card.getByRole('button', { name: 'Allow once' }))
    await waitFor(() => {
      expect(appSdkMocks.post).toHaveBeenCalledWith('/api/chat/slots/session-1/approve', {
        action: 'approved',
        request_id: 'approval-1',
      })
    })
    // The click must not bubble into the row's select toggle: the card stays
    // selected and expanded instead of collapsing out from under the decision.
    expect(screen.getByTestId('work-item-session:session-1')).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('.ow-row .ow-formal-approval')).not.toBeNull()
  })

  it('the approval is asked in one place: the expanded card', async () => {
    renderApp()
    fireEvent.click(await screen.findByTestId('work-item-session:session-1'))

    await waitFor(() => {
      expect(document.querySelectorAll('.ow-formal-approval')).toHaveLength(1)
    })
    // No bare PermissionDecision beside it anywhere on screen.
    expect(document.querySelectorAll('.ow-permission')).toHaveLength(0)
  })

  it('a PR row names the repo, states one verdict, and lists what is holding it up', async () => {
    localStorage.clear()
    const now = new Date().toISOString()
    appSdkMocks.post.mockImplementation(async (path: string) => {
      if (path === '/api/source/pull-request') {
        return {
          title: 'feat: one card anatomy in Goal view', state: 'open', draft: false,
          headBranch: 'feat/goal-digest', baseBranch: 'main',
          author: 'xuejinT', updatedAt: new Date(Date.now() - 3600_000).toISOString(),
          additions: 594, deletions: 396, changedFiles: 6,
          mergeStateStatus: 'dirty', mergeable: 'conflicting',
          checks: [{ bucket: 'passed' }, { bucket: 'failed' }, { bucket: 'failed' }],
          comments: [
            { kind: 'inline', resolvable: true, resolved: false, threadId: 't1' },
            { kind: 'inline', resolvable: true, resolved: false, threadId: 't1' },
            { kind: 'inline', resolvable: true, resolved: true, threadId: 't2' },
          ],
          files: [{ path: 'src/index.tsx', additions: 64, deletions: 13 }],
        }
      }
      throw new Error(`Unexpected POST ${path}`)
    })
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [{
          key: 's1', title: 'Ship goal grouping', messages: 4, running: true, last_ts: now,
          source_links: [{ kind: 'change', number: 4, url: 'https://github.com/x/crew-manager-app/pull/4', ci: 'passed' }],
        }]
      }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      throw new Error(`Unexpected GET ${path}`)
    })
    renderApp()

    expect(await screen.findByText('feat: one card anatomy in Goal view')).toBeInTheDocument()
    // The PR card now uses the shared goal-card anatomy: title tab, a right-aligned
    // verdict pill, and one meta line. Target the card by its verdict pill.
    const prCard = document.querySelector('.ow-pr-verdict')?.closest('.ow-block') as HTMLElement
    const head = within(prCard)
    const meta = prCard.querySelector('.ow-goal-meta')?.textContent ?? ''
    // Which repo, whose PR — the identity line. The branch is not here: at rail
    // width it crowded out the title, and the link goes to it.
    expect(meta).toContain('crew-manager-app')
    expect(meta).toContain('xuejinT')
    // One verdict. A conflict outranks the failing checks: rebasing re-runs them.
    expect(head.getByText('Conflict')).toBeInTheDocument()
    // Every real obstacle folds into the meta line, threads counted once each.
    expect(meta).toContain('2 checks failing · merge conflict with main · 1 unresolved comment')
    // The diff itself is the forge's job — no file list, at rest or expanded.
    expect(screen.queryByText('src/index.tsx')).not.toBeInTheDocument()
    expect(screen.queryByText(/Files Changed/)).not.toBeInTheDocument()

    // The card header already names the list and counts it, so the section's own
    // heading only repeated both. It keeps its accessible name.
    expect(screen.queryByText('Work by PR')).not.toBeInTheDocument()
    expect(document.querySelector('section[aria-label="Work by PR"]')).not.toBeNull()

    // The status filter sits OUTSIDE the scroll container: a filter that scrolls
    // away from the list it filters can only be reached by scrolling back.
    const card = document.querySelector('.ow-main > details[data-panel="prs"]') as HTMLElement
    const tools = card.querySelector('.ow-pr-tools') as HTMLElement
    expect(tools.querySelector('[aria-label="Filter by PR status"]')).not.toBeNull()
    expect(card.querySelector('.ow-stack-body')?.contains(tools)).toBe(false)

    // A conflicting PR arrives open, and what it reveals is the sessions —
    // which is the thing a PR groups on this board.
    const chips = within(document.querySelector('.ow-pr-sessions') as HTMLElement)
    fireEvent.click(chips.getByRole('button', { name: /Ship goal grouping/ }))
    expect(appSdkMocks.navigate).toHaveBeenCalledWith('/chat?sid=s1')

    // Selecting the PR header quotes it into the Conductor — the same gesture a
    // goal header carries. Selection shows on the header itself (the quote bar
    // lives inside the async-mounted Conductor embed).
    fireEvent.click(prCard.querySelector('.ow-pr-header') as HTMLElement)
    await waitFor(() => expect(prCard.querySelector('.ow-pr-header')?.getAttribute('data-selected')).toBe('true'))
    // Clicking again deselects — a mode you can leave from where you entered it.
    fireEvent.click(prCard.querySelector('.ow-pr-header') as HTMLElement)
    await waitFor(() => expect(prCard.querySelector('.ow-pr-header')?.getAttribute('data-selected')).toBeNull())

    // The chevron folds it away, like every other card; the title is now a
    // select target, not the fold toggle.
    fireEvent.click(screen.getByRole('button', { name: /Collapse feat: one card anatomy/ }))
    await waitFor(() => expect(document.querySelector('.ow-pr-sessions')).toBeNull())
  })

  it('shows the verb, not an Issue badge, on a blocked change in Needs you', async () => {
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [{
          key: 'session-3',
          title: 'Upload limits',
          messages: 5,
          running: false,
          last_ts: '2026-08-10T18:00:00Z',
          // issue and changeBlocked both come from this, so this is exactly the
          // item the Issue badge used to shadow.
          source_links: [{ kind: 'change', id: '42', label: 'PR #42', ci: 'failed' }],
        }]
      }
      if (path === '/api/chat/slots/crew-manager-conductor') return { messages: [], running: false }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      throw new Error(`Unexpected GET ${path}`)
    })
    renderApp()
    // The lane head being tested belongs to the Sessions lens.
    fireEvent.click(await screen.findByRole('tab', { name: 'Sessions' }))
    await screen.findByTestId('work-item-session:session-3')

    // The badge names the response, now on the lane head shared by the group.
    await waitFor(() => {
      expect(document.querySelector('.ow-lane-badge')?.textContent).toBe('Unblock')
    })
    expect(screen.queryByText('Issue')).not.toBeInTheDocument()
  })

  it('asks the Conductor when nothing is quoted', async () => {
    renderApp()
    const input = await screen.findByLabelText('Message to Conductor')
    fireEvent.change(input, { target: { value: 'What needs me?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(appSdkMocks.post).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({ slot: 'crew-manager-conductor' }),
      )
    })
  })
})

describe('utility rail cards', () => {
  function stackCards() {
    return Array.from(
      document.querySelectorAll('details.ow-stack-card[data-primary="false"]'),
    ) as HTMLDetailsElement[]
  }

  function cardTitled(label: string) {
    return stackCards().find(card => card.querySelector('summary')?.textContent?.includes(label))
  }

  it('opens exactly one card at rest', async () => {
    localStorage.removeItem('crew-manager.stack-open-v2')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    const open = stackCards().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].querySelector('summary')?.textContent).toContain('PRs')
  })

  it('opening one card closes the others', async () => {
    localStorage.removeItem('crew-manager.stack-open-v2')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    const loops = cardTitled('Loops')!
    fireEvent.click(loops.querySelector('summary') as HTMLElement)

    await waitFor(() => expect(loops.open).toBe(true))
    expect(stackCards().filter(card => card.open)).toHaveLength(1)
    expect(cardTitled('PRs')!.open).toBe(false)
  })

  it('clicking the open card closes it, leaving none open', async () => {
    localStorage.removeItem('crew-manager.stack-open-v2')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    const prs = cardTitled('PRs')!
    fireEvent.click(prs.querySelector('summary') as HTMLElement)

    await waitFor(() => expect(prs.open).toBe(false))
    expect(stackCards().filter(card => card.open)).toHaveLength(0)
  })

  it('remembers which card was open', async () => {
    localStorage.setItem('crew-manager.stack-open-v2', JSON.stringify('loops'))
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    expect(cardTitled('Loops')!.open).toBe(true)
    expect(cardTitled('PRs')!.open).toBe(false)
  })

})

describe('promotable primary column', () => {
  function panels() {
    return Array.from(document.querySelectorAll('.ow-main > details.ow-stack-card')) as HTMLDetailsElement[]
  }

  function panel(id: string) {
    return document.querySelector(`.ow-main > details[data-panel="${id}"]`) as HTMLDetailsElement
  }

  function primaryPanel() {
    return document.querySelector('.ow-main > details[data-primary="true"]') as HTMLDetailsElement
  }

  function railPanels() {
    return Array.from(
      document.querySelectorAll('.ow-main > details[data-primary="false"]'),
    ) as HTMLDetailsElement[]
  }

  // HTML5 drag carries the payload on the event's dataTransfer, which jsdom does
  // not construct — one shared stub stands in for it.
  function dragTransfer() {
    const data = new Map<string, string>()
    return {
      setData: (key: string, value: string) => { data.set(key, value) },
      getData: (key: string) => data.get(key) ?? '',
      setDragImage: vi.fn(),
      effectAllowed: 'move',
    }
  }

  async function ready() {
    renderApp()
    await waitFor(() => expect(panels()).toHaveLength(4))
  }

  it('starts with Work primary, PRs open in the rail, Conductor on the right', async () => {
    await ready()

    expect(primaryPanel().dataset.panel).toBe('work')
    expect(primaryPanel().open).toBe(true)
    const open = railPanels().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].dataset.panel).toBe('prs')
    // Conductor is a sibling of .ow-main, not a panel inside it.
    expect(document.querySelector('.ow-main > .ow-conductor')).toBeNull()
    expect(document.querySelector('.ow-layout > .ow-conductor')).not.toBeNull()
  })

  it('promotes the dropped card and demotes the current primary into the rail', async () => {
    await ready()

    const dataTransfer = dragTransfer()
    fireEvent.dragStart(panel('loops'), { dataTransfer })
    fireEvent.dragOver(primaryPanel(), { dataTransfer })
    expect(primaryPanel().dataset.dragover).toBe('true')

    fireEvent.drop(primaryPanel(), { dataTransfer })

    await waitFor(() => expect(panel('loops').dataset.primary).toBe('true'))
    expect(panel('work').dataset.primary).toBe('false')
    expect(panel('loops').dataset.dragover).toBeUndefined()
    // Demoted Work is a rail card now: same shell, collapsed, with a label
    // instead of the tab row.
    expect(panel('work').open).toBe(false)
    expect(panel('work').querySelector('summary')?.textContent).toContain('Goals / Sessions')
  })

  it('dropping the current primary on itself changes nothing', async () => {
    await ready()

    const dataTransfer = dragTransfer()
    fireEvent.dragStart(panel('work'), { dataTransfer })
    fireEvent.drop(panel('work'), { dataTransfer })

    await waitFor(() => expect(panel('work').dataset.dragover).toBeUndefined())
    expect(panel('work').dataset.primary).toBe('true')
    expect(railPanels().map(card => card.dataset.panel)).toEqual(['prs', 'loops', 'schedule'])
  })

  it('keeps exactly one card in column 1 and three in column 2 through promotions', async () => {
    await ready()

    for (const id of ['prs', 'schedule', 'work', 'loops']) {
      const dataTransfer = dragTransfer()
      fireEvent.dragStart(panel(id), { dataTransfer })
      fireEvent.drop(primaryPanel(), { dataTransfer })
      await waitFor(() => expect(panel(id).dataset.primary).toBe('true'))

      expect(document.querySelectorAll('.ow-main > details[data-primary="true"]')).toHaveLength(1)
      expect(railPanels()).toHaveLength(3)
      // Rail rows are 0,1,2 with no gaps, so no card lands off the grid.
      expect(railPanels().map(card => card.dataset.railIndex)).toEqual(['0', '1', '2'])
    }
  })

  it('drags the ghost of one card, not the whole rail', async () => {
    await ready()

    const dataTransfer = dragTransfer()
    fireEvent.dragStart(panel('loops'), { dataTransfer })

    // Left to pick its own drag image the browser painted the entire column, so
    // moving one card looked like moving all three. The image is this card's
    // own header, and nothing above or below it.
    const [image] = dataTransfer.setDragImage.mock.calls[0]
    expect(image).toBe(panel('loops').querySelector('summary'))
    expect(panel('work').contains(image as Node)).toBe(false)
    expect(panel('schedule').contains(image as Node)).toBe(false)
  })

  it('keeps one board refresh control on whichever card is primary', async () => {
    await ready()

    // Board state, not one panel's. Upstream put it in the Work card's header;
    // Work can now be demoted into the rail, which would have taken the only
    // refresh control with it.
    expect(screen.getAllByRole('button', { name: 'Refresh' })).toHaveLength(1)
    expect(panel('work').querySelector('.ow-refreshbar')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Move Loops to the first column/ }))
    await waitFor(() => expect(panel('loops').dataset.primary).toBe('true'))

    expect(screen.getAllByRole('button', { name: 'Refresh' })).toHaveLength(1)
    expect(panel('loops').querySelector('.ow-refreshbar')).not.toBeNull()
    expect(panel('work').querySelector('.ow-refreshbar')).toBeNull()
  })

  it('refetches the board without promoting the card it sits on', async () => {
    await ready()
    appSdkMocks.get.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => expect(appSdkMocks.get).toHaveBeenCalledWith('/api/chat/slots'))
    // The control lives inside a <summary>, so it must not toggle or promote.
    expect(panel('work').dataset.primary).toBe('true')
  })

  it('reveals Split on hover, and keeps it reachable by keyboard', async () => {
    await ready()
    const css = (document.querySelector('.ow-root style') as HTMLStyleElement).textContent as string

    // Split is a correction, not a primary action: hidden at rest, shown on
    // card hover, and still reachable without a mouse (focus-within / focus).
    expect(css).toMatch(/\.ow-goal-split \{[^}]*opacity: 0/)
    expect(css).toContain('.ow-goalcard:hover .ow-goal-split')
    expect(css).toContain('.ow-goalcard:focus-within .ow-goal-split')
    expect(css).toContain('.ow-goal-split:focus-visible')
  })

  it('marks the whole page as Beta in the header', async () => {
    await ready()
    const beta = document.querySelector('.ow-titlebar .ow-beta') as HTMLElement
    expect(beta).not.toBeNull()
    expect(beta.textContent).toBe('Beta')
    // Sits inline right after the name so the two read as one label.
    expect(beta.closest('.ow-title-line')?.textContent).toBe('Crew ManagerBeta')
    expect(beta.closest('h1')?.textContent).toContain('Crew Manager')
  })

  it('offers two keyboard-focusable column resizers with min/max bounds', async () => {
    await ready()
    const resizers = Array.from(document.querySelectorAll('.ow-resizer')) as HTMLElement[]
    expect(resizers).toHaveLength(2)
    for (const r of resizers) {
      expect(r.getAttribute('role')).toBe('separator')
      expect(r.getAttribute('aria-orientation')).toBe('vertical')
      expect(r.tabIndex).toBe(0)
      expect(r.getAttribute('aria-label')).toBeTruthy()
    }
    // The work handle sits inside .ow-main; the Conductor handle is a direct
    // child of .ow-layout, between the main column and the aside.
    expect(document.querySelector('.ow-main > .ow-resizer')).not.toBeNull()
    expect(document.querySelector('.ow-layout > .ow-resizer')).not.toBeNull()
    // Bounds are wired so a drag can never collapse the neighbour to nothing.
    const css = (document.querySelector('.ow-root style') as HTMLStyleElement).textContent as string
    expect(css).toContain('grid-template-columns: var(--ow-work-w, minmax(0, 1fr)) 6px minmax(0, 1fr)')
    expect(css).toContain('var(--ow-conductor-w, 30%)')
  })

  it('does not double-label a session card: the needs-you count and the lane verb', async () => {
    await ready()
    fireEvent.click(screen.getByRole('tab', { name: 'Sessions' }))
    await waitFor(() => expect(document.querySelector('.ow-goalcard[data-grouped]')).not.toBeNull())

    // Find an expanded session card that has a needs-you lane (UNBLOCK / FOLLOW UP).
    const cards = Array.from(document.querySelectorAll('.ow-goalcard[data-grouped]')) as HTMLElement[]
    const withLane = cards.find(c =>
      c.dataset.open === 'true' && c.querySelector('.ow-lane-unblock, .ow-lane-followup'))
    expect(withLane).toBeTruthy()

    // The lane badge carries the signal, so the header must not ALSO show the
    // "N need you" flag — that is the duplication the user flagged.
    expect(withLane!.querySelector('.ow-goalcard-summary .ow-goal-flag-warn')).toBeNull()

    // Collapse it: the lanes go away, so the rollup flag returns as the only signal.
    fireEvent.click(withLane!.querySelector('.ow-goalcard-chevron') as HTMLElement)
    await waitFor(() => expect(withLane!.dataset.open).toBeUndefined())
    expect(withLane!.querySelector('.ow-goalcard-summary .ow-goal-flag-warn')?.textContent)
      .toMatch(/need you/)
  })

  it('gives every card body its own bounded scroll area', async () => {
    await ready()
    const css = (document.querySelector('.ow-root style') as HTMLStyleElement).textContent as string

    // Chrome wraps a details' non-summary children in a ::details-content BLOCK
    // box. Without this rule the card's flex column holds only the summary and
    // that wrapper, so a body asking to flex grew to its own content and the
    // card clipped the overflow with nothing able to scroll to it.
    const rule = css.slice(css.indexOf('.ow-stack-card::details-content'))
    expect(rule).toContain('.ow-stack-card::details-content')
    expect(rule.slice(0, 200)).toContain('display: flex')
    expect(rule.slice(0, 200)).toContain('min-height: 0')
    expect(rule.slice(0, 200)).toContain('flex: 1 1 auto')
  })

  it('promotes from the card header without a drag', async () => {
    await ready()

    fireEvent.click(screen.getByRole('button', { name: /Move Scheduled tasks to the first column/ }))

    await waitFor(() => expect(panel('schedule').dataset.primary).toBe('true'))
    expect(panel('schedule').open).toBe(true)
    // The primary card offers no promote action — it is already there.
    expect(screen.queryByRole('button', { name: /Move Scheduled tasks to the first column/ })).toBeNull()
  })

  it('leaves the Conductor chat mounted across a promotion', async () => {
    await ready()
    const embed = await waitFor(() => screen.getByTestId('chat-embed'))

    fireEvent.click(screen.getByRole('button', { name: /Move Loops to the first column/ }))
    await waitFor(() => expect(panel('loops').dataset.primary).toBe('true'))

    // Same node, not a re-created one: a remount would lose transcript scroll
    // and any in-flight stream.
    expect(screen.getByTestId('chat-embed')).toBe(embed)
    expect(document.querySelector('.ow-layout > .ow-conductor')).not.toBeNull()
  })

  it('hands the rail its open slot when the open card is promoted', async () => {
    await ready()
    expect(panel('prs').open).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /Move PRs to the first column/ }))

    await waitFor(() => expect(panel('prs').dataset.primary).toBe('true'))
    // PRs left the rail, so the next candidate in order takes the open slot.
    const open = railPanels().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].dataset.panel).toBe('loops')
    expect(JSON.parse(localStorage.getItem('crew-manager.stack-open-v2') as string)).toBe('loops')
  })

  it('persists the primary and the open card, and never lets them name the same panel', async () => {
    await ready()
    fireEvent.click(screen.getByRole('button', { name: /Move Loops to the first column/ }))
    await waitFor(() => expect(panel('loops').dataset.primary).toBe('true'))

    expect(JSON.parse(localStorage.getItem('crew-manager.primary-v1') as string)).toBe('loops')

    cleanup()
    await ready()
    expect(primaryPanel().dataset.panel).toBe('loops')
    expect(railPanels().filter(card => card.open)[0].dataset.panel).toBe('prs')
  })

  it('repairs a stored open card that names the stored primary', async () => {
    localStorage.setItem('crew-manager.primary-v1', JSON.stringify('schedule'))
    localStorage.setItem('crew-manager.stack-open-v2', JSON.stringify('schedule'))
    await ready()

    expect(primaryPanel().dataset.panel).toBe('schedule')
    const open = railPanels().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].dataset.panel).toBe('prs')
  })

  it('ignores a stored primary that is not a panel', async () => {
    localStorage.setItem('crew-manager.primary-v1', JSON.stringify('nonsense'))
    await ready()

    expect(primaryPanel().dataset.panel).toBe('work')
  })

  it('declares resizable columns with a single-column fallback under 1100px', async () => {
    await ready()
    const css = (document.querySelector('.ow-root style') as HTMLStyleElement).textContent as string

    // Outer split: Conductor width is user-set (var), main takes the rest;
    // default 30% keeps the prior ~70/30 balance.
    expect(css).toContain('grid-template-columns: minmax(0, 1fr) 6px var(--ow-conductor-w, 30%)')
    expect(css).toMatch(/\.ow-main \{[^}]*grid-template-columns: var\(--ow-work-w, minmax\(0, 1fr\)\) 6px minmax\(0, 1fr\)/)
    const narrow = css.slice(css.indexOf('@media (max-width: 1100px)'))
    expect(narrow).toContain('.ow-main { grid-template-columns: minmax(0, 1fr); }')
    expect(narrow).toContain('grid-row: auto')
    expect(narrow).toContain('overflow-y: auto')
    // Rows sized to content, not split from the viewport height: a stretched row
    // let .ow-main's panels paint over the Conductor.
    expect(narrow).toContain('grid-template-rows: min-content min-content')
    expect(narrow).toContain('align-content: start')
    // Handles collapse away once the columns stack.
    expect(narrow).toContain('.ow-resizer { display: none; }')
  })

  it('names the row that takes the leftover height in column 2', async () => {
    await ready()
    const main = document.querySelector('.ow-main') as HTMLElement
    // PRs is rail row 0 by default.
    expect(main.dataset.openRow).toBe('0')

    fireEvent.click(panel('schedule').querySelector('summary') as HTMLElement)
    await waitFor(() => expect(main.dataset.openRow).toBe('2'))

    fireEvent.click(panel('schedule').querySelector('summary') as HTMLElement)
    await waitFor(() => expect(main.dataset.openRow).toBe('none'))
  })
})

describe('binding the Conductor to its own agent', () => {
  // The conductor slot must be ABSENT for the creation path to run at all.
  function withoutConductor(probe: unknown) {
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [{ key: 'session-1', title: 'Work', messages: 1, running: true, last_ts: '2026-08-10T18:00:00Z' }]
      }
      if (path === '/api/apps/crew-manager/conductor-agent') {
        if (probe instanceof Error) throw probe
        return probe
      }
      if (path.startsWith('/api/chat/slots/')) return { messages: [], running: false }
      if (path === '/api/approvals') return []
      if (path === '/api/spawn') return { agents: [] }
      if (path === '/api/workflows/runs') return { runs: [] }
      if (path === '/api/crons') return { jobs: [] }
      if (path === '/api/artifacts') return { artifacts: [] }
      throw new Error(`Unexpected GET ${path}`)
    })
  }

  async function slotCreateBody() {
    await waitFor(() => {
      expect(appSdkMocks.post.mock.calls.some(call => call[0] === '/api/chat/slots')).toBe(true)
    })
    return appSdkMocks.post.mock.calls.find(call => call[0] === '/api/chat/slots')?.[1] as Record<string, unknown>
  }

  it('binds the declared agent name when the backend confirms it is registered', async () => {
    withoutConductor({ available: true, agent: 'crew-manager-conductor' })
    renderApp()
    // The declared name is the only name kiro-cli can resolve — not the
    // namespaced `crew-manager/...` form and not the `crew-manager--...` filename.
    expect(await slotCreateBody()).toMatchObject({
      name: 'crew-manager-conductor',
      agent: 'crew-manager-conductor',
    })
  })

  it('omits the agent when this install has not registered it', async () => {
    // An install that does not trust app-provided agents never materializes the
    // config. Binding anyway creates a slot that accepts a message and never
    // replies, so the absence of the field is the whole safety property.
    withoutConductor({ available: false, reason: 'agent not registered on this install', agent: null })
    renderApp()
    expect(await slotCreateBody()).not.toHaveProperty('agent')
  })

  it('still creates the Conductor when the probe itself fails', async () => {
    // A backend too old to serve the route must not cost the user their
    // Conductor: no agent, but the slot is still created.
    withoutConductor(new Error('404'))
    renderApp()
    const body = await slotCreateBody()
    expect(body).toMatchObject({ name: 'crew-manager-conductor' })
    expect(body).not.toHaveProperty('agent')
  })

  it('never binds a name the backend did not hand back', async () => {
    // available:true with no agent name is a malformed answer; trusting the flag
    // alone would send `agent: undefined` or a guessed literal.
    withoutConductor({ available: true })
    renderApp()
    expect(await slotCreateBody()).not.toHaveProperty('agent')
  })
})
