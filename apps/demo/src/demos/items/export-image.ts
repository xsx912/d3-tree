import { createBidirectionalTree } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const exportImage: DemoItem = {
  id: 'export-image',
  title: '导出图片',
  desc: 'exportImage 把当前可见图谱导出为文件：format 选 svg（矢量）或 png（scale 控制倍率，默认 2x）。导出内容包含主题与自定义节点。',
  setup({ canvas, overlay, setHint }) {
    const tree = createBidirectionalTree(canvas, { data, colorByGroup: true })
    tree.zoomToFit()

    const svgBtn = document.createElement('button')
    svgBtn.textContent = '导出 SVG'
    svgBtn.onclick = () => tree.exportImage({ format: 'svg', filename: '产业链图谱' })
    const pngBtn = document.createElement('button')
    pngBtn.textContent = '导出 PNG'
    pngBtn.onclick = () => tree.exportImage({ format: 'png', scale: 2, filename: '产业链图谱' })
    overlay.append(svgBtn, pngBtn)
    setHint('点击上方按钮下载文件')
    return () => tree.destroy()
  },
}
