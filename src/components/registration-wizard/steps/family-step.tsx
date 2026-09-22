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
      <TextField label="Father name" registration={register("fatherName")} error={errors.fatherName} placeholder="Optional" />
      <TextField label="Mother name" registration={register("motherName")} error={errors.motherName} placeholder="Optional" />
      <TextField
        label="Father side grandparents name"
        registration={register("fatherGrandparents")}
        error={errors.fatherGrandparents}
        placeholder="Eg: Grandfather / Grandmother"
      />
      <TextField
        label="Mother side grandparents name"
        registration={register("motherGrandparents")}
        error={errors.motherGrandparents}
        placeholder="Eg: Grandfather / Grandmother"
      />
    </StepSection>
  );
}
