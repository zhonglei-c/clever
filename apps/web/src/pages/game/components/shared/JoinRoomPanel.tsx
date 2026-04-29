import { type FormEvent } from "react";
import { Link } from "react-router-dom";

interface JoinRoomPanelProps {
  normalizedRoomId: string;
  nickname: string;
  onNicknameChange: (value: string) => void;
  joining: boolean;
  socketConnected: boolean;
  error: string;
  onJoinRoom: (event: FormEvent<HTMLFormElement>) => void;
}

export function JoinRoomPanel({
  normalizedRoomId,
  nickname,
  onNicknameChange,
  joining,
  socketConnected,
  error,
  onJoinRoom,
}: JoinRoomPanelProps) {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Game</p>
        <h1>加入对局 {normalizedRoomId}</h1>
        <p className="lead">先恢复或加入你的房间身份，对局页才能拿到服务端实时状态。</p>
        <div className="status-row">
          <span className="status-pill">{socketConnected ? "实时已连接" : "实时未连接"}</span>
        </div>
        <form className="panel subpanel form-stack join-panel" onSubmit={onJoinRoom}>
          <label className="field">
            <span>昵称</span>
            <input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} maxLength={24} />
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
