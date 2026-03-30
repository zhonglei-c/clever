import { Link, useParams } from "react-router-dom";

export function RoomPage() {
  const { roomId } = useParams();

  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Room</p>
        <h1>房间 {roomId}</h1>
        <p className="lead">
          后续这里会放房间信息、座位区、玩家列表、准备状态和房主控制。
        </p>
        <div className="placeholder-grid">
          <article className="placeholder-card">
            <h2>玩家区</h2>
            <p>展示昵称、座位、是否准备、房主标记、在线状态。</p>
          </article>
          <article className="placeholder-card">
            <h2>邀请区</h2>
            <p>展示房间码、邀请链接、复制按钮和分享提示。</p>
          </article>
          <article className="placeholder-card">
            <h2>控制区</h2>
            <p>房主开始、返回首页、后续可加重新开局。</p>
          </article>
        </div>
        <div className="link-row">
          <Link to="/">返回首页</Link>
          <Link to={`/game/${roomId}`}>跳到对局骨架</Link>
        </div>
      </section>
    </main>
  );
}
