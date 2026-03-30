import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import type {
  BlueCellId,
  GameStateSnapshot,
  PendingSheetBonus,
  PlayerSheetSnapshot,
  SheetPlacement,
  YellowCellId
} from "@clever/game-core";
import { BLUE_CELL_IDS, YELLOW_CELL_IDS } from "@clever/game-core";
import type {
  DieValue,
  RoomErrorEvent,
  RoomJoinedEvent,
  RoomSummary,
  SyncStateEvent
} from "@clever/shared";

import { ensureRealtimeConnection, getRealtimeSocket } from "../../services/realtime";
import {
  getLastNickname,
  getStoredRoomSession,
  saveRoomSession,
  setLastNickname
} from "../../services/room-session";

type SelectedIntent =
  | {
      kind: "active";
      die: DieValue;
    }
  | {
      kind: "passive";
      die: DieValue;
    }
  | {
      kind: "bonus";
      bonus: PendingSheetBonus;
      bonusIndex: number;
    };

export function GamePage() {
  const { roomId } = useParams();
  const normalizedRoomId = roomId ?? "";
  const storedSession = normalizedRoomId ? getStoredRoomSession(normalizedRoomId) : null;
  const [nickname, setNickname] = useState(
    () => storedSession?.nickname ?? (getLastNickname() || "Player"),
  );
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [gameState, setGameState] = useState<GameStateSnapshot | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(storedSession?.playerId ?? null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(() => getRealtimeSocket().connected);
  const [selectedIntent, setSelectedIntent] = useState<SelectedIntent | null>(null);

  useEffect(() => {
    if (!normalizedRoomId) {
      return;
    }

    const socket = ensureRealtimeConnection();

    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleJoined = (payload: RoomJoinedEvent) => {
      if (payload.room.id !== normalizedRoomId) {
        return;
      }

      setRoom(payload.room);
      setCurrentPlayerId(payload.player.id);
      setNickname(payload.player.nickname);
      setLastNickname(payload.player.nickname);
      setGameState((payload.gameState as GameStateSnapshot | null) ?? null);
      saveRoomSession({
        roomId: payload.room.id,
        playerId: payload.player.id,
        nickname: payload.player.nickname
      });
      setError("");
      setJoining(false);
      setPendingAction(null);
      setSelectedIntent(null);
    };

    const handleSync = (payload: SyncStateEvent) => {
      if (payload.room.id !== normalizedRoomId) {
        return;
      }

      setRoom(payload.room);
      setGameState((payload.gameState as GameStateSnapshot | null) ?? null);
      setPendingAction(null);
      setSelectedIntent(null);
    };

    const handleError = (payload: RoomErrorEvent) => {
      setError(payload.message);
      setJoining(false);
      setPendingAction(null);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room:joined", handleJoined);
    socket.on("state:sync", handleSync);
    socket.on("room:error", handleError);

    const existingSession = getStoredRoomSession(normalizedRoomId);
    if (existingSession) {
      setJoining(true);
      socket.emit("room:join", {
        roomId: normalizedRoomId,
        nickname: existingSession.nickname,
        playerId: existingSession.playerId
      });
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room:joined", handleJoined);
      socket.off("state:sync", handleSync);
      socket.off("room:error", handleError);
    };
  }, [normalizedRoomId]);

  const currentPlayer = room?.players.find((player) => player.id === currentPlayerId) ?? null;
  const activePlayer = room?.players.find((player) => player.id === gameState?.currentPlayerId) ?? null;
  const passiveSelection = useMemo(
    () => gameState?.turn?.passiveSelections.find((selection) => selection.playerId === currentPlayerId) ?? null,
    [currentPlayerId, gameState?.turn?.passiveSelections],
  );
  const mySheet = useMemo(
    () => gameState?.players.find((player) => player.playerId === currentPlayerId) ?? null,
    [currentPlayerId, gameState?.players],
  );
  const pendingBonusResolution =
    gameState?.turn?.pendingBonusResolution?.playerId === currentPlayerId
      ? gameState.turn.pendingBonusResolution
      : null;
  const sheetSelection = useMemo(
    () => (gameState && mySheet ? buildSheetSelection(selectedIntent, gameState, mySheet) : emptySheetSelection()),
    [gameState, mySheet, selectedIntent],
  );
  const actionPrompt = getActionPrompt({
    room,
    gameState,
    currentPlayerId,
    currentPlayerNickname: currentPlayer?.nickname ?? nickname,
    activePlayerNickname: activePlayer?.nickname ?? null,
    passiveSelectionStatus: passiveSelection?.status ?? null,
    hasPendingBonus: Boolean(pendingBonusResolution)
  });
  const selectionSummary = describeSelectedIntent(selectedIntent);

  const canRoll = Boolean(
    room?.status === "in_game" &&
      gameState?.phase === "awaiting_active_roll" &&
      gameState.currentPlayerId === currentPlayerId,
  );
  const canAdvanceTurn = Boolean(
    room?.status === "in_game" &&
      gameState?.phase === "awaiting_turn_end" &&
      gameState.currentPlayerId === currentPlayerId,
  );

  function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedRoomId) {
      return;
    }

    setJoining(true);
    setError("");
    const socket = ensureRealtimeConnection();
    socket.emit("room:join", {
      roomId: normalizedRoomId,
      nickname
    });
  }

  function emitAction(actionKey: string, callback: () => void) {
    setPendingAction(actionKey);
    setError("");
    callback();
    window.setTimeout(() => {
      setPendingAction((current) => (current === actionKey ? null : current));
    }, 250);
  }

  function handleRoll() {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction("roll", () => {
      socket.emit("game:roll", {
        roomId: gameState.roomId
      });
    });
  }

  function handleSelectDie(die: DieValue, placement: SheetPlacement) {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction(`select-${die.id}-${placement.zone}`, () => {
      socket.emit("game:select-die", {
        roomId: gameState.roomId,
        dieId: die.id,
        placement
      });
    });
  }

  function handlePassivePick(die: DieValue, placement: SheetPlacement) {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction(`passive-${die.id}-${placement.zone}`, () => {
      socket.emit("game:passive-pick", {
        roomId: gameState.roomId,
        dieId: die.id,
        placement
      });
    });
  }

  function handlePassiveSkip() {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction("passive-skip", () => {
      socket.emit("game:passive-skip", {
        roomId: gameState.roomId
      });
    });
  }

  function handleAdvanceTurn() {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction("advance-turn", () => {
      socket.emit("game:advance-turn", {
        roomId: gameState.roomId
      });
    });
  }

  function handleResolveBonus(bonusIndex: number, placement: SheetPlacement) {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction(`resolve-${bonusIndex}-${placement.zone}`, () => {
      socket.emit("game:resolve-bonus", {
        roomId: gameState.roomId,
        bonusIndex,
        placement
      });
    });
  }

  function handleSheetPlacement(placement: SheetPlacement) {
    if (!selectedIntent) {
      return;
    }

    if (selectedIntent.kind === "active") {
      handleSelectDie(selectedIntent.die, placement);
      return;
    }

    if (selectedIntent.kind === "passive") {
      handlePassivePick(selectedIntent.die, placement);
      return;
    }

    handleResolveBonus(selectedIntent.bonusIndex, placement);
  }

  if (!currentPlayer) {
    return (
      <main className="page-shell">
        <section className="panel">
          <p className="eyebrow">Game</p>
          <h1>加入对局 {normalizedRoomId}</h1>
          <p className="lead">先恢复或加入你的房间身份，对局页才能拿到服务端实时状态。</p>
          <div className="status-row">
            <span className="status-pill">{socketConnected ? "实时已连接" : "实时未连接"}</span>
          </div>
          <form className="panel subpanel form-stack join-panel" onSubmit={handleJoinRoom}>
            <label className="field">
              <span>昵称</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} />
            </label>
            <button className="primary-button" disabled={joining}>
              {joining ? "加入中..." : "加入房间并恢复对局"}
            </button>
          </form>
          {error ? <p className="error-banner">{error}</p> : null}
          <div className="link-row">
            <Link to={`/room/${normalizedRoomId}`}>返回房间页</Link>
            <Link to="/">返回首页</Link>
          </div>
        </section>
      </main>
    );
  }

  const rolledDice = gameState?.turn?.rolledDice ?? [];
  const silverPlatter = gameState?.turn?.silverPlatter ?? [];

  return (
    <main className="page-shell">
      <section className="status-strip panel">
        <div>
          <span className="status-label">房间</span>
          <strong>{normalizedRoomId}</strong>
        </div>
        <div>
          <span className="status-label">阶段</span>
          <strong>{gameState?.phase ?? "等待同步"}</strong>
        </div>
        <div>
          <span className="status-label">轮次</span>
          <strong>{gameState ? `${gameState.round} / ${gameState.totalRounds}` : "-"}</strong>
        </div>
        <div>
          <span className="status-label">当前玩家</span>
          <strong>{activePlayer?.nickname ?? gameState?.currentPlayerId ?? "待开始"}</strong>
        </div>
      </section>

      <section className="game-layout">
        <article className="panel primary-sheet">
          <p className="eyebrow">Score Sheet</p>
          <h1>我的计分纸主视图</h1>
          <p className="lead">
            当前先接真实对局状态和默认落点操作。后续再把这里升级成可点击的高保真计分纸。
          </p>
          <div className="status-row">
            <span className="status-pill">你：{currentPlayer.nickname}</span>
            <span className="status-pill">总分：{mySheet?.score ?? 0}</span>
            <span className="status-pill">本回合已选：{mySheet?.selectedDiceThisTurn ?? 0}</span>
            <span className="status-pill">状态：{room?.status ?? "unknown"}</span>
          </div>
          <div className="info-banner">
            <strong>当前提示：</strong> {actionPrompt}
          </div>
          {selectionSummary ? (
            <div className="info-banner selection-banner">
              <strong>当前已选：</strong> {selectionSummary}
              <button className="micro-button" onClick={() => setSelectedIntent(null)}>
                取消选择
              </button>
            </div>
          ) : null}
          <div className="score-sheet-layout">
            <article className={`sheet-card sheet-yellow ${
              sheetSelection.activeZoneIds.has("yellow") ? "sheet-card-active" : ""
            }`}>
              <div className="sheet-card-header">
                <h2>Yellow</h2>
                <span>{mySheet?.sheet.yellow.markedCellIds.length ?? 0} 格</span>
              </div>
              <p className="sheet-hint">{getZoneHint("yellow", sheetSelection, selectedIntent)}</p>
              {mySheet ? renderYellowSheet(mySheet, sheetSelection, handleSheetPlacement) : <p>等待同步</p>}
            </article>
            <article className={`sheet-card sheet-blue ${
              sheetSelection.activeZoneIds.has("blue") ? "sheet-card-active" : ""
            }`}>
              <div className="sheet-card-header">
                <h2>Blue</h2>
                <span>{mySheet?.sheet.blue.markedCellIds.length ?? 0} 格</span>
              </div>
              <p className="sheet-hint">{getZoneHint("blue", sheetSelection, selectedIntent)}</p>
              {mySheet ? renderBlueSheet(mySheet, sheetSelection, handleSheetPlacement) : <p>等待同步</p>}
            </article>
            <article className={`sheet-card sheet-green ${
              sheetSelection.activeZoneIds.has("green") ? "sheet-card-active" : ""
            }`}>
              <div className="sheet-card-header">
                <h2>Green</h2>
                <span>{mySheet?.sheet.green.filledThresholds.length ?? 0} 阶段</span>
              </div>
              <p className="sheet-hint">{getZoneHint("green", sheetSelection, selectedIntent)}</p>
              {mySheet ? renderGreenSheet(mySheet, sheetSelection, handleSheetPlacement) : <p>等待同步</p>}
            </article>
            <article className={`sheet-card sheet-orange ${
              sheetSelection.activeZoneIds.has("orange") ? "sheet-card-active" : ""
            }`}>
              <div className="sheet-card-header">
                <h2>Orange</h2>
                <span>{mySheet?.sheet.orange.values.length ?? 0} 次记录</span>
              </div>
              <p className="sheet-hint">{getZoneHint("orange", sheetSelection, selectedIntent)}</p>
              {mySheet ? renderTrackSheet(mySheet.sheet.orange.values, "尚未填入橙色值。", "orange", sheetSelection, handleSheetPlacement) : <p>等待同步</p>}
            </article>
            <article className={`sheet-card sheet-purple ${
              sheetSelection.activeZoneIds.has("purple") ? "sheet-card-active" : ""
            }`}>
              <div className="sheet-card-header">
                <h2>Purple</h2>
                <span>{mySheet?.sheet.purple.values.length ?? 0} 次记录</span>
              </div>
              <p className="sheet-hint">{getZoneHint("purple", sheetSelection, selectedIntent)}</p>
              {mySheet ? renderTrackSheet(mySheet.sheet.purple.values, "尚未填入紫色值。", "purple", sheetSelection, handleSheetPlacement) : <p>等待同步</p>}
            </article>
            <article className="sheet-card sheet-resource">
              <div className="sheet-card-header">
                <h2>Resources</h2>
                <span>奖励与资源</span>
              </div>
              {mySheet ? renderResourceSheet(mySheet) : <p>等待同步</p>}
            </article>
          </div>
        </article>

        <aside className="sidebar-stack">
          <article className="panel">
            <p className="eyebrow">Dice Pool</p>
            <h2>公共骰池与银盘</h2>
            <p className="lead">这里现在展示真实掷骰结果、银盘和可执行动作。</p>
            <div className="dice-section">
              <h3>本次掷骰</h3>
              <p className="helper-copy">白骰当前先按“默认落点”流程处理，会提供跨五个区域的快捷按钮。</p>
              <div className="dice-grid">
                {rolledDice.length > 0 ? (
                  rolledDice.map((die) => (
                    <button
                      key={`rolled-${die.id}`}
                      className={`die-card die-${die.color} ${
                        isIntentSelected(selectedIntent, "active", die.id) ? "die-card-selected" : ""
                      } ${
                        gameState?.phase === "awaiting_active_selection" &&
                        gameState.currentPlayerId === currentPlayerId
                          ? "die-card-actionable"
                          : ""
                      }`}
                      onClick={() => setSelectedIntent({ kind: "active", die })}
                      disabled={
                        !(
                          gameState?.phase === "awaiting_active_selection" &&
                          gameState.currentPlayerId === currentPlayerId
                        )
                      }
                    >
                      <strong>{die.id}</strong>
                      <span>{die.value}</span>
                    </button>
                  ))
                ) : (
                  <p>还没有掷骰结果。</p>
                )}
              </div>
            </div>
            <div className="dice-section">
              <h3>银盘</h3>
              <div className="dice-grid">
                {silverPlatter.length > 0 ? (
                  silverPlatter.map((die) => (
                    <button
                      key={`silver-${die.id}-${die.value}`}
                      className={`die-card die-${die.color} ${
                        isIntentSelected(selectedIntent, "passive", die.id) ? "die-card-selected" : ""
                      } ${
                        gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "pending"
                          ? "die-card-actionable"
                          : ""
                      }`}
                      onClick={() => setSelectedIntent({ kind: "passive", die })}
                      disabled={
                        !(gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "pending")
                      }
                    >
                      <strong>{die.id}</strong>
                      <span>{die.value}</span>
                    </button>
                  ))
                ) : (
                  <p>银盘还没有骰子。</p>
                )}
              </div>
            </div>
          </article>
          <article className="panel">
            <p className="eyebrow">Players</p>
            <h2>其他玩家摘要</h2>
            <div className="player-list">
              {room?.players.map((player) => {
                const snapshot = gameState?.players.find((entry) => entry.playerId === player.id);
                return (
                  <div key={player.id} className="player-card">
                    <strong>{player.nickname}</strong>
                    <span>{player.id === gameState?.currentPlayerId ? "当前行动" : "等待中"}</span>
                    <span>{player.connected ? "在线" : "离线"}</span>
                    <span>分数 {snapshot?.score ?? 0}</span>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="panel">
            <p className="eyebrow">Actions</p>
            <h2>操作面板</h2>
            <p className="lead">右侧现在更偏“选择动作对象”，真正落子优先在左侧计分纸上完成。</p>
            {error ? <p className="error-banner">{error}</p> : null}
            <div className="action-stack">
              <button className="primary-button" onClick={handleRoll} disabled={!canRoll || pendingAction !== null}>
                {pendingAction === "roll" ? "掷骰中..." : "主动玩家掷骰"}
              </button>

              {gameState?.phase === "awaiting_active_selection" && gameState.currentPlayerId === currentPlayerId ? (
                <div className="action-group">
                  <h3>主动选骰</h3>
                  <p className="helper-copy">先在这里选中一个骰子，再去左侧高亮区域点格子或点轨道位完成落子。</p>
                  {rolledDice.map((die) => (
                    <div key={`active-action-${die.id}`} className="die-action-row">
                      <span>{describeDieAction(die, "active")}</span>
                      <div className="mini-action-row">
                        <button
                          className={`micro-button ${
                            isIntentSelected(selectedIntent, "active", die.id) ? "micro-button-selected" : ""
                          }`}
                          onClick={() => setSelectedIntent({ kind: "active", die })}
                          disabled={pendingAction !== null}
                        >
                          选中后点纸面
                        </button>
                        <details className="fallback-details">
                          <summary>备用快捷按钮</summary>
                          <div className="mini-action-row fallback-row">
                            {renderPlacementButtons(die, (placement) => handleSelectDie(die, placement), pendingAction)}
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "pending" ? (
                <div className="action-group">
                  <h3>被动选骰</h3>
                  <p className="helper-copy">被动玩家最多拿银盘中的一个骰子。白骰同样提供跨区域默认落点。</p>
                  {silverPlatter.map((die) => (
                    <div key={`passive-action-${die.id}-${die.value}`} className="die-action-row">
                      <span>{describeDieAction(die, "passive")}</span>
                      <div className="mini-action-row">
                        <button
                          className={`micro-button ${
                            isIntentSelected(selectedIntent, "passive", die.id) ? "micro-button-selected" : ""
                          }`}
                          onClick={() => setSelectedIntent({ kind: "passive", die })}
                          disabled={pendingAction !== null}
                        >
                          选中后点纸面
                        </button>
                        <details className="fallback-details">
                          <summary>备用快捷按钮</summary>
                          <div className="mini-action-row fallback-row">
                            {renderPlacementButtons(die, (placement) => handlePassivePick(die, placement), pendingAction, "拿")}
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                  <button className="secondary-button" onClick={handlePassiveSkip} disabled={pendingAction !== null}>
                    {pendingAction === "passive-skip" ? "处理中..." : "跳过本次银盘选择"}
                  </button>
                </div>
              ) : null}

              {gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "picked" ? (
                <div className="info-banner">
                  你的被动选择已经提交，等待其他玩家完成本轮银盘阶段。
                </div>
              ) : null}

              {gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "skipped" ? (
                <div className="info-banner">
                  你已经跳过本次银盘选择，等待其他玩家完成本轮银盘阶段。
                </div>
              ) : null}

              {gameState?.phase === "awaiting_bonus_resolution" && pendingBonusResolution ? (
                <div className="action-group">
                  <h3>奖励解析</h3>
                  {pendingBonusResolution.bonuses.map((bonus, index) => (
                    <div key={`${bonus.source}-${index}`} className="die-action-row">
                      <span>{describeBonus(bonus)}</span>
                      <div className="mini-action-row">
                        <button
                          className={`micro-button ${
                            selectedIntent?.kind === "bonus" && selectedIntent.bonusIndex === index
                              ? "micro-button-selected"
                              : ""
                          }`}
                          onClick={() => setSelectedIntent({ kind: "bonus", bonus, bonusIndex: index })}
                          disabled={pendingAction !== null}
                        >
                          选中后点纸面
                        </button>
                        <details className="fallback-details">
                          <summary>备用快捷按钮</summary>
                          <div className="mini-action-row fallback-row">
                            {renderBonusButtons(bonus, (placement) => handleResolveBonus(index, placement), pendingAction)}
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                className="secondary-button"
                onClick={handleAdvanceTurn}
                disabled={!canAdvanceTurn || pendingAction !== null}
              >
                {pendingAction === "advance-turn" ? "推进中..." : "推进到下一位玩家"}
              </button>
            </div>
            <div className="log-list">
              <h3>最近日志</h3>
              {(gameState?.logs.slice(-5).reverse() ?? []).map((entry) => (
                <div key={entry.id} className="log-item">
                  {entry.message}
                </div>
              ))}
            </div>
            {gameState?.phase === "finished" && gameState.standings ? (
              <div className="action-group">
                <h3>最终排名</h3>
                {gameState.standings.map((standing) => {
                  const player = room?.players.find((entry) => entry.id === standing.playerId);
                  return (
                    <div key={standing.playerId} className="log-item">
                      #{standing.rank} {player?.nickname ?? standing.playerId}: {standing.totalScore}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </article>
        </aside>
      </section>
      <div className="link-row">
        <Link to={`/room/${normalizedRoomId}`}>返回房间页</Link>
        <Link to="/">返回首页</Link>
      </div>
    </main>
  );
}

const yellowGrid: YellowCellId[][] = [
  ["y-r1c1", "y-r1c2", "y-r1c3", "y-r1c4"],
  ["y-r2c1", "y-r2c2", "y-r2c3", "y-r2c4"],
  ["y-r3c1", "y-r3c2", "y-r3c3", "y-r3c4"]
];

const yellowValues: Record<YellowCellId, number> = {
  "y-r1c1": 2,
  "y-r1c2": 1,
  "y-r1c3": 5,
  "y-r1c4": 4,
  "y-r2c1": 1,
  "y-r2c2": 2,
  "y-r2c3": 4,
  "y-r2c4": 3,
  "y-r3c1": 5,
  "y-r3c2": 6,
  "y-r3c3": 6,
  "y-r3c4": 3
};

const blueGrid: Array<Array<BlueCellId | null>> = [
  ["b-r1c1", "b-r1c2", null, null],
  ["b-r2c1", null, "b-r2c3", "b-r2c4"],
  [null, "b-r3c2", "b-r3c3", "b-r3c4"],
  [null, "b-r4c2", "b-r4c3", "b-r4c4"]
];

const blueSums: Record<BlueCellId, number> = {
  "b-r1c1": 2,
  "b-r1c2": 3,
  "b-r2c1": 4,
  "b-r2c3": 5,
  "b-r2c4": 6,
  "b-r3c2": 7,
  "b-r3c3": 8,
  "b-r3c4": 9,
  "b-r4c2": 10,
  "b-r4c3": 11,
  "b-r4c4": 12
};

interface SheetSelectionState {
  activeZoneIds: Set<SheetPlacement["zone"]>;
  activeYellowCellIds: Set<YellowCellId>;
  activeBlueCellIds: Set<BlueCellId>;
  activeGreen: boolean;
  activeOrange: boolean;
  activePurple: boolean;
}

function renderYellowSheet(
  player: PlayerSheetSnapshot,
  selection: SheetSelectionState,
  onSelect: (placement: SheetPlacement) => void,
) {
  const marked = new Set(player.sheet.yellow.markedCellIds);

  return (
    <>
      <div className="sheet-grid yellow-grid">
        {yellowGrid.flatMap((row) =>
          row.map((cellId) => (
            <button
              key={cellId}
              className={`sheet-cell ${marked.has(cellId) ? "sheet-cell-marked" : ""} ${
                selection.activeYellowCellIds.has(cellId) ? "sheet-cell-actionable" : ""
              }`}
              title={
                marked.has(cellId)
                  ? `黄色 ${yellowValues[cellId]}，已填写`
                  : selection.activeYellowCellIds.has(cellId)
                    ? `黄色 ${yellowValues[cellId]}，点击即可落子`
                    : `黄色 ${yellowValues[cellId]}，当前不可落子`
              }
              onClick={() => onSelect({ zone: "yellow", cellId })}
              disabled={!selection.activeYellowCellIds.has(cellId)}
            >
              {yellowValues[cellId]}
            </button>
          )),
        )}
      </div>
      <div className="sheet-meta">
        <span>对角奖励：{player.sheet.yellow.claimedDiagonalBonus ? "已拿" : "未拿"}</span>
        <span>行奖励：{player.sheet.yellow.claimedRowBonuses.join(", ") || "暂无"}</span>
      </div>
    </>
  );
}

function renderBlueSheet(
  player: PlayerSheetSnapshot,
  selection: SheetSelectionState,
  onSelect: (placement: SheetPlacement) => void,
) {
  const marked = new Set(player.sheet.blue.markedCellIds);

  return (
    <>
      <div className="sheet-grid blue-grid">
        {blueGrid.flatMap((row, rowIndex) =>
          row.map((cellId, columnIndex) =>
            cellId ? (
              <button
                key={cellId}
                className={`sheet-cell ${marked.has(cellId) ? "sheet-cell-marked" : ""} ${
                  selection.activeBlueCellIds.has(cellId) ? "sheet-cell-actionable" : ""
                }`}
                title={
                  marked.has(cellId)
                    ? `蓝色和数 ${blueSums[cellId]}，已填写`
                    : selection.activeBlueCellIds.has(cellId)
                      ? `蓝色和数 ${blueSums[cellId]}，点击即可落子`
                      : `蓝色和数 ${blueSums[cellId]}，当前不可落子`
                }
                onClick={() => onSelect({ zone: "blue", cellId })}
                disabled={!selection.activeBlueCellIds.has(cellId)}
              >
                {blueSums[cellId]}
              </button>
            ) : (
              <div key={`blue-empty-${rowIndex}-${columnIndex}`} className="sheet-cell sheet-cell-empty" />
            ),
          ),
        )}
      </div>
      <div className="sheet-meta">
        <span>已记和数：{player.sheet.blue.markedSums.join(", ") || "暂无"}</span>
        <span>列奖励：{player.sheet.blue.claimedColumnBonuses.join(", ") || "暂无"}</span>
      </div>
    </>
  );
}

function renderGreenSheet(
  player: PlayerSheetSnapshot,
  selection: SheetSelectionState,
  onSelect: (placement: SheetPlacement) => void,
) {
  const filled = new Set(player.sheet.green.filledThresholds.map((value, index) => `${value}-${index}`));

  return (
    <>
      <div className="threshold-row">
        {[1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6].map((value, index) => {
          const key = `${value}-${index}`;
          return (
            <button
              key={key}
              className={`threshold-pill ${filled.has(key) ? "threshold-pill-filled" : ""} ${
                !filled.has(key) && index === player.sheet.green.filledThresholds.length && selection.activeGreen
                  ? "sheet-cell-actionable"
                  : ""
              }`}
              title={
                filled.has(key)
                  ? `绿色阈值 ${value}，已完成`
                  : selection.activeGreen && index === player.sheet.green.filledThresholds.length
                    ? `绿色阈值 ${value}，点击即可落子`
                    : `绿色阈值 ${value}，当前不可落子`
              }
              onClick={() => onSelect({ zone: "green" })}
              disabled={!(selection.activeGreen && index === player.sheet.green.filledThresholds.length)}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div className="sheet-meta">
        <span>已完成阈值：{player.sheet.green.filledThresholds.join(", ") || "暂无"}</span>
      </div>
    </>
  );
}

function renderTrackSheet(
  values: number[],
  emptyText: string,
  zone: "orange" | "purple",
  selection: SheetSelectionState,
  onSelect: (placement: SheetPlacement) => void,
) {
  const actionable = zone === "orange" ? selection.activeOrange : selection.activePurple;
  const maxSlots = 11;

  return (
    <>
      <div className="track-grid">
        {Array.from({ length: maxSlots }, (_, index) => {
          const value = values[index];
          const isNextSlot = index === values.length;
          const isFilled = typeof value === "number";
          const isActionable = actionable && !isFilled && isNextSlot;

          return (
            <button
              key={`${zone}-slot-${index}`}
              className={`track-slot ${isFilled ? "track-slot-filled" : ""} ${
                isActionable ? "sheet-cell-actionable" : ""
              }`}
              title={
                isFilled
                  ? `${zone} 第 ${index + 1} 格，已记录 ${value}`
                  : isActionable
                    ? `${zone} 第 ${index + 1} 格，点击即可填写`
                    : `${zone} 第 ${index + 1} 格，当前不可填写`
              }
              onClick={() => onSelect({ zone })}
              disabled={!isActionable}
            >
              {isFilled ? value : index + 1}
            </button>
          );
        })}
      </div>
      <div className="sheet-meta">
        <span>{values.length > 0 ? `已记录：${values.join(", ")}` : emptyText}</span>
        <span>{actionable ? "当前可点击下一个空位提交" : "当前不是这个区域的落子时机"}</span>
      </div>
    </>
  );
}

function renderResourceSheet(player: PlayerSheetSnapshot) {
  return (
    <>
      <div className="resource-grid">
        <div className="resource-card">
          <span>Wild</span>
          <strong>{player.sheet.resources.wildMarks}</strong>
        </div>
        <div className="resource-card">
          <span>Extra Die</span>
          <strong>{player.sheet.resources.extraDice}</strong>
        </div>
        <div className="resource-card">
          <span>Fox</span>
          <strong>{player.sheet.resources.foxes}</strong>
        </div>
      </div>
      <div className="sheet-meta">
        <span>待处理奖励：{player.sheet.pendingBonuses.length}</span>
        <span>
          已填黄格：{player.sheet.yellow.markedCellIds.length} / {YELLOW_CELL_IDS.length}
        </span>
        <span>
          已填蓝格：{player.sheet.blue.markedCellIds.length} / {BLUE_CELL_IDS.length}
        </span>
      </div>
    </>
  );
}

function emptySheetSelection(): SheetSelectionState {
  return {
    activeZoneIds: new Set(),
    activeYellowCellIds: new Set(),
    activeBlueCellIds: new Set(),
    activeGreen: false,
    activeOrange: false,
    activePurple: false
  };
}

function getZoneHint(
  zone: SheetPlacement["zone"],
  selection: SheetSelectionState,
  selectedIntent: SelectedIntent | null,
) {
  if (!selectedIntent) {
    return "先在右侧选中一个骰子或奖励对象，再回到这里点击落点。";
  }

  switch (zone) {
    case "yellow":
      return selection.activeYellowCellIds.size > 0
        ? "当前可点击高亮黄格完成落子。"
        : "当前选中的对象不能落在黄色，或没有合法黄格可选。";
    case "blue":
      return selection.activeBlueCellIds.size > 0
        ? "当前可点击高亮蓝格完成落子。"
        : "当前选中的对象不能落在蓝色，或当前蓝白和数没有可用格子。";
    case "green":
      return selection.activeGreen
        ? "当前可点击下一个绿色阈值位完成落子。"
        : "当前选中的对象无法满足绿色阈值要求。";
    case "orange":
      return selection.activeOrange
        ? "当前可点击橙色轨道中的下一个空位。"
        : "当前选中的对象不能落在橙色区域。";
    case "purple":
      return selection.activePurple
        ? "当前可点击紫色轨道中的下一个空位。"
        : "当前选中的对象不能落在紫色区域。";
    default:
      return "等待选择可落子的对象。";
  }
}

function buildSheetSelection(
  intent: SelectedIntent | null,
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
): SheetSelectionState {
  if (!intent) {
    return emptySheetSelection();
  }

  const placements = getPlacementsForIntent(intent);
  const zoneIds = new Set(placements.map((placement) => placement.zone));
  const yellowValue = getYellowValueForIntent(intent);
  const blueTotal = getBlueTotalForIntent(intent, gameState);
  const nextGreenThreshold = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6][player.sheet.green.filledThresholds.length] ?? null;
  const greenValue = getGreenValueForIntent(intent);

  return {
    activeZoneIds: zoneIds,
    activeYellowCellIds: new Set(
      zoneIds.has("yellow") && yellowValue
        ? YELLOW_CELL_IDS.filter(
            (cellId) =>
              yellowValues[cellId] === yellowValue &&
              !player.sheet.yellow.markedCellIds.includes(cellId),
          )
        : [],
    ),
    activeBlueCellIds: new Set(
      zoneIds.has("blue") && typeof blueTotal === "number"
        ? BLUE_CELL_IDS.filter(
            (cellId) =>
              blueSums[cellId] === blueTotal &&
              !player.sheet.blue.markedCellIds.includes(cellId),
          )
        : [],
    ),
    activeGreen:
      zoneIds.has("green") &&
      typeof greenValue === "number" &&
      typeof nextGreenThreshold === "number" &&
      greenValue > nextGreenThreshold,
    activeOrange: zoneIds.has("orange"),
    activePurple: zoneIds.has("purple")
  };
}

function getPlacementsForIntent(intent: SelectedIntent): SheetPlacement[] {
  if (intent.kind === "bonus") {
    return getBonusPlacements(intent.bonus);
  }

  return intent.die.id === "white"
    ? [
        { zone: "yellow" },
        { zone: "blue" },
        { zone: "green" },
        { zone: "orange" },
        { zone: "purple" }
      ]
    : [{ zone: intent.die.id }];
}

function getYellowValueForIntent(intent: SelectedIntent) {
  if (intent.kind === "bonus") {
    if (intent.bonus.type === "wild-mark") {
      return 6;
    }

    if (intent.bonus.type === "number-mark" && intent.bonus.allowedZones.includes("yellow")) {
      return intent.bonus.value;
    }

    return null;
  }

  return intent.die.id === "yellow" || intent.die.id === "white" ? intent.die.value : null;
}

function getBlueTotalForIntent(intent: SelectedIntent, gameState: GameStateSnapshot) {
  if (intent.kind === "bonus") {
    if (intent.bonus.type === "wild-mark") {
      return 6;
    }

    if (intent.bonus.type === "number-mark" && intent.bonus.allowedZones.includes("blue")) {
      return intent.bonus.value;
    }

    return null;
  }

  if (!(intent.die.id === "blue" || intent.die.id === "white")) {
    return null;
  }

  const blueValue = gameState.turn?.currentDiceValues.blue;
  const whiteValue = gameState.turn?.currentDiceValues.white;
  return typeof blueValue === "number" && typeof whiteValue === "number"
    ? blueValue + whiteValue
    : null;
}

function getGreenValueForIntent(intent: SelectedIntent) {
  if (intent.kind === "bonus") {
    if (intent.bonus.type === "wild-mark") {
      return 6;
    }

    if (intent.bonus.type === "number-mark" && intent.bonus.allowedZones.includes("green")) {
      return intent.bonus.value;
    }

    return null;
  }

  return intent.die.id === "green" || intent.die.id === "white" ? intent.die.value : null;
}

function renderPlacementButtons(
  die: DieValue,
  onSelect: (placement: SheetPlacement) => void,
  pendingAction: string | null,
  verb = "填"
) {
  const placements =
    die.id === "white"
      ? ([
          { zone: "yellow" },
          { zone: "blue" },
          { zone: "green" },
          { zone: "orange" },
          { zone: "purple" }
        ] satisfies SheetPlacement[])
      : ([{ zone: die.id }] satisfies SheetPlacement[]);

  return placements.map((placement) => {
    const actionKey = `${verb}-${die.id}-${placement.zone}`;

    return (
      <button
        key={actionKey}
        className="micro-button"
        onClick={() => onSelect(placement)}
        disabled={pendingAction !== null}
      >
        {verb}{formatPlacementLabel(placement, die)}
      </button>
    );
  });
}

function isIntentSelected(
  intent: SelectedIntent | null,
  expectedKind: "active" | "passive",
  dieId: DieValue["id"],
) {
  return Boolean(intent && intent.kind === expectedKind && intent.die.id === dieId);
}

function describeSelectedIntent(intent: SelectedIntent | null) {
  if (!intent) {
    return "";
  }

  if (intent.kind === "bonus") {
    return `奖励处理中：${describeBonus(intent.bonus)}。请去左侧高亮区域点击落点。`;
  }

  const modeLabel = intent.kind === "active" ? "主动" : "被动";
  const whiteHint = intent.die.id === "white" ? " 白骰可跨区。" : "";
  return `${modeLabel}已选 ${intent.die.id} = ${intent.die.value}。请去左侧高亮区域点击落点。${whiteHint}`;
}

function renderBonusButtons(
  bonus: PendingSheetBonus,
  onSelect: (placement: SheetPlacement) => void,
  pendingAction: string | null,
) {
  const placements = getBonusPlacements(bonus);

  return placements.map((placement) => (
    <button
      key={`${bonus.source}-${placement.zone}`}
      className="micro-button"
      onClick={() => onSelect(placement)}
      disabled={pendingAction !== null}
    >
      处理{placement.zone}
    </button>
  ));
}

function getBonusPlacements(bonus: PendingSheetBonus): SheetPlacement[] {
  switch (bonus.type) {
    case "wild-mark":
      return [
        { zone: "yellow" },
        { zone: "blue" },
        { zone: "green" },
        { zone: "orange" },
        { zone: "purple" }
      ];
    case "number-mark":
      return bonus.allowedZones.map((zone) => ({ zone }));
    case "orange-number":
      return [{ zone: "orange" }];
    case "purple-number":
      return [{ zone: "purple" }];
    case "extra-die":
      return [{ zone: "green" }];
    default:
      return [];
  }
}

function describeBonus(bonus: PendingSheetBonus) {
  switch (bonus.type) {
    case "wild-mark":
      return `Wild mark from ${bonus.source}`;
    case "extra-die":
      return `Extra die from ${bonus.source}`;
    case "number-mark":
      return `Number mark ${bonus.value} from ${bonus.source}`;
    case "orange-number":
      return `Orange bonus from ${bonus.source}`;
    case "purple-number":
      return `Purple bonus from ${bonus.source}`;
    default:
      return "Unknown bonus";
  }
}

function formatPlacementLabel(placement: SheetPlacement, die: DieValue) {
  if (die.id === "white") {
    return `${placement.zone}(白)`;
  }

  return placement.zone;
}

function describeDieAction(die: DieValue, mode: "active" | "passive") {
  const prefix = mode === "active" ? "主动" : "被动";
  const whiteHint = die.id === "white" ? "，可当任意颜色" : "";
  return `${prefix} ${die.id} = ${die.value}${whiteHint}`;
}

function getActionPrompt(args: {
  room: RoomSummary | null;
  gameState: GameStateSnapshot | null;
  currentPlayerId: string | null;
  currentPlayerNickname: string;
  activePlayerNickname: string | null;
  passiveSelectionStatus: "pending" | "picked" | "skipped" | null;
  hasPendingBonus: boolean;
}) {
  const {
    room,
    gameState,
    currentPlayerId,
    currentPlayerNickname,
    activePlayerNickname,
    passiveSelectionStatus,
    hasPendingBonus
  } = args;

  if (!room || room.status !== "in_game" || !gameState) {
    return "等待房间进入对局中，或等待服务端同步最新状态。";
  }

  if (hasPendingBonus) {
    return `${currentPlayerNickname} 现在需要先解析奖励，完成后状态机会回到上一个阶段。`;
  }

  switch (gameState.phase) {
    case "awaiting_active_roll":
      return gameState.currentPlayerId === currentPlayerId
        ? "轮到你掷骰了。先掷出当前仍可用的骰子。"
        : `等待 ${activePlayerNickname ?? gameState.currentPlayerId} 掷骰。`;
    case "awaiting_active_selection":
      return gameState.currentPlayerId === currentPlayerId
        ? "轮到你从当前掷骰结果里选择一个骰子，并用默认落点先推进流程。"
        : `等待 ${activePlayerNickname ?? gameState.currentPlayerId} 选择主动骰子。`;
    case "awaiting_passive_picks":
      if (passiveSelectionStatus === "pending") {
        return "现在轮到你处理银盘阶段。你可以选择一个骰子，或者跳过。";
      }
      if (passiveSelectionStatus === "picked") {
        return "你已经提交了被动选择，等待其他玩家完成银盘阶段。";
      }
      if (passiveSelectionStatus === "skipped") {
        return "你已经跳过本次银盘选择，等待其他玩家完成银盘阶段。";
      }
      return "当前处于银盘阶段，等待相关玩家完成被动选择。";
    case "awaiting_turn_end":
      return gameState.currentPlayerId === currentPlayerId
        ? "主动和被动阶段都结束了，现在由你推进到下一位玩家。"
        : `等待 ${activePlayerNickname ?? gameState.currentPlayerId} 推进到下一回合。`;
    case "finished":
      return "这局已经结束，可以查看最终排名和分数。";
    case "lobby":
      return "游戏尚未开始。";
    case "awaiting_bonus_resolution":
      return "当前有奖励待解析。";
    default:
      return "等待下一步动作。";
  }
}
