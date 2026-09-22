import { useFormContext } from "react-hook-form";
import type { RegistrationWizardValues } from "@/lib/registration-schema";
import { SelectField, StepSection, TextAreaField, TextField } from "@/components/registration-wizard/fields";

export function PlayerStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();

  return (
    <StepSection title="Player details">
      <TextField label="Full name" registration={register("fullName")} error={errors.fullName} required className="sm:col-span-2" />
      <TextField label="Email" type="email" registration={register("email")} error={errors.email} required />
      <TextField label="Phone" type="tel" placeholder="10-digit mobile number" registration={register("phone")} error={errors.phone} required />
      <TextField
        label="Date of birth"
        type="date"
        registration={register("dob")}
        error={errors.dob}
        required
        helper="Used to calculate your age category."
      />
      <SelectField label="Gender" registration={register("gender")} error={errors.gender}>
        <option value="">Optional</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </SelectField>
      <TextField label="City" registration={register("city")} error={errors.city} placeholder="Optional" />
      <TextAreaField
        label="Resident address"
        registration={register("address")}
        error={errors.address}
        placeholder="Optional"
        className="sm:col-span-2"
      />
    </StepSection>
  );
}
