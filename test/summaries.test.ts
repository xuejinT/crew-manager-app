import { describe, expect, it, vi } from 'vitest'
import type { ChatSlot } from '../src/types'
import { SUMMARY_SESSION_LIMIT, fetchSummaries, summaryStamp, summaryTargets } from '../src/summaries'

function slot(overrides: Partial<ChatSlot> = {}): ChatSlot {
  return { key: 'session-1', messages: 4, running: false, last_ts: '2026-08-17T10:00:00Z', ...overrides }
}

describe('summaryTargets', () => {
  it('skips the Conductor and incognito sessions, newest first', () => {
    const targets = summaryTargets([
      slot({ key: 'old', last_ts: '2026-08-01T00:00:00Z' }),
      slot({ key: 'crew-manager-conductor' }),
      slot({ key: 'secret', memory_mode: 'incognito' }),
      slot({ key: 'new', last_ts: '2026-08-17T09:00:00Z' }),
    ], 'crew-manager-conductor')

    expect(targets.map(target => target.key)).toEqual(['new', 'old'])
  })

  it('bounds how many sessions are read in one pass', () => {
    const many = Array.from({ length: 40 }, (_, index) => slot({ key: `session-${index}` }))
    expect(summaryTargets(many, 'crew-manager-conductor')).toHaveLength(SUMMARY_SESSION_LIMIT)
  })
})

describe('summaryStamp', () => {
  it('changes only when the session could have a new summary', () => {
    expect(summaryStamp(slot())).toBe(summaryStamp(slot()))
    expect(summaryStamp(slot())).not.toBe(summaryStamp(slot({ messages: 5 })))
  })
})

describe('fetchSummaries', () => {
  it('reports unsupported and stops asking when the endpoint is missing', async () => {
    const get = vi.fn().mockRejectedValue(new Error('API 404: not found'))
    const result = await fetchSummaries([slot({ key: 'a' }), slot({ key: 'b' })], get)

    expect(result.support).toBe('unsupported')
    expect(result.summaries).toEqual({})
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('reports disabled after one answer instead of polling every session', async () => {
    const get = vi.fn().mockResolvedValue({ enabled: false, intents: [] })
    const result = await fetchSummaries([slot({ key: 'a' }), slot({ key: 'b' })], get)

    expect(result.support).toBe('disabled')
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('collects summaries when the feature is on', async () => {
    const get = vi.fn().mockResolvedValue({ enabled: true, intents: [{ title: 'Goal', state: 'done' }] })
    const result = await fetchSummaries([slot({ key: 'a' })], get)

    expect(result.support).toBe('available')
    expect(result.summaries.a.intents?.[0].title).toBe('Goal')
  })
})
