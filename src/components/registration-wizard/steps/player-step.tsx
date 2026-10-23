import { useFormContext } from "react-hook-form";
import { digitsOnly, sanitizePhone } from "@/lib/input-filters";
import type { RegistrationWizardValues } from "@/lib/registration-schema";
import {
  ReadOnlyField,
  SelectField,
  StepSection,
  TextAreaField,
  TextField,
} from "@/components/registration-wizard/fields";
import { EmailVerifyButton } from "@/components/registration-wizard/email-verify-button";

export function PlayerStep({
  verifiedEmail,
  onEmailVerified,
  lockedEmail,
}: {
  verifiedEmail?: string | null;
  onEmailVerified?: (email: string | null) => void;
  /** Updating an application: the email is how the player signed in, so it's shown, not edited. */
  lockedEmail?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();

  return (
    <StepSection title="Player details">
      <TextField
        label="Full name"
        registration={register("fullName")}
        error={errors.fullName}
        required
        maxLength={80}
        autoComplete="name"
        className="sm:col-span-2"
      />
      {lockedEmail ? (
        <ReadOnlyField
          id="email"
          label="Email"
          value={lockedEmail}
          helper="The email you signed in with. To change it, contact the organisers."
        />
      ) : (
        <TextField
          label="Email"
          type="email"
          registration={register("email")}
          error={errors.email}
          required
          maxLength={120}
          autoComplete="email"
          helper="We'll email a code here to verify it's yours."
          suffix={
            <EmailVerifyButton
              verifiedEmail={verifiedEmail ?? null}
              onVerified={onEmailVerified ?? (() => {})}
            />
          }
        />
      )}
      <TextField
        label="Phone"
        type="tel"
        inputMode="numeric"
        placeholder="10-digit mobile number"
        registration={register("phone")}
        error={errors.phone}
        required
        sanitize={sanitizePhone}
        autoComplete="tel-national"
      />
      <TextField
        label="Year of birth"
        inputMode="numeric"
        placeholder="e.g. 2014"
        registration={register("birthYear")}
        error={errors.birthYear}
        required
        sanitize={digitsOnly(4)}
        helper="4-digit year, as on your age proof. Your age category is worked out from it."
      />
      <SelectField label="Gender" registration={register("gender")} error={errors.gender} required>
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </SelectField>
      <TextField
        label="City"
        registration={register("city")}
        error={errors.city}
        required
        maxLength={60}
        autoComplete="address-level2"
      />
      <TextAreaField
        label="Resident address"
        registration={register("address")}
        error={errors.address}
        required
        maxLength={200}
        autoComplete="street-address"
        className="sm:col-span-2"
      />
    </StepSection>
  );
}
