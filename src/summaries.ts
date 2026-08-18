import type { ChatSlot, SessionSummary } from './types'

/** Sessions summarized per pass. Bounded so a large workspace cannot fan out. */
export const SUMMARY_SESSION_LIMIT = 12

export type SummarySupport = 'unknown' | 'available' | 'disabled' | 'unsupported'

export interface SummaryFetchResult {
  summaries: Record<string, SessionSummary>
  support: SummarySupport
}

/**
 * A cache stamp for one session's summary.
 *
 * Summaries are only regenerated at turn end, so re-reading an unchanged
 * session every poll would be pure waste. Keying on last activity plus message
 * count means a session is re-read exactly when it could have a new summary.
 */
export function summaryStamp(slot: ChatSlot): string {
  return `${slot.last_ts ?? slot.last_activity_ts ?? ''}:${slot.messages ?? 0}`
}

/** Sessions worth summarizing, most recently active first. */
export function summaryTargets(slots: ChatSlot[], conductorSlot: string): ChatSlot[] {
  return slots
    .filter(slot => slot.key && slot.key !== conductorSlot && slot.memory_mode !== 'incognito')
    .sort((a, b) => stamp(b) - stamp(a))
    .slice(0, SUMMARY_SESSION_LIMIT)
}

function stamp(slot: ChatSlot): number {
  const value = slot.last_ts ?? slot.last_activity_ts ?? slot.created
  if (typeof value === 'number') return value > 10_000_000_000 ? value : value * 1000
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Read intent summaries for *targets*.
 *
 * Degrades rather than erroring: a gateway without the endpoint reports
 * `unsupported` after the first failure and is not asked again, and a gateway
 * with the feature switched off reports `disabled`. Either way Crew Manager falls
 * back to describing the session itself.
 */
export async function fetchSummaries(
  targets: ChatSlot[],
  get: (path: string) => Promise<SessionSummary>,
): Promise<SummaryFetchResult> {
  const summaries: Record<string, SessionSummary> = {}
  let support: SummarySupport = 'unknown'

  for (const slot of targets) {
    try {
      const body = await get(`/api/chat/slots/${encodeURIComponent(slot.key)}/summary`)
      if (!body || typeof body !== 'object') {
        support = 'unsupported'
        break
      }
      if (body.enabled === false) {
        // The flag is off workspace-wide; one answer settles it for every slot.
        support = 'disabled'
        break
      }
      summaries[slot.key] = body
      support = 'available'
    } catch {
      // An older gateway has no such route. Stop asking.
      support = 'unsupported'
      break
    }
  }

  return { summaries, support }
}
