# 贡献指南

感谢你想为这个皮肤做贡献！无论是报告问题、提建议还是提交代码，都欢迎。

## 报告 Bug

在提交 Bug 报告前，请先：

1. 搜索 [现有 Issue](https://github.com/1622352030/dsh-anime-wallpaper/issues)，看是否已经有人报告过同样的问题。
2. 阅读 [README 的常见问题](README.md#七常见问题)，看是否是已知现象（比如 npx 间歇性报错）。

提交 Bug 报告时，请用 **Bug 报告模板**，并尽量提供：

- 你的操作系统（Windows/macOS/Linux）和版本
- dsh 的版本（`dsh --version`）
- 浏览器和版本
- 复现步骤
- 期望行为 vs 实际行为
- 相关截图（如果有）

## 提功能建议

提功能建议时，请用 **功能请求模板**，说明：

- 你想要什么功能
- 这个功能解决什么问题
- 期望的效果是什么样的

## 提交代码（Pull Request）

### 开发环境

本项目用 pnpm 构建、tsdown 打包。开始前：

```sh
git clone https://github.com/1622352030/dsh-anime-wallpaper.git
cd dsh-anime-wallpaper
pnpm install
```

### 开发流程

1. Fork 本仓库并克隆到本地。
2. 从 `main` 拉一个功能分支：

   ```sh
   git checkout -b feat/你的改动
   ```

3. 改代码。主要文件：
   - `src/client/index.ts` —— 客户端入口（背景挂载、localStorage 逻辑）
   - `src/client/background-picker.ts` —— 右下角 🖼 背景选择器
   - `src/client/anime-wallpaper.module.css` —— 全部蒙版/布局样式
   - `src/client/backgrounds.generated.ts` —— 内嵌壁纸（由脚本生成，不要手改）
   - `scripts/generate-backgrounds.py` —— 素材生成脚本

4. 构建验证：

   ```sh
   pnpm build
   ```

5. 提交（提交信息用约定式提交，见下）：

   ```sh
   git commit -m "fix: 描述改动"
   ```

6. 推送到你的 fork，然后开 Pull Request 到本仓库的 `main` 分支。

### 提交信息规范

使用[约定式提交（Conventional Commits）](https://www.conventionalcommits.org/zh-hans/)：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档改动
- `style:` 格式（不影响逻辑）
- `refactor:` 重构
- `perf:` 性能优化
- `chore:` 其他杂项

示例：`fix: 暗色主题下侧栏蒙版叠加过深`

### 关于素材与版权

- 新增壁纸素材时，请确认你拥有授权，或素材为可合法分发的作品。
- 本项目整体以 **CC BY-NC-SA 4.0** 发布，禁止商业使用。提交代码即表示你同意你的贡献按此许可分发。
- 换 `images/` 里的源图后，需要重新生成内嵌素材：`python scripts/generate-backgrounds.py`。

### 皮肤定位

这个皮肤是**纯展示层客户端插件**：不注入服务、不发出 Cordis 事件、不触达模型请求。请保持这个定位，不要在皮肤里加入会访问模型、文件系统或网络的能力。

## 需要帮助？

开发相关问题可以直接在 Issue 里提问，或参考 [README](README.md)。
