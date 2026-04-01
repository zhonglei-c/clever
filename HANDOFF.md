# Handoff Guide

最后更新：`2026-03-31`

这个文件用于未来继续开发时快速接手，不依赖特定模型、IDE 或插件。

## 1. 先读什么

任何新协作者、新模型、新编辑器接手本项目时，请按下面顺序阅读：

1. `README.md`
2. `PROJECT_BOARD.md`
3. `PROJECT_BLUEPRINT.md`
4. 再查看当前代码与 `docs/`

## 2. 当前状态

目前仓库处于“单机规则流第一版已跑通，准备精修黄蓝版面奖励与接入联机”的阶段。

已经确认：

- 项目目标
- 功能清单
- 页面结构
- 技术目录结构
- 首发范围和非目标

已经开始：

- Monorepo 目录结构
- 前端页面骨架
- 服务端最小入口
- 共享包与规则引擎包骨架
- 第一批核心文档
- 主动回合 / 银盘 / 被动选骰状态机
- `game-core` 基础测试
- 五个颜色区域中的绿色/橙色/紫色合法性
- 黄色/蓝色的显式格子原型与行列奖励常量
- bonus queue / resolve 状态机骨架
- 区域计分与终局 standings 生成

尚未完成：

- 规则逐条拆解
- 单机规则流完整版本
- 多人联机逻辑
- 正式部署配置

## 3. 当前决定

- 游戏类型：浏览器多人房间制桌游
- 首发模式：私人房间
- 人数范围：每桌 `1-6` 人
- 首发设备重点：桌面端、平板端
- 首发不做：AI、公开匹配、复杂账号、扩展
- 前端方向：`React + TypeScript + Vite + DOM/SVG`
- 服务端方向：`Node.js + TypeScript + Fastify + Socket.IO`
- 数据方向：`SQLite`
- 部署方向：小型 VPS + `Docker Compose`

## 4. 资料来源

- `Ganz_schon_clever.pdf`
- `prettyclever_w_scoring_black.pdf`

如果后续出现规则争议，应以规则书为主，再在文档里记录“数字化实现解释”。

## 5. 继续开发时的工作规则

- 开发前先查看 `PROJECT_BOARD.md`，确认当前未完成项
- 每做完一个功能，就更新 `PROJECT_BOARD.md`
- 如果实现方案改变，就更新 `PROJECT_BLUEPRINT.md`
- 如果阶段目标、已知问题或接手方式改变，就更新本文件

## 6. 推荐的下一步

下一位协作者应优先做下面四件事：

1. 初始化 monorepo 工程骨架
2. 对照原始 score sheet 继续复核黄色/蓝色区域的真实格子排列
3. 复核黄蓝奖励常量与狐狸来源是否与原始版面完全一致
4. 开始把 `game-core` 接入 `server` 的真实房间事件

## 7. 交接模板

以后每次阶段性交接，可以直接在这个文件末尾追加一段：

```md
## Handoff Note - YYYY-MM-DD

- 本阶段完成：
- 当前进行中：
- 下一个建议动作：
- 风险/阻塞：
- 已更新的清单项：
```

## 8. 成功标准

如果未来的协作者只看根目录这几个 Markdown 文件，就能知道：

- 这个项目要做什么
- 现在做到哪里
- 下一步该做什么
- 完成后该去哪里打勾

## Handoff Note - 2026-03-29

- 本阶段完成：根目录协作文档、monorepo 工程骨架、前端页面骨架、服务端最小入口、共享包与规则引擎包骨架、第一批设计文档。
- 当前进行中：规则拆解文档、`game-core` 状态模型。
- 下一个建议动作：把 rulebook 逐条整理成可执行规则，再把主动回合与被动选骰写成纯函数状态机。
- 风险/阻塞：依赖已安装，类型检查和构建已通过；当前主要阻塞是规则书仍需逐项人工核对。
- 已更新的清单项：`PROJECT_BOARD.md` 中的工程初始化、页面骨架、文档骨架条目。

## Handoff Note - 2026-03-30

