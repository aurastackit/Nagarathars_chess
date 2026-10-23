"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import type { TournamentFormState } from "@/lib/tournament-form";
import { PosterField } from "@/components/admin/poster-field";

const SELECT_CLASS =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal";

/**
 * The tournament create/edit form. Validation runs in the server action; on an
 * error the action returns every field's message plus what was typed, so
 * nothing is lost and each problem shows under its own field.
 */
export function TournamentForm({
  action,
  initial,
  mode,
}: {
  action: (state: TournamentFormState, formData: FormData) => Promise<TournamentFormState>;
  /** Current values (edit) or defaults (create), as form strings. */
  initial: Record<string, string>;
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  // "Saved" toast: shown for each new successful save, hidden again after a few seconds.
  const saves = state?.saves ?? 0;
  const [dismissedSave, setDismissedSave] = useState(0);
  useEffect(() => {
    if (!saves) return;
    const timer = setTimeout(() => setDismissedSave(saves), 3000);
    return () => clearTimeout(timer);
  }, [saves]);
  const showSaved = saves > 0 && dismissedSave !== saves;
  const errors = state?.errors ?? {};
  // After an error show what was submitted; after a save (or on first render) the saved values.
  const values = state?.values ?? initial;
  const v = (name: string) => values[name] ?? "";
  const errorCount = Object.keys(errors).length;

  const field = (name: string, label: string, input: ReactNode, hint?: string) => (
    <div>
      <Label htmlFor={name}>{label}</Label>
      {input}
      {errors[name] ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {errors[name]}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>
      )}
    </div>
  );
  // Shared props for a text-like input: name/id, value to restore, and error wiring.
  const p = (name: string) => ({
    id: name,
    name,
    defaultValue: v(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: errors[name] ? "!border-red-400" : undefined,
  });

  return (
    <>
      {showSaved && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 rounded-md bg-charcoal px-4 py-3 text-sm font-semibold text-background shadow-lg"
        >
          ✓ Saved
        </div>
      )}
      {/* key: remount after each response so the restored values become the inputs' defaults. */}
      <form key={JSON.stringify(state)} action={formAction} className="space-y-4" noValidate>
        {state?.notice && (
          <div
            role="status"
            className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {state.notice}
          </div>
        )}
        {errorCount > 0 && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Please fix{" "}
            {errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`}{" "}
            below.
          </div>
        )}
        {field("title", "Title", <Input {...p("title")} required />)}
        {field("description", "Description", <Textarea {...p("description")} rows={4} required />)}
        <div className={`grid gap-4 ${mode === "edit" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {field(
            "category",
            "Category",
            <Input {...p("category")} placeholder="e.g. Open, U-15, School" required />
          )}
          {field(
            "format",
            "Format",
            <select {...p("format")} className={SELECT_CLASS}>
              <option value="classical">Classical</option>
              <option value="rapid">Rapid</option>
              <option value="blitz">Blitz</option>
            </select>
          )}
          {mode === "edit" &&
            field(
              "status",
              "Status",
              <select {...p("status")} className={SELECT_CLASS}>
                <option value="draft">Draft</option>
                <option value="unlisted">Unlisted (test — direct link only)</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
                <option value="completed">Completed</option>
              </select>,
              "Only “Published” tournaments appear on the public site. “Unlisted” works only by its direct link — for testing."
            )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            "startDate",
            "Start date",
            <Input {...p("startDate")} type="date" required />,
            mode === "edit"
              ? "Changing it emails every player holding a seat, asking them to confirm the new date or withdraw."
              : undefined
          )}
          {field("endDate", "End date", <Input {...p("endDate")} type="date" required />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("venue", "Venue", <Input {...p("venue")} required />)}
          {field("city", "City", <Input {...p("city")} required />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {field(
            "entryFee",
            "Entry fee (₹, 0 = free)",
            <Input {...p("entryFee")} type="number" min={0} />
          )}
          {field(
            "maxParticipants",
            "Max participants",
            <Input {...p("maxParticipants")} type="number" min={1} placeholder="Optional" />
          )}
          {field(
            "registrationDeadline",
            "Registration deadline",
            <Input {...p("registrationDeadline")} type="date" required />,
            "Must be before the start date. Closes at 11:59 pm IST that day."
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            "posterImageUrl",
            "Poster image",
            <PosterField
              defaultValue={v("posterImageUrl")}
              invalid={Boolean(errors.posterImageUrl)}
            />,
            "Upload a JPG, PNG or WEBP (resized automatically), or paste an image URL."
          )}
          {field(
            "brochurePdfUrl",
            "Brochure PDF URL",
            <Input {...p("brochurePdfUrl")} placeholder="Optional" />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            "timeControl",
            "Time control",
            <Input {...p("timeControl")} placeholder="e.g. 90 min + 30 sec increment" />
          )}
          {field(
            "rounds",
            "Rounds",
            <Input {...p("rounds")} type="number" min={1} placeholder="Optional" />
          )}
        </div>
        {field(
          "prizeStructure",
          "Prize structure",
          <Textarea
            {...p("prizeStructure")}
            rows={3}
            placeholder={"1st place — ₹5,000\n2nd place — ₹3,000\nBest U-11 — ₹1,000"}
          />
        )}
        {field(
          "rulesText",
          "Rules",
          <Textarea
            {...p("rulesText")}
            rows={4}
            placeholder={
              "Eligibility|Open to all age categories, no FIDE rating required.\nTiebreaks|Standard FIDE tiebreak rules apply."
            }
          />,
          "One rule per line, formatted as Title|Details."
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create tournament" : "Save changes"}
        </Button>
      </form>
    </>
  );
}
