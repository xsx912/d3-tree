import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const r = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

// React 页不用 @vitejs/plugin-react：esbuild 原生转换 tsx JSX（automatic runtime），
// 避免插件与 vite 小版本间的 exports 兼容问题
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 开发期直连各包源码，避免依赖过期的 dist 构建
      '@d3-tree/core': r('../../packages/core/src/index.ts'),
      '@d3-tree/vue': r('../../packages/vue/src/index.ts'),
      '@d3-tree/react': r('../../packages/react/src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: r('./index.html'),
        vue: r('./vue.html'),
        react: r('./react.html'),
        custom: r('./custom.html'),
        lazy: r('./lazy.html'),
      },
    },
  },
})
