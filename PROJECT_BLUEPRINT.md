# Project Blueprint

最后更新：`2026-03-29`

## 1. 项目目标

构建《快可聪明》浏览器多人版，先部署到一台小型服务器上，支持多桌并发，每桌支持 `1-6` 人。产品重点是：

- 规则正确
- 联机稳定
- UI 保留原作计分纸的视觉语言和操作手感
- 易于后续继续开发和交接

## 2. 首发范围

首发版本是一个可联机、可结算、可部署的房间制 MVP。

包含：

- 昵称入桌
- 创建房间与加入房间
- 房主开始游戏
- 完整对局流程
- 完整计分与结算
- 断线重连

不包含：

- AI 玩家
- 公开匹配
- 复杂账号系统
- 扩展规则包

## 3. 产品原则

- 服务端权威，前端不决定规则结果
- 规则引擎独立于前后端 UI
- 先保证桌面端与平板端体验
- UI 以“数字化计分纸”为核心，不做实体桌面模拟器
- 风格上保留原汁原味，但避免直接照搬原始素材

## 4. 推荐技术栈

### 前端

- `React`
- `TypeScript`
- `Vite`
- `DOM + SVG` 作为主要 UI 渲染方式

### 服务端

- `Node.js`
- `TypeScript`
- `Fastify`
- `Socket.IO`

### 数据与部署

- `SQLite` 作为 MVP 存储
- `Docker Compose` 部署
- `Caddy` 或 `Nginx` 反向代理

## 5. 架构原则

项目拆成三个核心层：

### `apps/web`

负责：

- 页面
- UI 组件
- 用户交互
- Socket 连接
- API 调用

### `apps/server`

负责：

- 房间逻辑
- 会话管理
- 联机同步
- 重连恢复
- 服务端规则调用

### `packages/game-core`

负责：

- 游戏状态模型
- 行为合法性校验
- 回合状态机
- 奖励链
- 计分
- 终局判定

### `packages/shared`

负责：

- 前后端共用类型
- 事件定义
- Schema 校验

## 6. 页面结构

### 首页 `/`

- 昵称输入
- 创建房间
- 加入房间
- 规则入口

### 房间页 `/room/:roomId`

- 房间信息
- 邀请链接与房间码
- 玩家列表
- 准备状态
- 房主控制

### 对局页 `/game/:roomId`

- 顶部状态条
- 中央公共骰池与银盘
- 自己的计分纸主视图
- 其他玩家摘要视图
- 操作面板
- 奖励反馈区域

### 结算层

- 排名
- 分项得分
- 再来一局

### 规则页 `/rules`

- 简化说明
- 区域说明
- 关键术语

## 7. 目录结构

```text
apps/
  web/
  server/
packages/
  shared/
  game-core/
infra/
docs/
```

推荐扩展结构：

```text
apps/web/src/pages
apps/web/src/features
apps/web/src/components
apps/web/src/services
apps/server/src/routes
apps/server/src/sockets
apps/server/src/modules
packages/shared/src/types
packages/shared/src/schemas
packages/game-core/src/engine
packages/game-core/src/model
packages/game-core/src/rules
packages/game-core/src/tests
```

## 8. 事件方向

建议预留以下事件：

- `room:create`
- `room:join`
- `room:leave`
- `room:ready`
- `game:start`
- `game:roll`
- `game:select-die`
- `game:apply-bonus`
- `game:end-turn`
- `game:state-sync`
- `game:reconnect`
- `game:finished`

## 9. 开发顺序

1. 先写规则拆解文档
2. 再实现 `game-core`
3. 再接 `server`
4. 最后做高保真前端 UI
5. 再做部署与压测

## 10. 里程碑

### M1: 文档与骨架

- 工程初始化
- 规则拆解
- 状态模型
- 基础目录

### M2: 单机跑通

- 本地单桌规则跑通
- 计分引擎可用
- 基本 UI 成型

### M3: 联机 MVP

- 房间系统
- 同步逻辑
- 重连恢复
- 完整结算

### M4: 可部署版本

- Docker 化
- VPS 部署
- 基础压测

## 11. 风险与约束

- 规则链条复杂，必须优先做测试
- 手机端不适合作为首发主目标
- 公网部署时要注意版权与素材替代
- UI 高保真不等于逐像素复刻

## 12. 文档维护规则

- 功能进度更新到 `PROJECT_BOARD.md`
- 方向变化更新到本文件
- 阶段总结与交接更新到 `HANDOFF.md`
