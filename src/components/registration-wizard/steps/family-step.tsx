import { useFormContext } from "react-hook-form";
import type { RegistrationWizardValues } from "@/lib/registration-schema";
import { StepSection, TextField } from "@/components/registration-wizard/fields";

export function FamilyStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();

  return (
    <StepSection title="Family details">
      <TextField
        label="Father name"
        registration={register("fatherName")}
        error={errors.fatherName}
        required
        maxLength={80}
      />
      <TextField
        label="Mother name"
        registration={register("motherName")}
        error={errors.motherName}
        required
        maxLength={80}
      />
      <TextField
        label="Father side grandparents name"
        registration={register("fatherGrandparents")}
        error={errors.fatherGrandparents}
        required
        maxLength={120}
        placeholder="Eg: Grandfather / Grandmother"
      />
      <TextField
        label="Mother side grandparents name"
        registration={register("motherGrandparents")}
        error={errors.motherGrandparents}
        required
        maxLength={120}
        placeholder="Eg: Grandfather / Grandmother"
      />
    </StepSection>
  );
}
