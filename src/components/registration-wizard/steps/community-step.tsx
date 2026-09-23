import { useFormContext } from "react-hook-form";
import { KOVILS } from "@/lib/kovils";
import type { RegistrationWizardValues } from "@/lib/registration-schema";
import {
  CheckboxField,
  SelectField,
  StepSection,
  TextField,
} from "@/components/registration-wizard/fields";

export function CommunityStep() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();

  const kovilLabel = watch("kovil");
  const motherKovilLabel = watch("motherKovil");
  const pirivuOptions = KOVILS.find((k) => k.label === kovilLabel)?.pirivus ?? [];
  const motherPirivuOptions = KOVILS.find((k) => k.label === motherKovilLabel)?.pirivus ?? [];

  return (
    <>
      <StepSection title="Community details (self)">
        <TextField
          label="Native"
          registration={register("native")}
          error={errors.native}
          placeholder="Optional"
        />
        <SelectField label="Kovil" registration={register("kovil")} error={errors.kovil}>
          <option value="">Optional — select your Kovil</option>
          {KOVILS.map((k) => (
            <option key={k.value} value={k.label}>
              {k.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Pirivu"
          registration={register("pirivu")}
          error={errors.pirivu}
          disabled={pirivuOptions.length === 0}
        >
          <option value="">
            {pirivuOptions.length === 0 ? "Select Kovil first" : "Optional — select your Pirivu"}
          </option>
          {pirivuOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </SelectField>
      </StepSection>

      <StepSection title="Community details (mother)">
        <TextField
          label="Mother native"
          registration={register("motherNative")}
          error={errors.motherNative}
          placeholder="Optional"
        />
        <SelectField
          label="Mother Kovil"
          registration={register("motherKovil")}
          error={errors.motherKovil}
        >
          <option value="">Optional — select Kovil</option>
          {KOVILS.map((k) => (
            <option key={k.value} value={k.label}>
              {k.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Mother Pirivu"
          registration={register("motherPirivu")}
          error={errors.motherPirivu}
          disabled={motherPirivuOptions.length === 0}
        >
          <option value="">
            {motherPirivuOptions.length === 0 ? "Select Kovil first" : "Optional — select Pirivu"}
          </option>
          {motherPirivuOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </SelectField>
      </StepSection>

      <StepSection title="Sangam membership">
        <CheckboxField
          label="Member of any Nagarathar Sangam"
          registration={register("sangamMember")}
          className="sm:col-span-2"
        />
      </StepSection>
    </>
  );
}
