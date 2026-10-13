# 06：销毁时恢复容器定位样式

Status: resolved
Priority: P3
Blocked by: None

## 实施

仅在库写入 position: relative 时记录原内联属性值与 priority。destroy 恢复原值；原本非 static 的容器不修改。若调用端在存活期间主动修改了该属性，销毁不得覆盖其新值。销毁保持幂等。

## 验收

- [x] 原无内联 position、显式 static、带 !important 的情况均能正确恢复。
- [x] 原 relative/absolute 等定位保持；调用端后续样式修改保持。
- [x] create→destroy→create 复用容器无定位残留及多余 SVG/浮层/样式。
- [x] 添加 core patch changeset。

## 验收记录（2026-10-13）

保存 position 值及 priority，幂等销毁，只恢复仍由库控制的属性；原 static!important 与调用端后续修改均验证。详见 ../verification.md 与 ../minimum-validation.log。
