import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
  getTrackPreviewValue,
  hasAnyLegalTarget,
  type SheetSelectionState,
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
  const [pendingDieIntent, setPendingDieIntent] = useState<Exclude<SelectedIntent, { kind: "bonus" }> | null>(null);
  const [rulesLanguage] = useState(getPreferredRulesLanguage);
  const [isTurnTopbarCollapsed, setIsTurnTopbarCollapsed] = useState(false);
  const previousTopbarVisibleRef = useRef(false);

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
      setPendingDieIntent(null);
      setSelectedIntent(null);
    };

    const handleSync = (payload: SyncStateEvent) => {
      if (payload.room.id !== normalizedRoomId) {
        return;
      }

      setRoom(payload.room);
      setGameState((payload.gameState as GameStateSnapshot | null) ?? null);
      setPendingAction(null);
      setPendingDieIntent(null);
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
  const pendingDieSelection = useMemo(
    () => (gameState && mySheet && pendingDieIntent
      ? buildSheetSelection(pendingDieIntent, gameState, mySheet)
      : emptySheetSelection()),
    [gameState, mySheet, pendingDieIntent],
  );
  const selectedIntentHasLegalTarget = hasAnyLegalTarget(sheetSelection);
  const selectedIntentPlacements = useMemo(() => getLegalPlacements(sheetSelection), [sheetSelection]);
  const pendingDieIntentPlacements = useMemo(() => getLegalPlacements(pendingDieSelection), [pendingDieSelection]);
  const pendingDieIntentHasLegalTarget = hasAnyLegalTarget(pendingDieSelection);
  const requiresManualPlacement = selectedIntentPlacements.length > 1;
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
  const isAwaitingMyActiveSelection = Boolean(
    gameState?.phase === "awaiting_active_selection" &&
      gameState.currentPlayerId === currentPlayerId,
  );
  const isAwaitingMyPassivePick = Boolean(
    gameState?.phase === "awaiting_passive_picks" && passiveSelection?.status === "pending",
  );
  const shouldShowTurnTopbar = Boolean(
    canRoll ||
      isAwaitingMyActiveSelection ||
      isAwaitingMyPassivePick ||
      canUseExtraDieResource ||
      pendingBonusResolution ||
      canAdvanceTurn,
  );

  useEffect(() => {
    if (shouldShowTurnTopbar && !previousTopbarVisibleRef.current) {
      setIsTurnTopbarCollapsed(false);
    }

    previousTopbarVisibleRef.current = shouldShowTurnTopbar;
  }, [shouldShowTurnTopbar]);

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

    applyIntentPlacement(selectedIntent, placement);
  }

  function applyIntentPlacement(intent: SelectedIntent, placement: SheetPlacement) {
    if (intent.kind === "active") {
      handleSelectDie(intent.die, placement);
      return;
    }

    if (intent.kind === "passive") {
      handlePassivePick(intent.die, placement);
      return;
    }

    if (intent.kind === "extra") {
      handleUseExtraDie(intent.die, placement);
      return;
    }

    handleResolveBonus(intent.bonusIndex, placement);
  }

  function handleConfirmPendingDieIntent() {
    if (!pendingDieIntent || !gameState || !mySheet) {
      return;
    }

    const placements = getLegalPlacements(buildSheetSelection(pendingDieIntent, gameState, mySheet));
    if (placements.length === 1) {
      applyIntentPlacement(pendingDieIntent, placements[0]);
      setPendingDieIntent(null);
      return;
    }

    setSelectedIntent(pendingDieIntent);
    setPendingDieIntent(null);
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
    <main
      className={`page-shell game-page-shell ${
        shouldShowTurnTopbar
          ? isTurnTopbarCollapsed
            ? "game-page-shell-with-turnbar-collapsed"
            : "game-page-shell-with-turnbar"
          : ""
      }`}
    >
      {shouldShowTurnTopbar ? (
        <section className={`turn-topbar panel ${isTurnTopbarCollapsed ? "turn-topbar-collapsed" : ""}`}>
          <div className="turn-topbar-head">
            <div className="turn-topbar-title">
              <p className="eyebrow">Your Turn</p>
              <h2>{isTurnTopbarCollapsed ? "操作" : actionPrompt}</h2>
            </div>
            <div className="turn-topbar-controls">
              {!isTurnTopbarCollapsed && selectedIntent && requiresManualPlacement ? (
                <div className="turn-topbar-summary">
                  <span className="selection-targets">请在左侧选择落点：{describeLegalTargets(sheetSelection)}</span>
                  <button
                    className="micro-button"
                    onClick={() => {
                      setPendingDieIntent(null);
                      setSelectedIntent(null);
                    }}
                  >
                    取消
                  </button>
                </div>
              ) : null}
              <button
                className="micro-button turn-topbar-toggle"
                onClick={() => setIsTurnTopbarCollapsed((current) => !current)}
              >
                {isTurnTopbarCollapsed ? "展开" : "收起"}
              </button>
            </div>
          </div>
          {!isTurnTopbarCollapsed && selectedIntent && !selectedIntentHasLegalTarget ? (
            <div className="error-banner turn-topbar-banner">
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
          {!isTurnTopbarCollapsed ? <div className="turn-topbar-content">
            {canRoll ? (
              <div className="turn-action-block">
                <button className="primary-button" onClick={handleRoll} disabled={pendingAction !== null}>
                  {pendingAction === "roll" ? "掷骰中..." : "主动玩家掷骰"}
                </button>
              </div>
            ) : null}

            {isAwaitingMyActiveSelection ? (
              <div className="turn-action-block">
                <div className="turn-action-header">
                  <h3>主动选骰</h3>
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
                </div>
                <div className="turn-option-grid turn-option-grid-dice">
                  {rolledDice.map((die) => (
                    <div key={`active-action-${die.id}`} className="die-action-row die-action-row-die">
                      <button
                        className={`die-card die-card-square die-${die.color} ${
                          isDieIntentPending(pendingDieIntent, { kind: "active", die }) ? "die-card-pending" : ""
                        } ${
                          isIntentSelected(selectedIntent, "active", die.id) ? "die-card-selected" : ""
                        } ${
                          pendingAction === null ? "die-card-actionable" : ""
                        } ${
                          mySheet && gameState && !isDieChoicePlayable({ kind: "active", die }, gameState, mySheet)
                            ? "die-card-blocked"
                            : ""
                        }`}
                        title={
                          mySheet && gameState
                            ? isDieChoicePlayable({ kind: "active", die }, gameState, mySheet)
                            ? "选中这个骰子，再去计分纸上落子。"
                              : "这个骰子当前没有合法落点。"
                            : ""
                        }
                        onClick={() => {
                          setPendingDieIntent({ kind: "active", die });
                          setSelectedIntent(null);
                        }}
                        disabled={pendingAction !== null}
                      >
                        <span>{die.value}</span>
                      </button>
                    </div>
                  ))}
                </div>
                {pendingDieIntent?.kind === "active" ? (
                  <div className="mini-action-row">
                    <button
                      className="primary-button"
                      onClick={handleConfirmPendingDieIntent}
                      disabled={pendingAction !== null || !pendingDieIntentHasLegalTarget}
                    >
                      {pendingDieIntentPlacements.length === 1 ? "确认并直接填写" : "确认并去左侧选择"}
                    </button>
                    <button
                      className="micro-button"
                      onClick={() => setPendingDieIntent(null)}
                      disabled={pendingAction !== null}
                    >
                      取消
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isAwaitingMyPassivePick ? (
              <div className="turn-action-block">
                <div className="turn-action-header">
                  <h3>被动选骰</h3>
                  <p className="helper-copy">
                    {passiveRegularSource === "active-fields"
                      ? "按规则，你当前不能使用任何银盘骰子，所以必须改从主动玩家左上角的已选骰子里拿 1 颗。"
                      : "被动玩家最多拿银盘中的一个骰子。只有当银盘和主动骰位都没有合法选择时，才能跳过。"}
                  </p>
                </div>
                <div className="turn-option-grid turn-option-grid-dice">
                  {passiveRegularDice.map((die) => (
                    <div key={`passive-action-${die.id}-${die.value}`} className="die-action-row die-action-row-die">
                      <button
                        className={`die-card die-card-square die-${die.color} ${
                          isDieIntentPending(pendingDieIntent, { kind: "passive", die }) ? "die-card-pending" : ""
                        } ${
                          isIntentSelected(selectedIntent, "passive", die.id) ? "die-card-selected" : ""
                        } ${
                          pendingAction === null ? "die-card-actionable" : ""
                        } ${
                          mySheet && gameState && !isDieChoicePlayable({ kind: "passive", die }, gameState, mySheet)
                            ? "die-card-blocked"
                            : ""
                        }`}
                        title={
                          mySheet && gameState
                            ? isDieChoicePlayable({ kind: "passive", die }, gameState, mySheet)
                            ? "选中这个骰子，再去计分纸上落子。"
                              : "这个骰子当前没有合法落点。"
                            : ""
                        }
                        onClick={() => {
                          setPendingDieIntent({ kind: "passive", die });
                          setSelectedIntent(null);
                        }}
                        disabled={pendingAction !== null}
                      >
                        <span>{die.value}</span>
                      </button>
                    </div>
                  ))}
                </div>
                {pendingDieIntent?.kind === "passive" ? (
                  <div className="mini-action-row">
                    <button
                      className="primary-button"
                      onClick={handleConfirmPendingDieIntent}
                      disabled={pendingAction !== null || !pendingDieIntentHasLegalTarget}
                    >
                      {pendingDieIntentPlacements.length === 1 ? "确认并直接填写" : "确认并去左侧选择"}
                    </button>
                    <button
                      className="micro-button"
                      onClick={() => setPendingDieIntent(null)}
                      disabled={pendingAction !== null}
                    >
                      取消
                    </button>
                  </div>
                ) : null}
                <button
                  className="secondary-button"
                  onClick={handlePassiveSkip}
                  disabled={hasAnyPlayablePassiveDie || pendingAction !== null}
                >
                  {pendingAction === "passive-skip" ? "处理中..." : "没有合法骰子，跳过本次被动选择"}
                </button>
              </div>
            ) : null}

            {canUseExtraDieResource ? (
              <div className="turn-action-block">
                <div className="turn-action-header">
                  <h3>Extra die 动作</h3>
                  <p className="helper-copy">
                    你现在可以消耗 1 个额外骰动作，从本回合全部 6 颗骰子里再选 1 颗来落子。
                    同一颗骰子在本回合里不能被这个动作重复选择。
                  </p>
                </div>
                <div className="turn-option-grid turn-option-grid-dice">
                  {extraActionDice.map((die) => (
                    <div key={`extra-action-${die.id}-${die.value}`} className="die-action-row die-action-row-die">
                      <button
                        className={`die-card die-card-square die-${die.color} ${
                          isDieIntentPending(pendingDieIntent, { kind: "extra", die, playerRole: extraActionRole })
                            ? "die-card-pending"
                            : ""
                        } ${
                          selectedIntent?.kind === "extra" && selectedIntent.die.id === die.id
                            ? "die-card-selected"
                            : ""
                        } ${
                          pendingAction === null ? "die-card-actionable" : ""
                        }`}
                        title="选中这个额外骰，再去计分纸上落子。"
                        onClick={() => {
                          setPendingDieIntent({ kind: "extra", die, playerRole: extraActionRole });
                          setSelectedIntent(null);
                        }}
                        disabled={pendingAction !== null}
                      >
                        <span>{die.value}</span>
                      </button>
                    </div>
                  ))}
                </div>
                {pendingDieIntent?.kind === "extra" ? (
                  <div className="mini-action-row">
                    <button
                      className="primary-button"
                      onClick={handleConfirmPendingDieIntent}
                      disabled={pendingAction !== null || !pendingDieIntentHasLegalTarget}
                    >
                      {pendingDieIntentPlacements.length === 1 ? "确认并直接填写" : "确认并去左侧选择"}
                    </button>
                    <button
                      className="micro-button"
                      onClick={() => setPendingDieIntent(null)}
                      disabled={pendingAction !== null}
                    >
                      取消
                    </button>
                  </div>
                ) : null}
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
              <div className="turn-action-block">
                <div className="turn-action-header">
                  <h3>{pendingBonusResolution.mode === "choice" ? "回合开局奖励" : "奖励解析"}</h3>
                  <p className="helper-copy">
                    {pendingBonusResolution.mode === "choice"
                      ? "第 4 轮开始时，每位玩家都要在黑色 X 和黑色 6 之间二选一，并立即执行，不能留到后面。"
                      : "先把奖励链处理完，完成后游戏会自动回到之前的阶段。"}
                  </p>
                </div>
                <div className="turn-option-grid">
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
              </div>
            ) : null}

            {canAdvanceTurn ? (
              <div className="turn-action-block">
                <button
                  className="secondary-button"
                  onClick={handleAdvanceTurn}
                  disabled={pendingAction !== null}
                >
                  {pendingAction === "advance-turn" ? "推进中..." : "推进到下一位玩家"}
                </button>
                {gameState?.phase === "awaiting_turn_end" && hasPendingTurnEndExtraDie ? (
                  <div className="info-banner turn-topbar-banner">
                    当前仍有玩家可以继续使用或明确放弃 `Extra die` 动作，回合暂时还不能推进。
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="turn-action-block">
              <div className="turn-action-header">
                <h3>已锁定骰子</h3>
                <p className="helper-copy">这里展示本回合已经被主动玩家拿走、目前锁定在右侧流程里的骰子。</p>
              </div>
              {activeSelections.length > 0 ? (
                <div className="locked-dice-grid">
                  {activeSelections.map((die, index) => (
                    <div key={`locked-${die.id}-${die.value}-${index}`} className="die-action-row die-action-row-die">
                      <div className={`die-card die-card-square die-card-locked die-${die.color}`}>
                        <span>{die.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="helper-copy">这回合还没有锁定骰子。</p>
              )}
            </div>
          </div> : null}
        </section>
      ) : null}

      <section className="game-header-bar panel">
        <div>
          <span className="status-label">房间</span>
          <strong>{normalizedRoomId}</strong>
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

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="game-main-stack">
        <article className="panel primary-sheet primary-sheet-simplified">
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

        <article className="panel game-log-panel">
          <h2>最近日志</h2>
          <div className="log-list">
            {(gameState?.logs.slice(-5).reverse() ?? []).map((entry) => (
              <div key={entry.id} className="log-item">
                {entry.message}
              </div>
            ))}
          </div>
          {gameState?.phase === "finished" && gameState.standings ? (
            <div className="action-group final-standings">
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

function isIntentSelected(
  intent: SelectedIntent | null,
  expectedKind: "active" | "passive",
  dieId: DieValue["id"],
) {
  return Boolean(intent && intent.kind === expectedKind && intent.die.id === dieId);
}

function getLegalPlacements(selection: SheetSelectionState): SheetPlacement[] {
  const placements: SheetPlacement[] = [];

  selection.activeYellowCellIds.forEach((cellId) => {
    placements.push({ zone: "yellow", cellId });
  });

  selection.activeBlueCellIds.forEach((cellId) => {
    placements.push({ zone: "blue", cellId });
  });

  if (selection.activeGreen) {
    placements.push({ zone: "green" });
  }

  if (selection.activeOrange) {
    placements.push({ zone: "orange" });
  }

  if (selection.activePurple) {
    placements.push({ zone: "purple" });
  }

  return placements;
}

function isDieIntentPending(
  pendingIntent: Exclude<SelectedIntent, { kind: "bonus" }> | null,
  intent: Exclude<SelectedIntent, { kind: "bonus" }>,
) {
  if (!pendingIntent || pendingIntent.kind !== intent.kind || pendingIntent.die.id !== intent.die.id) {
    return false;
  }

  if (pendingIntent.kind !== "extra" || intent.kind !== "extra") {
    return true;
  }

  return pendingIntent.playerRole === intent.playerRole;
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
