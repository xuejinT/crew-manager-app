import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@kirocrew/app-sdk/ui': `${here}test/mocks/ui.tsx`,
      '@kirocrew/app-sdk': `${here}test/mocks/app-sdk.tsx`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
})
