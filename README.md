# maid-atelier-ex · 深海女仆工坊·EX

DeepSeek Harness Web GUI 的动漫壁纸皮肤：可切换的全屏壁纸背景，加上随亮/暗主题自动切换为白/黑的弱蒙版。纯展示层客户端插件——`apply()` 设置 `data-dsh-maid-atelier-ex` 作用域、挂载壁纸背景，并为侧栏与对话区叠加半透明蒙版。effect 销毁器还原全部 CSS 写入;不注入服务、不发出 Cordis 事件、不触达模型请求。

## 特性

- 9 张内嵌动漫壁纸（webp data URI，激活不依赖临时文件/远程 URL）
- 默认使用「灵梦吃花（无水印）」，可通过 localStorage 热切换任意一张
- 侧栏与对话区弱蒙版：亮色主题为白、暗色主题为黑（35% 不透明度）
- 新会话（着陆页）对话区无蒙版，壁纸完整呈现
- 与皮肤中心/dsh-skin 的互斥切换兼容，`wiring.id` 为 `ui-skin-maid-atelier-ex`

## 安装

```sh
git clone https://github.com/Small-tailqwq/dsh-deep-whale
cd <harness>
dsh plugin --profile web add ../dsh-deep-whale-ex
```

加载即生效、卸载即复原。

## 切换背景

在浏览器控制台执行（key 见下表），随后刷新或触发跨标签页 `storage` 事件即热切换：

```js
localStorage.setItem('dsh-skin-maid-atelier-ex.background', 'nahida')
```

| key | 素材 |
|---|---|
| `rabbit-umbrella` | 兔子打伞 |
| `sakuya-snow` | 咲夜看雪 |
| `sanae-fishing` | 早苗摸鱼 |
| `orange-isle` | 橘子洲头 |
| `reimu-flower` | 灵梦吃花（无水印，默认） |
| `reimu-flower-wm` | 灵梦吃花 |
| `reimu-water` | 灵梦泡水 |
| `nahida` | 纳西达 |
| `rem` | 蕾姆流星锤 |

## 开发与构建

```sh
pnpm install          # 安装构建依赖
python scripts/generate-backgrounds.py   # 重新生成素材嵌入（替换 images/ 后）
pnpm build            # tsdown 构建 lib/
```

## 许可

CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）。素材版权归属见 `NOTICE`。
