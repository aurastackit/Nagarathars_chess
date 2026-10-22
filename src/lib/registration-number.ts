/**
 * Registration numbers: NCC{YY}-{CAT}-{NNNN}, e.g. NCC26-U11-0042.
 *   YY   — the tournament's start year in India time
 *   CAT  — the player's age category at submission (it isn't renumbered later)
 *   NNNN — a per-tournament sequence across all categories, from Tournament.registrationSeq
 */
export const CATEGORY_CODE: Record<string, string> = {
  under_11: "U11",
  "11_to_18": "U19",
  above_19: "A19",
};

/** The calendar year of `date` in India time. */
export function yearInIST(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" }).format(date)
  );
}

export function formatRegistrationNo(params: {
  startDate: Date;
  ageCategory: string | null | undefined;
  seq: number;
}) {
  const yy = String(yearInIST(params.startDate) % 100).padStart(2, "0");
  const cat = (params.ageCategory && CATEGORY_CODE[params.ageCategory]) || "GEN";
  // Past 9999 the number simply gets wider rather than wrapping.
  return `NCC${yy}-${cat}-${String(params.seq).padStart(4, "0")}`;
}

/**
 * Every query inside an interactive transaction is a round trip to the
 * database in Sydney; Prisma's default 5 s limit is too tight for the
 * registration transaction's five queries.
 */
export const TRANSACTION_TIMEOUTS = { maxWait: 10_000, timeout: 30_000 };

/** The slice of a Prisma transaction client this needs (so tests can pass a fake). */
export type RegistrationSeqClient = {
  tournament: {
    update(args: {
      where: { id: string };
      data: { registrationSeq: { increment: number } };
      select: { registrationSeq: true; startDate: true };
    }): Promise<{ registrationSeq: number; startDate: Date }>;
  };
};

/**
 * Takes the next number for a tournament. Call inside the transaction that
 * creates the registration: the increment is a single
 * `UPDATE … SET "registrationSeq" = "registrationSeq" + 1 RETURNING …`, which
 * locks the tournament row until the transaction ends, so concurrent
 * submissions queue up and can never get the same number (the unique index on
 * (tournamentId, registrationNo) is the backstop). If the transaction rolls
 * back, so does the increment — no gaps from failed submissions.
 */
export async function nextRegistrationNo(
  tx: RegistrationSeqClient,
  tournamentId: string,
  ageCategory: string | null | undefined
) {
  const { registrationSeq, startDate } = await tx.tournament.update({
    where: { id: tournamentId },
    data: { registrationSeq: { increment: 1 } },
    select: { registrationSeq: true, startDate: true },
  });
  return formatRegistrationNo({ startDate, ageCategory, seq: registrationSeq });
}
