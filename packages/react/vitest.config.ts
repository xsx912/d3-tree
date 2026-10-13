import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@d3-tree/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)) },
  },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'jsdom', include: ['test/**/*.test.ts'] },
})
