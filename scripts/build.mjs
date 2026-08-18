import { build } from 'esbuild'

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
