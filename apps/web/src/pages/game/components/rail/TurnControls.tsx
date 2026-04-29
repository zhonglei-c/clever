import { useGameState } from "../../context/GameStateContext";
import { useSelection } from "../../context/SelectionContext";
import { isIntentSelected } from "../../utils/intentHelpers";
import { isInstantBonus, describeBonus } from "../../utils/bonusHelpers";
import { describePlacement } from "../../utils/placementHelpers";
import { isDieChoicePlayable } from "../../utils/gameStateQueries";
import { describeLegalTargets } from "../../scoreSheetSelection";
import styles from "./TurnControls.module.css";

export function TurnControls() {
  const game = useGameState();
  const selection = useSelection();

  function handleConfirmSelectedPlacement() {
    if (!selection.selectedIntent || !selection.pendingPlacement) return;
    game.applyIntentPlacement(selection.selectedIntent, selection.pendingPlacement);
  }

  return (
    <div className={styles.turnControls}>
      {/* Confirmation / Guide area */}
      {selection.selectedIntent && selection.pendingPlacement ? (
        <div className={styles.confirmBar}>
          <div className={styles.confirmCopy}>
            <span className={styles.confirmKicker}>待确认</span>
            <strong className={styles.confirmTitle}>{describePlacement(selection.pendingPlacement)}</strong>
          </div>
          <div className={styles.confirmActions}>
            <button
              className="primary-button"
              onClick={handleConfirmSelectedPlacement}
              disabled={game.pendingAction !== null}
            >
              确认填写
            </button>
            <button
              className="micro-button"
              onClick={() => selection.setPendingPlacement(null)}
              disabled={game.pendingAction !== null}
            >
              重选
            </button>
            <button
              className="micro-button"
              onClick={() => {
                selection.setPendingPlacement(null);
                selection.setSelectedIntent(null);
              }}
              disabled={game.pendingAction !== null}
            >
              取消
            </button>
          </div>
        </div>
      ) : selection.selectedIntent && !selection.pendingPlacement ? (
        <div className={styles.guideBar}>
          <div className={styles.guideCopy}>
            <span>
              {selection.selectedIntentHasLegalTarget
                ? `点击左侧高亮区域：${describeLegalTargets(selection.sheetSelection)}`
                : "当前选择没有合法落点，请取消后改选。"}
            </span>
          </div>
          <button
            className="micro-button"
            onClick={() => {
              selection.setPendingPlacement(null);
              selection.setSelectedIntent(null);
            }}
            disabled={game.pendingAction !== null}
          >
            取消
          </button>
        </div>
      ) : null}

      {/* Error banner */}
      {selection.selectedIntent && !selection.selectedIntentHasLegalTarget ? (
        <div className={styles.errorBanner}>
          当前选中的对象在所有允许区域里都没有合法落点。
          {selection.selectedIntent.kind === "passive"
            ? game.passiveRegularSource === "active-fields"
              ? " 这是被动阶段的主动骰位补救选择；如果这里也都不能用，你才可以跳过。"
              : " 这是被动阶段时，可以改选别的银盘骰子；只有银盘和主动骰位都不能用时才可以跳过。"
            : selection.selectedIntent.kind === "active"
              ? game.hasAnyPlayableActiveDie
                ? " 这是主动阶段时，请取消当前选择并改选别的骰子。"
                : " 这是主动阶段时，而且当前所有已掷骰子都没有合法落点；你现在可以把这次掷骰记为空过。"
              : selection.selectedIntent.kind === "extra"
                ? " 这是额外骰动作时，请改选别的候选骰子。"
                : " 请取消当前奖励选择，改用其他可解析的奖励或等待前一动作调整。"}
        </div>
      ) : null}

      {/* Roll section */}
      {game.canRoll ? (
        <div className={styles.actionBlock}>
          <button className="primary-button" onClick={game.handleRoll} disabled={game.pendingAction !== null}>
            {game.pendingAction === "roll" ? "掷骰中..." : "主动玩家掷骰"}
          </button>
        </div>
      ) : null}

      {/* Active selection */}
      {game.isAwaitingMyActiveSelection ? (
        <div className={styles.actionBlock}>
          <div className={styles.actionHeader}>
            <h3>主动选骰</h3>
            <div className={styles.miniActions}>
              <button
                className="secondary-button"
                onClick={game.handleUseRerollResource}
                disabled={!game.canUseRerollResource || game.pendingAction !== null}
              >
                {game.pendingAction === "use-reroll"
                  ? "重投中..."
                  : `消耗重投 (${game.mySheet?.sheet.resources.rerolls ?? 0})`}
              </button>
              <button
                className="secondary-button"
                onClick={game.handleActiveSkip}
                disabled={game.hasAnyPlayableActiveDie || game.pendingAction !== null}
              >
                {game.pendingAction === "active-skip" ? "处理中..." : "本掷无法填写，记为空过"}
              </button>
            </div>
          </div>
          <div className={styles.diceGrid}>
            {game.rolledDice.map((die) => (
              <div key={`active-action-${die.id}`} className={styles.dieRow}>
                <button
                  className={`die-card die-card-square die-${die.color} ${
                    isIntentSelected(selection.selectedIntent, "active", die.id) ? "die-card-selected" : ""
                  } ${game.pendingAction === null ? "die-card-actionable" : ""} ${
                    game.mySheet && game.gameState &&
                    !isDieChoicePlayable({ kind: "active", die }, game.gameState, game.mySheet)
                      ? "die-card-blocked"
                      : ""
                  }`}
                  title={
                    game.mySheet && game.gameState
                      ? isDieChoicePlayable({ kind: "active", die }, game.gameState, game.mySheet)
                        ? "选中这个骰子，左侧会高亮所有合法落点。"
                        : "这个骰子当前没有合法落点。"
                      : ""
                  }
                  onClick={() => {
                    selection.setPendingPlacement(null);
                    selection.setSelectedIntent({ kind: "active", die });
                  }}
                  disabled={game.pendingAction !== null}
                >
                  <span>{die.value}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Passive selection */}
      {game.isAwaitingMyPassivePick ? (
        <div className={styles.actionBlock}>
          <div className={styles.actionHeader}>
            <h3>被动选骰</h3>
            <p className={styles.helper}>
              {game.passiveRegularSource === "active-fields"
                ? "按规则，你当前不能使用任何银盘骰子，所以必须改从主动玩家左上角的已选骰子里拿 1 颗。"
                : "被动玩家最多拿银盘中的一个骰子。只有当银盘和主动骰位都没有合法选择时，才能跳过。"}
            </p>
          </div>
          <div className={styles.diceGrid}>
            {game.passiveRegularDice.map((die) => (
              <div key={`passive-action-${die.id}-${die.value}`} className={styles.dieRow}>
                <button
                  className={`die-card die-card-square die-${die.color} ${
                    isIntentSelected(selection.selectedIntent, "passive", die.id) ? "die-card-selected" : ""
                  } ${game.pendingAction === null ? "die-card-actionable" : ""} ${
                    game.mySheet && game.gameState &&
                    !isDieChoicePlayable({ kind: "passive", die }, game.gameState, game.mySheet)
                      ? "die-card-blocked"
                      : ""
                  }`}
                  title={
                    game.mySheet && game.gameState
                      ? isDieChoicePlayable({ kind: "passive", die }, game.gameState, game.mySheet)
                        ? "选中这个骰子，左侧会高亮所有合法落点。"
                        : "这个骰子当前没有合法落点。"
                      : ""
                  }
                  onClick={() => {
                    selection.setPendingPlacement(null);
                    selection.setSelectedIntent({ kind: "passive", die });
                  }}
                  disabled={game.pendingAction !== null}
                >
                  <span>{die.value}</span>
                </button>
              </div>
            ))}
          </div>
          <button
            className="secondary-button"
            onClick={game.handlePassiveSkip}
            disabled={game.hasAnyPlayablePassiveDie || game.pendingAction !== null}
          >
            {game.pendingAction === "passive-skip" ? "处理中..." : "没有合法骰子，跳过本次被动选择"}
          </button>
        </div>
      ) : null}

      {/* Extra die */}
      {game.canUseExtraDieResource ? (
        <div className={styles.actionBlock}>
          <div className={styles.actionHeader}>
            <h3>Extra die 动作</h3>
            <p className={styles.helper}>
              你现在可以消耗 1 个额外骰动作，从本回合全部 6 颗骰子里再选 1 颗来落子。
              同一颗骰子在本回合里不能被这个动作重复选择。
            </p>
          </div>
          <div className={styles.diceGrid}>
            {game.extraActionDice.map((die) => (
              <div key={`extra-action-${die.id}-${die.value}`} className={styles.dieRow}>
                <button
                  className={`die-card die-card-square die-${die.color} ${
                    selection.selectedIntent?.kind === "extra" && selection.selectedIntent.die.id === die.id
                      ? "die-card-selected"
                      : ""
                  } ${game.pendingAction === null ? "die-card-actionable" : ""}`}
                  title="选中这个额外骰，左侧会高亮所有合法落点。"
                  onClick={() => {
                    selection.setPendingPlacement(null);
                    selection.setSelectedIntent({ kind: "extra", die, playerRole: game.extraActionRole });
                  }}
                  disabled={game.pendingAction !== null}
                >
                  <span>{die.value}</span>
                </button>
              </div>
            ))}
          </div>
          <button className="secondary-button" onClick={game.handlePassExtraDie} disabled={game.pendingAction !== null}>
            {game.pendingAction === "pass-extra-die" ? "处理中..." : "本回合不再使用额外骰"}
          </button>
        </div>
      ) : null}

      {/* Bonus resolution */}
      {game.gameState?.phase === "awaiting_bonus_resolution" && game.pendingBonusResolution ? (
        <div className={styles.actionBlock}>
          <div className={styles.actionHeader}>
            <h3>{game.pendingBonusResolution.mode === "choice" ? "回合开局奖励" : "奖励解析"}</h3>
            <p className={styles.helper}>
              {game.pendingBonusResolution.mode === "choice"
                ? "第 4 轮开始时，每位玩家都要在黑色 X 和黑色 6 之间二选一，并立即执行，不能留到后面。"
                : "先把奖励链处理完，完成后游戏会自动回到之前的阶段。"}
            </p>
          </div>
          <div className={styles.optionGrid}>
            {game.pendingBonusResolution.bonuses.map((bonus, index) => (
              <div key={`${bonus.source}-${index}`} className={styles.dieRow}>
                <span>{describeBonus(bonus)}</span>
                <div className={styles.miniActions}>
                  {isInstantBonus(bonus) ? (
                    <button
                      className="micro-button micro-button-emphasis"
                      onClick={() => game.handleResolveInstantBonus(index)}
                      disabled={game.pendingAction !== null}
                    >
                      {game.pendingAction === `resolve-${index}-instant` ? "领取中..." : "立即领取"}
                    </button>
                  ) : (
                    <button
                      className={`micro-button ${
                        selection.selectedIntent?.kind === "bonus" && selection.selectedIntent.bonusIndex === index
                          ? "micro-button-selected"
                          : ""
                      }`}
                      onClick={() => {
                        selection.setPendingPlacement(null);
                        selection.setSelectedIntent({ kind: "bonus", bonus, bonusIndex: index });
                      }}
                      disabled={game.pendingAction !== null}
                    >
                      选择奖励
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Advance turn */}
      {game.canAdvanceTurn ? (
        <div className={styles.actionBlock}>
          <button className="secondary-button" onClick={game.handleAdvanceTurn} disabled={game.pendingAction !== null}>
            {game.pendingAction === "advance-turn" ? "推进中..." : "推进到下一位玩家"}
          </button>
          {game.gameState?.phase === "awaiting_turn_end" && game.hasPendingTurnEndExtraDie ? (
            <div className={styles.infoBanner}>
              当前仍有玩家可以继续使用或明确放弃 `Extra die` 动作，回合暂时还不能推进。
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Locked dice */}
      <div className={styles.actionBlock}>
        <div className={styles.actionHeader}>
          <h3>已锁定骰子</h3>
          <p className={styles.helper}>
            这里展示本回合已经进入银盘、不会再参与后续投掷的锁定骰子，不包含玩家已经拿走的已使用骰子。
          </p>
        </div>
        {game.silverPlatter.length > 0 ? (
          <div className={styles.lockedDiceGrid}>
            {game.silverPlatter.map((die, index) => (
              <div key={`locked-${die.id}-${die.value}-${index}`} className={styles.dieRow}>
                <div className={`die-card die-card-square die-card-locked die-${die.color}`}>
                  <span>{die.value}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.helper}>这回合还没有进入银盘的锁定骰子。</p>
        )}
      </div>
    </div>
  );
}
