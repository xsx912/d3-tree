import { createBidirectionalTree } from '@d3-tree/core'
import { industryData } from './data'

const container = document.querySelector<HTMLDivElement>('#chart')
if (!container) throw new Error('#chart 容器不存在')

createBidirectionalTree(container, { data: industryData })
