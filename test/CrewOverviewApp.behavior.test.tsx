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
    await screen.findByTestId('work-item-session:session-3')

    // The badge names the response. "Issue" is a state, and it belongs to Done.
    await waitFor(() => {
      expect(document.querySelector('.ow-verb')?.textContent).toBe('UNBLOCK')
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
