# 01：隔离数据换代与清除搜索状态

Status: resolved
Priority: P2
Blocked by: None

## 问题

setData 重置部分状态但保留 loadingKeys/searchState；expandLazy 和 revealByParent 的异步回调只检查 destroyed。新树同 ID 节点被旧请求阻塞，旧回调可修改旧对象及新实例状态，旧搜索类可留在复用 DOM 上。

## 实施

引入每次 setData 都递增的数据代次。两条加载路径在调用 loader 前捕获代次，成功与失败均检查有效性；失效请求不得清除新代次同 key 的 loading 或发事件。setData 清 loading 集合与复用节点 loading 类，调用完整搜索清理逻辑后替换数据。保持当前其他重置与动画规则。

## 验收

- [x] 延迟旧请求成功/失败，对新树、旧数据对象及事件均无副作用。
- [x] 两条加载路径均覆盖；新树同 ID 可立即发起新请求，旧请求结束不撤销新 loading。
- [x] 永不结束的旧请求不阻塞新树；同一数据引用再次 setData 也使旧请求失效。
- [x] search 后 setData：不同 ID 和相同 ID/名称变化均无旧 hit、ancestor、dimmed 类。
- [x] destroy 后响应仍无副作用；现有懒加载/搜索行为通过。
- [x] 添加 core patch changeset。

## 验收记录（2026-10-13）

每次 setData 使用代次隔离，两加载路径成功/失败均忽略旧请求；清 loading 与完整搜索 DOM 类。回归见 data-update.test.ts。详见 ../verification.md 与 ../minimum-validation.log。
