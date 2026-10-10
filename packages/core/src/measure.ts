import { theme } from './theme'
import type { Theme } from './theme'
import type { NodeVariant, TextMeasurer } from './types'

const FONT_WEIGHT: Record<NodeVariant, string> = {
  root: 'bold',
  node: 'normal',
  aggregate: 'normal',
}

/** 水平内边距（单侧），对应参考稿节点左右 ~14px 留白 */
const PADDING: Record<NodeVariant, number> = { root: 24, node: 14, aggregate: 12 }

function font(variant: NodeVariant, t: Theme): string {
  const size = variant === 'root' ? t.rootFontSize : t.nodeFontSize
  return `${FONT_WEIGHT[variant]} ${size}px ${t.font}`
}

/** 估算兜底：canvas 2d 不可用（如 jsdom）时按字宽系数估算 */
export const estimateMeasurer: TextMeasurer = (text, variant) =>
  text.length * (variant === 'root' ? theme.rootFontSize : theme.nodeFontSize) +
  PADDING[variant] * 2

/** 默认度量器：离屏 canvas measureText；字体族/字号随传入主题（缺省内置主题） */
export function createCanvasMeasurer(t: Theme = theme): TextMeasurer {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return estimateMeasurer
  return (text: string, variant: NodeVariant) => {
    ctx.font = font(variant, t)
    return Math.ceil(ctx.measureText(text).width) + PADDING[variant] * 2
  }
}
