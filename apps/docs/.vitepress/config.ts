import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const r = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  lang: 'zh-CN',
  title: 'd3-tree',
  description: '基于 d3 v7 的双向树图谱 —— 框架无关核心 + Vue / React 封装',
  head: [['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }]],
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/install' },
      { text: '在线演示', link: '/demos/basic' },
      { text: 'API', link: '/guide/api' },
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '安装与接入', link: '/guide/install' },
          { text: 'API 参考', link: '/guide/api' },
          { text: '节点自定义', link: '/guide/custom-node' },
          { text: '连线自定义', link: '/guide/custom-link' },
          { text: '水平与垂直布局', link: '/guide/orientation' },
        ],
      },
      {
        text: '演示',
        items: [{ text: '产业链图谱', link: '/demos/basic' }],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/example/d3-tree' }],
    search: {
      provider: 'local',
      options: { translations: { button: { buttonText: '搜索文档', buttonAriaLabel: '搜索' } } },
    },
    outline: { label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
  },
  vite: {
    resolve: {
      alias: {
        // 开发期直连源码（与 apps/demo 同策略；基准目录为 .vitepress/，需三层返回到仓库根）
        '@d3-tree/core': r('../../../packages/core/src/index.ts'),
        '@d3-tree/vue': r('../../../packages/vue/src/index.ts'),
      },
    },
  },
})
