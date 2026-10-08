import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      // 开发期直连 core 源码，避免依赖过期的 dist 构建
      '@d3-tree/core': fileURLToPath(
        new URL('../../packages/core/src/index.ts', import.meta.url),
      ),
    },
  },
})
