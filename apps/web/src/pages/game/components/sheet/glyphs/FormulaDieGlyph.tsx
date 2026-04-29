interface FormulaDieGlyphProps {
  tone: "blue" | "white";
}

export function FormulaDieGlyph({ tone }: FormulaDieGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={`blue-formula-die-svg blue-formula-die-svg-${tone}`} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.2" />
      <circle cx="12" cy="12" r="2.15" />
    </svg>
  );
}
