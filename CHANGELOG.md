# 更新日志

本皮肤是 DSH Web 界面的样式注入层，**能不能用取决于 DSH 前端的 DOM 结构**：DSH 每改一次界面，某些蒙版就可能失效。所以每个皮肤版本都标注它**验证过**的 DSH 版本。

## 两个版本号要分开看

| 名称 | 是什么 | 在哪看 | 例 |
| --- | --- | --- | --- |
| **DSH Desktop** | 桌面版安装包的版本 | 应用「设置 → 关于」或安装包文件名 | `0.10.0` |
| **Harness 内核** | 真正决定前端 DOM 的那一层，也是**插件兼容性检查的对象** | 安装目录 `resources/app.asar.unpacked/node_modules/@deepseek-ai/dsh-client-ui-conversation/package.json` 里的 `version` | `0.1.7-rc.2` |

皮肤通过 `package.json` 的 `engines.dsh` 声明兼容的内核范围。内核会读取它（见 DSH 的 `inferPluginRuntimeCompatibility`）：**不满足时插件被判为不兼容并被跳过**，而不是加载后悄悄出问题。

## 版本对照表

| 皮肤版本 | 日期 | 兼容 DSH Desktop | 兼容 Harness 内核 | 说明 |
| --- | --- | --- | --- | --- |
| `1.1.1` | 2026-09-30 | `0.10.0` | `0.1.7-rc.2` | 修复任务面板／目标条／队列面板／智能体团队面板的蒙版失效 |
| `1.1.0` | 2026-09-28 | `0.10.0` | `0.1.7-rc.2` | 适配新会话 PPT 模式（chip + 模板面板）与插件管理页面 |
| `1.0.1` | 2026-09-16 | `0.9.0` | 未记录 | 适配 DSH 0.9.0 前端改动，补回丢失的蒙版 |
| `1.0.0` | 2026-08-14 | `0.1.x` | 未记录 | 初版：动漫壁纸 + 主题自适应黑白蒙版 |

> 「未记录」是指当时没有留下内核版本记录，不是「不兼容」。DSH Desktop `0.1.x` 是 2026-08-14 当天连发的 `0.1.2`～`0.1.5`。
> DSH Desktop 与内核的对应关系（节选自官方发布说明）：`0.4.0`→内核 `0.1.0-rc.8`，`0.6.0`→`0.1.1-rc.2`，`0.7.0`→`0.1.2-alpha.1`，`0.8.0-rc.1`→`0.1.2-alpha.4`，`0.10.0`→`0.1.7-rc.2`。

## 版本规则

- 皮肤用**自己的**语义化版本（从 `1.0.0` 起），与 DSH 版本解耦；DSH 版本只出现在兼容性字段和本表里。
- 当前兼容范围：`^0.1.7-rc.2`。按 DSH 自己的 `satisfiesComparator` 语义，这意味着：
  - 兼容 `0.1.7-rc.2` 及同段的 prerelease；
  - 兼容后续 `0.1.x`（如 `0.1.8`）；
  - **不兼容 `0.2.x`**——内核大版本一变，皮肤会被判为不兼容并跳过，促使你去更新皮肤，而不是带着失效的蒙版运行。
- 每次适配新 DSH 版本，需要同步四处：`package.json` 的 `engines.dsh`、`skin.json` 的 `compatibility`、本文件的表格、`README.md` 的兼容性章节。

---

## 1.1.1 — 2026-09-30

**适配**：DSH Desktop `0.10.0` / Harness `0.1.7-rc.2`

**修复**

- 任务面板（TodoPanel）、目标条（goal bar）、队列面板、智能体团队面板的蒙版恢复。这四个组件已从 `--dsw-specific-tip` 迁移到 `--dsw-specific-menu`（实测值 `#43454a73`，即 45% 灰加 40px 磨砂），而皮肤只覆盖了前者，导致它们不再受皮肤控制。
- 修复方式是在这四个面板上**局部**重指变量（`[data-testid='todo-panel']`、`[class*='lXshSW_root']`、`[class*='nLMEza_bar']`、`[class*='_7yHdaG_panel']`、`[class*='VoX2oq_panel']`），并把 `--dsw-menu-backdrop-filter` 设为 `none`。**不能全局改** `--dsw-specific-menu`：它另有 13 处消费者是真菜单／弹窗（模型选择、后台任务菜单、日程面板、HoverCard 等），必须保持不透明。

**新增**

- 引入版本管理：`package.json` 增加 `engines.dsh` 兼容性声明（DSH 内核的 `inferPluginRuntimeCompatibility` 会校验它，不匹配则跳过本插件）、`skin.json` 增加 `version` 与 `compatibility` 元数据、新增本更新日志、`README.md` 增加「兼容性与版本历史」章节。
- 皮肤版本号从占位的 `0.0.1` 规范为 `1.1.1`，并回溯标注历史版本（见上表）。

## 1.1.0 — 2026-09-28

**适配**：DSH Desktop `0.10.0` / Harness `0.1.7-rc.2`

**新增适配**

- 新会话（hero）页的 PPT 模式 chip 与模板面板蒙版。DSH 用 `.…_heroModeCluster button{background:transparent!important}` 清掉了整簇按钮底色，皮肤侧只能对**未选中态**用 `!important` 补蒙版（选中态保留 DSH 自己的 `#262626` 实心）。
- 侧栏「插件」入口打开的插件管理页面蒙版。该页面打开时文档里**没有任何** `[data-phase]` 标记，导致全部 phase 相关规则失效、中心列回落为透明。
- PPT「我的模板」对话框：它写的是 `background:var(--dsw-alias-bg-base,#fff)`，而该 token 被皮肤清成 `transparent`、回退值不生效；改用未被改动的 `--dsw-alias-bg-layer-2` 恢复不透明。

## 1.0.1 — 2026-09-16

**适配**：DSH Desktop `0.9.0`（内核版本当时未记录）

**修复**

- 适配 DSH 0.9.0 的前端改动，补回丢失的蒙版。

## 1.0.0 — 2026-08-14

**适配**：DSH Desktop `0.1.x`（当天连发 `0.1.2`～`0.1.5`；内核版本当时未记录）

**初始版本**

- 动漫壁纸全屏背景 + 主题自适应（亮/暗）黑白蒙版。
- 同期完成：侧栏与对话区蒙版、用户消息气泡、markdown 代码块与标题栏、目标卡片／todo 面板／队列、弹窗保持不透明、输入框蒙版、浮动壁纸选择器（内置壁纸 + 自定义图导入 + 持久化）。
