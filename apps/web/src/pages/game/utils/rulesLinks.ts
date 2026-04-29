export function getPreferredRulesLanguage() {
  if (typeof window === "undefined") {
    return "zh";
  }

  const saved = window.localStorage.getItem("clever-rules-language");
  return saved === "en" ? "en" : "zh";
}

export function getRulesHref(language: string, sectionId?: string) {
  const hash = sectionId ? `#${sectionId}` : "";
  return `/rules?lang=${language}${hash}`;
}
