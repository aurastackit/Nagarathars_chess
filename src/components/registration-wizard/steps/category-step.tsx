import { useFormContext } from "react-hook-form";
import { AGE_CATEGORIES, ageByYear, naturalAgeCategory } from "@/lib/age-category";
import { digitsOnly } from "@/lib/input-filters";
import type { RegistrationWizardValues } from "@/lib/registration-schema";
import { ReadOnlyField, StepSection, TextField } from "@/components/registration-wizard/fields";

export function CategoryStep({ tournamentStartDate }: { tournamentStartDate: Date }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();

  // The age category isn't chosen: it follows from the year of birth entered
  // in the Player step (and the server works it out again on submit).
  const birthYear = Number(watch("birthYear"));
  const age =
    Number.isInteger(birthYear) && birthYear > 0 ? ageByYear(birthYear, tournamentStartDate) : null;
  const category =
    age !== null ? AGE_CATEGORIES.find((c) => c.value === naturalAgeCategory(age)) : undefined;

  return (
    <StepSection title="Tournament category">
      <ReadOnlyField
        id="age-category"
        label="Age category"
        value={category?.label ?? "Enter your year of birth first"}
        helper={
          age !== null
            ? `Set automatically from your year of birth: age ${age} in ${tournamentStartDate.getUTCFullYear()}. It can't be changed.`
            : undefined
        }
        className="sm:col-span-2"
      />
      <TextField
        label="Rating"
        inputMode="numeric"
        registration={register("rating")}
        error={errors.rating}
        sanitize={digitsOnly(4)}
        placeholder="Optional — 4 digits"
        helper="Leave blank if you don't have a rating."
      />
      <TextField
        label="FIDE ID"
        inputMode="numeric"
        registration={register("fideId")}
        error={errors.fideId}
        sanitize={digitsOnly(8)}
        placeholder="Optional — up to 8 digits"
        helper="Leave blank if you're unrated."
      />
    </StepSection>
  );
}