- 本阶段完成：`game-core` 的主动回合三次选骰、银盘累积、被动选骰、回合推进状态机；补充了规则拆解文档和状态机文档；新增了 `game-core` 测试。
- 当前进行中：颜色区域规则拆解、奖励链设计、单机规则流第一版收尾。
- 下一个建议动作：先实现五个颜色区域的落点合法性验证，再把奖励链接入当前状态机。
- 风险/阻塞：银盘“被动玩家可重复选择同一骰子”的实现已按公开规则说明处理，但仍建议继续对照原始 PDF 做逐条人工核对。
- 已更新的清单项：`PROJECT_BOARD.md` 中的游戏状态模型、掷骰模型、行为校验器、回合状态机、规则单元测试等条目。

## Handoff Note - 2026-03-30 (Later)

- 本阶段完成：玩家计分纸状态已正式进入 `game-core`；主动选骰和被动拿骰现在都会做颜色区域合法性校验；green/orange/purple 规则已按文本规则落地；yellow/blue 先按简化模型落地；bonus queue / resolve 已接入状态机。
- 当前进行中：yellow/blue 的真实版面格子与 bonus 触发位置复核。
- 下一个建议动作：优先从原始 score sheet 还原黄色和蓝色区域的真实格子布局，再补上对应奖励链常量。
- 风险/阻塞：目前 yellow/blue 还是“规则上可玩、版面上未完全还原”的原型实现；bonus 系统骨架已接好，但真实触发位置还未全部编码。
- 已更新的清单项：`PROJECT_BOARD.md` 中的单机规则引擎、绿色/橙色/紫色校验、奖励引擎骨架、规则单元测试等条目。

## Handoff Note - 2026-03-30 (Yellow Blue Pass)

- 本阶段完成：yellow/blue 从简单计数模型升级成显式格子模型；yellow 加入了行奖励、对角奖励和列分值常量；blue 加入了行列奖励常量；黄蓝奖励已接入现有 bonus queue / resolve；新增黄蓝专项测试。
- 当前进行中：黄蓝显式格子排列和奖励常量的原图复核。
- 下一个建议动作：优先把 yellow/blue 的常量和原始计分纸逐格核对，然后进入区域计分与终局判定。
- 风险/阻塞：yellow/blue 版面常量当前是“基于 OCR 片段和公开规则整理出的高可信原型”，还不是“逐格人工核对后的最终版”。
- 已更新的清单项：`PROJECT_BOARD.md` 中黄色/蓝色区域校验条目由未开始改为进行中。

## Handoff Note - 2026-03-30 (Scoring And Endgame)

- 本阶段完成：区域计分引擎、总分汇总、终局 standings 生成、按总轮数自动结束对局。
- 当前进行中：狐狸来源与黄蓝真实版面常量复核。
- 下一个建议动作：把 `game-core` 接到 `server` 的房间和事件流，做第一版联机可玩闭环。
- 风险/阻塞：狐狸加分公式已经接入，但当前狐狸数量仍未从真实版面奖励中完整产出。
- 已更新的清单项：`PROJECT_BOARD.md` 中计分引擎、终局引擎、区域分数计算、总分汇总等条目。

## Handoff Note - 2026-03-30 (Room Flow MVP)

- 本阶段完成：首页已接入昵称、创建房间、房间码加入；房间页已接入 Socket.IO 实时同步、玩家列表、准备状态、房主开始游戏；前端新增本地 room session 存储与重连用 playerId 复用。
- 当前进行中：房间成功开局后的真实对局页接线、断线重连细节、邀请链接加入体验。
- 下一个建议动作：优先把 `/game/:roomId` 接到真实 `state:sync`，至少完成“开局后看到当前 phase / 玩家 / 掷骰与选骰入口”的第一版联机对局闭环。
- 风险/阻塞：当前重连恢复只覆盖“房间成员身份复用”，还没有完成“对局中视图恢复”和更完整的 reconnect 协议；邀请链接目前是展示型，未做复制按钮和首页自动带参加入。
- 已更新的清单项：`PROJECT_BOARD.md` 中昵称进入游戏、创建房间、房间码加入、玩家准备状态、座位展示与房间玩家列表、基础错误提示、Socket 连接层、房间创建/加入逻辑、Socket 网关等条目。

## Handoff Note - 2026-03-30 (Game Flow MVP)

