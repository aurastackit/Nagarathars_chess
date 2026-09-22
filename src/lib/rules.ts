export type RuleSection = { title: string; body: string };

/**
 * Parses the admin-entered rules textarea into accordion sections. One rule
 * per line, formatted as `Title|Details`. Lines without a `|` fall back to a
 * generic numbered title so the field still degrades gracefully.
 */
export function parseRules(rulesText: string | null | undefined): RuleSection[] {
  if (!rulesText) return [];
  return rulesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const sep = line.indexOf("|");
      if (sep === -1) return { title: `Rule ${i + 1}`, body: line };
      return { title: line.slice(0, sep).trim(), body: line.slice(sep + 1).trim() };
    });
}
