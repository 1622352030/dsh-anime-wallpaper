# anime-wallpaper · DSH 动漫壁纸

一个给 **DeepSeek Harness（dsh）Web 界面**用的皮肤：把对话界面的背景换成可切换的动漫壁纸，并在侧栏、对话区等地方铺一层半透明蒙版，保证文字看得清。

> 注意：**这个仓库本身不是一个能直接双击运行的软件**，它只是一套「皮肤」。它必须装进 dsh 里才能生效。本文档从头讲清楚怎么装、怎么用、怎么关。

---

## 目录

- [一、它是怎么工作的](#一它是怎么工作的)
- [二、安装前准备（先让 dsh 命令可用）](#二安装前准备先让-dsh-命令可用)
- [三、安装皮肤](#三安装皮肤)
- [四、使用（右下角调色板按钮）](#四使用右下角调色板按钮)
- [五、关闭 / 卸载皮肤](#五关闭--卸载皮肤)
- [六、换电脑迁移](#六换电脑迁移)
- [七、常见问题](#七常见问题)
- [八、开发与构建](#八开发与构建)
- [九、兼容性与版本历史](#九兼容性与版本历史)
- [十、Windows 标题栏（0.12.0 起的新界面）](#十windows-标题栏dsh-0120-起的新界面)
- [十一、许可](#十一许可)

---

## 一、它是怎么工作的

一句话：**皮肤是「数据」，dsh 是「程序」，皮肤装在 dsh 的用户数据目录里，不装在 dsh 程序里。**

具体来说：

- dsh 有一个用户数据目录（Windows 下是 `C:\Users\<你的用户名>\.dsh`），里面有个叫 `web` 的 **profile**（配置环境）。
- 安装皮肤，本质就是「把皮肤包登记进这个 web profile」。
- 皮肤代码本身放在磁盘任意位置，profile 里只是一个**符号链接**指过去。
- 所以不管你是用全局安装的 dsh、还是源码 checkout 的 dsh、还是 npx 下载的 dsh，只要它们读的是同一个 `~/.dsh`，皮肤就都在。

---

## 二、安装前准备（先让 `dsh` 命令可用）

装皮肤之前，你得先有一个能用的 `dsh` 命令。有两种情况，选一种即可。

### 情况 A：没有 dsh 源码（普通用户，推荐）

全局安装 dsh，装一次以后任何目录都能用 `dsh`：

1. 打开 **PowerShell**（Windows 开始菜单搜 `PowerShell` 即可）。
2. 输入下面这行并回车：

   ```powershell
   npm install -g @deepseek-ai/dsh
   ```

3. 等它装完，输入下面这行验证：

   ```powershell
   dsh --version
   ```

   如果打印出类似 `0.1.0-rc.6` 的版本号，说明装好了。

> 前提是你机器上已经装了 Node.js 和 npm（版本 22.19+ 或 24+）。没装的话先去 https://nodejs.org 下载 LTS 版本安装。

### 情况 B：你有 dsh 源码 checkout

如果你是从源码跑的 dsh（比如 `D:\...\deepseek-harness`），那 `dsh` 命令没有全局安装，要用 `pnpm dsh` 来调用，而且要先 `cd` 进源码目录：

```powershell
cd D:\English_path\github_fork\deepseek-harness\deepseek-harness
pnpm dsh --version
```

之后本文档里所有写 `dsh` 的地方，你都替换成「先 `cd` 进源码目录，再用 `pnpm dsh`」。

### 情况 C：用 DSH Desktop 桌面版（Electron 应用）

桌面版**没有** `dsh` 命令，而且它的 profile 由 Electron 独占管理，命令行直接添加会被拒：

```
error: profile "desktop" is managed exclusively by the Electron application
```

所以桌面版走下面两条路之一。

**C-1：应用内插件管理（推荐先试这个）**

打开 DSH Desktop →左侧「插件」/插件管理 → 从本地路径或仓库地址安装 `dsh-anime-wallpaper`。装完按提示**完全退出**再重开。

**C-2：手动登记进 profile（界面里找不到入口时）**

1. 找到桌面版的 profile 目录（Windows 默认）：

   ```
   C:\Users\<你的用户名>\AppData\Roaming\dsh-desktop\harness\profiles\web
   ```

2. 在该目录执行（`-w` 不能省，否则 pnpm 会报 `ERR_PNPM_ADDING_TO_ROOT`）：

   ```powershell
   cd "$env:APPDATA\dsh-desktop\harness\profiles\web"
   pnpm add -w "link:C:\path\to\dsh-anime-wallpaper"
   ```

3. 编辑同目录的 `package.json`，把包加进 `dsh.profile.bundles` 数组：

   ```json
   {
     "dsh": {
       "profile": {
         "bundles": [
           "...",
           "@dsh-external/dsh-client-ui-skin-anime-wallpaper"
         ]
       }
     }
   }
   ```

4. **完全退出** DSH Desktop（托盘图标右键 → 退出；只点窗口右上角的 × 只是收进托盘，配置不会重读），再重新打开。

> 桌面版每次启动都会换端口，这是正常的。皮肤的壁纸选择与开关存在 `localStorage`，换端口不影响你当前这次会话，但**跨重启保存**目前只保证在 `localStorage` 里（同一端口内有效）。

---

## 三、安装皮肤

### 第一步：下载皮肤代码

```powershell
git clone https://github.com/1622352030/dsh-anime-wallpaper.git
```

这一步会在当前目录生成一个 `dsh-anime-wallpaper` 文件夹，里面就是皮肤的全部代码和素材。

> 不用 git 的话，也可以直接下载 ZIP、解压到某个目录，效果一样。

### 第二步：把皮肤登记进 dsh

用**绝对路径**（皮肤文件夹的真实完整路径），这样在哪个目录敲都行：

```powershell
dsh plugin --profile web add <皮肤文件夹的绝对路径>
```

举例（假设你克隆到了 `D:\github_fork` 目录下）：

```powershell
dsh plugin --profile web add D:\github_fork\dsh-anime-wallpaper
```

把 `<皮肤文件夹的绝对路径>` 换成你自己的实际路径。**注意别照抄 `<>` 尖括号**，那是占位符。

成功的标志是输出里出现一行：

```
+ @dsh-external/dsh-client-ui-skin-anime-wallpaper link:...
```

### 第三步：重启 web 让皮肤生效

皮肤层是在 dsh **启动那一刻**扫描的，所以装完后要重启 web：

- **全局安装场景**（情况 A），任意目录直接：

  ```powershell
  dsh web
  ```

- **源码 checkout 场景**（情况 B）：

  ```powershell
  cd <你的 harness 源码目录>
  pnpm dsh web
  ```

等终端打印出 `dsh web: http://127.0.0.1:3080` 之类的地址后，在浏览器打开它，皮肤就生效了。

### 第四步：确认装好了

在浏览器打开 web 界面后：

- 右下角应该多出一个 **圆形调色板图标按钮**；
- 背景应该变成了默认壁纸（灵梦吃花·无水印）。

看到这两样，说明安装成功。

---

## 四、使用（右下角调色板按钮）

皮肤的所有操作都在右下角那个 **圆形调色板图标按钮**里完成。点它，会弹出一个下拉菜单。

### 1. 切换壁纸

1. 点右下角调色板按钮，打开菜单。
2. 菜单里列出了所有壁纸，每项左边是小缩略图、右边是名字。
3. 点你想用的那一项，背景立刻切换。
4. 当前正在用的那一项，右边会显示一个 **✓** 对勾。

内置 9 张壁纸分别是：兔子打伞、咲夜看雪、早苗摸鱼、橘子洲头、灵梦吃花·无水印（默认）、灵梦吃花、灵梦泡水、纳西达、蕾姆流星锤。

### 2. 从文件导入自定义图片

1. 点右下角调色板按钮打开菜单。
2. 点菜单最底部的 **「从文件导入图片…」**。
3. 系统会弹出文件选择窗口，选一张你电脑上的图片（jpg/png/webp 都行）。
4. 皮肤会自动把图片压到 1920px 宽、转成 webp 再存起来，然后立刻设为当前背景。

导入的图片会永久保存，下次刷新、重启都还在。

### 3. 重命名一个主题

1. 点右下角调色板按钮打开菜单。
2. 把鼠标**悬停**到你想改名的那个主题上，这一行的右侧会浮现两个小按钮 **✎**（重命名）和 **✕**（删除）。
3. 点 **✎**，会弹出一个输入框。
4. 输入新名字，点确定，名字就改好了。

内置壁纸和自定义图都可以重命名，改完会记住。

### 4. 删除一个主题

1. 点右下角调色板按钮打开菜单。
2. 悬停到要删的主题上，点右侧的 **✕** 按钮。
3. 弹窗问你是否确认，点确定。

区别：

- **内置壁纸**：删除 = 从列表里「隐藏」（数据还在，只是不再显示）。
- **自定义图**：删除 = 真正删掉（连图片数据一起删）。

如果删掉的是当前正在用的背景，会自动切回默认壁纸，不会留空。

> 以上所有操作都会自动保存到浏览器 localStorage，无需手动保存。

### 5. 自动配色（可选开关）

菜单最底部有一个 **「自动配色（从壁纸取色）」** 勾选框，**默认关闭**。

- **关闭时**（默认）：蒙版就是原设计的半透明白（浅色主题）/ 黑（深色主题），文字对比由设计保证。
- **打开后**：皮肤读取当前壁纸，算出平均色，再按**当前主题的文字色**决定蒙版往哪边走：
  - 深色主题（文字近白）→ 蒙版取**壁纸色相的深色版**；
  - 浅色主题（文字近黑）→ 蒙版取**壁纸色相的浅色版**。

  这样蒙版与画面有色彩关联，但始终站在文字的对侧，不会把正文淹没。

**觉得不好看随时关掉**：勾掉立刻回到原来的黑白蒙版，不需要重启，也不会丢任何设置。

> 方向由**文字色**决定而不是壁纸亮度，这是有意为之：深色主题里若按壁纸亮度选，遇到浅色壁纸会同时得到「浅蒙版 + 白字」，正文就沉进壁纸里了（这是 1.4.0 开发中实际踩过的坑）。

---

## 五、关闭 / 卸载皮肤

两种方式，按需选择。

### 方式一：彻底卸载（一劳永逸）

在终端执行：

```powershell
dsh plugin --profile web remove @dsh-external/dsh-client-ui-skin-anime-wallpaper
```

（源码 checkout 场景同样先 `cd` 进源码目录，用 `pnpm dsh`。）

然后重启 web，界面就恢复默认了。

### 方式二：临时禁用（保留安装，随时恢复）

如果只是想暂时关掉、以后还想用，就「禁用」而不是卸载：

1. 打开文件 `C:\Users\<你的用户名>\.dsh\cordis.patch.yml`（机器级配置文件；没有这个文件就新建一个）。
2. 写入下面两行：

   ```yaml
   - id: ui-skin-anime-wallpaper
     disabled: true
   ```

3. 保存。dsh 会监视这个文件并自动重载，皮肤随即关闭。

以后想恢复，把这两行删掉（或整个文件删掉）即可。

---

## 六、换电脑迁移

皮肤代码搬过去 + 新电脑重新登记一次，两步搞定。

### 第一步：拿到皮肤代码

用 git（推荐）：

```powershell
git clone https://github.com/1622352030/dsh-anime-wallpaper.git
```

或者直接拷整个 `dsh-anime-wallpaper` 文件夹过去。

### 第二步：新电脑上装

```powershell
# 先让 dsh 可用（参考「二、安装前准备」）
npm install -g @deepseek-ai/dsh

# 再登记皮肤（用绝对路径）
dsh plugin --profile web add <新电脑上皮肤文件夹的绝对路径>
```

然后重启 web、刷新浏览器即可。

### 关于你的个人选择（壁纸选择、自定义图）

这些存在**浏览器 localStorage**里，只在**当前环境**生效，不会跟着代码走：

- **同一环境内**（同一个浏览器）：刷新、重启 web 后仍保留；
- **跨环境**（Web 浏览器 ↔ 桌面版）：**不共享**，各自独立；
- **换电脑**：不会跟着代码走，需要重新选。

> 说明：目前皮肤**没有跨环境的服务器端保存**。壁纸选择等只存在各环境自己的 localStorage 里，Web 和桌面版不会互通。

想搬走（同一浏览器换设备），可在旧浏览器控制台（F12）读出 4 个键的值，再到新浏览器控制台 `localStorage.setItem(...)` 写回：

```js
localStorage.getItem('dsh-skin-anime-wallpaper.background')  // 当前壁纸
localStorage.getItem('dsh-skin-anime-wallpaper.custom')      // 自定义图
localStorage.getItem('dsh-skin-anime-wallpaper.names')       // 重命名
localStorage.getItem('dsh-skin-anime-wallpaper.hidden')      // 隐藏列表
```

---

## 七、常见问题

### Q1：`npx @deepseek-ai/dsh web` 报 `'dsh' is not recognized` 或 `Could not determine Node.js install directory`

这是 **npx 在 Windows 上的间歇性坑**，不是皮肤也不是 dsh 的 bug。npx 每次要临时下载组装上百个依赖，下载不完整就会报这种莫名其妙的错。

解决：

- 优先用**全局安装**代替 npx：`npm install -g @deepseek-ai/dsh`；
- 或者清缓存重试：`npm cache clean --force` 后再 `npx @deepseek-ai/dsh web`。

### Q2：装完皮肤了，但界面没变化

多半是 **web 没重启**。皮肤层在启动时扫描，装完必须重启 web（见「三、第三步」）再刷新浏览器。

### Q3：改了皮肤代码，怎么生效？

在皮肤目录执行 `pnpm build`。dsh 的 client-plugin HMR 会自动热更新，通常刷新一下浏览器（或自动）就能看到。

### Q4：皮肤的选择数据存在哪？

- 皮肤代码和素材：你克隆/解压出来的 `dsh-anime-wallpaper` 文件夹。
- 安装登记：`C:\Users\<你的用户名>\.dsh\profiles\web\`（里面是符号链接）。
- 你的选择（壁纸、自定义图、重命名、隐藏列表）：浏览器 localStorage，键都以 `dsh-skin-anime-wallpaper.` 开头。仅当前环境有效，Web 与桌面版不共享。

---

## 八、开发与构建

如果你要改皮肤（换素材、调样式、改逻辑）：

```powershell
# 1. 进入皮肤目录
cd <皮肤目录>

# 2. 安装构建依赖（第一次才需要）
pnpm install

# 3.（可选）换了 images/ 里的源图后，重新生成内嵌素材
python scripts/generate-backgrounds.py

# 4. 构建，输出到 lib/
pnpm build
```

构建产物在 `lib/`，已构建的 `lib/` 默认被 `.gitignore` 忽略（可重新生成）。

---

## 九、兼容性与版本历史

皮肤是样式注入层，**能不能用取决于 DSH 前端的 DOM 结构**，所以每个版本都标注了它验证过的 DSH 版本。完整历史见 [`CHANGELOG.md`](CHANGELOG.md)。

### 两个版本号要分开看

| 名称 | 是什么 | 在哪看 |
| --- | --- | --- |
| **DSH Desktop** | 桌面版安装包的版本 | 应用「设置 → 关于」，或安装包文件名 |
| **Harness 内核** | 真正决定前端 DOM 的那一层，也是插件兼容性检查的对象 | DSH Desktop `0.12.0` 起内核包收进 `C:\Program Files\DSH Desktop\resources\app.asar`（不再有 unpacked 副本）；启动日志里 `dsh 0.1.7` 的提示即此层版本 |

### 当前版本

| 皮肤版本 | 兼容 DSH Desktop | 兼容 Harness 内核 |
| --- | --- | --- |
| `1.4.0` | `0.12.0` | `0.1.7` |
| `1.3.1` | `0.12.0` | `0.1.7` |
| `1.3.0` | `0.12.0` | `0.1.7` |
| `1.2.0` | `0.10.0` | `0.1.7-rc.2` |
| `1.1.1` | `0.10.0` | `0.1.7-rc.2` |

皮肤在 `package.json` 里用 `engines.dsh` 声明兼容的内核范围（当前 `^0.1.7-rc.2`）。DSH 内核会读这个字段：**不满足时会把皮肤判为不兼容并跳过**，而不是加载后悄悄出问题。所以如果 DSH 升到 `0.2.x` 而皮肤没跟上，你会看到皮肤「没生效」——那时来更新皮肤即可。

### 历史版本

| 皮肤版本 | 日期 | 兼容 DSH Desktop | 说明 |
| --- | --- | --- | --- |
| `1.4.0` | 2026-10-22 | `0.12.0` | 新增自动配色；修复 Windows 标题栏亮条与左上圆角缺口 |
| `1.3.1` | 2026-10-22 | `0.12.0` | 补上窗口标签栏（tab strip）蒙版 |
| `1.3.0` | 2026-10-22 | `0.12.0` | 适配工作台页与会话页顶部标签栏蒙版 |
| `1.2.0` | 2026-10-16 | `0.10.0` | 适配技能中心页面蒙版 |
| `1.1.1` | 2026-09-30 | `0.10.0` | 修复任务／目标／队列／智能体面板蒙版失效 |
| `1.1.0` | 2026-09-28 | `0.10.0` | 适配新会话 PPT 模式与插件管理页面 |
| `1.0.1` | 2026-09-16 | `0.9.0` | 适配 DSH 0.9.0 前端改动，补回丢失的蒙版 |
| `1.0.0` | 2026-08-14 | `0.1.x` | 初版：动漫壁纸 + 主题自适应黑白蒙版 |

> 升级 DSH 之后皮肤失效，通常是 DSH 改了 DOM 结构或主题变量。带上面这张表提 issue，能省一半排查时间。

---

## 十、Windows 标题栏（DSH 0.12.0 起的新界面）

**它不是系统边框，是 DSH 用 CSS 画在网页里的**：

```css
[data-windows-titlebar] .frame:before {
  height: var(--dsh-windows-titlebar-height);   /* 34px */
  background: var(--dsw-specific-sidebar-fill);
  -webkit-app-region: drag;                     /* 可拖动窗口 */
}
```

它填充的是 `--dsw-specific-sidebar-fill`。本皮肤为了「侧边栏只叠一层蒙版」把这个 token 设成 `transparent`，于是这条也跟着透明，露出 Electron 的窗口底色 `#f8f8f6`——看起来就像「没上色的原生标题栏」。

**1.4.0 已适配**：单独给这个伪元素铺蒙版（会话页 75%、hero 页 50%，跟随侧边栏），并加 `z-index: 1` 让它盖在侧边栏之上（否则左端会被侧边栏自己那层盖住，形成左右深浅不同的接缝）。

另外 DSH 还给中心列切了一个 `border-radius: 16px 0 0 0` 的左上圆角；中心列背景被皮肤清成透明，那个圆角缺口会直通壁纸，形成一小块楔形亮斑。1.4.0 已把它压平为 `0`。

以上两条都限定在 `[data-windows-titlebar]`，只在 Windows 生效，macOS / Linux 布局不受影响。

> **给后来者的排查提示**：看到某处「没蒙版」时，先用开发者工具（`Ctrl+Shift+I`）对那一点执行 `document.elementFromPoint(x, y)`，再沿命中元素往上找 `background` 不为透明的祖先。多数「漏修」其实是**共享 token 被清成了 `transparent`**（或者被别的层盖住），补一条局部规则即可。真正属于宿主、CSS 够不到的地方很少——本项目自己就曾把这块误判成「原生边框不可改」，绕了很大一圈才回到 CSS 上。

---

## 十一、许可

CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）。背景壁纸素材版权归各画师所有，署名链详见 `NOTICE`。