- 本阶段完成：`/game/:roomId` 已接到真实 `state:sync`；对局页现在可以显示真实阶段、轮次、当前玩家、已掷骰子、银盘、玩家摘要和最近日志；已补上主动掷骰、默认落点主动选骰、被动跳过、回合推进的第一版操作面板；房间页在 `in_game` 后可直接进入真实对局。
- 当前进行中：白骰和奖励解析的完整交互、被动选骰默认落点体验、对局中断线恢复细节、计分纸高保真点击 UI。
- 下一个建议动作：优先补 `awaiting_bonus_resolution` 的前端操作入口，再把被动拿骰和白骰跨区域选择做得更完整，这样多人对局能从开始一路走到更长的真实流程。
- 风险/阻塞：当前对局页仍是“联机调试面板”形态，不是最终 UI；奖励解析尚未前端接线，所以命中 bonus 后可能需要继续补操作才能完整推进；白骰虽然提供了默认区按钮，但还没有做更清晰的规则引导。
- 已更新的清单项：`PROJECT_BOARD.md` 中对局顶部状态条、中央骰池与银盘布局、其他玩家摘要视图、操作面板组件、对局页实时闭环等条目。

## Handoff Note - 2026-03-30 (Sheet Data View)

- 本阶段完成：对局页左侧主视图已从占位块升级成真实计分纸数据视图，能展示 yellow/blue 显式格子、green 阈值、orange/purple 记录和资源区；同时补强了白骰和被动选骰提示文案、当前行动提示和阶段反馈。
- 当前进行中：把默认落点按钮进一步迁移到“点计分纸即可落子”的交互模式；补强 bonus 细节和更完整的白骰说明。
- 下一个建议动作：优先把 yellow/blue/green 的可落点高亮和点击选区接到现有 `game:select-die` / `game:passive-pick`，逐步把调试面板式按钮替换成真正的计分纸点击交互。
- 风险/阻塞：目前主视图虽已反映真实数据，但仍是“数据化纸面”而非“可点击高保真纸面”；yellow/blue 还没有把具体格子点击和默认落点选择统一到一个交互模型里。
- 已更新的清单项：`PROJECT_BOARD.md` 中自己的计分纸主视图条目已从未开始更新为进行中。

## Handoff Note - 2026-03-30 (Sheet Click Flow)

- 本阶段完成：对局页已支持“右侧先选骰/奖励，左侧再点纸面落子”的第一版交互；yellow/blue 可点具体格子，green 可点下一个可填阈值，orange/purple 可点区域提交；白骰与被动选骰都接入了这条交互路径。
- 当前进行中：把右侧默认落点按钮进一步降级为辅助入口，并继续提高计分纸点击交互的直觉性和可视反馈。
- 下一个建议动作：优先把当前选中的骰子/奖励对象在左侧计分纸上做更明显的高亮说明，再把 orange/purple 的轨道点击做成更接近真实版面的行进式 UI。
- 风险/阻塞：当前 yellow/blue/green 已有基础点击流，但 orange/purple 仍是“点整个区域提交”；bonus 的纸面点击已经可用，但视觉提示还偏工程化。
- 已更新的清单项：当前主要是交互增强，`PROJECT_BOARD.md` 状态无需额外改级别，仍保持相关条目为进行中。

## Handoff Note - 2026-03-30 (Rulebook UI)

- 本阶段完成：站内规则页已升级成可查阅的规则书网页，支持中英文切换、快速事实卡片、分节导航和当前数字实现说明；游戏页顶部已加入“快速打开规则书”入口，新标签打开且会沿用已保存的语言偏好。
- 当前进行中：对局页交互反馈、纸面点击体验、真实联机手测。
- 下一个建议动作：如果继续做 UI，可把规则页与对局页的术语进一步对齐，比如把当前阶段提示中的关键词直接链接到规则书对应锚点。
- 风险/阻塞：当前规则页属于“站内速查版”，不是完整逐段翻译版原规则书；如后续补更完整英文文案，建议继续和 `docs/game-rules.md` 保持同步。
- 已更新的清单项：规则页条目原本已完成，这次属于体验升级，不额外改变 `PROJECT_BOARD.md` 勾选状态。

## Handoff Note - 2026-03-31 (Bonus Flow Polish)

