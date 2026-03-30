# State Machine

最后更新：`2026-03-30`

## 1. 房间状态

```text
created -> lobby -> starting -> in_game -> finished
               \-> dissolved
```

## 2. 对局状态

```text
lobby
  -> awaiting_active_roll
  -> awaiting_active_selection
  -> awaiting_passive_picks
  -> awaiting_turn_end
  -> finished
```

## 3. 已实现的状态语义

### `awaiting_active_roll`

- 当前主动玩家提交可重掷骰子的结果
- 服务端校验：只能掷当前仍可用的骰子集合

### `awaiting_active_selection`

- 当前主动玩家从掷出的骰子中选择一个
- 更小点数骰子进入银盘
- 未被选中且点数更大或相等的骰子进入下一次重掷候选

### `awaiting_passive_picks`

- 非主动玩家从银盘中各选一个骰子
- 服务端按顺序收集选择，但逻辑上等价于同时选
- 银盘骰子不会因某个被动玩家选择而被移除

### `awaiting_turn_end`

- 当前回合所有主动/被动动作已结束
- 服务端推进到下一位主动玩家

## 4. 暂未实现的状态语义

- 奖励链中断与恢复
- 终局判定
- 五个颜色区域的录入状态
- 额外骰和额外重掷动作

## 5. 客户端交互原则

- 客户端只能请求动作，不能直接改状态
- 服务端广播单一可信状态快照
- 所有中间状态都必须可序列化并支持重连恢复

## 6. 下一步

- 把奖励链加入状态机
- 为每个状态定义完整的事件白名单
- 把终局条件与轮次结束规则接入

## 7. 当前实现备注

- 现在的 `active-select` 和 `passive-pick` 都会同时执行“选骰 + 落点校验 + 写入玩家计分纸”
- 如果某个动作产生待处理 bonus，状态机会进入 `awaiting_bonus_resolution`
- bonus 解析器已经可用，但真实的版面 bonus 触发位置仍在继续核对
- yellow/blue 已经不再是纯计数器，而是显式格子与行列奖励模型
- 当最后一轮结束时，状态机会自动进入 `finished`，并生成最终 standings
