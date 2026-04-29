import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { GameStateSnapshot, PassivePickSnapshot, PlayerSheetSnapshot, SheetPlacement } from "@clever/game-core";
import type {
  DieValue,
  RoomErrorEvent,
  RoomJoinedEvent,
  RoomSummary,
  SyncStateEvent,
} from "@clever/shared";
import { ensureRealtimeConnection, getRealtimeSocket } from "../../../services/realtime";
import {
  getLastNickname,
  getStoredRoomSession,
  saveRoomSession,
  setLastNickname,
} from "../../../services/room-session";
import { getPreferredRulesLanguage } from "../utils/rulesLinks";
import { isDieChoicePlayable } from "../utils/gameStateQueries";
import {
  getPassiveRegularSource,
  getPassiveRegularDice,
  canUseExtraDieAction,
  getExtraDieCandidates,
  areTurnEndActionsComplete,
} from "../utils/gameStateQueries";
import { useSheetViewportScaling } from "../hooks/useSheetViewportScaling";
import { useTurnTopbarCollapse } from "../hooks/useTurnTopbarCollapse";
import type { SelectedIntent } from "../scoreSheetSelection";

interface GameStateContextValue {
  normalizedRoomId: string;
  socketConnected: boolean;
  currentPlayerId: string | null;
  nickname: string;
  setNickname: (name: string) => void;
  rulesLanguage: string;
  room: RoomSummary | null;
  gameState: GameStateSnapshot | null;
  error: string;
  joining: boolean;
  pendingAction: string | null;
  selectionResetToken: number;
  currentPlayer: RoomSummary["players"][number] | null;
  activePlayer: RoomSummary["players"][number] | null;
  mySheet: PlayerSheetSnapshot | null;
  rolledDice: DieValue[];
  silverPlatter: DieValue[];
  activeSelections: DieValue[];
  passiveSelection: PassivePickSnapshot | null;
  pendingBonusResolution: NonNullable<GameStateSnapshot["turn"]>["pendingBonusResolution"] | null;
  passiveRegularDice: DieValue[];
  passiveRegularSource: string;
  extraActionDice: DieValue[];
  extraActionRole: "active" | "passive";
  canRoll: boolean;
  isAwaitingMyActiveSelection: boolean;
  isAwaitingMyPassivePick: boolean;
  canUseRerollResource: boolean;
  canUseExtraDieResource: boolean;
  canAdvanceTurn: boolean;
  hasPendingTurnEndExtraDie: boolean;
  shouldShowTurnTopbar: boolean;
  hasAnyPlayableActiveDie: boolean;
  hasAnyPlayablePassiveDie: boolean;
  handleJoinRoom: (event: FormEvent<HTMLFormElement>) => void;
  handleRoll: () => void;
  handleSelectDie: (die: DieValue, placement: SheetPlacement) => void;
  handlePassivePick: (die: DieValue, placement: SheetPlacement) => void;
  handleUseExtraDie: (die: DieValue, placement: SheetPlacement) => void;
  handlePassExtraDie: () => void;
  handlePassiveSkip: () => void;
  handleActiveSkip: () => void;
  handleAdvanceTurn: () => void;
  handleUseRerollResource: () => void;
  handleResolveBonus: (bonusIndex: number, placement: SheetPlacement) => void;
  handleResolveInstantBonus: (bonusIndex: number) => void;
  applyIntentPlacement: (intent: SelectedIntent, placement: SheetPlacement) => void;
  viewportScale: number;
  viewportHeight: number | null;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  scheduleViewportUpdate: () => void;
  isTurnTopbarCollapsed: boolean;
  toggleTurnTopbar: () => void;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({
  normalizedRoomId,
  children,
}: {
  normalizedRoomId: string;
  children: React.ReactNode;
}) {
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
  const [rulesLanguage] = useState(getPreferredRulesLanguage);
  const [selectionResetToken, setSelectionResetToken] = useState(0);

  // --- Socket connection ---
  useEffect(() => {
    if (!normalizedRoomId) return;

    const socket = ensureRealtimeConnection();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleJoined = (payload: RoomJoinedEvent) => {
      if (payload.room.id !== normalizedRoomId) return;
      setRoom(payload.room);
      setCurrentPlayerId(payload.player.id);
      setNickname(payload.player.nickname);
      setLastNickname(payload.player.nickname);
      setGameState((payload.gameState as GameStateSnapshot | null) ?? null);
      saveRoomSession({
        roomId: payload.room.id,
        playerId: payload.player.id,
        nickname: payload.player.nickname,
      });
      setError("");
      setJoining(false);
      setPendingAction(null);
      setSelectionResetToken((t) => t + 1);
    };

    const handleSync = (payload: SyncStateEvent) => {
      if (payload.room.id !== normalizedRoomId) return;
      setRoom(payload.room);
      setGameState((payload.gameState as GameStateSnapshot | null) ?? null);
      setPendingAction(null);
      setSelectionResetToken((t) => t + 1);
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
        playerId: existingSession.playerId,
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

  // --- Derived state ---
  const currentPlayer = room?.players.find((p) => p.id === currentPlayerId) ?? null;
  const activePlayer = room?.players.find((p) => p.id === gameState?.currentPlayerId) ?? null;
  const rolledDice = gameState?.turn?.rolledDice ?? [];
  const silverPlatter = gameState?.turn?.silverPlatter ?? [];
  const activeSelections = gameState?.turn?.activeSelections ?? [];
  const passiveSelection = useMemo(
    () => gameState?.turn?.passiveSelections.find((s) => s.playerId === currentPlayerId) ?? null,
    [currentPlayerId, gameState?.turn?.passiveSelections],
  );
  const mySheet = useMemo(
    () => gameState?.players.find((p) => p.playerId === currentPlayerId) ?? null,
    [currentPlayerId, gameState?.players],
  );
  const pendingBonusResolution =
    gameState?.turn?.pendingBonusResolution?.playerId === currentPlayerId
      ? gameState.turn.pendingBonusResolution
      : null;

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
    gameState?.phase === "awaiting_active_selection" && gameState.currentPlayerId === currentPlayerId,
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

  // --- Hooks ---
  const {
    scale: viewportScale,
    height: viewportHeight,
    viewportRef,
    contentRef,
    scheduleUpdate: scheduleViewportUpdate,
  } = useSheetViewportScaling();

  const { isCollapsed: isTurnTopbarCollapsed, toggle: toggleTurnTopbar } =
    useTurnTopbarCollapse(shouldShowTurnTopbar);

  // --- Font-load / state-change viewport recalculation ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const frameIds = [
      window.requestAnimationFrame(() => scheduleViewportUpdate()),
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => scheduleViewportUpdate());
      }),
    ];
    const timeoutIds = [
      window.setTimeout(() => scheduleViewportUpdate(), 0),
      window.setTimeout(() => scheduleViewportUpdate(), 120),
    ];

