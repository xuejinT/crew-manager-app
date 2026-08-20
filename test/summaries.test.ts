import { describe, expect, it, vi } from 'vitest'
import type { ChatSlot } from '../src/types'
import { SUMMARY_PASS_LIMIT, fetchSummaries, isActiveSession, summaryStamp, summaryTargets } from '../src/summaries'

function slot(overrides: Partial<ChatSlot> = {}): ChatSlot {
  return { key: 'session-1', messages: 4, running: false, last_ts: '2026-08-17T10:00:00Z', ...overrides }
}

// Pinned, because "active" is measured against the clock and a fixture dated
// relative to the real one would change meaning as it ages.
const NOW = Date.parse('2026-08-20T12:00:00Z')
const RECENT = '2026-08-20T09:00:00Z'
const ANCIENT = '2026-07-01T00:00:00Z'

describe('summaryTargets', () => {
  it('skips the Conductor and incognito sessions, newest first', () => {
    const targets = summaryTargets([
      slot({ key: 'older', last_ts: '2026-08-19T00:00:00Z' }),
      slot({ key: 'crew-manager-conductor', last_ts: RECENT }),
      slot({ key: 'secret', memory_mode: 'incognito', last_ts: RECENT }),
      slot({ key: 'new', last_ts: RECENT }),
    ], 'crew-manager-conductor', NOW)

    expect(targets.map(target => target.key)).toEqual(['new', 'older'])
  })

  it('summarizes every active session rather than a fixed number of them', () => {
    // The pass is bounded; the TOTAL is not. A fleet larger than one pass used to
    // get per-goal cards for its newest sessions and bare session cards for the
    // rest, which reads as the view being inconsistent rather than as a limit.
    const many = Array.from({ length: 40 }, (_, index) => (
      slot({ key: `session-${index}`, last_ts: RECENT })
    ))
    const first = summaryTargets(many, 'crew-manager-conductor', NOW)
    expect(first).toHaveLength(SUMMARY_PASS_LIMIT)

    // Freshness is applied BEFORE the bound. Applied after, the newest twelve
    // would fill every pass forever and session thirteen would never be read --
    // bounded per pass in appearance, never draining in fact.
    const done = new Set(first.map(target => target.key))
    const next = summaryTargets(many, 'crew-manager-conductor', NOW, slot => done.has(slot.key))
    expect(next).toHaveLength(SUMMARY_PASS_LIMIT)
    expect(next.some(target => done.has(target.key))).toBe(false)

    // And it reaches the end rather than stalling part-way.
    const seen = new Set<string>()
    for (let pass = 0; pass < 10; pass += 1) {
      const batch = summaryTargets(many, 'crew-manager-conductor', NOW, slot => seen.has(slot.key))
      if (batch.length === 0) break
      for (const target of batch) seen.add(target.key)
    }
    expect(seen.size).toBe(many.length)
  })

  it('leaves finished-and-quiet sessions alone', () => {
    // Outside the Done window the board no longer shows it, so a summary would be
    // budget spent on a card nobody can see.
    const targets = summaryTargets([
      slot({ key: 'live', last_ts: RECENT }),
      slot({ key: 'gone', last_ts: ANCIENT }),
    ], 'crew-manager-conductor', NOW)

    expect(targets.map(target => target.key)).toEqual(['live'])
  })
})

describe('isActiveSession', () => {
  it('counts anything mid-flight as active however old its last message', () => {
    for (const mid of ['running', 'subagents_running', 'orchestrating', 'pending_approval'] as const) {
      expect(isActiveSession(slot({ last_ts: ANCIENT, [mid]: true }), NOW)).toBe(true)
    }
  })

  it('counts a session the board still shows as active', () => {
    expect(isActiveSession(slot({ last_ts: RECENT }), NOW)).toBe(true)
  })

  it('does not count a session the board has dropped', () => {
    expect(isActiveSession(slot({ last_ts: ANCIENT }), NOW)).toBe(false)
  })

  it('treats an unknown timestamp as active rather than skipping it', () => {
    // The board shows such a session -- unknown is never ancient -- so refusing to
    // summarize it would reproduce the missing-card gap on the rows least
    // understood.
    expect(isActiveSession(slot({ last_ts: null, last_activity_ts: null, created: null }), NOW)).toBe(true)
    expect(isActiveSession(slot({ last_ts: 'not a date', last_activity_ts: null, created: null }), NOW)).toBe(true)
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