- 本阶段完成：对局页补强了奖励解析和选骰引导；`extra-die` 奖励现在可在右侧直接领取，不再伪装成绿色落点；当前选中的骰子/奖励会额外显示“有哪些合法目标区域”摘要；白骰和被动选骰文案更明确。
- 当前进行中：继续把“工程化调试面板”替换成更直觉的纸面点击体验，尤其是 orange/purple 的真实轨道交互。
- 下一个建议动作：优先继续补 orange/purple 的点击式落子和更完整的多人联机手测，确认从开局到结算的长局路径没有新的交互断点。
- 风险/阻塞：`extra-die` 目前仍只是“计入资源”而不是完整消费系统；如果后续要做真正的奖励资源使用流程，需要再把资源消费动作接进状态机和前端。
- 已更新的清单项：本次属于对局闭环体验补强，`PROJECT_BOARD.md` 相关条目仍保持进行中，无需改勾选级别。

## Handoff Note - 2026-03-31 (Yellow Sheet Layout Pass)

- 本阶段完成：黄色区已从抽象按钮网格改成更接近原纸面的 `4 x 4` 视觉布局，补上了预印 `X` 占位、格子连接线、底部箭头计分和右侧奖励轨；同时把前端与 `game-core` 中 yellow 的数字分布映射校到截图版排布，避免“看起来一个数、点下去按另一个数判定”的错位。
- 当前进行中：黄色区奖励图标仍是“接近原图的 CSS 还原版”，不是最终高保真素材；蓝色区尚未按同样标准补线条与奖励信息。
- 下一个建议动作：继续把蓝色区按原纸面做同等级还原，并用一次真实多人长局手测确认 yellow/blue 点击反馈都足够直观。
- 风险/阻塞：yellow 奖励轨当前在视觉上已经更接近原图，但奖励符号本身仍以当前实现语义为主，不是逐像素复刻；如后续继续校正规则书，需同步复核 yellow 奖励位和 diagonal 奖励含义。
- 已更新的清单项：本次属于计分纸主视图深化，`PROJECT_BOARD.md` 中“自己的计分纸主视图”仍保持进行中。

## Handoff Note - 2026-03-31 (Blue Sheet Layout Pass)

- 本阶段完成：蓝色区已按截图补成四层结构，包含顶部累计分数轨、下方 `1-11` 计数带、中央 `2-12` 和数格、右侧奖励列和底部奖励条；蓝区现在比原来的“散点格子”更接近真实纸面，可读性和测试导向明显提升。
- 当前进行中：蓝色区的奖励图标和公式位仍是 CSS 近似还原，不是最终高保真素材；yellow/blue 之间的视觉语言也还可以再统一一轮。
- 下一个建议动作：继续细抠蓝色区图标和连线细节，然后开始把绿色区也往“真实纸面块”方向推进，避免只剩一个区域风格落后。
- 风险/阻塞：蓝色区当前主要改的是视觉结构，不是规则语义重构；如果后续继续按原图核对 bonus 含义，仍需同步复核 `game-core` 中 blue 的奖励映射。
- 已更新的清单项：本次属于计分纸主视图深化，`PROJECT_BOARD.md` 中“自己的计分纸主视图”与“其他玩家摘要视图”状态不变，仍保持进行中。

## Handoff Note - 2026-03-31 (Reward Wiring Pass)

- 本阶段完成：`green / orange / purple` 的线性奖励位已按当前前端常量接入 `game-core`；`fox`、`extra-die`、`reroll` 这类即时奖励现在都会真实累计到资源区；黄色/蓝色区在对局页上的奖励标签已改成和当前引擎常量一致，避免真人测试被 UI 误导。
- 当前进行中：`reroll / extra-die` 的消费动作已接入当前数字版流程，但它们仍是“按现有实现约定”的第一版，不是已经逐条对过原始规则书的最终版；黄蓝奖励常量也仍待继续对原始版面复核。
- 下一个建议动作：优先做一轮 2-3 人真人长局，重点测试 `R` 在主动阶段的重掷、`+1` 在主动/被动选骰时的 `+1/-1` 修正、以及这些资源和奖励链交错时会不会出现新的断点。
- 风险/阻塞：当前数字版把 `extra-die` 资源解释成 UI 上的 `+1`，把 `reroll` 解释成“已掷骰未选骰时重掷当前可用骰组”；这套解释已经在代码、UI、文档里保持一致，但仍需要继续和原始 rulebook/score sheet 人工复核。
- 已更新的清单项：`PROJECT_BOARD.md` 中“即时奖励触发”与“狐狸加分计算”可以继续保留进行中，当前更接近“可测版本”；“连锁奖励触发”仍建议保持进行中，直到真人长局确认没有新的 bonus chain 断点。

