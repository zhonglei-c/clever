import { SheetCrossGlyph } from "./SheetCrossGlyph";

interface RewardGlyphProps {
  token: string;
}

export function RewardGlyph({ token }: RewardGlyphProps) {
  if (token === "X") {
    return <SheetCrossGlyph className="sheet-reward-glyph-svg" />;
  }

  if (token === "R") {
    return (
      <svg viewBox="0 0 24 24" className="sheet-reward-glyph-svg" aria-hidden="true">
        <path d="M18 9a7 7 0 1 0 1.1 7.2" />
        <path d="M14.5 4H20v5.5" />
      </svg>
    );
  }

  if (token === "FOX") {
    return (
      <svg viewBox="0 0 24 24" className="sheet-reward-glyph-svg sheet-reward-glyph-fox" aria-hidden="true">
        <path d="M6 9 3.5 4 9 6.5 12 5.5 15 6.5 20.5 4 18 9l-.9 6.6L12 20l-5.1-4.4Z" />
        <circle cx="9.25" cy="11.3" r="1.05" />
        <circle cx="14.75" cy="11.3" r="1.05" />
      </svg>
    );
  }

  return <span className="sheet-reward-glyph-text">{token}</span>;
}
