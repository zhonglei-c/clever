# Clever Browser Game

这是《快可聪明》浏览器多人版项目的仓库入口。

开始任何开发前，请先看下面三个文件：

- [PROJECT_BOARD.md](./PROJECT_BOARD.md): 项目总看板与可勾选功能清单
- [PROJECT_BLUEPRINT.md](./PROJECT_BLUEPRINT.md): 产品、技术、页面、架构总纲
- [HANDOFF.md](./HANDOFF.md): 换模型、换 IDE、换协作者时的续接说明

项目资料来源：

- `Ganz_schon_clever.pdf`: 规则书
- `prettyclever_w_scoring_black.pdf`: 原始计分表 UI 参考

协作约定：

- 每完成一个功能，就更新 `PROJECT_BOARD.md` 里的勾选状态
- 如果实现过程中改变了产品或技术方向，就同步更新 `PROJECT_BLUEPRINT.md`
- 如果阶段目标、当前进度、注意事项发生变化，就同步更新 `HANDOFF.md`

当前目标：

- 先完成可部署到小型服务器上的多人房间制 MVP
- 支持多桌并发，每桌 `1-6` 人
- 保留原作计分纸视觉语言和玩法手感

快速启动：

```bash
npm install
npm run dev:server
npm run dev:web
```

基础校验：

```bash
npm run typecheck
npm run build
```

项目内置 skill：

```bash
./project-skills/clever-project/scripts/link-into-codex-home.sh
```

说明：

- 项目专属 skill 源码放在 `project-skills/clever-project`
- 换设备后，在仓库根目录执行上面的脚本，会把这个 skill 链接到 `${CODEX_HOME:-$HOME/.codex}/skills`
- 这样 skill 跟着仓库走，但 Codex 仍能按本机默认位置自动发现它
