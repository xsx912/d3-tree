/** 每个示例的挂载上下文 */
export interface DemoContext {
  /** 画布容器（占满示例区），示例在其中创建图表 */
  canvas: HTMLElement
  /** 画布左上角浮层，放该示例专属控件；不用的示例保持为空 */
  overlay: HTMLElement
  /** 画布左下角轻提示（替代旧工具栏 #hint） */
  setHint(text: string): void
}

export interface DemoItem {
  /** URL hash 与目录 key，如 "horizontal" */
  id: string
  title: string
  /** 一句话说明，显示在源码面板顶部 */
  desc: string
  /** 挂载示例，返回清理函数（销毁实例、还原容器样式等） */
  setup(ctx: DemoContext): () => void
}

export interface DemoEntry {
  item: DemoItem
  /** 该示例文件的真实源码（vite ?raw 导入），展示用 */
  source: string
}

export interface DemoCategory {
  label: string
  entries: DemoEntry[]
}
