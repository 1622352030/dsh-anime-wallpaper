# maid-atelier-ex · 深海女仆工坊·EX

DeepSeek Harness Web GUI 的动漫壁纸皮肤：可切换的全屏壁纸背景，加上随亮/暗主题自动切换为白/黑的蒙版。纯展示层客户端插件——`apply()` 设置 `data-dsh-maid-atelier-ex` 作用域、挂载壁纸背景，并为侧栏与对话区叠加半透明蒙版。effect 销毁器还原全部 CSS 写入；不注入服务、不发出 Cordis 事件、不触达模型请求。

## 特性

- 9 张内嵌动漫壁纸（webp data URI，激活不依赖临时文件/远程 URL）
- 右下角浮动「🖼」按钮：下拉菜单切换壁纸、从文件导入自定义图、重命名、删除，均持久化到 localStorage
- 侧栏 / 对话区 / 轨迹页 / 消息气泡 / 代码块等表面统一蒙版（亮=白、暗=黑）
- 新会话（着陆页）对话区无蒙版，壁纸完整呈现；内容沉到底部、不遮挡壁纸主体
- 弹窗（设置面板、菜单、Modal）保持不透明
- 与皮肤中心/dsh-skin 的互斥切换兼容，`wiring.id` 为 `ui-skin-maid-atelier-ex`

## 开启皮肤（安装）

```sh
git clone https://github.com/Small-tailqwq/dsh-deep-whale
cd <harness>
dsh plugin --profile web add ../dsh-deep-whale-ex
```

装完后**重启 web 进程**再刷新浏览器页面，皮肤即生效：

```sh
cd <harness>
dsh web        # 或 pnpm dsh web（源码 checkout 场景）
```

> 开发期若改动皮肤代码并 `pnpm build`，dsh 的 client-plugin HMR 会自动热更新，通常无需重启、刷新即可看到。

## 使用（右下角 🖼 按钮）

- **切换壁纸**：点 🖼 → 点列表里的缩略图，当前选中的打 ✓
- **导入自定义图**：点「从文件导入图片…」→ 选本地图片（自动压到 1920px 宽 webp）
- **重命名**：悬停某项 → 点 ✎
- **删除**：悬停某项 → 点 ✕（内置图为隐藏、自定义图为真删；删除当前项会回退到默认壁纸）

所有选择都自动保存，刷新/重启后仍保留。

## 关闭皮肤

**方式一：彻底卸载**

```sh
cd <harness>
dsh plugin --profile web remove @dsh-external/dsh-client-ui-skin-maid-atelier-ex
```

卸载后重启 web，界面恢复默认。

**方式二：临时禁用（保留安装，可随时恢复）**

在 `~/.dsh/cordis.patch.yml`（机器级配置层）写入：

```yaml
- id: ui-skin-maid-atelier-ex
  disabled: true
```

恢复时删掉这两行（或删掉整个文件）即可。

## 开发与构建

```sh
pnpm install          # 安装构建依赖
python scripts/generate-backgrounds.py   # 重新生成素材嵌入（替换 images/ 后）
pnpm build            # tsdown 构建 lib/
```

## 许可

CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）。素材版权归属见 `NOTICE`。
