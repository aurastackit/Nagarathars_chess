import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  AGE_CATEGORIES,
  ageAt,
  naturalAgeCategory,
  type AgeCategoryValue,
} from "@/lib/age-category";
import type { RegistrationWizardValues } from "@/lib/registration-schema";
import { SelectField, StepSection, TextField } from "@/components/registration-wizard/fields";

const RANK: Record<AgeCategoryValue, number> = { under_11: 0, "11_to_18": 1, above_19: 2 };

export function CategoryStep({ tournamentStartDate }: { tournamentStartDate: Date }) {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();

  // `watch` returns the raw <input type="date"> string, not the zod-coerced
  // Date (that transform only runs during resolver validation), so parse it
  // ourselves for this live preview.
  const dobRaw = watch("dob") as unknown as string | Date | undefined;
  const dobDate = dobRaw ? (dobRaw instanceof Date ? dobRaw : new Date(dobRaw)) : null;
  const age = dobDate && !isNaN(dobDate.getTime()) ? ageAt(dobDate, tournamentStartDate) : null;
  const natural = age !== null ? naturalAgeCategory(age) : null;

  // Pre-select the lowest eligible category whenever DOB changes, unless the
  // player already picked a valid (equal-or-higher) category — that's them
  // deliberately playing up, so don't clobber it.
  useEffect(() => {
    if (!natural) return;
    const current = getValues("ageCategory") as AgeCategoryValue | undefined;
    if (!current || RANK[current] < RANK[natural]) {
      setValue("ageCategory", natural, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  const eligibleCategories = AGE_CATEGORIES.filter(
    (c) => !natural || RANK[c.value] >= RANK[natural]
  );

  return (
    <StepSection title="Tournament category">
      <div className="sm:col-span-2">
        {age !== null && (
          <p className="mb-3 text-sm text-foreground/60">
            You&apos;ll be <strong>{age}</strong> at the tournament — lowest eligible category is{" "}
            <strong>{AGE_CATEGORIES.find((c) => c.value === natural)?.label}</strong>.
          </p>
        )}
        <SelectField
          label="Age category"
          registration={register("ageCategory")}
          error={errors.ageCategory}
          required
        >
          {eligibleCategories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <p className="mt-1 text-xs text-foreground/50">
          You can play up in an older category, but not down.
        </p>
      </div>
      <TextField
        label="Rating"
        type="number"
        min={0}
        registration={register("rating")}
        error={errors.rating}
        placeholder="Optional — local/state rating"
      />
      <TextField
        label="FIDE ID"
        registration={register("fideId")}
        error={errors.fideId}
        placeholder="Optional — leave blank if unrated"
      />
    </StepSection>
  );
}
