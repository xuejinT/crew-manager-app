import { describe, expect, it } from 'vitest'
import type { WorkItem } from '../src/model'
import type { RecallHit } from '../src/types'
import {
  RECALL_MIN_QUERY,
  dedupeRecall,
  describeAge,
  readRecallReport,
  recallIsWorthAsking,
  recallUrl,
} from '../src/recall'

const DAY = 86_400_000
const NOW = 1_800_000_000_000

function hit(overrides: Partial<RecallHit> = {}): RecallHit {
  return { session_key: 'past-1', title: 'Ack contention', ...overrides }
}

function live(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'session:live-1',
    title: 'Live work',
    summary: 'still going',
    state: 'running',
    issue: false,
    updatedAt: NOW,
    sessionKey: 'live-1',
    provenance: 'workspace',
    action: 'open',
    references: [],
    ...overrides,
  } as WorkItem
}

describe('recall', () => {
  it('does not scan on a query too short to rank', () => {
    expect(recallIsWorthAsking('a')).toBe(false)
    expect(recallIsWorthAsking('  a  ')).toBe(false)
    expect(recallIsWorthAsking('ab')).toBe(true)
    expect(RECALL_MIN_QUERY).toBe(2)
  })

  it('drops a recalled session the live results already show', () => {
    const hits = [hit({ session_key: 'live-1' }), hit({ session_key: 'past-2' })]

    // The live row carries real state and a real action; the recalled row could
    // only offer "open it", so listing both is one thing shown twice.
    expect(dedupeRecall(hits, [live()]).map(h => h.session_key)).toEqual(['past-2'])
  })

  it('drops repeats inside one response and rows without a key', () => {
    const hits = [
      hit({ session_key: 'past-2' }),
      hit({ session_key: 'past-2' }),
      hit({ session_key: '' }),
    ]

    expect(dedupeRecall(hits, []).map(h => h.session_key)).toEqual(['past-2'])
  })

  it('treats a disabled gateway as a conclusive answer, not an empty result', () => {
    // The caller must stop asking: scanning transcripts on every keystroke for a
    // gateway that cannot answer is pure waste.
    expect(readRecallReport({ enabled: false, results: [] }).unsupported).toBe(true)
    expect(readRecallReport(null).unsupported).toBe(true)
    expect(readRecallReport({ enabled: true, results: [hit()] })).toEqual({
      unsupported: false,
      hits: [hit()],
      scope: 'workspace',
    })
  })

  it('reports the scope the backend actually searched, not the one we asked for', () => {
    expect(readRecallReport({ enabled: true, scope: 'all', results: [hit()] }).scope).toBe('all')
    // A gateway that ignores the parameter, or predates it, must not have its
    // results labelled as cross-workspace. The label is a claim about reach.
    expect(readRecallReport({ enabled: true, results: [hit()] }).scope).toBe('workspace')
    expect(readRecallReport({ enabled: true, scope: 'nonsense', results: [] }).scope).toBe('workspace')
  })

  it('asks for the default scope without a parameter at all', () => {
    // The default query stays byte-identical to the one that shipped, so a
    // widening is always visible in the request itself.
    expect(recallUrl('ack contention', 8)).not.toContain('scope')
    expect(recallUrl('ack contention', 8, 'workspace')).not.toContain('scope')
    expect(recallUrl('ack contention', 8, 'all')).toContain('scope=all')
  })

  it('ignores rows with no session to open', () => {
    const state = readRecallReport({ enabled: true, results: [hit(), hit({ session_key: '' })] })
    expect(state.hits).toHaveLength(1)
  })

  it('describes age the way someone remembers it', () => {
    expect(describeAge(NOW / 1000, NOW)).toBe('today')
    expect(describeAge((NOW - DAY) / 1000, NOW)).toBe('yesterday')
    expect(describeAge((NOW - 3 * DAY) / 1000, NOW)).toBe('3 days ago')
    expect(describeAge((NOW - 8 * DAY) / 1000, NOW)).toBe('last week')
    expect(describeAge((NOW - 21 * DAY) / 1000, NOW)).toBe('3 weeks ago')
    expect(describeAge((NOW - 70 * DAY) / 1000, NOW)).toBe('2 months ago')
  })

  it('accepts a timestamp in seconds or milliseconds', () => {
    // Slot payloads carry both shapes; a wrong guess would report every hit as
    // "today" or as decades old.
    expect(describeAge((NOW - 3 * DAY) / 1000, NOW)).toBe('3 days ago')
    expect(describeAge(NOW - 3 * DAY, NOW)).toBe('3 days ago')
  })

  it('treats a missing timestamp as unknown rather than ancient', () => {
    expect(describeAge(undefined, NOW)).toBe('today')
  })

  it('builds an encoded request url', () => {
    expect(recallUrl('  ack contention  ', 8)).toBe(
      '/api/apps/crew-manager/recall?q=ack+contention&limit=8',
    )
  })
})
