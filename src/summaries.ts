import type { ChatSlot, SessionSummary } from './types'
import { DONE_WINDOW_MS } from './model'

/**
 * Sessions summarized in ONE pass — not a limit on how many are summarized.
 *
 * There is no cap on the total: every active session gets a summary, because a
 * fleet that outgrew an arbitrary number was getting per-goal cards for its most
 * recent work and bare session cards for the rest, which reads as the view being
 * inconsistent rather than as a limit being enforced.
 *
 * The per-pass bound stays because `fetchSummaries` awaits each session in turn.
 * Without it, a cold start on a large workspace is one long serial run before any
 * summary appears. With it, each poll takes the next few and the stamp cache
 * never re-reads a session that has not changed, so the queue drains and then
 * goes quiet.
 */
export const SUMMARY_PASS_LIMIT = 12

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

/**
 * Is this session still live enough to be worth a summary?
 *
 * Anything mid-flight qualifies outright. Beyond that the test is the same
 * `DONE_WINDOW_MS` the board uses to decide what it still shows, so the two
 * cannot disagree: summarizing a session the board has already dropped is spent
 * budget for a card nobody can see, and NOT summarizing one the board still shows
 * is the inconsistency this replaced.
 */
export function isActiveSession(slot: ChatSlot, now: number = Date.now()): boolean {
  if (slot.running || slot.subagents_running || slot.orchestrating || slot.pending_approval) {
    return true
  }
  const last = stamp(slot)
  // An unknown timestamp is treated as live rather than skipped: the board shows
  // such a session (`updatedAt === 0` means unknown, never ancient), so refusing
  // to summarize it would reproduce the gap on exactly the rows least understood.
  if (last === 0) return true
  return now - last <= DONE_WINDOW_MS
}

/**
 * Active sessions worth summarizing, most recently active first, bounded per
 * pass rather than in total.
 *
 * `alreadySummarized` is applied BEFORE the bound, which is the whole reason it
 * is a parameter rather than the caller's business. Filtering after the slice
 * means that once the newest N are summarized the set is empty on every
 * subsequent pass and session N+1 is never read at all -- the queue looks bounded
 * per pass while in fact never draining.
 */
export function summaryTargets(
  slots: ChatSlot[],
  conductorSlot: string,
  now: number = Date.now(),
  alreadySummarized: (slot: ChatSlot) => boolean = () => false,
): ChatSlot[] {
  return slots
    .filter(slot => slot.key && slot.key !== conductorSlot && slot.memory_mode !== 'incognito')
    .filter(slot => isActiveSession(slot, now))
    .filter(slot => !alreadySummarized(slot))
    .sort((a, b) => stamp(b) - stamp(a))
    .slice(0, SUMMARY_PASS_LIMIT)
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