## Handoff Note - 2026-03-31 (Rulebook Alignment Pass)

## Handoff Note - 2026-04-01 (Green + Orange + Purple Underlay Pass)

- `ScoreSheetBoard.tsx` now gives green, orange, and purple their own track-shell underlays, matching the yellow/blue direction from the previous pass. All five major colored areas now use SVG-backed interior framing in some form.
- The green threshold rail, orange track, and purple track now render interactive cells above dedicated SVG rails instead of relying only on plain grid scaffolding.
- `global.css` now contains shared shell layering for these three tracks, with per-zone frame/line styling so the paper skeleton is more consistent across the whole board.
- Verification after this pass: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- Next recommended step: shift from broad skeleton work into fidelity work, especially the exact icon placement, printed label styling, and any remaining zone-specific geometry mismatches against the uploaded reference images.

## Handoff Note - 2026-04-01 (Yellow + Blue SVG Underlay Pass)

- `ScoreSheetBoard.tsx` now gives the yellow and blue interiors dedicated SVG underlay layers. The yellow connector network is no longer built from per-cell pseudo-elements, and the blue grid now has a printed-frame underlay beneath the formula tile and sum cells.
- `global.css` was updated so the yellow and blue grids render above these underlays, keeping the interactive cells unchanged while shifting more of the “paper skeleton” into SVG-backed structure.
- This is the first interior-zone move away from box-model tricks and toward an SVG-native board shell. Green / orange / purple still use mostly CSS scaffolding.
- Verification after this pass: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- Next recommended step: apply the same underlay pattern to the green / orange / purple tracks so the board’s internal framing stops mixing SVG and pseudo-element scaffolds zone by zone.

## Handoff Note - 2026-04-01 (Companion Panel Pass)

- `GamePage.tsx` no longer pairs the new sheet with the old generic card panel. The resource area now uses a dedicated companion-panel structure with a loading state, a custom header, stacked resource summaries, and note blocks.
- `global.css` now lays out the board stage as `sheet + companion panel` on desktop and collapses it to one column on smaller screens, so the main score sheet and the side status panel feel like one composed surface instead of mismatched widgets.
- A dead legacy tail was removed from the stylesheet: the unused `threshold-*`, `track-*`, and old resource-card helper styles are gone after the resource panel switched to its new classes.
- Verification after this pass: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- Next recommended step: keep pushing the board itself toward SVG-native interior framing, especially the yellow connectors and the blue/green/orange/purple track scaffolding, so fewer of the original paper cues rely on box-model tricks.

## Handoff Note - 2026-04-01 (Blue Grid Spec + Connector Pass)

- `packages/game-core/src/rules/score-sheet-spec.ts` now owns a dedicated blue display spec: the top progress track, central `2-12` board, right-side row rewards, bottom column rewards, and the connector map all come from explicit coordinates instead of ad-hoc JSX ordering.
- `ScoreSheetBoard.tsx` now renders the blue area from that shared spec. The main number tiles, formula tile, right reward rail, and bottom reward row all live in one unified `5 x 4` shell, while the dark row/column arrows are painted in a separate SVG underlay layer behind the nodes.
- `global.css` now gives blue its own grid variables, scalloped top score badges, board-native formula dice glyphs, unified `X` stroke styling, and underlay-backed right/bottom panels so the blue area reads much closer to the printed sheet and better matches the newer yellow layout language.
- Verification after this pass: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- Next recommended step: keep refining icon fidelity across yellow / blue together, then decide whether green / orange / purple should also move from their current “track shell” spec to explicit connector specs for full board consistency.

## Handoff Note - 2026-04-01 (Chrome + Zone Header Pass)

