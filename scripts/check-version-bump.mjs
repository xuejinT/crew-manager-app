import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

/*
 * Refuse a pull request that changes what an installed app RUNS without moving
 * `app.json`'s version.
 *
 * The version is not decoration. The official catalog entry for this app tracks
 * `main`, and the registry's publish pipeline bakes `version` out of this
 * manifest; the dashboard then decides whether to offer an update by comparing
 * that string against the installed one, and it never looks at the commit. So a
 * merge that ships new bytes under an unchanged version is invisible to everyone
 * who already has the app — they are pinned to an older build with no signal
 * that anything newer exists. That is not hypothetical: #42, #43 and #44 all
 * landed while the manifest read 0.4.14, and #45 had to relabel them after the
 * fact. The same string also cache-keys the UI bundle in the dashboard, so a
 * same-version reinstall keeps serving the previously cached JS.
 *
 * WHAT TRIGGERS THE REQUIREMENT, and why it is not `src/**`.
 *
 * The honest question is "did the artifact a user executes change?", not "did a
 * source file change". Those differ in both directions:
 *
 *   - `src/**` OVER-triggers. esbuild strips comments, so a comment-only or
 *     type-only edit under `src/` produces a byte-identical `ui/index.mjs`.
 *     Nothing shipped, so demanding a version for it would train people to bump
 *     meaninglessly — and a version that moves when nothing changed is as
 *     useless as one that stays when something did.
 *   - `src/**` UNDER-triggers. `scripts/build.mjs` also composes the bundle and
 *     inlines the Conductor prompt, so a change there ships without touching
 *     `src/`.
 *
 * Watching the built bundle answers the real question and closes both gaps at
 * once: the sibling CI step already asserts the committed `ui/index.mjs` matches
 * a fresh build of `src/`, so any source change that survives into the shipped
 * artifact necessarily shows up here.
 *
 * `backend/**` and `agents/**` are watched directly because they ship without
 * passing through the bundle at all — the routes the installed app serves, and
 * the Conductor spec the host registers.
 */
const WATCHED_EXACT = ['ui/index.mjs']
const WATCHED_PREFIXES = ['backend/', 'agents/']

/*
 * The escape hatch, deliberately a label rather than a body marker: it is
 * visible on the PR list, it takes a deliberate act to apply, and it survives
 * an edit to the description. A gate with no override becomes something people
 * route around instead of using.
 */
export const OVERRIDE_LABEL = 'no-version-bump'

/*
 * Every version this app has ever published is a plain `x.y.z`. Rather than
 * carry a semver parser for range syntax and prereleases that have never
 * appeared, refuse anything else and say so — a version this cannot compare is
 * a fact worth surfacing, not one to guess past.
 */
const VERSION = /^(\d+)\.(\d+)\.(\d+)$/

export function parseVersion(value) {
  const match = VERSION.exec(String(value ?? '').trim())
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** Strictly newer, not merely different: a downgrade re-creates the stale-cache trap. */
export function isNewer(head, base) {
  const a = parseVersion(head)
  const b = parseVersion(base)
  if (!a || !b) return false
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return false
}

export function watchedChanges(paths) {
  return paths.filter(
    path => WATCHED_EXACT.includes(path) || WATCHED_PREFIXES.some(prefix => path.startsWith(prefix)),
  )
}

/**
 * The whole verdict as one pure function, so the tests can exercise it without
 * a git repository. Returns `{ ok, reason, watched }`.
 */
export function decide({ changedPaths, baseVersion, headVersion, labels = [] }) {
  const watched = watchedChanges(changedPaths)

  if (watched.length === 0) {
    return { ok: true, reason: 'nothing that ships changed', watched }
  }
  if (labels.includes(OVERRIDE_LABEL)) {
    return { ok: true, reason: `waived by the ${OVERRIDE_LABEL} label`, watched }
  }
  if (!parseVersion(baseVersion)) {
    return { ok: false, reason: `the base version ${baseVersion} is not x.y.z`, watched }
  }
  if (!parseVersion(headVersion)) {
    return { ok: false, reason: `the version ${headVersion} is not x.y.z`, watched }
  }
  if (headVersion === baseVersion) {
    return { ok: false, reason: `the version is still ${headVersion}`, watched }
  }
  if (!isNewer(headVersion, baseVersion)) {
    return {
      ok: false,
      reason: `${headVersion} is not newer than ${baseVersion} — a downgrade keeps the stale bundle cached`,
      watched,
    }
  }
  return { ok: true, reason: `${baseVersion} → ${headVersion}`, watched }
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })

function main() {
  // On a pull_request run the checked-out ref is the MERGE commit, so diffing the
  // base against HEAD gives exactly this PR's net change. Locally, origin/main.
  const base = process.env.BASE_SHA?.trim() || 'origin/main'

  const changedPaths = git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean)
  const baseVersion = JSON.parse(git('show', `${base}:app.json`)).version
  const headVersion = JSON.parse(readFileSync('app.json', 'utf8')).version

  let labels = []
  if (process.env.PR_LABELS) {
    try {
      labels = JSON.parse(process.env.PR_LABELS)
    } catch {
      // A malformed payload must not read as a waiver, so fall through with none.
      console.log('warning: PR_LABELS was not valid JSON; treating the PR as unlabelled')
    }
  }

  const { ok, reason, watched } = decide({ changedPaths, baseVersion, headVersion, labels })

  if (ok) {
    console.log(`app.json version check passed — ${reason}`)
    if (watched.length > 0) console.log(`  shipped paths: ${watched.join(', ')}`)
    return
  }

  console.log(`::error file=app.json::This PR changes what an installed app runs, but ${reason}.`)
  console.log('')
  console.log('Shipped paths in this diff:')
  for (const path of watched) console.log(`  ${path}`)
  console.log('')
  console.log(`Bump "version" in app.json above ${baseVersion}. Existing installs are offered an`)
  console.log('update by comparing that string against the one they have, so leaving it means')
  console.log('this change reaches nobody who already has the app.')
  console.log('')
  console.log(`If this genuinely ships nothing, add the ${OVERRIDE_LABEL} label to the PR.`)
  process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
