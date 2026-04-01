import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import type {
  GameStateSnapshot,
  PendingSheetBonus,
  PlayerSheetSnapshot,
  SheetPlacement
} from "@clever/game-core";
import type {
  DieValue,
  RoomErrorEvent,
  RoomJoinedEvent,
  RoomSummary,
  SyncStateEvent
} from "@clever/shared";

import { ScoreSheetBoard } from "./ScoreSheetBoard";
import {
  buildSheetSelection,
  describeLegalTargets,
  emptySheetSelection,
  getBonusPlacements,
  getIntentDie,
  getTrackPreviewValue,
  hasAnyLegalTarget,
  type SelectedIntent
} from "./scoreSheetSelection";
import { ensureRealtimeConnection, getRealtimeSocket } from "../../services/realtime";
import {
  getLastNickname,
  getStoredRoomSession,
  saveRoomSession,
  setLastNickname
} from "../../services/room-session";

function getPreferredRulesLanguage() {
  if (typeof window === "undefined") {
    return "zh";
  }

  const saved = window.localStorage.getItem("clever-rules-language");
  return saved === "en" ? "en" : "zh";
}

function getRulesHref(language: string, sectionId?: string) {
  const hash = sectionId ? `#${sectionId}` : "";
  return `/rules?lang=${language}${hash}`;
}

function getRulesSectionForPhase(phase: GameStateSnapshot["phase"] | undefined) {
  switch (phase) {
    case "awaiting_active_roll":
    case "awaiting_active_selection":
    case "awaiting_turn_end":
      return "turn-flow";
    case "awaiting_passive_picks":
      return "silver";
    case "awaiting_bonus_resolution":
      return "bonuses";
    case "finished":
      return "scoring";
    default:
      return "turn-flow";
  }
}

