import type { GameStateSnapshot, SheetPlacement } from "@clever/game-core";
import type { RoomSummary } from "@clever/shared";
import type { SelectedIntent } from "../scoreSheetSelection";

export function getActionPrompt(args: {
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
  pendingPlacement: SheetPlacement | null;
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
    selectedIntentHasLegalTarget,
    pendingPlacement
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

  if (selectedIntent) {
    return pendingPlacement
      ? "确认填写"
      : "请选择左侧落点";
  }

  switch (gameState.phase) {
    case "awaiting_active_roll":
      return gameState.currentPlayerId === currentPlayerId
        ? "轮到你掷骰了。先掷出当前仍可用的骰子。"
        : `等待 ${activePlayerNickname ?? gameState.currentPlayerId} 掷骰。`;
    case "awaiting_active_selection":
      return gameState.currentPlayerId === currentPlayerId
        ? "轮到你从当前掷骰结果里选择一个骰子，再到左侧点高亮落点并确认。"
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
