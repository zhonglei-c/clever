import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { rulesCopy, type RulesLanguage } from "./rules-content";

const languageKey = "clever-rules-language";

function isLanguage(value: string | null): value is RulesLanguage {
  return value === "zh" || value === "en";
}

export function RulesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<RulesLanguage>(() => {
    const fromUrl = searchParams.get("lang");
    if (isLanguage(fromUrl)) {
      return fromUrl;
    }

    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(languageKey);
      if (isLanguage(saved)) {
        return saved;
      }
    }

    return "zh";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(languageKey, language);
    }

    const next = new URLSearchParams(searchParams);
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  }, [language, searchParams, setSearchParams]);

  const copy = rulesCopy[language];

  return (
    <main className="page-shell">
      <section className="panel rules-shell">
        <div className="rules-hero">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="lead">{copy.subtitle}</p>
          </div>
          <div className="rules-toolbar">
            <div className="language-toggle" role="tablist" aria-label="Rule language switch">
              <button
                className={language === "zh" ? "language-button language-button-active" : "language-button"}
                onClick={() => setLanguage("zh")}
              >
                中文
              </button>
              <button
                className={language === "en" ? "language-button language-button-active" : "language-button"}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
            </div>
            <div className="link-row">
              <Link to="/">返回首页</Link>
            </div>
          </div>
        </div>

        <div className="rules-facts">
          {copy.quickFacts.map((fact) => (
            <article key={fact.label} className="rules-fact">
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </article>
          ))}
        </div>

        <nav className="rules-nav">
          {copy.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="rules-nav-link">
              {section.title}
            </a>
          ))}
        </nav>

        <div className="rules-sections">
          {copy.sections.map((section) => (
            <section key={section.id} id={section.id} className="rules-section">
              <h2>{section.title}</h2>
              {section.intro ? <p className="lead compact-lead">{section.intro}</p> : null}
              {section.steps ? (
                <ol className="rules-steps">
                  {section.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : null}
              {section.bullets ? (
                <ul className="rule-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section className="rules-note">
          <h2>{copy.noteTitle}</h2>
          <ul className="rule-list">
            {copy.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
