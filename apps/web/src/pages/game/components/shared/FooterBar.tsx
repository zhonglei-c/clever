import { Link } from "react-router-dom";
import { getRulesHref } from "../../utils/rulesLinks";

interface FooterBarProps {
  roomId: string;
  rulesLanguage: string;
}

export function FooterBar({ roomId, rulesLanguage }: FooterBarProps) {
  return (
    <section className="panel game-footer-bar">
      <div className="link-row game-footer-links">
        <Link to={`/room/${roomId}`}>返回房间页</Link>
        <Link to="/">返回首页</Link>
      </div>
      <div className="game-footer-meta">
        <div className="game-footer-chip">
          <span className="status-label">房间号</span>
          <strong>{roomId}</strong>
        </div>
        <div className="game-footer-chip">
          <span className="status-label">规则书</span>
          <a
            className="inline-action-link inline-action-link-small"
            href={getRulesHref(rulesLanguage)}
            target="_blank"
            rel="noreferrer"
          >
            快速打开
          </a>
        </div>
      </div>
    </section>
  );
}
