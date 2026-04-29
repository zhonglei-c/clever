interface SheetCrossGlyphProps {
  className: string;
}

export function SheetCrossGlyph({ className }: SheetCrossGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
