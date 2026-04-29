import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { GameStateProvider, useGameState } from "./context/GameStateContext";
import { SelectionProvider, useSelection } from "./context/SelectionContext";
import { MyScoreSheet } from "./components/sheet/MyScoreSheet";
import { SideRail } from "./components/rail/SideRail";
import { getActionPrompt } from "./utils/actionPrompt";
import { getRulesHref } from "./utils/rulesLinks";
import { getPassiveRegularSource } from "./utils/gameStateQueries";

export function GamePage() {
  const { roomId } = useParams();
  const normalizedRoomId = roomId ?? "";

  return (
    <GameStateProvider normalizedRoomId={normalizedRoomId}>
      <GamePageContent />
    </GameStateProvider>
  );
}

function GamePageContent() {
  const ctx = useGameState();

  return (
    <SelectionProvider gameState={ctx.gameState} mySheet={ctx.mySheet} resetToken={ctx.selectionResetToken}>
      <GamePageUI />
    </SelectionProvider>
  );
}

function GamePageUI() {
  const game = useGameState();
  const selection = useSelection();

  const actionPrompt = useMemo(
    () =>
      getActionPrompt({
        room: game.room,
        gameState: game.gameState,
        currentPlayerId: game.currentPlayerId,
        currentPlayerNickname: game.currentPlayer?.nickname ?? game.nickname,
        activePlayerNickname: game.activePlayer?.nickname ?? null,
        passiveSelectionStatus: game.passiveSelection?.status ?? null,
        passiveRegularSource:
          game.gameState && game.mySheet ? getPassiveRegularSource(game.gameState, game.mySheet) : "silver",
        hasPendingBonus: Boolean(game.pendingBonusResolution),
        selectedIntent: selection.selectedIntent,
        selectedIntentHasLegalTarget: selection.selectedIntentHasLegalTarget,
        pendingPlacement: selection.pendingPlacement,
      }),
    [
      game.room,
      game.gameState,
      game.currentPlayerId,
      game.currentPlayer,
      game.nickname,
      game.activePlayer,
      game.passiveSelection,
      game.pendingBonusResolution,
      game.mySheet,
      selection.selectedIntent,
      selection.selectedIntentHasLegalTarget,
      selection.pendingPlacement,
    ],
  );

  if (!game.currentPlayer) {
    return (
      <main className="page-shell">
        <section className="panel">
          <p className="eyebrow">Game</p>
          <h1>加入对局 {game.normalizedRoomId}</h1>
          <p className="lead">先恢复或加入你的房间身份，对局页才能拿到服务端实时状态。</p>
          <div className="status-row">
            <span className="status-pill">{game.socketConnected ? "实时已连接" : "实时未连接"}</span>
          </div>
          <form className="panel subpanel form-stack join-panel" onSubmit={game.handleJoinRoom}>
            <label className="field">
              <span>昵称</span>
              <input value={game.nickname} onChange={(event) => game.setNickname(event.target.value)} maxLength={24} />
            </label>
            <button className="primary-button" disabled={game.joining}>
              {game.joining ? "加入中..." : "加入房间并恢复对局"}
            </button>
          </form>
          {game.error ? <p className="error-banner">{game.error}</p> : null}
          <div className="link-row">
            <Link to={`/room/${game.normalizedRoomId}`}>返回房间页</Link>
            <Link to="/">返回首页</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell game-page-shell">
      {game.error ? <p className="error-banner">{game.error}</p> : null}

      <div className="game-stage-layout">
        <section className="game-main-stack">
          <article className="panel primary-sheet primary-sheet-simplified">
            <div
              ref={game.viewportRef}
              className={`score-sheet-stage ${game.viewportScale < 0.995 ? "score-sheet-stage-scaled" : ""}`}
              style={game.viewportHeight ? { height: `${game.viewportHeight}px` } : undefined}
            >
              <div
                ref={game.contentRef}
                className="score-sheet-stage-scale"
                style={
                  game.viewportScale < 0.995
                    ? { transform: `scale(${game.viewportScale})` }
                    : undefined
                }
              >
                {game.mySheet ? (
                  <MyScoreSheet
                    player={game.mySheet}
                    activeSelections={game.activeSelections}
                    currentRound={game.gameState?.round ?? 1}
                    totalRounds={game.gameState?.totalRounds ?? 1}
                    selection={selection.sheetSelection}
                    previewPlacement={selection.pendingPlacement}
                    previewValue={selection.pendingPlacementValue}
                    onSelect={selection.handleSheetPlacement}
                  />
                ) : (
                  <div className="score-sheet-loading">Waiting for sync</div>
                )}
              </div>
            </div>
          </article>
        </section>

        <aside className="game-side-rail">
          {game.shouldShowTurnTopbar ? (
            <section className={`turn-topbar panel ${game.isTurnTopbarCollapsed ? "turn-topbar-collapsed" : ""}`}>
              <div className="turn-topbar-head">
                <div className="turn-topbar-title">
                  <p className="eyebrow">Your Turn</p>
                  <h2>{game.isTurnTopbarCollapsed ? "操作" : actionPrompt}</h2>
                </div>
                <div className="turn-topbar-controls">
                  <button
                    className="micro-button turn-topbar-toggle"
                    onClick={game.toggleTurnTopbar}
                  >
                    {game.isTurnTopbarCollapsed ? "展开" : "收起"}
                  </button>
                </div>
              </div>
              {!game.isTurnTopbarCollapsed ? (
                <div className="turn-topbar-content">
                  <SideRail />
                </div>
              ) : null}
            </section>
          ) : null}

          <article className="panel game-log-panel">
            <h2>最近日志</h2>
            <div className="log-list">
              {(game.gameState?.logs.slice(-5).reverse() ?? []).map((entry) => (
                <div key={entry.id} className="log-item">
                  {entry.message}
                </div>
              ))}
            </div>
            {game.gameState?.phase === "finished" && game.gameState.standings ? (
              <div className="action-group final-standings">
                <h3>最终排名</h3>
                {game.gameState.standings.map((standing) => {
                  const player = game.room?.players.find((entry) => entry.id === standing.playerId);
                  return (
                    <div key={standing.playerId} className="log-item">
                      #{standing.rank} {player?.nickname ?? standing.playerId}: {standing.totalScore}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </article>

          <section className="panel game-footer-bar">
            <div className="link-row game-footer-links">
              <Link to={`/room/${game.normalizedRoomId}`}>返回房间页</Link>
              <Link to="/">返回首页</Link>
            </div>
            <div className="game-footer-meta">
              <div className="game-footer-chip">
                <span className="status-label">房间号</span>
                <strong>{game.normalizedRoomId}</strong>
              </div>
              <div className="game-footer-chip">
                <span className="status-label">规则书</span>
                <a
                  className="inline-action-link inline-action-link-small"
                  href={getRulesHref(game.rulesLanguage)}
                  target="_blank"
                  rel="noreferrer"
                >
                  快速打开
                </a>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
