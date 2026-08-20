import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CrewOverviewApp, { noticedSinceLastTurn } from '../src/index'
import { appSdkMocks } from './mocks/app-sdk'
import { OVERWATCH_STYLES } from '../src/styles'

function renderApp() {
  return render(<CrewOverviewApp />)
}

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  // Card fold state, the primary panel and the open rail card all persist, so a
  // prior test's clicks must not leak into the next one.
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
    await waitFor(() => expect(stackCards().length).toBe(2))

    const open = stackCards().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].querySelector('summary')?.textContent).toContain('Loops')
  })

  it('opening one card closes the others', async () => {
    localStorage.removeItem('crew-manager.stack-open-v2')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(2))

    const schedule = cardTitled('Scheduled tasks')!
    fireEvent.click(schedule.querySelector('summary') as HTMLElement)

    await waitFor(() => expect(schedule.open).toBe(true))
    expect(stackCards().filter(card => card.open)).toHaveLength(1)
    expect(cardTitled('Loops')!.open).toBe(false)
  })

  it('clicking the open card closes it, leaving none open', async () => {
    localStorage.removeItem('crew-manager.stack-open-v2')
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(2))

    const loops = cardTitled('Loops')!
    fireEvent.click(loops.querySelector('summary') as HTMLElement)

    await waitFor(() => expect(loops.open).toBe(false))
    expect(stackCards().filter(card => card.open)).toHaveLength(0)
  })

  it('remembers which card was open', async () => {
    localStorage.setItem('crew-manager.stack-open-v2', JSON.stringify('schedule'))
    renderApp()
    await waitFor(() => expect(stackCards().length).toBe(2))

    expect(cardTitled('Scheduled tasks')!.open).toBe(true)
    expect(cardTitled('Loops')!.open).toBe(false)
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
    await waitFor(() => expect(panels()).toHaveLength(3))
  }

  it('starts with Work primary, Loops open in the rail, Conductor on the right', async () => {
    await ready()

    expect(primaryPanel().dataset.panel).toBe('work')
    expect(primaryPanel().open).toBe(true)
    const open = railPanels().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].dataset.panel).toBe('loops')
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
    expect(panel('work').querySelector('summary')?.textContent).toContain('Sessions')
  })

  it('dropping the current primary on itself changes nothing', async () => {
    await ready()

    const dataTransfer = dragTransfer()
    fireEvent.dragStart(panel('work'), { dataTransfer })
    fireEvent.drop(panel('work'), { dataTransfer })

    await waitFor(() => expect(panel('work').dataset.dragover).toBeUndefined())
    expect(panel('work').dataset.primary).toBe('true')
    expect(railPanels().map(card => card.dataset.panel)).toEqual(['loops', 'schedule'])
  })

  it('keeps exactly one card in column 1 and two in column 2 through promotions', async () => {
    await ready()

    for (const id of ['schedule', 'work', 'loops']) {
      const dataTransfer = dragTransfer()
      fireEvent.dragStart(panel(id), { dataTransfer })
      fireEvent.drop(primaryPanel(), { dataTransfer })
      await waitFor(() => expect(panel(id).dataset.primary).toBe('true'))

      expect(document.querySelectorAll('.ow-main > details[data-primary="true"]')).toHaveLength(1)
      expect(railPanels()).toHaveLength(2)
      // Rail rows are 0,1 with no gaps, so no card lands off the grid.
      expect(railPanels().map(card => card.dataset.railIndex)).toEqual(['0', '1'])
    }
  })

  it('drags the ghost of one card, not the whole rail', async () => {
    await ready()

    const dataTransfer = dragTransfer()
    fireEvent.dragStart(panel('loops'), { dataTransfer })

    // Left to pick its own drag image the browser painted the entire column, so
    // moving one card looked like moving all of them. The image is this card's
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
    expect(panel('loops').open).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /Move Loops to the first column/ }))

    await waitFor(() => expect(panel('loops').dataset.primary).toBe('true'))
    // Loops left the rail, so the next candidate in order takes the open slot.
    const open = railPanels().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].dataset.panel).toBe('schedule')
    expect(JSON.parse(localStorage.getItem('crew-manager.stack-open-v2') as string)).toBe('schedule')
  })

  it('persists the primary and the open card, and never lets them name the same panel', async () => {
    await ready()
    fireEvent.click(screen.getByRole('button', { name: /Move Loops to the first column/ }))
    await waitFor(() => expect(panel('loops').dataset.primary).toBe('true'))

    expect(JSON.parse(localStorage.getItem('crew-manager.primary-v1') as string)).toBe('loops')

    cleanup()
    await ready()
    expect(primaryPanel().dataset.panel).toBe('loops')
    expect(railPanels().filter(card => card.open)[0].dataset.panel).toBe('schedule')
  })

  it('repairs a stored open card that names the stored primary', async () => {
    localStorage.setItem('crew-manager.primary-v1', JSON.stringify('schedule'))
    localStorage.setItem('crew-manager.stack-open-v2', JSON.stringify('schedule'))
    await ready()

    expect(primaryPanel().dataset.panel).toBe('schedule')
    const open = railPanels().filter(card => card.open)
    expect(open).toHaveLength(1)
    expect(open[0].dataset.panel).toBe('loops')
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
    // Loops is rail row 0 by default.
    expect(main.dataset.openRow).toBe('0')

    fireEvent.click(panel('schedule').querySelector('summary') as HTMLElement)
    await waitFor(() => expect(main.dataset.openRow).toBe('1'))

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

describe('what the watcher noticed since the Conductor last spoke', () => {
  const LAST_TURN = '2026-08-20T12:00:00Z'
  const before = Date.parse(LAST_TURN) / 1000 - 60
  const after = Date.parse(LAST_TURN) / 1000 + 60

  function report(over: Record<string, unknown> = {}) {
    return {
      stalls: [{ key: 's1', label: 'Docs cleanup', silent_secs: 900, private: false, reason: 'It was running the test suite.' }],
      error_loops: [],
      first_seen: { s1: after },
      ...over,
    }
  }

  it('names a stall first seen after the last turn', () => {
    expect(noticedSinceLastTurn(report(), LAST_TURN)).toEqual([
      'Docs cleanup went quiet — It was running the test suite.',
    ])
  })

  it('says nothing about a stall the Conductor has already seen', () => {
    // Already discussed. Repeating it every turn is how a board teaches its
    // reader to stop reading.
    expect(noticedSinceLastTurn(report({ first_seen: { s1: before } }), LAST_TURN)).toEqual([])
  })

  it('falls back to the silence duration when no reason was written', () => {
    // A private session never gets a model-written reason, and one may not have
    // been generated yet — neither is a reason to drop the finding.
    const r = report({ stalls: [{ key: 's1', label: 'Secret work', silent_secs: 900, private: true }] })
    expect(noticedSinceLastTurn(r, LAST_TURN)[0]).toContain('Secret work went quiet after')
  })

  it('reports nothing at all on a backend that does not send first_seen', () => {
    // An older app backend must not make the ENTIRE board read as fresh news on
    // every turn — that is worse than staying quiet.
    expect(noticedSinceLastTurn(report({ first_seen: undefined }), LAST_TURN)).toEqual([])
  })

  it('reports nothing before the Conductor has any turn to be newer than', () => {
    expect(noticedSinceLastTurn(report(), undefined)).toEqual([])
    expect(noticedSinceLastTurn(report(), null)).toEqual([])
    expect(noticedSinceLastTurn(report(), 'not a date')).toEqual([])
  })

  it('accepts a numeric last_ts in seconds or milliseconds', () => {
    // The platform sends either, and a bare number is ambiguous; a seconds value
    // read as ms lands in 1970 and would mark everything new.
    const secs = Date.parse(LAST_TURN) / 1000
    expect(noticedSinceLastTurn(report(), secs)).toEqual(noticedSinceLastTurn(report(), LAST_TURN))
    expect(noticedSinceLastTurn(report(), secs * 1000)).toEqual(noticedSinceLastTurn(report(), LAST_TURN))
  })

  it('includes an error loop that started after the last turn', () => {
    const r = report({
      stalls: [],
      error_loops: [{ key: 'l1', label: 'Build fix', tool: 'execute_bash', repeats: 3 }],
      first_seen: { l1: after },
    })
    expect(noticedSinceLastTurn(r, LAST_TURN)).toEqual([
      'Build fix repeated the same execute_bash failure 3 times',
    ])
  })

  it('caps the list so it cannot crowd out the briefing it sits beside', () => {
    const stalls = Array.from({ length: 9 }, (_, i) => ({
      key: `s${i}`, label: `Session ${i}`, silent_secs: 900, private: false,
    }))
    const first_seen = Object.fromEntries(stalls.map(s => [s.key, after]))
    const lines = noticedSinceLastTurn(report({ stalls, first_seen }), LAST_TURN)
    expect(lines).toHaveLength(6)
    expect(lines[5]).toBe('and 4 more')
  })

  it('ignores a finding with no first-seen entry rather than guessing', () => {
    const r = report({ first_seen: { other: after } })
    expect(noticedSinceLastTurn(r, LAST_TURN)).toEqual([])
  })
})

describe('rebinding a Conductor that already exists', () => {
  const AGENT_ROUTE = '/api/apps/crew-manager/conductor-agent'
  const REBIND = `/api/chat/slots/${encodeURIComponent('crew-manager-conductor')}/agent`

  function withConductor(agent: string | undefined, probe: unknown) {
    appSdkMocks.get.mockImplementation(async (path: string) => {
      if (path === '/api/chat/slots') {
        return [
          { key: 'session-1', title: 'Work', messages: 1, running: true, last_ts: '2026-08-20T12:00:00Z' },
          {
            key: 'crew-manager-conductor',
            title: 'Conductor',
            messages: 3,
            running: false,
            last_ts: '2026-08-20T12:00:00Z',
            ...(agent === undefined ? {} : { agent }),
          },
        ]
      }
      if (path === AGENT_ROUTE) {
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

  const rebinds = () => appSdkMocks.post.mock.calls.filter(call => call[0] === REBIND)

  it('binds an unbound Conductor without the session having to be deleted', async () => {
    // The agent is chosen at creation, so every Conductor created before the agent
    // existed is stuck on the default one. Deleting the session to fix that throws
    // away its history for a config change.
    withConductor(undefined, { available: true, agent: 'crew-manager-conductor' })
    renderApp()
    await waitFor(() => expect(rebinds()).toHaveLength(1))
    expect(rebinds()[0][1]).toEqual({ agent: 'crew-manager-conductor' })
  })

  it('leaves a Conductor the developer pointed at another agent alone', async () => {
    // A non-empty binding was a deliberate choice; overriding it would be the app
    // taking a decision that is not its own.
    withConductor('some-other-agent', { available: true, agent: 'crew-manager-conductor' })
    renderApp()
    await waitFor(() => expect(appSdkMocks.get).toHaveBeenCalledWith('/api/chat/slots'))
    expect(rebinds()).toHaveLength(0)
  })

  it('does not rebind when the agent is not registered on this install', async () => {
    withConductor(undefined, { available: false, reason: 'agent not registered on this install' })
    renderApp()
    await waitFor(() => expect(appSdkMocks.get).toHaveBeenCalledWith(AGENT_ROUTE))
    expect(rebinds()).toHaveLength(0)
  })

  it('does not rebind when the probe itself fails', async () => {
    withConductor(undefined, new Error('404'))
    renderApp()
    await waitFor(() => expect(appSdkMocks.get).toHaveBeenCalledWith(AGENT_ROUTE))
    expect(rebinds()).toHaveLength(0)
  })

  it('attempts the rebind once, not on every poll', async () => {
    withConductor(undefined, { available: true, agent: 'crew-manager-conductor' })
    const view = renderApp()
    await waitFor(() => expect(rebinds()).toHaveLength(1))
    view.rerender(<CrewOverviewApp />)
    await waitFor(() => expect(appSdkMocks.get).toHaveBeenCalledWith('/api/chat/slots'))
    expect(rebinds()).toHaveLength(1)
  })
})

describe('the row title has room to distinguish itself', () => {
  // jsdom performs no layout, so the visual result cannot be asserted here. This
  // is a shape guard, not a behaviour test: it exists so that reverting the clamp
  // cannot happen silently, because the failure it prevents is invisible in code
  // review -- five rows reading "Open ONE PR on kirodotdev/KiroCrew fixin…" look
  // fine in a diff and are useless on screen.
  it('clamps the title to two lines rather than one with an ellipsis', () => {
    const rule = OVERWATCH_STYLES
      .split('}')
      .find(block => block.includes('.ow-row-title'))

    expect(rule).toBeDefined()
    expect(rule).toContain('-webkit-line-clamp: 2')
    // A single-line nowrap rule is what truncated away the distinguishing words.
    expect(rule).not.toContain('white-space: nowrap')
  })
})
