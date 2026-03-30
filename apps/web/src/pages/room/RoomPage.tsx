import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import type {
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

export function RoomPage() {
  const { roomId } = useParams();
  const normalizedRoomId = roomId ?? "";
  const storedSession = normalizedRoomId ? getStoredRoomSession(normalizedRoomId) : null;
  const [nickname, setNickname] = useState(
    () => storedSession?.nickname ?? (getLastNickname() || "Player"),
  );
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(storedSession?.playerId ?? null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [socketConnected, setSocketConnected] = useState(() => getRealtimeSocket().connected);

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
      saveRoomSession({
        roomId: payload.room.id,
        playerId: payload.player.id,
        nickname: payload.player.nickname
      });
      setError("");
      setJoining(false);
    };

    const handleSync = (payload: SyncStateEvent) => {
      if (payload.room.id !== normalizedRoomId) {
        return;
      }

      setRoom(payload.room);
    };

    const handleError = (payload: RoomErrorEvent) => {
      setError(payload.message);
      setJoining(false);
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
  const isOwner = room?.ownerPlayerId === currentPlayerId;
  const canStart = Boolean(isOwner && room?.players.length && room.players.every((player) => player.ready));

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

  function handleToggleReady() {
    if (!room || !currentPlayer) {
      return;
    }

    const socket = ensureRealtimeConnection();
    socket.emit("room:ready", {
      roomId: room.id,
      ready: !currentPlayer.ready
    });
  }

  function handleStartGame() {
    if (!room) {
      return;
    }

    const socket = ensureRealtimeConnection();
    socket.emit("game:start", {
      roomId: room.id
    });
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Room</p>
        <h1>房间 {normalizedRoomId}</h1>
        <p className="lead">
          这一页已经接上实时房间状态。下一步可以继续把房间成功开局后的对局流和断线重连细节接深。
        </p>
        <div className="status-row">
          <span className="status-pill">{socketConnected ? "实时已连接" : "实时未连接"}</span>
          {room ? <span className="status-pill">状态：{room.status}</span> : null}
          {room ? <span className="status-pill">人数：{room.players.length} / {room.maxPlayers}</span> : null}
        </div>
        {!currentPlayer ? (
          <form className="panel subpanel form-stack join-panel" onSubmit={handleJoinRoom}>
            <h2>加入这个房间</h2>
            <label className="field">
              <span>昵称</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} />
            </label>
            <button className="primary-button" disabled={joining}>
              {joining ? "加入中..." : "加入房间"}
            </button>
          </form>
        ) : null}
        {error ? <p className="error-banner">{error}</p> : null}
        <div className="placeholder-grid">
          <article className="placeholder-card">
            <h2>玩家区</h2>
            {room ? (
              <ul className="player-list">
                {room.players.map((player) => (
                  <li key={player.id} className="player-card">
                    <strong>{player.nickname}</strong>
                    <span>座位 {player.seatIndex + 1}</span>
                    <span>{player.connected ? "在线" : "离线"}</span>
                    <span>{player.ready ? "已准备" : "未准备"}</span>
                    {player.id === room.ownerPlayerId ? <span>房主</span> : null}
                    {player.id === currentPlayerId ? <span>你</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>等待加入或等待房间状态同步。</p>
            )}
          </article>
          <article className="placeholder-card">
            <h2>邀请区</h2>
            <p>房间码：{normalizedRoomId}</p>
            <p>分享链接：{typeof window === "undefined" ? "" : `${window.location.origin}/room/${normalizedRoomId}`}</p>
            <p>当前阶段可以直接复制房间码，让其他人从首页加入。</p>
          </article>
          <article className="placeholder-card">
            <h2>控制区</h2>
            {currentPlayer ? (
              <div className="control-stack">
                <button className="primary-button" onClick={handleToggleReady} disabled={!room || room.status !== "lobby"}>
                  {currentPlayer.ready ? "取消准备" : "标记准备"}
                </button>
                {isOwner ? (
                  <button className="secondary-button" onClick={handleStartGame} disabled={!canStart || room?.status !== "lobby"}>
                    房主开始游戏
                  </button>
                ) : (
                  <p>等待房主开始游戏。</p>
                )}
              </div>
            ) : (
              <p>先加入房间，之后这里会显示准备和开始按钮。</p>
            )}
          </article>
        </div>
        <div className="link-row">
          <Link to="/">返回首页</Link>
          <Link to={`/game/${normalizedRoomId}`}>
            {room?.status === "in_game" ? "进入真实对局" : "跳到对局骨架"}
          </Link>
        </div>
      </section>
    </main>
  );
}
