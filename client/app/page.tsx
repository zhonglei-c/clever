'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as Colyseus from "colyseus.js";
import { YellowArea, BlueArea, GreenArea, OrangeArea, PurpleArea } from '../components/ScoringAreas';

const ENDPOINT = process.env.NEXT_PUBLIC_SERVER_URL ?? "ws://localhost:2567";

const STORAGE_ROOM_ID  = 'clever_room_id';
const STORAGE_SESSION  = 'clever_session_id';
const STORAGE_NAME     = 'clever_player_name';

export default function Home() {
  const clientRef = useRef<Colyseus.Client | null>(null);
  const [room, setRoom] = useState<Colyseus.Room | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [playerName, setPlayerName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  // 页面加载时尝试自动重连
  useEffect(() => {
    const roomId   = localStorage.getItem(STORAGE_ROOM_ID);
    const session  = localStorage.getItem(STORAGE_SESSION);
    const name     = localStorage.getItem(STORAGE_NAME);
    if (roomId && session) {
      if (name) setPlayerName(name);
      tryReconnect(roomId, session);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupRoom = (joinedRoom: Colyseus.Room) => {
    setRoom(joinedRoom);
    setIsJoined(true);
    setConnectionLost(false);
    setIsReconnecting(false);

    // 持久化重连信息
    localStorage.setItem(STORAGE_ROOM_ID, joinedRoom.id);
    localStorage.setItem(STORAGE_SESSION, joinedRoom.sessionId);

    joinedRoom.onStateChange((state: any) => {
      setGameState(state.toJSON());
    });
    if (joinedRoom.state) {
      setGameState((joinedRoom.state as any).toJSON());
    }

    // 断线检测：自动尝试重连
    joinedRoom.onLeave(() => {
      setConnectionLost(true);
      const roomId  = localStorage.getItem(STORAGE_ROOM_ID);
      const session = localStorage.getItem(STORAGE_SESSION);
      if (roomId && session) {
        tryReconnect(roomId, session);
      }
    });
  };

  const tryReconnect = async (roomId: string, sessionId: string) => {
    setIsReconnecting(true);
    const client = new Colyseus.Client(ENDPOINT);
    clientRef.current = client;
    try {
      const joinedRoom = await (client as any).reconnect(roomId, sessionId) as Colyseus.Room;
      setupRoom(joinedRoom);
    } catch {
      // 重连失败，清除存储，回到大厅
      localStorage.removeItem(STORAGE_ROOM_ID);
      localStorage.removeItem(STORAGE_SESSION);
      setIsReconnecting(false);
      setConnectionLost(false);
      setIsJoined(false);
    }
  };

  const joinGame = async () => {
    if (!playerName.trim()) return;
    const client = new Colyseus.Client(ENDPOINT);
    clientRef.current = client;
    try {
      localStorage.setItem(STORAGE_NAME, playerName.trim());
      const joinedRoom = await client.joinOrCreate("clever", { name: playerName.trim() });
      setupRoom(joinedRoom);
    } catch (e) {
      console.error("Join error:", e);
      setErrorMsg("Connection failed: Is the server running?");
    }
  };

  const myPlayer = useMemo(() => {
    if (!gameState || !room) return null;
    return gameState.players?.[room.sessionId] || null;
  }, [gameState, room]);

  const activePlayer = useMemo(() => {
    if (!gameState) return null;
    const ids = Object.keys(gameState.players || {});
    const activeId = ids[gameState.activePlayerIndex];
    return gameState.players?.[activeId] || null;
  }, [gameState]);

  const isActiveTurn   = !!(myPlayer && activePlayer && myPlayer.sessionId === activePlayer.sessionId);
  const isPassivePhase = !isActiveTurn && gameState?.phase === 'PASSIVE_CHOOSING';
  // 被动阶段：是否已选定骰子，等待点击格子
  const passiveDieSelected = isPassivePhase && !!myPlayer?.pendingPassiveDieId;
  // 被动阶段：已选的骰子对象（用于 UI 高亮）
  const myPendingPassiveDie = useMemo(() => {
    if (!passiveDieSelected || !myPlayer?.pendingPassiveDieId || !gameState) return null;
    return [...(gameState.silverPlatter || []), ...(gameState.selected || [])].find(
      (d: any) => d.id === myPlayer.pendingPassiveDieId
    ) || null;
  }, [passiveDieSelected, myPlayer?.pendingPassiveDieId, gameState]);

  // 计分区域点击处理（统一入口）
  const handleMark = (area: string, extra?: { row?: number; col?: number; value?: number }) => {
    if (passiveDieSelected) {
      room?.send("markPassive", { area, ...extra });
    } else if (gameState?.phase === 'MARKING' || gameState?.phase === 'BONUS_MARKING') {
      room?.send("mark", { area, ...extra, isBonus: gameState.phase === 'BONUS_MARKING' });
    }
  };
  const isSheetClickable = isActiveTurn
    ? (gameState?.phase === 'MARKING' || gameState?.phase === 'BONUS_MARKING')
    : passiveDieSelected;

  // ── 重连中覆盖层 ────────────────────────────────────────────────
  if (isReconnecting) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">{connectionLost ? "Connection lost, reconnecting..." : "Reconnecting to game..."}</p>
        </div>
      </main>
    );
  }

  // ── 大厅 ────────────────────────────────────────────────────────
  if (!isJoined) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-900 p-8 text-white">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Clever Online</h1>
          <div className="space-y-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinGame()}
              placeholder="Enter your name..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={joinGame} className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl transition-all shadow-lg">
              Join Game
            </button>
            {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
          </div>
        </div>
      </main>
    );
  }

  if (!gameState) return <div className="p-12 text-center text-slate-500">Connecting...</div>;

  return (
    <main className="p-8 max-w-6xl mx-auto text-white">
      {/* 连接丢失提示条 */}
      {connectionLost && (
        <div className="mb-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm text-center">
          Connection lost — attempting to reconnect...
        </div>
      )}

      <h1 className="text-4xl font-bold mb-8">Clever Online</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          {/* Game Info */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-300">Game Info</h2>
            <div className="space-y-2 text-sm font-mono">
              <p className="flex justify-between"><span className="text-slate-500">Room:</span> <span className="text-blue-400">{gameState.roomID}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Round:</span> <span className="text-blue-400 font-bold">{gameState.round} / {gameState.maxRounds}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Phase:</span> <span className="text-blue-400 uppercase font-bold">{gameState.phase}</span></p>
              {gameState.phase !== 'WAITING' && (
                <p className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span className="text-slate-500">Active:</span>
                  <span className="text-yellow-400 font-bold">{activePlayer?.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Players List */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-300">Players</h2>
            <ul className="space-y-2">
              {Object.values(gameState.players || {}).map((p: any) => (
                <li key={p.sessionId} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                  <span className={p.sessionId === room?.sessionId ? "text-blue-400 font-bold" : "text-slate-400"}>
                    {/* 连接状态指示点 */}
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${p.isConnected ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`} />
                    {p.name} {p.sessionId === activePlayer?.sessionId ? "🎲" : ""}
                    {!p.isConnected && <span className="text-xs text-red-400 ml-1">(offline)</span>}
                  </span>
                  <div className="flex gap-2">
                    {p.bonuses?.rerolls > 0 && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded">R:{p.bonuses.rerolls}</span>}
                    {p.bonuses?.plusOnes > 0 && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">+:{p.bonuses.plusOnes}</span>}
                    <span className="text-green-400 font-mono text-xs font-bold">{p.totalScore} pts</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="space-y-3">
              {gameState.phase === 'WAITING' && (
                <button className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold shadow-lg" onClick={() => room?.send("start")}>
                  START GAME
                </button>
              )}

              {isActiveTurn && gameState.phase === 'ROLLING' && (
                <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold shadow-lg animate-pulse" onClick={() => room?.send("roll")}>
                  ROLL DICE ({gameState.remainingRolls})
                </button>
              )}

              {isActiveTurn && gameState.phase === 'SELECTING' && myPlayer?.bonuses?.rerolls > 0 && (
                <button className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold shadow-lg text-sm" onClick={() => room?.send("reroll")}>
                  ↺ USE REROLL ({myPlayer.bonuses.rerolls})
                </button>
              )}

              {/* 被动阶段 UI */}
              {isPassivePhase && !myPlayer?.passiveDone && (
                <div className="space-y-2">
                  {!passiveDieSelected ? (
                    <>
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center text-xs text-indigo-400 font-bold">
                        PASSIVE PHASE: Pick a die from the platter below
                      </div>
                      <button
                        className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-xl text-sm text-slate-400"
                        onClick={() => room?.send("selectPassiveDie", { dieId: null })}
                      >
                        Skip (no valid cell)
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center text-xs text-yellow-400 font-bold">
                        Die selected: <span className="uppercase">{myPendingPassiveDie?.color}</span> [{myPendingPassiveDie?.value}]
                        — now click a cell on your sheet
                      </div>
                      <button
                        className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-xl text-sm text-slate-400"
                        onClick={() => room?.send("selectPassiveDie", { dieId: null })}
                      >
                        Cancel &amp; Skip
                      </button>
                    </>
                  )}
                </div>
              )}

              {isPassivePhase && myPlayer?.passiveDone && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-center text-xs text-green-400 font-bold">
                  Waiting for other players...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Dice Area */}
          <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Dice Pool</span>
                <div className="flex flex-wrap gap-4 min-h-[64px] p-3 bg-black/20 rounded-xl">
                  {gameState.pool?.map((die: any) => (
                    <button
                      key={die.id}
                      disabled={!isActiveTurn || gameState.phase !== 'SELECTING'}
                      onClick={() => room?.send("selectDie", die.id)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-2xl transition-all ${getDieColorClass(die.color)} ${isActiveTurn && gameState.phase === 'SELECTING' ? 'hover:-translate-y-2 ring-4 ring-white/10' : 'opacity-40 grayscale'}`}
                    >
                      {die.value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Active Slots</span>
                  <div className="flex gap-3 min-h-[64px] p-2 bg-black/10 rounded-xl">
                    {gameState.selected?.map((die: any) => (
                      <div key={die.id} className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${getDieColorClass(die.color)} shadow-lg`}>
                        {die.value}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Silver Platter</span>
                  <div className="flex gap-2 min-h-[64px] p-2 bg-black/10 rounded-xl overflow-x-auto">
                    {gameState.silverPlatter?.map((die: any) => {
                      const isSelected = die.id === myPlayer?.pendingPassiveDieId;
                      const canPick = isPassivePhase && !myPlayer?.passiveDone && !passiveDieSelected;
                      return (
                        <button
                          key={die.id}
                          disabled={!canPick}
                          onClick={() => room?.send("selectPassiveDie", { dieId: die.id })}
                          className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold shadow-md transition-transform ${getDieColorClass(die.color)} ${canPick ? 'hover:scale-110 ring-2 ring-white/20' : isSelected ? 'ring-4 ring-yellow-400' : 'opacity-40 grayscale'}`}
                        >
                          {die.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Scoring Sheet */}
          {myPlayer && (
            <div className={`space-y-6 transition-all duration-500 ${isSheetClickable ? 'ring-4 ring-blue-500/40 p-6 rounded-3xl bg-blue-500/5' : 'opacity-80'}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">My Sheet</h3>
                {myPlayer.pendingBonuses?.length > 0 && (
                  <div className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-black rounded-lg animate-bounce">
                    BONUS: {myPlayer.pendingBonuses[0].type.replace('_', ' ').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <YellowArea data={myPlayer.sheet.yellow} onMark={(row, col) => handleMark('yellow', { row, col })} />
                <BlueArea   data={myPlayer.sheet.blue}   onMark={(val) => handleMark('blue',   { value: val })} />
              </div>
              <div className="space-y-4">
                <GreenArea  data={myPlayer.sheet.green}  onMark={() => handleMark('green')} />
                <OrangeArea data={myPlayer.sheet.orange} onMark={() => handleMark('orange')} />
                <PurpleArea data={myPlayer.sheet.purple} onMark={() => handleMark('purple')} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function getDieColorClass(color: string) {
  switch (color) {
    case 'yellow': return 'bg-yellow-400 text-slate-900';
    case 'blue':   return 'bg-blue-500 text-white';
    case 'green':  return 'bg-green-500 text-white';
    case 'orange': return 'bg-orange-500 text-white';
    case 'purple': return 'bg-purple-600 text-white';
    case 'white':  return 'bg-white text-slate-900';
    default:       return 'bg-slate-400 text-white';
  }
}
