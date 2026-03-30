# API And Socket Events

最后更新：`2026-03-29`

## 1. HTTP

### `GET /health`

- 用途：服务健康检查

### `GET /rooms/:roomId`

- 用途：临时占位接口
- 备注：后续会改成真实房间查询

## 2. Socket 事件草案

### 房间事件

- `room:create`
- `room:join`
- `room:leave`
- `room:ready`
- `room:start`
- `room:dissolve`

### 游戏事件

- `game:roll`
- `game:select-die`
- `game:apply-bonus`
- `game:passive-pick`
- `game:end-turn`
- `game:state-sync`
- `game:finished`

### 连接事件

- `presence:join`
- `presence:leave`
- `presence:reconnect`

## 3. 事件设计原则

- 事件名尽量表达意图，而不是表达 UI 点击
- 每个事件都要带 `roomId`
- 每个游戏动作都应具备服务端可重放性
- 拒绝非法动作时，要返回明确错误码与原因

## 4. 下一步

- 给每个事件补 payload schema
- 区分 `client -> server` 与 `server -> client`
- 明确重连时的状态同步协议
