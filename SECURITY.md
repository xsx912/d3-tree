# 安全策略

## 支持版本

| 版本 | 支持状态 |
| --- | --- |
| latest（npm 上的最新版） | ✅ 支持 |
| 其他历史版本 | ❌ 不支持，请升级 |

## 报告漏洞

**请不要以公开 Issue 的形式报告安全漏洞。**

请通过 [GitHub Security Advisories（私密报告）](https://github.com/xsx912/d3-tree/security/advisories/new) 私密报告，或联系仓库所有者（xsx912）。

报告时请尽量附上：影响版本、复现步骤、影响评估（如 XSS 可行性）。我们会在 7 天内给出初步响应，确认后在下一个补丁版本修复并致谢报告者。

## 已知安全边界

- `tooltip.formatter` 与 `nodeTemplate`（字符串形式）的内容会作为 **HTML 注入** DOM，转义责任在使用方：请勿将未净化的用户输入直接传入。默认渲染路径（`properties` 键值表、`name`）已自动转义。
- `exportImage` 导出的 SVG/PNG 会内联当前 DOM 内容，包含外链资源（图片/字体）时可能受浏览器 canvas 污染限制。
