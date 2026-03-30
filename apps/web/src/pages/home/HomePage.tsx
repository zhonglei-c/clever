import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Clever Browser Game</p>
        <h1>《快可聪明》多人浏览器版</h1>
        <p className="lead">
          当前是项目骨架阶段。后续这里会接入昵称入桌、创建房间、房间码加入和规则入口。
        </p>
        <div className="link-row">
          <Link to="/room/demo-room">查看房间页骨架</Link>
          <Link to="/game/demo-room">查看对局页骨架</Link>
          <Link to="/rules">查看规则页骨架</Link>
        </div>
      </section>
    </main>
  );
}
