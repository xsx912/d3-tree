import type { TreeNodeData } from '@d3-tree/core'

/** 产业链风格示例数据（对齐视觉参考稿：企业 → 左右产业板块 → 细分） */
export const industryData: TreeNodeData = {
  id: 'root',
  name: '小米科技有限责任公司',
  properties: { 成立: '2010年', 总部: '北京', 定位: '消费电子与互联网' },
  children: [
    // 左侧：多元投资与产业布局
    {
      id: 'l-arch',
      name: '装配式建筑',
      side: 'left',
      group: '建筑',
      properties: { 类型: '产业投资' },
      children: [
        { id: 'l-arch-1', name: '预制构件', group: '建筑' },
        { id: 'l-arch-2', name: '绿色建材', group: '建筑' },
      ],
    },
    {
      id: 'l-bio',
      name: '生命科学产业',
      side: 'left',
      group: '医疗',
      children: [
        { id: 'l-bio-1', name: '体外诊断', group: '医疗' },
        { id: 'l-bio-2', name: '医疗器械', group: '医疗' },
        { id: 'l-bio-3', name: '生物制药', group: '医疗' },
      ],
    },
    {
      id: 'l-tcm',
      name: '现代中药产业',
      side: 'left',
      group: '医疗',
      children: [
        { id: 'l-tcm-1', name: '中药创新药', group: '医疗' },
        { id: 'l-tcm-2', name: '配方颗粒', group: '医疗' },
      ],
    },
    {
      id: 'l-ev',
      name: '新能源汽车产业',
      side: 'left',
      group: '汽车',
      children: [
        { id: 'l-ev-1', name: '动力电池', group: '汽车' },
        { id: 'l-ev-2', name: '电驱系统', group: '汽车' },
        { id: 'l-ev-3', name: '车规级芯片', group: '汽车' },
      ],
    },
    { id: 'l-agri', name: '农机装备', side: 'left', group: '装备' },
    { id: 'l-fin', name: '金融科技', side: 'left', group: '金融' },
    // 右侧：核心业务生态
    {
      id: 'r-hw',
      name: '智能硬件',
      side: 'right',
      group: '硬件',
      properties: { 定位: '核心业务' },
      children: [
        {
          id: 'r-hw-phone',
          name: '智能手机',
          group: '硬件',
          children: [
            { id: 'r-hw-fold', name: '折叠屏', group: '硬件' },
            { id: 'r-hw-cam', name: '影像系统', group: '硬件' },
            { id: 'r-hw-chip', name: '自研芯片', group: '硬件' },
          ],
        },
        { id: 'r-hw-wear', name: '可穿戴设备', group: '硬件' },
        { id: 'r-hw-home', name: '智能家居', group: '硬件' },
        { id: 'r-hw-iot', name: 'IoT 平台', group: '硬件' },
        { id: 'r-hw-display', name: '显示技术', group: '硬件' },
      ],
    },
    {
      id: 'r-net',
      name: '互联网服务',
      side: 'right',
      group: '软件',
      children: [
        { id: 'r-net-os', name: '澎湃 OS', group: '软件' },
        { id: 'r-net-cloud', name: '云服务', group: '软件' },
        { id: 'r-net-game', name: '游戏娱乐', group: '软件' },
        { id: 'r-net-store', name: '应用商店', group: '软件' },
      ],
    },
    {
      id: 'r-car',
      name: '电动汽车',
      side: 'right',
      group: '汽车',
      children: [
        { id: 'r-car-veh', name: '整车制造', group: '汽车' },
        { id: 'r-car-ad', name: '智能驾驶', group: '汽车' },
        { id: 'r-car-charge', name: '充电网络', group: '汽车' },
      ],
    },
    {
      id: 'r-tel',
      name: '通信技术',
      side: 'right',
      group: '硬件',
      children: [
        { id: 'r-tel-5g', name: '5G 标准', group: '硬件' },
        { id: 'r-tel-sat', name: '卫星通信', group: '硬件' },
      ],
    },
  ],
}
