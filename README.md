# anime-wallpaper · DSH 动漫壁纸

一个给 **DeepSeek Harness（dsh）Web 界面**用的皮肤：把对话界面的背景换成可切换的动漫壁纸，并在侧栏、对话区等地方铺一层半透明蒙版，保证文字看得清。

> 注意：**这个仓库本身不是一个能直接双击运行的软件**，它只是一套「皮肤」。它必须装进 dsh 里才能生效。本文档从头讲清楚怎么装、怎么用、怎么关。

---

## 目录

- [一、它是怎么工作的](#一它是怎么工作的)
- [二、安装前准备（先让 dsh 命令可用）](#二安装前准备先让-dsh-命令可用)
- [三、安装皮肤](#三安装皮肤)
- [四、使用（右下角 🖼 按钮）](#四使用右下角--按钮)
- [五、关闭 / 卸载皮肤](#五关闭--卸载皮肤)
- [六、换电脑迁移](#六换电脑迁移)
- [七、常见问题](#七常见问题)
- [八、开发与构建](#八开发与构建)
- [九、许可](#九许可)

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

- 右下角应该多出一个 **🖼 按钮**；
- 背景应该变成了默认壁纸（灵梦吃花·无水印）。

看到这两样，说明安装成功。

---

## 四、使用（右下角 🖼 按钮）

皮肤的所有操作都在右下角那个 **🖼 圆形按钮**里完成。点它，会弹出一个下拉菜单。

### 1. 切换壁纸

1. 点右下角 🖼 按钮，打开菜单。
2. 菜单里列出了所有壁纸，每项左边是小缩略图、右边是名字。
3. 点你想用的那一项，背景立刻切换。
4. 当前正在用的那一项，右边会显示一个 **✓** 对勾。

内置 9 张壁纸分别是：兔子打伞、咲夜看雪、早苗摸鱼、橘子洲头、灵梦吃花·无水印（默认）、灵梦吃花、灵梦泡水、纳西达、蕾姆流星锤。

### 2. 从文件导入自定义图片

1. 点 🖼 打开菜单。
2. 点菜单最底部的 **「从文件导入图片…」**。
3. 系统会弹出文件选择窗口，选一张你电脑上的图片（jpg/png/webp 都行）。
4. 皮肤会自动把图片压到 1920px 宽、转成 webp 再存起来，然后立刻设为当前背景。

导入的图片会永久保存，下次刷新、重启都还在。

### 3. 重命名一个主题

1. 点 🖼 打开菜单。
2. 把鼠标**悬停**到你想改名的那个主题上，这一行的右侧会浮现两个小按钮 **✎**（重命名）和 **✕**（删除）。
3. 点 **✎**，会弹出一个输入框。
4. 输入新名字，点确定，名字就改好了。

内置壁纸和自定义图都可以重命名，改完会记住。

### 4. 删除一个主题

1. 点 🖼 打开菜单。
2. 悬停到要删的主题上，点右侧的 **✕** 按钮。
3. 弹窗问你是否确认，点确定。

区别：

- **内置壁纸**：删除 = 从列表里「隐藏」（数据还在，只是不再显示）。
- **自定义图**：删除 = 真正删掉（连图片数据一起删）。

如果删掉的是当前正在用的背景，会自动切回默认壁纸，不会留空。

> 以上所有操作都会自动保存到浏览器 localStorage，无需手动保存。

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

这些存在**浏览器 localStorage**里，不会跟着代码走。两种处理：

- **不管它**：新电脑装好后重新点几下选壁纸、重新导入图片即可（最简单）。
- **想搬过去**：在旧浏览器控制台（F12）执行 `localStorage.getItem('dsh-skin-anime-wallpaper.background')` 读出值，再到新浏览器控制台 `localStorage.setItem(...)` 写回去。

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
- 你的选择（壁纸、自定义图、重命名、隐藏列表）：浏览器 localStorage，键都以 `dsh-skin-anime-wallpaper.` 开头。

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

## 九、许可

CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）。背景壁纸素材版权归各画师所有，署名链详见 `NOTICE`。
