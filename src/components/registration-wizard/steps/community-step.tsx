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
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();

  const kovilLabel = watch("kovil");
  const motherKovilLabel = watch("motherKovil");
  const sangamMember = watch("sangamMember");
  const pirivuOptions = KOVILS.find((k) => k.label === kovilLabel)?.pirivus ?? [];
  const motherPirivuOptions = KOVILS.find((k) => k.label === motherKovilLabel)?.pirivus ?? [];

  return (
    <>
      <StepSection title="Community details (self)">
        <TextField
          label="Native"
          registration={register("native")}
          error={errors.native}
          required
          maxLength={60}
          placeholder="Native place"
        />
        <SelectField
          label="Kovil"
          registration={register("kovil", {
            // A Pirivu belongs to one Kovil, so changing the Kovil clears it.
            onChange: () => {
              setValue("pirivu", "");
              clearErrors("pirivu");
            },
          })}
          error={errors.kovil}
          required
        >
          <option value="">Select your Kovil</option>
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
          required
          disabled={pirivuOptions.length === 0}
        >
          <option value="">
            {pirivuOptions.length === 0 ? "Select Kovil first" : "Select your Pirivu"}
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
          required
          maxLength={60}
          placeholder="Native place"
        />
        <SelectField
          label="Mother Kovil"
          registration={register("motherKovil", {
            onChange: () => {
              setValue("motherPirivu", "");
              clearErrors("motherPirivu");
            },
          })}
          error={errors.motherKovil}
          required
        >
          <option value="">Select Kovil</option>
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
          required
          disabled={motherPirivuOptions.length === 0}
        >
          <option value="">
            {motherPirivuOptions.length === 0 ? "Select Kovil first" : "Select Pirivu"}
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
          registration={register("sangamMember", {
            onChange: (e) => {
              // Unticking removes the relative's name field, so drop what was typed.
              if (!e.target.checked) {
                setValue("sangamRelativeName", "");
                clearErrors("sangamRelativeName");
              }
            },
          })}
          className="sm:col-span-2"
        />
        {sangamMember && (
          <TextField
            label="Relative's name"
            registration={register("sangamRelativeName")}
            error={errors.sangamRelativeName}
            required
            maxLength={80}
            helper="Name of the relative who is a member of the Sangam."
            className="sm:col-span-2"
          />
        )}
      </StepSection>
    </>
  );
}
