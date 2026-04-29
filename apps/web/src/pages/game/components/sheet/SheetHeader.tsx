import type { PlayerSheetSnapshot } from "@clever/game-core";
import type { DieValue } from "@clever/shared";
import { ResourceTrack, getRoundRewardLabel } from "./ResourceTrack";

interface SheetHeaderProps {
  player: PlayerSheetSnapshot;
  activeSelections: DieValue[];
  currentRound: number;
  totalRounds: number;
}

export function SheetHeader({ player, activeSelections, currentRound, totalRounds }: SheetHeaderProps) {
  return (
    <header className="score-sheet-topbar">
      <div className="score-sheet-used-dice">
        <div className="score-sheet-used-dice-head">
          <span className="score-sheet-panel-label">Used Dice</span>
          <strong>已使用骰子</strong>
        </div>
        <div className="score-sheet-used-dice-slots">
          {Array.from({ length: 3 }, (_, index) => {
            const die = activeSelections[index] ?? null;
            return (
              <div
                key={`selected-die-slot-${index + 1}`}
                className={`score-sheet-used-die-slot ${die ? "score-sheet-used-die-slot-filled" : ""}`}
                title={die ? `${die.id} ${die.value}` : `已使用骰位 ${index + 1}`}
              >
                {die ? (
                  <div className={`score-sheet-used-die-face die-card die-card-square die-${die.color}`}>
                    <span>{die.value}</span>
                  </div>
                ) : (
                  <span className="score-sheet-used-die-placeholder">{index + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="score-sheet-topbar-main">
        <div className="score-sheet-topbar-head">
          <div className="score-sheet-brand">
            <span className="score-sheet-brand-line">Pretty Clever</span>
            <strong className="score-sheet-brand-title">Player Sheet</strong>
          </div>
          <div className="score-sheet-summary-strip">
            <div className="score-sheet-summary-pill">
              <span>Fox</span>
              <strong>{player.sheet.resources.foxes}</strong>
            </div>
            <div className="score-sheet-summary-pill">
              <span>Pending</span>
              <strong>{player.sheet.pendingBonuses.length}</strong>
            </div>
          </div>
        </div>

        <div className="score-sheet-round-strip">
          <div className="score-sheet-round-strip-head">
            <span className="score-sheet-panel-label">Round Track</span>
            <strong>{currentRound} / {totalRounds}</strong>
          </div>
          <div className="score-sheet-round-track">
            {Array.from({ length: totalRounds }, (_, index) => {
              const round = index + 1;
              const state = round < currentRound ? "complete" : round === currentRound ? "active" : "upcoming";
              const rewardLabel = getRoundRewardLabel(round);
              return (
                <div
                  key={`round-${round}`}
                  className={`score-sheet-round-step score-sheet-round-step-${state}`}
                >
                  <div className="score-sheet-round-step-number">{round}</div>
                  <div className="score-sheet-round-step-meta">{rewardLabel ?? " "}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="score-sheet-resource-lanes">
          <ResourceTrack
            label="Reroll" title="重投" accent="reroll" token="R"
            available={player.sheet.resources.rerolls}
            gained={player.sheet.resourceTracks.rerolls.gained}
            spent={player.sheet.resourceTracks.rerolls.spent}
          />
          <ResourceTrack
            label="Plus One" title="+1" accent="plus" token="+1"
            available={player.sheet.resources.extraDice}
            gained={player.sheet.resourceTracks.extraDice.gained}
            spent={player.sheet.resourceTracks.extraDice.spent}
          />
        </div>
      </div>
    </header>
  );
}