- `ScoreSheetBoard.tsx` now renders through a dedicated board chrome layer plus a `score-sheet-board-content` grid. The live sheet has an inline SVG paper frame with top and bottom rules, corner dots, and a more unified printed-board silhouette.
- Zone titles were refactored into a shared `ZoneHeader` component so yellow / blue / green / orange / purple now use the same printed label structure instead of ad-hoc section headings.
- `global.css` was cleaned again: several unused helper selectors were removed, and the score sheet root was restructured so decorative chrome and interactive content are layered separately.
- Verification after this pass: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- Next recommended step: move more of the color-zone borders and connecting marks into SVG so the shell, title band, and interior framing stop being split between CSS boxes and SVG decoration.

## Handoff Note - 2026-04-01 (Board Framing Pass)

- `ScoreSheetBoard.tsx` now includes a paper-style masthead and a footer score strip so the live board reads more like a single printed score sheet and less like isolated color blocks.
- The footer uses `scorePlayerSheet()` directly from `game-core` to show per-zone running scores plus fox bonus and total, giving the UI a visible end-of-sheet anchor without inventing separate frontend math.
- `global.css` was pruned further: a batch of dead legacy card-layout selectors and unused zone-specific leftovers were removed while keeping the active `ScoreSheetBoard` styles intact.
- Verification after this pass: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- Next recommended step: keep trimming unused legacy CSS, then move the board shell itself toward a more SVG-native composition so the top title band, zone borders, and bottom score boxes share one visual language.

## Handoff Note - 2026-03-31 (Legacy Sheet Removal Pass)

- `GamePage.tsx` no longer carries the hidden legacy five-card score-sheet JSX. The live page now mounts only `ScoreSheetBoard.tsx` for the main sheet path, plus the resource side panel.
- The score-sheet selection helpers that were duplicated inside `GamePage.tsx` are now sourced only from `apps/web/src/pages/game/scoreSheetSelection.ts`. This removes the risk of the UI using stale yellow / blue legality logic after spec updates.
- A large block of dead legacy render code was removed from `GamePage.tsx`, including the old yellow / blue / green / orange / purple renderers and their local display constants.
- The now-unused `.score-sheet-layout` and `.score-sheet-layout-legacy` CSS hooks were removed from `apps/web/src/styles/global.css`.
- Verification after this cleanup: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- Next recommended step: continue the cleanup in CSS by pruning legacy zone-specific styles that are no longer referenced, then spend the saved space on refining `ScoreSheetBoard.tsx` toward a single SVG-native score sheet.

## Handoff Note - 2026-03-31 (Continuous Sheet Pass)

- This pass moved the live board renderer onto a shared sheet spec path. `packages/game-core/src/rules/score-sheet-spec.ts` now owns the actively used yellow / blue / green / orange / purple display constants for the new board component.
- A new `apps/web/src/pages/game/ScoreSheetBoard.tsx` now renders the main player sheet as one continuous board shell instead of the old five-card layout. `GamePage.tsx` has been switched to this new renderer, while the legacy layout is still present but hidden so compilation stays stable during the migration.
- Yellow and blue now keep their printed numbers visible and draw an overlaid `X` after selection. Green shows the actual written value in filled boxes. Orange and purple continue to write the selected number directly into the slot.
- The uploaded per-zone reference images were used to realign several display-side reward positions and labels, especially in yellow, blue, orange, and purple. This is a visual/spec pass, not yet a full rule-semantics reconciliation.
- Next recommended step: keep shrinking `GamePage.tsx` by removing the hidden legacy renderer, then start the next pass toward a single SVG score-sheet and board-native icon set.
- Known risk: some yellow/blue reward semantics in `game-core` still reflect the earlier approximation, so visual positions are now closer to the source sheet than the underlying bonus model.

## Handoff Note - 2026-03-31 (Reward Glyph Pass)

- `ScoreSheetBoard.tsx` now renders a first board-native glyph layer for rewards. `X`, reroll, and fox markers are no longer plain text only; they use a shared inline-SVG treatment so the reward rail reads more like a printed board and less like generic pills.
- The new glyph treatment is already wired into yellow row rewards, the yellow corner reward, blue row rewards, blue bottom rewards, and the green / orange / purple milestone markers.
- Verification after this pass: `npm run typecheck`, `npm run build`, and `npm run test` all passed.
- The hidden legacy score-sheet JSX is still present in `GamePage.tsx`; it remains intentionally hidden for now, and should be deleted in the next cleanup pass once the team is comfortable that the new board path fully covers all interaction needs.

