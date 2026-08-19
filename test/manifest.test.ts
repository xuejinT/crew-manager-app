import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const manifestPath = resolve(process.cwd(), 'app.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

describe('Crew Manager app manifest', () => {
  it('declares a standalone UI entry and page icon', () => {
    expect(manifest.name).toBe('crew-manager')
    expect(manifest.backend?.hooks?.routes).toBe('backend.routes:register_routes')
    // The base-path form would route to a standalone proxy serving dead stubs.
    expect(manifest.backend?.routes).toBeUndefined()
    expect(manifest.notifications?.channels?.map((c: { id: string }) => c.id)).toEqual([
      'stalled',
      'error-loop',
    ])
    expect(manifest.ui.entry).toBe('index.mjs')
    expect(manifest.ui.pages).toEqual([
      {
        route: '/crew-manager',
        label: 'Crew Manager',
        iconUrl: 'icon.svg',
      },
    ])
  })

  it('keeps the beta disabled until explicitly enabled', () => {
    expect(manifest.defaultEnabled).toBe(false)
  })

  it('requests only the existing Kiro Crew work APIs', () => {
    expect(manifest.permissions.api).toEqual([
      // A plain prefix already grants everything beneath it, so this one entry
      // covers /api/chat/slots and /api/chat/slots/{slot}/context as well.
      '/api/chat',
      '/api/approvals',
      '/api/spawn',
      '/api/workflows',
      '/api/crons',
      '/api/artifacts',
      // Live monitor loops: listed to show them, DELETEd to stop one. The loop
      // is the only work on the board that spends budget with nobody watching.
      '/api/autonudge',
      // Its own backend: stall findings, watcher settings, past-work recall.
      '/api/apps/crew-manager',
    ])
    expect(manifest.permissions.network).toBe(false)
  })

  it('declares no "/*" entry, because the host does not treat * as a wildcard', () => {
    // createScopedApi matches with
    //   normalized === p || normalized.startsWith(p.endsWith('/') ? p : p + '/')
    // so "/api/chat/*" can only ever match a path that literally ends in "/*".
    // The entries were dead, and dead entries are worse than absent ones: they
    // invite someone to declare "/api/foo/*" without "/api/foo" and be silently
    // denied at runtime with the manifest looking correct.
    expect(manifest.permissions.api.filter((path: string) => path.includes('*'))).toEqual([])
  })

  it('covers every API path the app actually calls', () => {
    // The allowlist and the call sites drifting apart is a runtime-only failure:
    // the SDK throws when a path is not declared, and nothing catches it at build
    // time. This walks the source instead of trusting the list.
    const src = ['src/index.tsx', 'src/summaries.ts', 'src/recall.ts']
      .map(file => readFileSync(resolve(process.cwd(), file), 'utf8'))
      .join('\n')
    const called = [...new Set(
      [...src.matchAll(/['"`](\/api\/[A-Za-z0-9/_.-]*)/g)].map(match => match[1]),
    )]
    const allowed = manifest.permissions.api as string[]
    const denied = called.filter(path => !allowed.some(
      entry => path === entry || path.startsWith(`${entry}/`),
    ))

    expect(denied).toEqual([])
    expect(called.length).toBeGreaterThan(5)
  })
})
