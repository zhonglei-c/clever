import { useState } from "react";
import { useGameState } from "../../context/GameStateContext";
import { TurnControls } from "./TurnControls";
import { OpponentSheetTab } from "./OpponentSheetTab";
import styles from "./SideRail.module.css";

type TabId = "my-turn" | string;

export function SideRail() {
  const game = useGameState();
  const [activeTab, setActiveTab] = useState<TabId>("my-turn");

  // Ensure active tab is still valid
  const opponentIds = (game.gameState?.players ?? [])
    .filter((p) => p.playerId !== game.currentPlayerId)
    .map((p) => p.playerId);

  const validTab =
    activeTab === "my-turn" || opponentIds.includes(activeTab) ? activeTab : "my-turn";

  return (
    <section className={styles.sideRail}>
      <nav className={styles.tabBar}>
        <button
          className={`${styles.tab} ${validTab === "my-turn" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("my-turn")}
        >
          My Turn
        </button>
        {opponentIds.map((playerId) => {
          const player = game.gameState?.players.find((p) => p.playerId === playerId);
          const roomPlayer = game.room?.players.find((p) => p.id === playerId);
          const label = roomPlayer?.nickname ?? playerId;
          return (
            <button
              key={playerId}
              className={`${styles.tab} ${validTab === playerId ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(playerId)}
            >
              {label}
            </button>
          );
        })}
      </nav>

      <div className={styles.tabContent}>
        {validTab === "my-turn" ? (
          <TurnControls />
        ) : (
          (() => {
            const opponent = game.gameState?.players.find((p) => p.playerId === validTab);
            const roomPlayer = game.room?.players.find((p) => p.id === validTab);
            if (!opponent) return null;
            return (
              <OpponentSheetTab
                player={opponent}
                nickname={roomPlayer?.nickname ?? validTab}
                room={game.room}
              />
            );
          })()
        )}
      </div>
    </section>
  );
}
