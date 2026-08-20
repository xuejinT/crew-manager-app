import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'

/*
 * Render the Conductor's prompt into its agent spec.
 *
 * The prompt's source of truth is the markdown file — it is prose, and prose
 * belongs in a file a human can read and diff, not in a JSON string literal.
 * But kiro-cli only accepts a prompt as inline text or as an ABSOLUTE `file://`
 * URL, and an app's agent spec ships inside the app, so it cannot know an
 * absolute path at packaging time. (The framework renders `{PLACEHOLDER}`
 * tokens for exactly one builtin and REFUSES to register any other agent whose
 * template still holds one, so that route is not open to an installed app.)
 *
 * So the markdown is inlined here instead, at build time, the same way
 * `ui/index.mjs` is a tracked artifact of `src/`. `test/manifest.test.ts`
 * asserts the two match, so editing only one of them fails the suite rather
 * than silently shipping a stale prompt.
 */
const AGENT_SPEC = 'agents/crew-manager-conductor.json'
const AGENT_PROMPT = 'agents/crew-manager-conductor.prompt.md'

const spec = JSON.parse(readFileSync(AGENT_SPEC, 'utf8'))
spec.prompt = readFileSync(AGENT_PROMPT, 'utf8').trimEnd()
writeFileSync(AGENT_SPEC, `${JSON.stringify(spec, null, 2)}\n`)

await build({
  entryPoints: ['src/index.tsx'],
  outfile: 'ui/index.mjs',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  treeShaking: true,
  minify: true,
  lineLimit: 120,
  legalComments: 'none',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'lucide-react',
    '@kirocrew/app-sdk',
    '@kirocrew/app-sdk/ui'
  ]
})
