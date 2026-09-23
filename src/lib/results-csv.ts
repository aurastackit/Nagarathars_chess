export type ResultCsvRow = {
  round: number;
  board: number | null;
  whiteEmail: string;
  blackEmail: string | null; // null = bye
  result: "1-0" | "0-1" | "0.5-0.5" | "BYE";
};

const VALID_RESULTS = new Set(["1-0", "0-1", "0.5-0.5", "1/2-1/2", "BYE"]);

function normalizeResult(raw: string): "1-0" | "0-1" | "0.5-0.5" | "BYE" {
  const v = raw.trim();
  if (v === "1/2-1/2") return "0.5-0.5";
  return v as "1-0" | "0-1" | "0.5-0.5" | "BYE";
}

/**
 * Parses the round-results CSV: `round,board,white_email,black_email,result`
 * (header row required, `board` and `black_email` may be blank — blank
 * black_email means a bye, which requires result "BYE").
 */
export function parseResultsCsv(text: string): { rows: ResultCsvRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  const rows: ResultCsvRow[] = [];

  if (lines.length === 0) return { rows, errors: ["Empty file"] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const expected = ["round", "board", "white_email", "black_email", "result"];
  if (expected.some((c) => !header.includes(c))) {
    return { rows, errors: [`Header must include: ${expected.join(", ")}`] };
  }
  const idx = Object.fromEntries(expected.map((c) => [c, header.indexOf(c)]));

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cols = lines[i].split(",").map((c) => c.trim());

    const roundRaw = cols[idx.round];
    const boardRaw = cols[idx.board];
    const whiteEmail = cols[idx.white_email];
    const blackEmailRaw = cols[idx.black_email];
    const resultRaw = cols[idx.result];

    const round = Number(roundRaw);
    if (!roundRaw || !Number.isInteger(round) || round < 1) {
      errors.push(`Line ${lineNo}: invalid round "${roundRaw}"`);
      continue;
    }
    if (!whiteEmail) {
      errors.push(`Line ${lineNo}: white_email is required`);
      continue;
    }
    if (!resultRaw || !VALID_RESULTS.has(resultRaw.trim())) {
      errors.push(`Line ${lineNo}: result must be one of 1-0, 0-1, 0.5-0.5, BYE (got "${resultRaw}")`);
      continue;
    }
    const result = normalizeResult(resultRaw);
    const blackEmail = blackEmailRaw ? blackEmailRaw : null;
    if (result === "BYE" && blackEmail) {
      errors.push(`Line ${lineNo}: result BYE must not have a black_email`);
      continue;
    }
    if (result !== "BYE" && !blackEmail) {
      errors.push(`Line ${lineNo}: black_email is required unless result is BYE`);
      continue;
    }

    rows.push({
      round,
      board: boardRaw ? Number(boardRaw) : null,
      whiteEmail: whiteEmail.toLowerCase(),
      blackEmail: blackEmail ? blackEmail.toLowerCase() : null,
      result,
    });
  }

  return { rows, errors };
}
