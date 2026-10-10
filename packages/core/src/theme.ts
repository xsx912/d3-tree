/** 视觉基线取自参考稿：白底、单一品牌蓝、克制灰阶（Element/AntD 风格）。
 *  实例可通过 options.theme 对任意字段做浅合并覆盖。 */
/** 不加 as const：Theme 取 typeof theme，字段开放为 string/number，
 *  options.theme 的 Partial<Theme> 覆盖值才不必等于默认字面量。 */
export const theme = {
  /** 画布背景（SVG 与导出图片共用） */
  background: '#FFFFFF',
  /** 搜索命中描边/文字色，兼作键盘焦点描边 */
  hitStroke: '#1E6EFF',
  /** 搜索/过滤时非命中元素的淡化透明度 */
  dimmedOpacity: 0.2,

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
}

export type Theme = typeof theme
