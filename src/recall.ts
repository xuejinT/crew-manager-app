/**
 * Past-work recall on the client side.
 *
 * Recall answers a question the live board structurally cannot: "what did we do
 * about this weeks ago". It is deliberately bound to SEARCH and never shown on the
 * resting board — the board is an attention queue, and history has no claim on
 * attention. Typing is the only thing that asks for it.
 */

import type { WorkItem } from './model'
import type { RecallHit, RecallReport } from './types'

/** Matches the backend floor: one character cannot rank usefully. */
export const RECALL_MIN_QUERY = 2

/** How long typing has to settle before a transcript scan is worth starting. */
export const RECALL_DEBOUNCE_MS = 300

export function recallIsWorthAsking(query: string): boolean {
  return query.trim().length >= RECALL_MIN_QUERY
}

/**
 * Drop recalled sessions that the live results ALREADY show.
 *
 * A session can be both live on the board and a strong history match. Listing it
 * in both places is the same duplication problem as repeating a meta line: the
 * user reads two rows and has to work out they are one thing. The live row wins,
 * because it carries the real state and a real action; the recalled row could only
 * offer "open it".
 */
export function dedupeRecall(hits: RecallHit[], live: WorkItem[]): RecallHit[] {
  const shown = new Set(live.map(item => item.sessionKey).filter(Boolean) as string[])
  const seen = new Set<string>()
  const out: RecallHit[] = []
  for (const hit of hits) {
    const key = hit?.session_key
    if (!key || shown.has(key) || seen.has(key)) continue
    seen.add(key)
    out.push(hit)
  }
  return out
}

/** Whole days between a past timestamp and now, floored at 0. */
export function daysAgo(modified: number | undefined, now: number): number {
  if (!modified) return 0
  const seconds = modified > 1e11 ? modified / 1000 : modified
  const days = Math.floor((now / 1000 - seconds) / 86_400)
  return days > 0 ? days : 0
}

/**
 * When this work was last touched, in the vaguest terms that are still true.
 *
 * Recall is about finding the thread again, not about precision: "3 weeks ago" is
 * what the user actually remembers, and a timestamp to the minute would imply the
 * date matters more than the match does.
 */
export function describeAge(modified: number | undefined, now: number): string {
  const days = daysAgo(modified, now)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? 'last week' : `${weeks} weeks ago`
  }
  const months = Math.floor(days / 30)
  return months === 1 ? 'last month' : `${months} months ago`
}

/**
 * Which workspaces a recall query is allowed to answer from.
 *
 * `workspace` is the default and the safe one. `all` is a per-query widening the
 * user asks for explicitly; it is never remembered across a reload, so nobody is
 * left in it without knowing.
 */
export type RecallScope = 'workspace' | 'all'

export interface RecallState {
  /** True once the gateway has told us it cannot answer recall at all. */
  unsupported: boolean
  hits: RecallHit[]
  /** The scope the BACKEND says answered, not the one we asked for. */
  scope: RecallScope
}

export const EMPTY_RECALL: RecallState = { unsupported: false, hits: [], scope: 'workspace' }

/**
 * Read one recall response into state.
 *
 * `enabled: false` is a CONCLUSIVE answer, not a transient miss: this gateway has
 * no history modules, so the caller should stop asking rather than scan on every
 * keystroke for the rest of the session.
 */
export function readRecallReport(report: RecallReport | null | undefined): RecallState {
  if (!report || report.enabled === false) {
    return { unsupported: true, hits: [], scope: 'workspace' }
  }
  const hits = Array.isArray(report.results) ? report.results : []
  return {
    unsupported: false,
    hits: hits.filter(hit => Boolean(hit?.session_key)),
    // Trust the backend's account of what it searched over our own request. If a
    // gateway ignores the parameter, the label must say "this workspace" rather
    // than claim a reach the results do not have.
    scope: report.scope === 'all' ? 'all' : 'workspace',
  }
}

export function recallUrl(query: string, limit: number, scope: RecallScope = 'workspace'): string {
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit) })
  // Sent only when widened, so a default query is byte-identical to before.
  if (scope === 'all') params.set('scope', 'all')
  return `/api/apps/crew-manager/recall?${params.toString()}`
}
