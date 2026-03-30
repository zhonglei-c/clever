import { useParams } from "react-router-dom";

import { sampleGameState } from "@clever/game-core";

export function GamePage() {
  const { roomId } = useParams();

  return (
    <main className="page-shell">
      <section className="status-strip panel">
        <div>
          <span className="status-label">房间</span>
          <strong>{roomId}</strong>
        </div>
        <div>
          <span className="status-label">阶段</span>
          <strong>{sampleGameState.phase}</strong>
        </div>
        <div>
          <span className="status-label">轮次</span>
          <strong>{sampleGameState.round}</strong>
        </div>
        <div>
          <span className="status-label">当前玩家</span>
          <strong>{sampleGameState.currentPlayerId ?? "待开始"}</strong>
        </div>
      </section>

      <section className="game-layout">
        <article className="panel primary-sheet">
          <p className="eyebrow">Score Sheet</p>
          <h1>我的计分纸主视图</h1>
          <p className="lead">
            这里后续会用 SVG + HTML 做高保真数字计分纸，并支持高亮可点击区域。
          </p>
          <div className="sheet-preview">
            <div className="zone zone-yellow">Yellow</div>
            <div className="zone zone-blue">Blue</div>
            <div className="zone zone-green">Green</div>
            <div className="zone zone-orange">Orange</div>
            <div className="zone zone-purple">Purple</div>
          </div>
        </article>

        <aside className="sidebar-stack">
          <article className="panel">
            <p className="eyebrow">Dice Pool</p>
            <h2>公共骰池与银盘</h2>
            <p>后续这里会展示主动玩家掷骰结果、银盘、可选操作和提示。</p>
          </article>
          <article className="panel">
            <p className="eyebrow">Players</p>
            <h2>其他玩家摘要</h2>
            <p>后续显示每位玩家的分数摘要、在线状态和可切换查看的缩略计分纸。</p>
          </article>
          <article className="panel">
            <p className="eyebrow">Actions</p>
            <h2>操作面板</h2>
            <p>后续显示当前可执行动作、奖励链触发和错误提示。</p>
          </article>
        </aside>
      </section>
    </main>
  );
}