## Handoff Note - 2026-03-31 (GamePage Stabilization Pass)

- A cleanup attempt on `GamePage.tsx` exposed how brittle the old mixed-encoding legacy block is. The file has been restored to a stable baseline and the active page path now cleanly mounts `ScoreSheetBoard` again.
- Current safe state:
  - `ScoreSheetBoard.tsx` remains the visible main sheet renderer.
  - Reward glyph styling remains active.
  - The legacy sheet renderer is still hidden behind `score-sheet-layout-legacy` rather than deleted.
- Verification after recovery: `npm run typecheck`, `npm run build`, and `npm run test` all passed again.
- Recommended next step: do the eventual legacy deletion in smaller slices, or migrate more behavior out of `GamePage.tsx` first so the final removal is mechanical instead of surgical.

- 本阶段完成：站内规则页 [apps/web/src/pages/rules/rules-content.ts](/Users/zhonglei/work/clever/apps/web/src/pages/rules/rules-content.ts) 已按用户提供的 rulebook 重写为中英文纸规版；`extra-die` 已从伪 `+1/-1` 修正改成真实的“回合末额外再选 1 颗骰子”；主动玩家“本掷无合法落点”现在会记为空过并消耗一次常规掷骰机会；被动玩家“银盘无合法骰”现在会改从主动玩家骰位里拿 1 颗，只有两边都不合法时才允许跳过。
- 当前进行中：继续把剩余纸规差异往实现上收口，尤其是前四轮 round tracker 奖励、4 人局轮数、终局尾声里的 `extra-die / reroll / tie-break`。
- 下一个建议动作：优先做三件事：1. 接 round tracker 奖励与第 4 轮黑色二选一。2. 修正 4 人局轮数与终局 tie-break。3. 做一轮 2-3 人真人长局，重点回归 `extra-die`、主动空过、被动主动骰位补救。
- 风险/阻塞：当前 `advance-turn` 仍由主动玩家手动推进，所以终局前的额外骰窗口主要靠玩家协同触发；yellow/blue/green 的纸面常量和阈值语义也仍需继续对照原始计分纸逐格复核。
- 已更新的清单项：规则页内容已从“当前实现速查”切回“纸面规则优先”；`docs/game-rules.md` 已同步记录当前修复计划与最新数字化解释。

## Handoff Note - 2026-03-31 (Round Tracker + Endgame Pass)

- 本阶段完成：前四轮 round tracker 奖励已接入 `game-core`，第 `1/3` 轮自动发 `reroll`、第 `2` 轮自动发 `extra-die`、第 `4` 轮会在开局进入黑色 `X / 6` 二选一解析；`4` 人局总轮数已修正为 `4` 轮；终局 standings 现按“总分 > 单一区域最高分 > 并列”排序；最后一回合会保留 `extra-die` 尾声窗口，并要求玩家使用或明确放弃后才能结束，同时剩余 `reroll` 会在结算前失效。
- 对局页同步补强：顶部状态条现在会显示本轮开局奖励；`Extra die` 区域新增“本回合不再使用额外骰”按钮；第 `4` 轮黑色二选一在右侧操作区会以单独提示文案展示，不再混在普通 bonus queue 里。
- 已完成的自动化回归：新增覆盖 `4` 人轮数、round `2` 自动发 `extra-die`、round `4` 黑色二选一、终局 `extra-die` pass gating、`reroll` 到期失效、tie-break，以及之前已修复的主动空过 / 被动主动骰位补救 / extra-die 复用规则。
- 当前进行中：yellow / blue 的 printed 常量和奖励位仍在继续对照 score sheet；“无法执行的数字奖励 / 万能填写应如何失效”也还没有统一做成显式跳过动作。
- 下一个建议动作：优先做一轮新的 2-4 人真人长局，把白骰跨区、round `4` 二选一、终局 extra-die 协同、以及黄蓝奖励连锁一起压一遍。
- 风险/阻塞：这轮做的是自动化回归，不是新的人工试玩；如果后续真人长局发现某类奖励在“无合法落点”时应直接作废，仍需要再补一层 bonus skip 机制。
