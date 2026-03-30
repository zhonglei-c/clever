import { Link } from "react-router-dom";

export function RulesPage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Rules</p>
        <h1>规则页骨架</h1>
        <p className="lead">
          后续这里会整理简化版玩法说明、区域说明、名词解释和新手引导内容。
        </p>
        <ul className="rule-list">
          <li>主动玩家掷骰并选择骰子填入对应区域。</li>
          <li>比所选骰值更小的骰子进入银盘，供其他玩家拿取。</li>
          <li>五个颜色区域使用不同录入与计分规则。</li>
          <li>奖励链即时触发，终局后进行总分结算。</li>
        </ul>
        <div className="link-row">
          <Link to="/">返回首页</Link>
        </div>
      </section>
    </main>
  );
}
