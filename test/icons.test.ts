import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The icons the host actually gives an app.
 *
 * Apps do not get the real `lucide-react`. The dashboard's Vite config aliases the
 * specifier to a vendor stub (`website/dist/vendor/lucide-react.mjs`) that
 * destructures a FIXED list off the host's registered module. Importing any other
 * name compiles, bundles, passes every type check — and then throws at load:
 *
 *   The requested module 'lucide-react' does not provide an export named 'CircleDot'
 *
 * which takes the whole page down, not just the icon. That is why this file exists
 * and why the list is hardcoded rather than imported: the app must not depend on the
 * platform checkout being present to be safe.
 *
 * The stub does expose everything through its default export (a Proxy), so an icon
 * outside this list is reachable as `lucide.Whatever` — but a named import is the
 * conventional form and the one that fails loudly, so keep to this list.
 */
const HOST_ICON_EXPORTS = new Set([
  'AlertTriangle', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'Bell', 'Bot', 'Brain',
  'Building2', 'Calendar', 'Check', 'ChevronRight', 'Clock', 'Code', 'Download',
  'ExternalLink', 'Gamepad2', 'Heart', 'Home', 'Loader2', 'Menu', 'MessageSquare',
  'Moon', 'Package', 'Plug', 'Plus', 'Power', 'RefreshCw', 'Rocket', 'Search',
  'Settings', 'Shield', 'Sparkles', 'Star', 'Sun', 'Tag', 'Trash2', 'Users',
  'Wand2', 'Waves', 'X', 'Zap',
])

function importedIcons(): string[] {
  const src = readFileSync(resolve(process.cwd(), 'src/index.tsx'), 'utf8')
  // `[^}]*` and not `[\s\S]*?`: a lazy any-character match still starts at the
  // FIRST `import {` in the file and stretches to the lucide `}`, swallowing the
  // React import's names on the way. Brace content cannot contain a `}`, so this
  // form can only ever match one block.
  const block = src.match(/import\s*\{([^}]*)\}\s*from\s*'lucide-react'/)
  if (!block) throw new Error('no lucide-react import block found in src/index.tsx')
  return block[1]
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    // "Package as FileText" -> the imported name is what the host must export.
    .map(entry => entry.split(/\s+as\s+/)[0].trim())
}

describe('lucide icon imports', () => {
  it('only imports icons the host vendor stub exports', () => {
    const missing = importedIcons().filter(name => !HOST_ICON_EXPORTS.has(name))
    expect(missing).toEqual([])
  })

  it('reads the import block at all', () => {
    // Guards the guard: a regex that silently matched nothing would make the test
    // above pass forever while checking nothing.
    expect(importedIcons().length).toBeGreaterThan(5)
    expect(importedIcons()).toContain('MessageSquare')
  })
})