    if ("fonts" in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled) scheduleViewportUpdate();
      });
    }

    return () => {
      cancelled = true;
      frameIds.forEach((id) => window.cancelAnimationFrame(id));
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, [mySheet, shouldShowTurnTopbar, isTurnTopbarCollapsed, room?.status, gameState?.phase, scheduleViewportUpdate]);

  // --- Action handlers ---
  const emitAction = useCallback(
    (actionKey: string, callback: () => void) => {
      setPendingAction(actionKey);
      setError("");
      callback();
      window.setTimeout(() => {
        setPendingAction((current) => (current === actionKey ? null : current));
      }, 250);
    },
    [],
  );

  const handleJoinRoom = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!normalizedRoomId) return;
      setJoining(true);
      setError("");
      const socket = ensureRealtimeConnection();
      socket.emit("room:join", { roomId: normalizedRoomId, nickname });
    },
    [normalizedRoomId, nickname],
  );

  const handleRoll = useCallback(() => {
    if (!gameState) return;
    const socket = ensureRealtimeConnection();
    emitAction("roll", () => socket.emit("game:roll", { roomId: gameState.roomId }));
  }, [gameState, emitAction]);

  const handleSelectDie = useCallback(
    (die: DieValue, placement: SheetPlacement) => {
      if (!gameState) return;
      const socket = ensureRealtimeConnection();
      emitAction(`select-${die.id}-${placement.zone}`, () =>
        socket.emit("game:select-die", { roomId: gameState.roomId, dieId: die.id, placement }),
      );
    },
    [gameState, emitAction],
  );

  const handlePassivePick = useCallback(
    (die: DieValue, placement: SheetPlacement) => {
      if (!gameState) return;
      const socket = ensureRealtimeConnection();
      emitAction(`passive-${die.id}-${placement.zone}`, () =>
        socket.emit("game:passive-pick", { roomId: gameState.roomId, dieId: die.id, placement }),
      );
    },
    [gameState, emitAction],
  );

  const handleUseExtraDie = useCallback(
    (die: DieValue, placement: SheetPlacement) => {
      if (!gameState) return;
      const socket = ensureRealtimeConnection();
      emitAction(`extra-${die.id}-${placement.zone}`, () =>
        socket.emit("game:use-extra-die", { roomId: gameState.roomId, dieId: die.id, placement }),
      );
    },
    [gameState, emitAction],
  );

  const handlePassExtraDie = useCallback(() => {
    if (!gameState) return;
    const socket = ensureRealtimeConnection();
    emitAction("pass-extra-die", () => socket.emit("game:pass-extra-die", { roomId: gameState.roomId }));
  }, [gameState, emitAction]);

  const handlePassiveSkip = useCallback(() => {
    if (!gameState) return;
    const socket = ensureRealtimeConnection();
    emitAction("passive-skip", () => socket.emit("game:passive-skip", { roomId: gameState.roomId }));
  }, [gameState, emitAction]);

  const handleActiveSkip = useCallback(() => {
    if (!gameState) return;
    const socket = ensureRealtimeConnection();
    emitAction("active-skip", () => socket.emit("game:active-skip", { roomId: gameState.roomId }));
  }, [gameState, emitAction]);

  const handleAdvanceTurn = useCallback(() => {
    if (!gameState) return;
    const socket = ensureRealtimeConnection();
    emitAction("advance-turn", () => socket.emit("game:advance-turn", { roomId: gameState.roomId }));
  }, [gameState, emitAction]);

  const handleUseRerollResource = useCallback(() => {
    if (!gameState) return;
    const socket = ensureRealtimeConnection();
    emitAction("use-reroll", () => socket.emit("game:use-reroll", { roomId: gameState.roomId }));
  }, [gameState, emitAction]);

  const handleResolveBonus = useCallback(
    (bonusIndex: number, placement: SheetPlacement) => {
      if (!gameState) return;
      const socket = ensureRealtimeConnection();
      emitAction(`resolve-${bonusIndex}-${placement.zone}`, () =>
        socket.emit("game:resolve-bonus", { roomId: gameState.roomId, bonusIndex, placement }),
      );
    },
    [gameState, emitAction],
  );

  const handleResolveInstantBonus = useCallback(
    (bonusIndex: number) => {
      if (!gameState) return;
      const socket = ensureRealtimeConnection();
      emitAction(`resolve-${bonusIndex}-instant`, () =>
        socket.emit("game:resolve-bonus", {
          roomId: gameState.roomId,
          bonusIndex,
          placement: { zone: "green" },
        }),
      );
    },
    [gameState, emitAction],
  );

  const applyIntentPlacement = useCallback(
    (intent: SelectedIntent, placement: SheetPlacement) => {
      if (intent.kind === "active") {
        handleSelectDie(intent.die, placement);
      } else if (intent.kind === "passive") {
        handlePassivePick(intent.die, placement);
      } else if (intent.kind === "extra") {
        handleUseExtraDie(intent.die, placement);
      } else {
        handleResolveBonus(intent.bonusIndex, placement);
      }
    },
    [handleSelectDie, handlePassivePick, handleUseExtraDie, handleResolveBonus],
  );

  // --- Context value ---
  const value = useMemo<GameStateContextValue>(
    () => ({
      normalizedRoomId,
      socketConnected,
      currentPlayerId,
      nickname,
      setNickname,
      rulesLanguage,
      room,
      gameState,
      error,
      joining,
      pendingAction,
      selectionResetToken,
      currentPlayer,
      activePlayer,
      mySheet,
      rolledDice,
      silverPlatter,
      activeSelections,
      passiveSelection,
      pendingBonusResolution,
      passiveRegularDice,
      passiveRegularSource,
      extraActionDice,
      extraActionRole,
      canRoll,
      isAwaitingMyActiveSelection,
      isAwaitingMyPassivePick,
      canUseRerollResource,
      canUseExtraDieResource,
      canAdvanceTurn,
      hasPendingTurnEndExtraDie,
      shouldShowTurnTopbar,
      hasAnyPlayableActiveDie,
      hasAnyPlayablePassiveDie,
      handleJoinRoom,
      handleRoll,
      handleSelectDie,
      handlePassivePick,
      handleUseExtraDie,
      handlePassExtraDie,
      handlePassiveSkip,
      handleActiveSkip,
      handleAdvanceTurn,
      handleUseRerollResource,
      handleResolveBonus,
      handleResolveInstantBonus,
      applyIntentPlacement,
      viewportScale,
      viewportHeight,
      viewportRef,
      contentRef,
      scheduleViewportUpdate,
      isTurnTopbarCollapsed,
      toggleTurnTopbar,
    }),
    [
      normalizedRoomId,
      socketConnected,
      currentPlayerId,
      nickname,
      rulesLanguage,
      room,
      gameState,
      error,
      joining,
      pendingAction,
      selectionResetToken,
      currentPlayer,
      activePlayer,
      mySheet,
      rolledDice,
      silverPlatter,
      activeSelections,
      passiveSelection,
      pendingBonusResolution,
      passiveRegularDice,
      passiveRegularSource,
      extraActionDice,
      extraActionRole,
      canRoll,
      isAwaitingMyActiveSelection,
      isAwaitingMyPassivePick,
      canUseRerollResource,
      canUseExtraDieResource,
      canAdvanceTurn,
      hasPendingTurnEndExtraDie,
      shouldShowTurnTopbar,
      hasAnyPlayableActiveDie,
      hasAnyPlayablePassiveDie,
      handleJoinRoom,
      handleRoll,
      handleSelectDie,
      handlePassivePick,
      handleUseExtraDie,
      handlePassExtraDie,
      handlePassiveSkip,
      handleActiveSkip,
      handleAdvanceTurn,
      handleUseRerollResource,
      handleResolveBonus,
      handleResolveInstantBonus,
      applyIntentPlacement,
      viewportScale,
      viewportHeight,
      viewportRef,
      contentRef,
      scheduleViewportUpdate,
      isTurnTopbarCollapsed,
      toggleTurnTopbar,
    ],
  );

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameStateContextValue {
  const context = useContext(GameStateContext);
  if (!context) throw new Error("useGameState must be used within GameStateProvider");
  return context;
}
