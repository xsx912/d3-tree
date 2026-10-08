/** 视觉基线取自参考稿：白底、单一品牌蓝、克制灰阶（Element/AntD 风格） */
export const theme = {
  rootFill: '#1E6EFF',
  rootText: '#FFFFFF',
  rootFontSize: 16,
  rootHeight: 44,

  nodeFill: '#FFFFFF',
  nodeStroke: '#DCDFE6',
  nodeText: '#303133',
  nodeFontSize: 14,
  nodeHeight: 34,

  aggregateText: '#909399',

  link: '#C0C4CC',
  linkWidth: 1,

  radius: 4,

  badgeRadius: 7,
  badgeFill: '#FFFFFF',
  badgeStroke: '#C0C4CC',
  badgeText: '#909399',

  font: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',

  groupPalette: [
    '#5B8FF9',
    '#5AD8A6',
    '#F6BD16',
    '#E8684A',
    '#6DC8EC',
    '#9270CA',
    '#FF9D4D',
    '#5D7092',
  ],
} as const

export type Theme = typeof theme
