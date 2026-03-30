import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { RoomErrorEvent, RoomJoinedEvent } from "@clever/shared";

import { ensureRealtimeConnection } from "../../services/realtime";
import { saveRoomSession, setLastNickname, getLastNickname } from "../../services/room-session";

export function HomePage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(() => getLastNickname() || "Player");
  const [roomName, setRoomName] = useState("轻巧聪明房");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(null);

  function waitForRoomJoined(action: () => void) {
    return new Promise<RoomJoinedEvent>((resolve, reject) => {
      const socket = ensureRealtimeConnection();

      const handleJoined = (payload: RoomJoinedEvent) => {
        cleanup();
        resolve(payload);
      };

      const handleError = (payload: RoomErrorEvent) => {
        cleanup();
        reject(new Error(payload.message));
      };

      const cleanup = () => {
        socket.off("room:joined", handleJoined);
        socket.off("room:error", handleError);
      };

      socket.on("room:joined", handleJoined);
      socket.on("room:error", handleError);
      action();
    });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPendingAction("create");

    try {
      const socket = ensureRealtimeConnection();
      const payload = await waitForRoomJoined(() => {
        socket.emit("room:create", {
          nickname,
          roomName,
          maxPlayers
        });
      });

      saveRoomSession({
        roomId: payload.room.id,
        playerId: payload.player.id,
        nickname: payload.player.nickname
      });
      setLastNickname(payload.player.nickname);
      navigate(`/room/${payload.room.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建房间失败。");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPendingAction("join");

    try {
      const socket = ensureRealtimeConnection();
      const payload = await waitForRoomJoined(() => {
        socket.emit("room:join", {
          roomId: joinRoomId.trim().toUpperCase(),
          nickname
        });
      });

      saveRoomSession({
        roomId: payload.room.id,
        playerId: payload.player.id,
        nickname: payload.player.nickname
      });
      setLastNickname(payload.player.nickname);
      navigate(`/room/${payload.room.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "加入房间失败。");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Clever Browser Game</p>
        <h1>《快可聪明》多人浏览器版</h1>
        <p className="lead">
          现在已经接上最小房间闭环。你可以直接创建房间、输入房间码加入，并在房间页里实时同步玩家和准备状态。
        </p>
        <div className="home-grid">
          <form className="panel subpanel form-stack" onSubmit={handleCreate}>
            <h2>创建房间</h2>
            <label className="field">
              <span>昵称</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} />
            </label>
            <label className="field">
              <span>房间名</span>
              <input value={roomName} onChange={(event) => setRoomName(event.target.value)} maxLength={40} />
            </label>
            <label className="field">
              <span>人数上限</span>
              <select
                value={maxPlayers}
                onChange={(event) => setMaxPlayers(Number(event.target.value))}
              >
                {Array.from({ length: 6 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value} 人
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" disabled={pendingAction !== null}>
              {pendingAction === "create" ? "创建中..." : "创建并进入房间"}
            </button>
          </form>

          <form className="panel subpanel form-stack" onSubmit={handleJoin}>
            <h2>加入房间</h2>
            <label className="field">
              <span>昵称</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} />
            </label>
            <label className="field">
              <span>房间码</span>
              <input
                value={joinRoomId}
                onChange={(event) => setJoinRoomId(event.target.value.toUpperCase())}
                placeholder="例如 ABC123"
                maxLength={6}
              />
            </label>
            <button className="primary-button" disabled={pendingAction !== null}>
              {pendingAction === "join" ? "加入中..." : "按房间码加入"}
            </button>
            <p className="lead compact-lead">
              当前阶段优先做私人房间体验，公开匹配和账号系统仍不在首发范围内。
            </p>
          </form>
        </div>
        {error ? <p className="error-banner">{error}</p> : null}
        <div className="link-row">
          <Link to="/room/demo-room">查看房间页</Link>
          <Link to="/game/demo-room">查看对局骨架</Link>
          <Link to="/rules">查看规则页骨架</Link>
        </div>
      </section>
    </main>
  );
}
