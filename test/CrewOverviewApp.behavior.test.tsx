import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CrewOverviewApp from '../src/index'
import { appSdkMocks } from './mocks/app-sdk'

function renderApp() {
  return render(<CrewOverviewApp />)
}

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
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
    // Two sessions whose slot titles clearly say the same job. Timestamps must be
    // recent: an idle session's card falls out of the done window otherwise.
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
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // One merged card, folded by default (nothing needs the user): digest shows.
    // It is NAMED from what the two sessions share, not labelled by their count.
    expect(await screen.findByText('Avatar upload flow', { selector: '.ow-goalcard-title' }))
      .toBeInTheDocument()
    expect(screen.queryByText('2 sessions, one goal')).not.toBeInTheDocument()
    // A merged card has to say what it merged on: the reason is what Split is
    // judged against, so an unexplained merge is one the user cannot check.
    expect(screen.getByText('Grouped because these sessions describe the same work.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Avatar upload flow' }))
    // Member rows carry a status dot + title; the lead is a row too (the header
    // names the GROUP, not a member, so nothing is duplicated).
    expect(await screen.findByTestId('work-item-session:s1')).toBeInTheDocument()
    expect(screen.getByTestId('work-item-session:s2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Split Ship the avatar upload flow' }))
    // The ruling takes effect immediately: two plain cards, no merged header.
    await waitFor(() => expect(
      screen.queryByText('Avatar upload flow', { selector: '.ow-goalcard-title' }),
    ).not.toBeInTheDocument())
    localStorage.removeItem('crew-manager.goal-verdicts')
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

  it('initiative buckets and auto clusters share one card anatomy; goal quote routes to the active session', async () => {
    localStorage.removeItem('crew-manager.goal-verdicts')
    localStorage.removeItem('crew-manager.initiative-collapsed')
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
    renderApp()

    fireEvent.click(await screen.findByRole('tab', { name: 'Goals' }))
    // The bucket card: name + a status flag in its header. The cluster card
    // carries the same flag — one chrome, so two "Running" flags render.
    expect(await screen.findByText('Crew Companion')).toBeInTheDocument()
    expect(screen.getAllByText('Running', { selector: '.ow-goal-flag' })).toHaveLength(2)
    // The auto cluster: same card chrome, named from what its members share
    // rather than labelled by their count. It arrives FOLDED (nothing needs the
    // user) showing the digest, not the rows — and the count lives in the meta.
    expect(screen.getByText('Avatar upload flow', { selector: '.ow-goalcard-title' })).toBeInTheDocument()
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
    expect(appSdkMocks.post).not.toHaveBeenCalled()
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

  it('answers a permission in the list instead of quoting it', async () => {
    renderApp()
    // session-1 is blocked on an approval, so selecting it must offer the
    // decision — not a message box for a yes/no.
    fireEvent.click(await screen.findByTestId('work-item-session:session-1'))

    await waitFor(() => {
      expect(document.querySelector('.ow-row .ow-permission')).not.toBeNull()
      expect(document.querySelector('.ow-quote')).toBeNull()
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0])
    await waitFor(() => {
      expect(appSdkMocks.post).toHaveBeenCalledWith('/api/approvals/approval-1/approve', {})
    })
  })

  it('asks for the permission once, in the row, not twice on one screen', async () => {
    renderApp()
    fireEvent.click(await screen.findByTestId('work-item-session:session-1'))

    // The row answers it. The Conductor block is for the other case: an
    // instruction was sent and the session went quiet on a permission.
    await waitFor(() => {
      expect(document.querySelectorAll('.ow-permission')).toHaveLength(1)
    })
    expect(document.querySelector('.ow-row .ow-permission')).not.toBeNull()
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
      expect(document.querySelector('.ow-lane-badge')?.textContent).toBe('UNBLOCK')
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

describe('bottom stack cards', () => {
  // The previous attempt at this shipped a chevron whose onToggle prop was never
  // passed by the call site, so it rendered and did nothing. These assert the
  // open STATE, not the presence of a control.
  function stackCards() {
    return Array.from(document.querySelectorAll('details.ow-stack-card')) as HTMLDetailsElement[]
  }

  function cardTitled(label: string) {
    return stackCards().find(card => card.querySelector('summary')?.textContent?.includes(label))
  }

  it('opens exactly one card at rest', async () => {
    localStorage.removeItem('crew-manager.open-stack')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    // PRs is the default: it is the only one of the three that routinely holds
    // work needing a decision.
    const open = stackCards().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].querySelector('summary')?.textContent).toContain('PRs')
  })

  it('opening one card closes the others', async () => {
    localStorage.removeItem('crew-manager.open-stack')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    const loops = cardTitled('Loops')
    expect(loops).toBeDefined()
    fireEvent.click(loops!.querySelector('summary') as HTMLElement)

    await waitFor(() => expect(loops!.open).toBe(true))
    // The whole point: PRs must have closed. Two open cards put the list you
    // wanted between two others.
    expect(stackCards().filter(card => card.open)).toHaveLength(1)
    expect(cardTitled('PRs')!.open).toBe(false)
  })

  it('clicking the open card closes it, leaving none open', async () => {
    localStorage.removeItem('crew-manager.open-stack')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    const prs = cardTitled('PRs')!
    expect(prs.open).toBe(true)
    fireEvent.click(prs.querySelector('summary') as HTMLElement)

    // Collapse-everything stays reachable; always-open would trap the user with
    // one card they cannot dismiss.
    await waitFor(() => expect(prs.open).toBe(false))
    expect(stackCards().filter(card => card.open)).toHaveLength(0)
  })

  it('remembers which card was open', async () => {
    localStorage.setItem('crew-manager.open-stack', JSON.stringify('loops'))
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(3))

    expect(cardTitled('Loops')!.open).toBe(true)
    expect(cardTitled('PRs')!.open).toBe(false)
  })
})
