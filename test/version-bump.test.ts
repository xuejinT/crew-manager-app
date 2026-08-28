import { describe, expect, it } from 'vitest'

import { OVERRIDE_LABEL, decide, isNewer, parseVersion } from '../scripts/check-version-bump.mjs'

/*
 * A gate nobody has watched bite is indistinguishable from a gate that is
 * silently broken, and this one exists precisely because three merged PRs
 * (#42, #43, #44) shipped under an unchanged version. So each case below is
 * written to fail if the corresponding branch of `decide` is removed.
 */
describe('app.json version-bump gate', () => {
  const BASE = '0.4.15'

  it('passes a PR that ships nothing, whatever its version does', () => {
    // Docs, tests, CI and screenshots are not in the installed app, so demanding
    // a version for them would train people to bump meaninglessly.
    const verdict = decide({
      changedPaths: ['README.md', 'test/model.test.ts', '.github/workflows/ci.yml'],
      baseVersion: BASE,
      headVersion: BASE,
    })
    expect(verdict.ok).toBe(true)
    expect(verdict.watched).toEqual([])
  })

  it('refuses a shipped bundle change that leaves the version alone', () => {
    const verdict = decide({
      changedPaths: ['src/index.tsx', 'ui/index.mjs'],
      baseVersion: BASE,
      headVersion: BASE,
    })
    expect(verdict.ok).toBe(false)
    expect(verdict.reason).toContain(BASE)
    // The message names the shipped path, not the source file that produced it.
    expect(verdict.watched).toEqual(['ui/index.mjs'])
  })

  it('passes the same change once the version moves', () => {
    const verdict = decide({
      changedPaths: ['src/index.tsx', 'ui/index.mjs'],
      baseVersion: BASE,
      headVersion: '0.4.16',
    })
    expect(verdict.ok).toBe(true)
    expect(verdict.reason).toBe('0.4.15 → 0.4.16')
  })

  it('watches backend and agents, which ship without passing through the bundle', () => {
    for (const path of ['backend/routes.py', 'agents/crew-manager-conductor.json']) {
      expect(decide({ changedPaths: [path], baseVersion: BASE, headVersion: BASE }).ok).toBe(false)
    }
  })

  it('does not treat a source-only edit as shipped', () => {
    // esbuild strips comments, so a comment-only edit under src/ produces a
    // byte-identical bundle. The sibling CI step proves the committed bundle
    // matches a fresh build, so a src change that MATTERS always moves the
    // bundle too — which is why the bundle is what this watches.
    const verdict = decide({
      changedPaths: ['src/index.tsx'],
      baseVersion: BASE,
      headVersion: BASE,
    })
    expect(verdict.ok).toBe(true)
  })

  it('refuses a downgrade, which would keep the stale bundle cached', () => {
    // The dashboard cache-keys the UI bundle on this version and a lower number
    // does not evict the higher one, so "different" is not the bar — newer is.
    const verdict = decide({
      changedPaths: ['ui/index.mjs'],
      baseVersion: BASE,
      headVersion: '0.4.14',
    })
    expect(verdict.ok).toBe(false)
    expect(verdict.reason).toContain('not newer')
  })

  it('honours the override label, and only that label', () => {
    const changedPaths = ['ui/index.mjs']
    expect(decide({ changedPaths, baseVersion: BASE, headVersion: BASE, labels: [OVERRIDE_LABEL] }).ok).toBe(true)
    expect(decide({ changedPaths, baseVersion: BASE, headVersion: BASE, labels: ['bug'] }).ok).toBe(false)
  })

  it('refuses a version it cannot compare rather than guessing past it', () => {
    const changedPaths = ['ui/index.mjs']
    expect(decide({ changedPaths, baseVersion: BASE, headVersion: 'next' }).ok).toBe(false)
    expect(decide({ changedPaths, baseVersion: 'main', headVersion: '0.4.16' }).ok).toBe(false)
  })

  it('compares each component numerically, not as text', () => {
    // '0.4.9' > '0.4.10' as strings, and that inversion is the whole reason the
    // triple is parsed rather than compared lexically.
    expect(isNewer('0.4.10', '0.4.9')).toBe(true)
    expect(isNewer('0.4.9', '0.4.10')).toBe(false)
    expect(isNewer('1.0.0', '0.99.99')).toBe(true)
    expect(isNewer('0.4.15', '0.4.15')).toBe(false)
  })

  it('parses only a plain x.y.z', () => {
    expect(parseVersion('0.4.15')).toEqual([0, 4, 15])
    for (const bad of ['0.4', '0.4.15-beta.1', 'v0.4.15', '', undefined, null]) {
      expect(parseVersion(bad)).toBeNull()
    }
  })
})
