import { useFormContext } from "react-hook-form";
import {
  AGE_PROOF_TYPES,
  isMinorToday,
  type RegistrationWizardValues,
} from "@/lib/registration-schema";
import { useS3Upload } from "@/lib/use-s3-upload";
import {
  CheckboxField,
  SelectField,
  StepSection,
  TextField,
} from "@/components/registration-wizard/fields";
import { FileUploadField } from "@/components/registration-wizard/file-upload-field";

export function DocumentsStep({ tournamentSlug }: { tournamentSlug: string }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();
  const { upload, uploading, error: uploadError } = useS3Upload(tournamentSlug);

  const dobRaw = watch("dob") as unknown as string | Date | undefined;
  const dobDate = dobRaw ? (dobRaw instanceof Date ? dobRaw : new Date(dobRaw)) : null;
  const isMinor = dobDate && !isNaN(dobDate.getTime()) ? isMinorToday(dobDate) : false;

  const ageProofKey = watch("ageProofKey");
  const passportPhotoKey = watch("passportPhotoKey");

  return (
    <div className="space-y-8">
      <StepSection title="Documents & photo">
        <div>
          <SelectField
            label="Age proof type"
            registration={register("ageProofType")}
            error={errors.ageProofType}
            required
          >
            <option value="">Select a document type</option>
            {AGE_PROOF_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectField>
        </div>
        <div />
        <FileUploadField
          label="Age proof"
          helper="Aadhaar (mask all but the last 4 digits before uploading), a birth certificate, or a school ID. Under 5MB."
          kind="ageProof"
          value={ageProofKey ?? ""}
          error={errors.ageProofKey}
          uploading={uploading.ageProof ?? false}
          onUpload={async (kind, file) => {
            const key = await upload(kind, file);
            setValue("ageProofKey", key, { shouldValidate: true });
            return key;
          }}
        />
        <FileUploadField
          label="Passport photo"
          helper="A recent passport-size photograph (without borders). Under 2MB."
          kind="passportPhoto"
          value={passportPhotoKey ?? ""}
          error={errors.passportPhotoKey}
          uploading={uploading.passportPhoto ?? false}
          onUpload={async (kind, file) => {
            const key = await upload(kind, file);
            setValue("passportPhotoKey", key, { shouldValidate: true });
            return key;
          }}
        />
      </StepSection>
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

      {isMinor && (
        <StepSection title="Parent / guardian consent">
          <TextField
            label="Parent/guardian full name"
            registration={register("guardianName")}
            error={errors.guardianName}
            required
            className="sm:col-span-2"
          />
          <CheckboxField
            label="I am this player's parent/guardian and I consent to their registration and the collection of the details above."
            registration={register("guardianConsent")}
            error={errors.guardianConsent}
            className="sm:col-span-2"
          />
        </StepSection>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-charcoal">Privacy notice</h3>
        <p className="mt-2 text-xs text-foreground/60">
          We collect this information to run tournament registration, verify age-category
          eligibility, and contact you about the event. Age-proof and photo files are stored in a
          private cloud bucket, accessible only to tournament organizers — never made public. Data
          is retained only as long as needed to run this and future Nagarathar&apos;s Chess events,
          and you can request deletion at any time by contacting us.
        </p>
        <CheckboxField
          label="I have read the privacy notice and consent to my (or my child's) details being collected and used as described."
          registration={register("consentAccepted")}
          error={errors.consentAccepted}
          className="mt-3"
        />
      </section>
    </div>
  );
}
