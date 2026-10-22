import { tournamentSchema, type TournamentInput } from "@/lib/validations";

/** What the tournament form's server actions hand back to the form. */
export type TournamentFormState = {
  /** First error per field name. */
  errors?: Record<string, string>;
  /** What was submitted, so the form can show it again after an error. */
  values?: Record<string, string>;
  /** How many times the edit form has saved successfully — changes on every save. */
  saves?: number;
  /** Shown after a save that did more than save (e.g. players emailed about a new date). */
  notice?: string;
} | null;

export const TOURNAMENT_STATUSES = ["draft", "published", "closed", "completed"] as const;

export type TournamentStatusValue = (typeof TOURNAMENT_STATUSES)[number];

/**
 * Parses the tournament form; on failure returns every field's error plus the
 * submitted values. The edit form also sends `status`, checked when `withStatus`.
 */
export function parseTournamentForm(
  formData: FormData,
  { withStatus = false } = {}
):
  | { ok: true; data: TournamentInput; status: TournamentStatusValue }
  | { ok: false; state: TournamentFormState } {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) values[k] = v;
  }

  const parsed = tournamentSchema.safeParse({
    title: values.title,
    description: values.description,
    category: values.category,
    format: values.format,
    startDate: values.startDate,
    endDate: values.endDate,
    venue: values.venue,
    city: values.city,
    entryFee: values.entryFee || 0,
    maxParticipants: values.maxParticipants || undefined,
    registrationDeadline: values.registrationDeadline,
    posterImageUrl: values.posterImageUrl,
    brochurePdfUrl: values.brochurePdfUrl,
    timeControl: values.timeControl,
    rounds: values.rounds || undefined,
    prizeStructure: values.prizeStructure,
    rulesText: values.rulesText,
  });

  const status = (TOURNAMENT_STATUSES as readonly string[]).includes(values.status)
    ? (values.status as TournamentStatusValue)
    : null;
  if (parsed.success && (status || !withStatus)) {
    return { ok: true, data: parsed.data, status: status ?? "draft" };
  }

  const errors: Record<string, string> = {};
  for (const issue of parsed.success ? [] : parsed.error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  if (withStatus && !status) errors.status = "Choose a status";
  return { ok: false, state: { errors, values } };
}
