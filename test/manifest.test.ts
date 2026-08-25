import { existsSync, readFileSync } from 'node:fs'
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

  it('ships store art for every surface, as files that exist', () => {
    // The store renders an external app's art through a plain <img>, so the bytes
    // are fixed: theme variables cannot reach them, which is why the light and
    // dark heroes are separate files.
    //
    // The paths must be REPO-RELATIVE because this app is distributed from a
    // repository. The host rewrites each art field onto its blob proxy
    // (`/api/apps/blob?repo=...&path=...`) whenever the app has a `repo`, and
    // that proxy refuses any path containing `..` or starting with `/` — so the
    // built-in `/apps/<name>/ui/...` form, which this test once required, loads
    // nothing on the store card or the detail banner. Assert the SHAPE the proxy
    // accepts rather than one literal string: a rename then stays free, while
    // reverting to the absolute form fails here instead of on a store card.
    const fields = [
      'iconPath',
      'heroImage',
      'heroImageDark',
      'heroImageDetail',
      'heroImageDetailDark',
    ]
    for (const field of fields) {
      const value = manifest[field]
      expect(typeof value, `${field} must be declared`).toBe('string')
      // The three forms the blob proxy rejects: absolute, parent-traversal, and
      // an off-origin URL (which the host refuses to copy out of a manifest).
      expect(value.startsWith('/'), `${field} must not be absolute`).toBe(false)
      expect(value, `${field} must not traverse`).not.toMatch(/\.\./)
      expect(value, `${field} must not carry a scheme`).not.toMatch(/^[a-z][a-z0-9+.-]*:/i)
      // A manifest pointing at a missing file degrades to the host's generic
      // Package glyph with nothing failing loudly, so assert the file is there.
      expect(existsSync(resolve(process.cwd(), value)), `${field} -> ${value} must exist`).toBe(true)
    }
    // Five surfaces, five files: a copy-paste that pointed the dark hero at the
    // light one would satisfy every check above and render the wrong art.
    expect(new Set(fields.map(f => manifest[f])).size).toBe(fields.length)
    // A top-level `iconUrl` is silently ignored for a repo-distributed app: the
    // host reads `iconPath` only, because an index-fetched manifest is untrusted
    // and an absolute URL out of it could aim the store's <img> at any host.
    // Declaring one again would look like art that works and never load.
    expect(manifest.iconUrl).toBeUndefined()
  })

  it('keeps art SVGs free of CSS variables, which do not resolve through <img>', () => {
    // Only the host's own /app-assets/ icons are inlined and repainted from theme
    // variables. This app's art is fetched as an image, where var() is not
    // resolved — a themed stroke would render as nothing at all.
    for (const file of [
      'icon.svg',
      'hero-light.svg', 'hero-dark.svg',
      'hero-detail-light.svg', 'hero-detail-dark.svg',
    ]) {
      const svg = readFileSync(resolve(process.cwd(), 'ui', file), 'utf8')
      expect(svg).not.toMatch(/var\(--/)
      // A '--' inside an XML comment makes the whole file invalid XML, and an
      // invalid SVG loaded as an image renders blank without raising anything.
      expect(svg).not.toMatch(/<!--/)
    }
  })

  it('paints the nav icon in one neutral ink, with no opacity fades', () => {
    // The icon cannot follow the theme: only the host's own /app-assets/ icons
    // are inlined, so an external app's icon is fixed bytes on a background it
    // does not know. One ink that clears 3:1 on both appearances is therefore
    // the whole contrast budget — a second, lighter ink (or an opacity fade)
    // would fail on whichever appearance it was not chosen against.
    const svg = readFileSync(resolve(process.cwd(), 'ui', 'icon.svg'), 'utf8')
    const inks = new Set(svg.match(/#[0-9A-Fa-f]{3,8}/g) ?? [])
    expect([...inks]).toEqual(['#737A8C'])
    expect(svg).not.toMatch(/opacity=/)
  })

  it('keeps the beta disabled until explicitly enabled', () => {
    expect(manifest.defaultEnabled).toBe(false)
  })

  describe('Conductor agent', () => {
    const specPath = resolve(process.cwd(), 'agents/crew-manager-conductor.json')
    const promptPath = resolve(process.cwd(), 'agents/crew-manager-conductor.prompt.md')
    const spec = JSON.parse(readFileSync(specPath, 'utf8'))

    it('is declared by the manifest at a path that exists', () => {
      // An agent the manifest does not declare is never materialized; a declared
      // path that does not resolve is skipped with a log line and nothing else.
      expect(manifest.agents).toEqual(['agents/crew-manager-conductor.json'])
      expect(existsSync(specPath)).toBe(true)
      expect(existsSync(promptPath)).toBe(true)
    })

    it('uses only keys kiro-cli accepts, since it rejects unknown ones', () => {
      // An unknown key does not degrade — the whole agent config is refused, so
      // the Conductor slot would bind a name that resolves to nothing. That is
      // also why the prompt cannot be referenced through a custom field.
      expect(Object.keys(spec).sort()).toEqual([
        'allowedTools',
        'description',
        'includeMcpJson',
        'mcpServers',
        'model',
        'name',
        'prompt',
        'tools',
      ])
      // The slot binds this name, not the namespaced filename stem.
      expect(spec.name).toBe('crew-manager-conductor')
    })

    it('carries the markdown prompt verbatim', () => {
      // The markdown is the source of truth and the build inlines it, because a
      // shipped spec cannot name an absolute `file://` path and kiro-cli reads
      // anything else in this field as literal prompt text. Asserting equality
      // is what stops one of the two being edited alone.
      expect(spec.prompt).toBe(readFileSync(promptPath, 'utf8').trimEnd())
      expect(spec.prompt.length).toBeGreaterThan(500)
    })

    it('grants no tool that could implement anything', () => {
      // The prompt says it never writes code; the tool list is what makes that
      // true rather than a request. A coordinator with fs_write or execute_bash
      // will eventually use them.
      expect(spec.tools).not.toContain('fs_write')
      expect(spec.tools).not.toContain('execute_bash')
      expect(spec.tools).toEqual([
        'fs_read', 'grep', 'glob', 'thinking', '@kirocrew-core', '@kirocrew-cron',
      ])
      // Auto-approval covers the read-only tools only; the MCP grants are not
      // pre-approved from here.
      expect(spec.allowedTools).toEqual(['fs_read', 'grep', 'glob', 'thinking'])
      // Opting out of the global mcp.json keeps the Conductor off whatever
      // servers the user has configured for their own sessions. The `@` grants
      // above still resolve: the host copies its managed cron/core specs into
      // this agent's own mcpServers at registration.
      expect(spec.includeMcpJson).toBe(false)
    })

    it('does not claim it can message an existing session', () => {
      // There is no tool for it yet. A prompt that tells the agent to "tell the
      // session" produces an answer describing an action that never happened,
      // which is worse than declining.
      expect(spec.prompt).toMatch(/CANNOT send a message into an existing session/)
    })
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
