---
'@d3-tree/core': minor
'@d3-tree/vue': patch
'@d3-tree/react': patch
---

修复数据换代后的异步加载/搜索残留、稳定 ID 自定义内容更新及聚合 key 冲突；nodeRenderer 新增可选清理返回值，在刷新、退出和销毁时释放内容资源。补基础树所有权与层级、默认文字对比度、减少动态效果规则，并恢复容器定位样式。

React 悬停事件回调经最新 props 调用、点击开关热更新；Vue 条件悬浮框插槽切换安全回退。新增两框架组件集成测试。

PNG 使用 canvas.toBlob 与 Blob URL 下载，避免 data URL 下载受浏览器限制；销毁后命令不再修改数据或发起下载，失败转换保持 URL 清理。