function getContextualRuleLinks(phase: GameStateSnapshot["phase"] | undefined) {
  switch (phase) {
    case "awaiting_active_roll":
    case "awaiting_active_selection":
      return [
        { id: "turn-flow", label: "主动阶段" },
        { id: "zones", label: "颜色区规则" }
      ];
    case "awaiting_passive_picks":
      return [
        { id: "silver", label: "银盘与被动选择" },
        { id: "zones", label: "颜色区规则" }
      ];
    case "awaiting_bonus_resolution":
      return [
        { id: "bonuses", label: "奖励与连锁" },
        { id: "zones", label: "颜色区规则" }
      ];
    case "finished":
      return [
        { id: "scoring", label: "计分与终局" }
      ];
    default:
      return [
        { id: "turn-flow", label: "回合流程" },
        { id: "tips", label: "数字版操作提示" }
      ];
  }
}

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
  const [rulesLanguage] = useState(getPreferredRulesLanguage);

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
  const rolledDice = gameState?.turn?.rolledDice ?? [];
  const silverPlatter = gameState?.turn?.silverPlatter ?? [];
  const activeSelections = gameState?.turn?.activeSelections ?? [];
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
  const selectedIntentHasLegalTarget = hasAnyLegalTarget(sheetSelection);
  const selectionSummary = describeSelectedIntent(selectedIntent);
  const phaseRulesSection = getRulesSectionForPhase(gameState?.phase);
  const contextualRuleLinks = getContextualRuleLinks(gameState?.phase);
  const canUseRerollResource = Boolean(
    gameState?.phase === "awaiting_active_selection" &&
      gameState.currentPlayerId === currentPlayerId &&
      (mySheet?.sheet.resources.rerolls ?? 0) > 0,
  );
  const passiveRegularDice = useMemo(
    () => (gameState && mySheet ? getPassiveRegularDice(gameState, mySheet) : silverPlatter),
    [gameState, mySheet, silverPlatter],
  );
  const passiveRegularSource = useMemo(
    () => (gameState && mySheet ? getPassiveRegularSource(gameState, mySheet) : "silver"),
    [gameState, mySheet],
  );
  const hasAnyPlayableActiveDie = Boolean(
    mySheet &&
      gameState &&
      rolledDice.some((die) => isDieChoicePlayable({ kind: "active", die }, gameState, mySheet)),
  );
  const hasAnyPlayablePassiveDie = Boolean(
    mySheet &&
      gameState &&
      passiveRegularDice.some((die) => isDieChoicePlayable({ kind: "passive", die }, gameState, mySheet)),
  );
  const canUseExtraDieResource = Boolean(
    gameState &&
      mySheet &&
      canUseExtraDieAction(gameState, currentPlayerId, mySheet, passiveSelection?.status ?? null),
  );
  const extraActionDice = useMemo(
    () =>
      gameState && mySheet && currentPlayerId
        ? getExtraDieCandidates(gameState, mySheet, currentPlayerId)
        : [],
    [currentPlayerId, gameState, mySheet],
  );
  const extraActionRole: "active" | "passive" =
    gameState?.currentPlayerId === currentPlayerId ? "active" : "passive";
  const actionPrompt = getActionPrompt({
    room,
    gameState,
    currentPlayerId,
    currentPlayerNickname: currentPlayer?.nickname ?? nickname,
    activePlayerNickname: activePlayer?.nickname ?? null,
    passiveSelectionStatus: passiveSelection?.status ?? null,
    passiveRegularSource,
    hasPendingBonus: Boolean(pendingBonusResolution),
    selectedIntent,
    selectedIntentHasLegalTarget
  });

  const canRoll = Boolean(
    room?.status === "in_game" &&
      gameState?.phase === "awaiting_active_roll" &&
      gameState.currentPlayerId === currentPlayerId,
  );
  const hasPendingTurnEndExtraDie = Boolean(gameState && !areTurnEndActionsComplete(gameState));
  const canAdvanceTurn = Boolean(
    room?.status === "in_game" &&
      gameState?.phase === "awaiting_turn_end" &&
      gameState.currentPlayerId === currentPlayerId &&
      !hasPendingTurnEndExtraDie,
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

  function handleUseExtraDie(die: DieValue, placement: SheetPlacement) {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction(`extra-${die.id}-${placement.zone}`, () => {
      socket.emit("game:use-extra-die", {
        roomId: gameState.roomId,
        dieId: die.id,
        placement
      });
    });
  }

  function handlePassExtraDie() {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction("pass-extra-die", () => {
      socket.emit("game:pass-extra-die", {
        roomId: gameState.roomId
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

  function handleActiveSkip() {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction("active-skip", () => {
      socket.emit("game:active-skip", {
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

  function handleUseRerollResource() {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction("use-reroll", () => {
      socket.emit("game:use-reroll", {
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

  function handleResolveInstantBonus(bonusIndex: number) {
    if (!gameState) {
      return;
    }

    const socket = ensureRealtimeConnection();
    emitAction(`resolve-${bonusIndex}-instant`, () => {
      socket.emit("game:resolve-bonus", {
        roomId: gameState.roomId,
        bonusIndex,
        placement: { zone: "green" }
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

    if (selectedIntent.kind === "extra") {
      handleUseExtraDie(selectedIntent.die, placement);
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
          <div className="status-subaction">
            <a
              className="inline-action-link inline-action-link-small"
              href={getRulesHref(rulesLanguage, phaseRulesSection)}
              target="_blank"
              rel="noreferrer"
            >
              查看本阶段规则
            </a>
          </div>
        </div>
        <div>
          <span className="status-label">轮次</span>
          <strong>{gameState ? `${gameState.round} / ${gameState.totalRounds}` : "-"}</strong>
        </div>
        <div>
          <span className="status-label">开局奖励</span>
          <strong>{getRoundTrackerLabel(gameState?.round ?? null)}</strong>
        </div>
        <div>
          <span className="status-label">当前玩家</span>
          <strong>{activePlayer?.nickname ?? gameState?.currentPlayerId ?? "待开始"}</strong>
        </div>
        <div>
          <span className="status-label">规则书</span>
          <a
            className="inline-action-link"
            href={getRulesHref(rulesLanguage)}
            target="_blank"
            rel="noreferrer"
          >
            快速打开
          </a>
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
          <div className="rule-link-row">
            {contextualRuleLinks.map((item) => (
              <a
                key={item.id}
                className="rule-jump-link"
                href={getRulesHref(rulesLanguage, item.id)}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ))}
          </div>
          {selectionSummary ? (
            <div className="info-banner selection-banner">
              <div className="selection-copy">
                <strong>当前已选：</strong> {selectionSummary}
                {selectedIntentHasLegalTarget ? (
                  <div className="selection-targets">可操作位置：{describeLegalTargets(sheetSelection)}</div>
                ) : null}
              </div>
              <div className="mini-action-row">
                <button className="micro-button" onClick={() => setSelectedIntent(null)}>
                  取消选择
                </button>
              </div>
            </div>
          ) : null}
          {selectedIntent && !selectedIntentHasLegalTarget ? (
            <div className="error-banner">
              当前选中的对象在所有允许区域里都没有合法落点。
              {selectedIntent.kind === "passive"
                ? passiveRegularSource === "active-fields"
                  ? " 这是被动阶段的主动骰位补救选择；如果这里也都不能用，你才可以跳过。"
                  : " 这是被动阶段时，可以改选别的银盘骰子；只有银盘和主动骰位都不能用时才可以跳过。"
                : selectedIntent.kind === "active"
                  ? hasAnyPlayableActiveDie
                    ? " 这是主动阶段时，请取消当前选择并改选别的骰子。"
                    : " 这是主动阶段时，而且当前所有已掷骰子都没有合法落点；你现在可以把这次掷骰记为空过。"
                  : selectedIntent.kind === "extra"
                    ? " 这是额外骰动作时，请改选别的候选骰子。"
                  : " 请取消当前奖励选择，改用其他可解析的奖励或等待前一动作调整。"}
            </div>
          ) : null}
          <div className="score-sheet-stage">
            {mySheet ? (
              <ScoreSheetBoard
                player={mySheet}
                activeSelections={activeSelections}
                currentRound={gameState?.round ?? 1}
                totalRounds={gameState?.totalRounds ?? 1}
                selection={sheetSelection}
                onSelect={handleSheetPlacement}
                orangePreviewValue={getTrackPreviewValue("orange", selectedIntent)}
                purplePreviewValue={getTrackPreviewValue("purple", selectedIntent)}
              />
            ) : (
              <div className="score-sheet-loading">Waiting for sync</div>
            )}
          </div>
        </article>

        <aside className="sidebar-stack">
          <article className="panel">
            <p className="eyebrow">Dice Pool</p>
            <h2>公共骰池与银盘</h2>
            <p className="lead">这里现在展示真实掷骰结果、银盘和可执行动作。</p>
            <div className="dice-section">
              <h3>本次掷骰</h3>
              <p className="helper-copy">
                白骰可以当任意颜色使用。点中后左侧会高亮当前真的能落子的区域，蓝色区会自动按蓝骰和白骰的和数判断。
              </p>
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
                      } ${
                        mySheet && gameState
                          ? isDieChoicePlayable(
                              { kind: "active", die },
                              gameState,
                              mySheet,
                            )
                            ? ""
                            : "die-card-blocked"
                          : ""
                      }`}
                      title={
                        mySheet && gameState
                          ? isDieChoicePlayable({ kind: "active", die }, gameState, mySheet)
                            ? "这个骰子当前至少有一个合法落点。"
                            : "这个骰子当前没有合法落点，选了也无法继续。"
                          : ""
                      }
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
              <p className="helper-copy">
                {passiveRegularSource === "active-fields"
                  ? "你当前不能使用任何银盘骰子。按规则，现在必须改从主动玩家左上角的已选骰子里拿 1 颗。"
                  : "被动玩家通常从这里拿 1 颗骰子；多个被动玩家可以选择同一颗。"}
              </p>
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
                      } ${
                        mySheet && gameState
                          ? isDieChoicePlayable(
                              { kind: "passive", die },
                              gameState,
                              mySheet,
                            )
                            ? ""
                            : "die-card-blocked"
                          : ""
                      }`}
                      title={
                        mySheet && gameState
                          ? isDieChoicePlayable({ kind: "passive", die }, gameState, mySheet)
                            ? "这个银盘骰子当前至少有一个合法落点。"
                            : "这个银盘骰子当前没有合法落点。"
                          : ""
                      }
                      onClick={() => setSelectedIntent({ kind: "passive", die })}
                      disabled={
                        !(
                          gameState?.phase === "awaiting_passive_picks" &&
                          passiveSelection?.status === "pending" &&
                          passiveRegularSource === "silver"
                        )
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
            <div className="dice-section">
              <h3>主动玩家骰位</h3>
              <p className="helper-copy">
                这里是主动玩家本回合常规拿过的骰子。只有当你作为被动玩家完全不能使用银盘时，才能从这里拿 1 颗。
              </p>
              <div className="dice-grid">
                {activeSelections.length > 0 ? (
                  activeSelections.map((die) => (
                    <button
                      key={`active-selection-${die.id}-${die.value}`}
                      className={`die-card die-${die.color} ${
                        isIntentSelected(selectedIntent, "passive", die.id) ? "die-card-selected" : ""
                      } ${
                        gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "pending"
                          ? "die-card-actionable"
                          : ""
                      } ${
                        mySheet && gameState
                          ? isDieChoicePlayable({ kind: "passive", die }, gameState, mySheet)
                            ? ""
                            : "die-card-blocked"
                          : ""
                      }`}
                      title={
                        passiveRegularSource === "active-fields"
                          ? "按规则，你当前必须从这些主动骰位里选 1 颗。"
                          : "只有当银盘里没有任何可用骰子时，才能改从这里拿。"
                      }
                      onClick={() => setSelectedIntent({ kind: "passive", die })}
                      disabled={
                        !(
                          gameState?.phase === "awaiting_passive_picks" &&
                          passiveSelection?.status === "pending" &&
                          passiveRegularSource === "active-fields"
                        )
                      }
                    >
                      <strong>{die.id}</strong>
                      <span>{die.value}</span>
                    </button>
                  ))
                ) : (
                  <p>主动玩家还没有放入骰位的骰子。</p>
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
                  <p className="helper-copy">
                    先在这里选中一个骰子，再去左侧高亮区域点格子或点轨道位完成落子。
                    如果当前所有已掷骰子都没有合法落点，这次掷骰会被记为空过，仍然会消耗一次常规掷骰机会。
                  </p>
                  <div className="mini-action-row">
                    <button
                      className="secondary-button"
                      onClick={handleUseRerollResource}
                      disabled={!canUseRerollResource || pendingAction !== null}
                    >
                      {pendingAction === "use-reroll"
                        ? "重投中..."
                        : `消耗重投 (${mySheet?.sheet.resources.rerolls ?? 0})`}
                    </button>
                    <button
                      className="secondary-button"
                      onClick={handleActiveSkip}
                      disabled={hasAnyPlayableActiveDie || pendingAction !== null}
                    >
                      {pendingAction === "active-skip" ? "处理中..." : "本掷无法填写，记为空过"}
                    </button>
                  </div>
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
                  <p className="helper-copy">
                    {passiveRegularSource === "active-fields"
                      ? "按规则，你当前不能使用任何银盘骰子，所以必须改从主动玩家左上角的已选骰子里拿 1 颗。"
                      : "被动玩家最多拿银盘中的一个骰子。只有当银盘和主动骰位都没有合法选择时，才能跳过。"}
                  </p>
                  {passiveRegularDice.map((die) => (
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
                  <button
                    className="secondary-button"
                    onClick={handlePassiveSkip}
                    disabled={hasAnyPlayablePassiveDie || pendingAction !== null}
                  >
                    {pendingAction === "passive-skip" ? "处理中..." : "没有合法骰子，跳过本次被动选择"}
                  </button>
                </div>
              ) : null}

              {gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "picked" ? (
                <div className="info-banner">
                  你的常规被动选择已经提交。若你还有额外骰动作，还可以在本回合继续使用。
                </div>
              ) : null}

              {gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "skipped" ? (
                <div className="info-banner">
                  你本次没有任何合法被动选择，已结束常规被动步骤。若你还有额外骰动作，还可以在本回合继续使用。
                </div>
              ) : null}

              {canUseExtraDieResource ? (
                <div className="action-group">
                  <h3>Extra die 动作</h3>
                  <p className="helper-copy">
                    你现在可以消耗 1 个额外骰动作，从本回合全部 6 颗骰子里再选 1 颗来落子。
                    同一颗骰子在本回合里不能被这个动作重复选择。
                  </p>
                  {extraActionDice.map((die) => (
                    <div key={`extra-action-${die.id}-${die.value}`} className="die-action-row">
                      <span>{describeDieAction(die, extraActionRole)}</span>
                      <div className="mini-action-row">
                        <button
                          className={`micro-button ${
                            selectedIntent?.kind === "extra" && selectedIntent.die.id === die.id
                              ? "micro-button-selected"
                              : ""
                          }`}
                          onClick={() => setSelectedIntent({ kind: "extra", die, playerRole: extraActionRole })}
                          disabled={pendingAction !== null}
                        >
                          选中后点纸面
                        </button>
                        <details className="fallback-details">
                          <summary>备用快捷按钮</summary>
                          <div className="mini-action-row fallback-row">
                            {renderPlacementButtons(die, (placement) => handleUseExtraDie(die, placement), pendingAction, "额外拿")}
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                  <button
                    className="secondary-button"
                    onClick={handlePassExtraDie}
                    disabled={pendingAction !== null}
                  >
                    {pendingAction === "pass-extra-die" ? "处理中..." : "本回合不再使用额外骰"}
                  </button>
                </div>
              ) : null}

              {gameState?.phase === "awaiting_bonus_resolution" && pendingBonusResolution ? (
                <div className="action-group">
                  <h3>{pendingBonusResolution.mode === "choice" ? "回合开局奖励" : "奖励解析"}</h3>
                  <p className="helper-copy">
                    {pendingBonusResolution.mode === "choice"
                      ? "第 4 轮开始时，每位玩家都要在黑色 X 和黑色 6 之间二选一，并立即执行，不能留到后面。"
                      : "先把奖励链处理完，完成后游戏会自动回到之前的阶段。"}
                  </p>
                  {pendingBonusResolution.bonuses.map((bonus, index) => (
                    <div key={`${bonus.source}-${index}`} className="die-action-row">
                      <span>{describeBonus(bonus)}</span>
                      <div className="mini-action-row">
                        {isInstantBonus(bonus) ? (
                          <button
                            className="micro-button micro-button-emphasis"
                            onClick={() => handleResolveInstantBonus(index)}
                            disabled={pendingAction !== null}
                          >
                            {pendingAction === `resolve-${index}-instant` ? "领取中..." : "立即领取"}
                          </button>
                        ) : (
                          <>
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
                                {renderBonusButtons(
                                  bonus,
                                  (placement) => handleResolveBonus(index, placement),
                                  pendingAction,
                                )}
                              </div>
                            </details>
                          </>
                        )}
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
              {gameState?.phase === "awaiting_turn_end" && hasPendingTurnEndExtraDie ? (
                <div className="info-banner">
                  当前仍有玩家可以继续使用或明确放弃 `Extra die` 动作，回合暂时还不能推进。
                </div>
              ) : null}
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

function isDieChoicePlayable(
  intent: SelectedIntent,
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  return hasAnyLegalTarget(buildSheetSelection(intent, gameState, player));
}

function getPassiveRegularSource(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  const silverPlatter = gameState.turn?.silverPlatter ?? [];
  return silverPlatter.some((die) => isDieChoicePlayable({ kind: "passive", die }, gameState, player))
    ? "silver"
    : "active-fields";
}

function getPassiveRegularDice(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  return getPassiveRegularSource(gameState, player) === "silver"
    ? (gameState.turn?.silverPlatter ?? [])
    : (gameState.turn?.activeSelections ?? []);
}

function canUseExtraDieAction(
  gameState: GameStateSnapshot,
  currentPlayerId: string | null,
  player: PlayerSheetSnapshot,
  passiveStatus: "pending" | "picked" | "skipped" | null,
) {
  if (!currentPlayerId || player.sheet.resources.extraDice <= 0) {
    return false;
  }

  if (!(gameState.phase === "awaiting_passive_picks" || gameState.phase === "awaiting_turn_end")) {
    return false;
  }

  if (gameState.currentPlayerId !== currentPlayerId && passiveStatus === "pending") {
    return false;
  }

  if (gameState.turn?.extraDicePassedByPlayer[currentPlayerId]) {
    return false;
  }

  return getExtraDieCandidates(gameState, player, currentPlayerId).length > 0;
}

function getExtraDieCandidates(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
  currentPlayerId: string,
) {
  const turn = gameState.turn;
  if (!turn) {
    return [];
  }

  const usedDieIds = new Set(turn.extraDiceUsedByPlayer[currentPlayerId] ?? []);
  return [...turn.activeSelections, ...turn.silverPlatter].filter(
    (die) =>
      !usedDieIds.has(die.id) &&
      isDieChoicePlayable({ kind: "extra", die, playerRole: "active" }, gameState, player),
  );
}

function areTurnEndActionsComplete(gameState: GameStateSnapshot) {
  if (!gameState.turn) {
    return true;
  }

  return gameState.players.every((player) => !hasAvailableExtraDieOption(gameState, player));
}

function hasAvailableExtraDieOption(
  gameState: GameStateSnapshot,
  player: PlayerSheetSnapshot,
) {
  const turn = gameState.turn;
  if (!turn || player.sheet.resources.extraDice <= 0) {
    return false;
  }

  if (!(gameState.phase === "awaiting_passive_picks" || gameState.phase === "awaiting_turn_end")) {
    return false;
  }

  if (turn.extraDicePassedByPlayer[player.playerId]) {
    return false;
  }

  if (player.playerId !== turn.activePlayerId) {
    const passiveSelection = turn.passiveSelections.find((selection) => selection.playerId === player.playerId);
    if (!passiveSelection || passiveSelection.status === "pending") {
      return false;
    }
  }

  return getExtraDieCandidates(gameState, player, player.playerId).length > 0;
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
    if (isInstantBonus(intent.bonus)) {
      return `奖励处理中：${describeBonus(intent.bonus)}。这个奖励不需要点纸面，直接在右侧立即领取即可。`;
    }

    return `奖励处理中：${describeBonus(intent.bonus)}。请去左侧高亮区域点击落点。`;
  }

  const modeLabel =
    intent.kind === "active" ? "主动" : intent.kind === "passive" ? "被动" : "额外骰";
  const die = getIntentDie(intent);
  const whiteHint = die.id === "white" ? " 白骰可跨区。" : "";
  return `${modeLabel}已选 ${die.id} = ${die.value}。请去左侧高亮区域点击落点。${whiteHint}`;
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

function describeBonus(bonus: PendingSheetBonus) {
  switch (bonus.type) {
    case "wild-mark":
      return `万能填写：${formatBonusSource(bonus.source)}`;
    case "extra-die":
      return `额外骰资源：${formatBonusSource(bonus.source)}`;
    case "fox":
      return `狐狸奖励：${formatBonusSource(bonus.source)}`;
    case "reroll":
      return `重投资源：${formatBonusSource(bonus.source)}`;
    case "number-mark":
      return `数字奖励 ${bonus.value}：${formatBonusSource(bonus.source)}`;
    case "orange-number":
      return `橙色数字 ${bonus.value ?? 6}：${formatBonusSource(bonus.source)}`;
    case "purple-number":
      return `紫色数字 ${bonus.value ?? 6}：${formatBonusSource(bonus.source)}`;
    default:
      return "未知奖励";
  }
}

function isInstantBonus(bonus: PendingSheetBonus) {
  return bonus.type === "extra-die" || bonus.type === "fox" || bonus.type === "reroll";
}

function formatBonusSource(source: string) {
  if (source === "round-4-black-x") {
    return "第 4 轮黑色 X";
  }

  if (source === "round-4-black-6") {
    return "第 4 轮黑色 6";
  }

  if (source.startsWith("yellow-row-")) {
    return `黄色第 ${source.slice(-1)} 行`;
  }

  if (source === "yellow-diagonal") {
    return "黄色对角线";
  }

  if (source.startsWith("blue-row-")) {
    return `蓝色第 ${source.slice(-1)} 行`;
  }

  if (source.startsWith("blue-column-")) {
    return `蓝色第 ${source.slice(-1)} 列`;
  }

  if (source.startsWith("green-step-")) {
    return `绿色第 ${source.split("-").at(-1)} 格`;
  }

  if (source.startsWith("orange-step-")) {
    return `橙色第 ${source.split("-").at(-1)} 格`;
  }

  if (source.startsWith("purple-step-")) {
    return `紫色第 ${source.split("-").at(-1)} 格`;
  }

  return source;
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

function getRoundTrackerLabel(round: number | null) {
  switch (round) {
    case 1:
      return "R";
    case 2:
      return "Extra Die";
    case 3:
      return "R";
    case 4:
      return "X / 6 二选一";
    default:
      return "无";
  }
}

function getActionPrompt(args: {
  room: RoomSummary | null;
  gameState: GameStateSnapshot | null;
  currentPlayerId: string | null;
  currentPlayerNickname: string;
  activePlayerNickname: string | null;
  passiveSelectionStatus: "pending" | "picked" | "skipped" | null;
  passiveRegularSource: "silver" | "active-fields";
  hasPendingBonus: boolean;
  selectedIntent: SelectedIntent | null;
  selectedIntentHasLegalTarget: boolean;
}) {
  const {
    room,
    gameState,
    currentPlayerId,
    currentPlayerNickname,
    activePlayerNickname,
    passiveSelectionStatus,
    passiveRegularSource,
    hasPendingBonus,
    selectedIntent,
    selectedIntentHasLegalTarget
  } = args;

  if (!room || room.status !== "in_game" || !gameState) {
    return "等待房间进入对局中，或等待服务端同步最新状态。";
  }

  if (hasPendingBonus) {
    return pendingBonusResolutionMessage(gameState, currentPlayerNickname);
  }

  if (selectedIntent && !selectedIntentHasLegalTarget) {
    return selectedIntent.kind === "passive"
      ? passiveRegularSource === "active-fields"
        ? "当前选中的主动骰位也没有合法落点。只有当银盘和主动骰位都不能用时，你才能跳过。"
        : "当前选中的银盘骰子没有任何合法落点。请改选别的骰子；只有当银盘和主动骰位都不能用时，你才能跳过。"
      : selectedIntent.kind === "active"
        ? "当前选中的主动骰子没有任何合法落点。请取消后改选别的骰子，或把这次掷骰记为空过。"
        : selectedIntent.kind === "extra"
          ? "当前选中的额外骰没有任何合法落点。请改选别的候选骰子。"
          : "当前选中的奖励没有任何合法解析位置。请取消后检查其他可处理路径。";
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
        return passiveRegularSource === "active-fields"
          ? "现在轮到你处理被动阶段。由于银盘里没有任何合法骰子，你必须改从主动玩家骰位里拿 1 颗。"
          : "现在轮到你处理银盘阶段。先完成一次常规被动选择；若你之后还有额外骰动作，可以继续使用。";
      }
      if (passiveSelectionStatus === "picked") {
        return "你已经提交了被动选择，等待其他玩家完成银盘阶段。";
      }
      if (passiveSelectionStatus === "skipped") {
        return "你本次没有任何合法被动选择，等待其他玩家完成银盘阶段。";
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

function pendingBonusResolutionMessage(
  gameState: GameStateSnapshot,
  currentPlayerNickname: string,
) {
  const resolution = gameState.turn?.pendingBonusResolution;
  if (resolution?.mode === "choice") {
    return `${currentPlayerNickname} 现在需要先处理第 4 轮开局奖励，在黑色 X 和黑色 6 之间二选一并立即执行。`;
  }

  return `${currentPlayerNickname} 现在需要先解析奖励，完成后状态机会回到上一个阶段。`;
}
