import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { mightBeMinor } from "@/lib/age-category";
import { AGE_PROOF_TYPES, type RegistrationWizardValues } from "@/lib/registration-schema";
import { useS3Upload, type UploadInfo } from "@/lib/use-s3-upload";
import { checkBeforeUpload } from "@/lib/upload-checks";
import {
  CheckboxField,
  SelectField,
  StepSection,
  TextField,
} from "@/components/registration-wizard/fields";
import {
  FileUploadField,
  UploadCancelled,
} from "@/components/registration-wizard/file-upload-field";
import { PhotoCropper } from "@/components/registration-wizard/photo-cropper";

type Cropping = { file: File; resolve: (cropped: File) => void; reject: (err: Error) => void };

export function DocumentsStep({
  tournamentSlug,
  registrationId,
}: {
  tournamentSlug: string;
  /** Set when a signed-in player updates their own application (/my-registration). */
  registrationId?: string;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RegistrationWizardValues>();
  const {
    upload,
    uploading,
    error: uploadError,
    info,
  } = useS3Upload(tournamentSlug, registrationId);
  const [cropping, setCropping] = useState<Cropping | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoInfo, setPhotoInfo] = useState<UploadInfo | undefined>();

  // Free the preview's object URL when it's replaced or the step goes away.
  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview]
  );

  const birthYear = Number(watch("birthYear"));
  const isMinor = Number.isInteger(birthYear) && birthYear > 0 ? mightBeMinor(birthYear) : false;

  const ageProofKey = watch("ageProofKey");
  const passportPhotoKey = watch("passportPhotoKey");
  const onRecord = registrationId ? "On file — choose a new file to replace it" : undefined;

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
        <p lang="ta" className="self-end text-xs text-foreground/60 sm:pb-2">
          புகைப்படம்: JPG/PNG, 512 KB-க்குள் · வயதுச் சான்று: JPG/PNG/PDF, 1 MB-க்குள். பெரிய
          புகைப்படங்கள் தானாகச் சிறியதாக்கப்படும்.
        </p>
        <FileUploadField
          label="Age proof"
          helper="Aadhaar (mask all but the last 4 digits before uploading), a birth certificate, or a school ID. JPG, PNG or PDF, up to 1 MB — photos are shrunk automatically."
          kind="ageProof"
          field="ageProofKey"
          value={ageProofKey ?? ""}
          error={errors.ageProofKey}
          uploading={uploading.ageProof ?? false}
          info={info.ageProof}
          existingLabel={onRecord}
          onUpload={async (kind, file) => {
            const key = await upload(kind, file);
            setValue("ageProofKey", key, { shouldValidate: true, shouldDirty: true });
            return key;
          }}
        />
        <FileUploadField
          label="Passport photo"
          helper="A recent, front-facing photo. You'll crop it so your face is centred. JPG or PNG — shrunk automatically."
          kind="passportPhoto"
          field="passportPhotoKey"
          value={passportPhotoKey ?? ""}
          error={errors.passportPhotoKey}
          uploading={uploading.passportPhoto ?? false}
          info={photoInfo}
          preview={photoPreview}
          existingLabel={onRecord}
          onUpload={async (kind, file) => {
            // Wrong type or far too big: say so before opening the cropper.
            const problem = checkBeforeUpload(kind, file);
            if (problem) throw new Error(problem);
            const cropped = await new Promise<File>((resolve, reject) =>
              setCropping({ file, resolve, reject })
            );
            const key = await upload(kind, cropped);
            setPhotoPreview(URL.createObjectURL(cropped));
            setPhotoInfo({ name: file.name, before: file.size, after: cropped.size });
            setValue("passportPhotoKey", key, { shouldValidate: true, shouldDirty: true });
            return key;
          }}
        />
      </StepSection>
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

      {cropping && (
        <PhotoCropper
          file={cropping.file}
          onCancel={() => {
            cropping.reject(new UploadCancelled());
            setCropping(null);
          }}
          onConfirm={(cropped) => {
            cropping.resolve(cropped);
            setCropping(null);
          }}
        />
      )}

      {isMinor && (
        <StepSection title="Parent / guardian consent">
          <TextField
            label="Parent/guardian full name"
            registration={register("guardianName")}
            error={errors.guardianName}
            required
            maxLength={80}
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
        <p className="mt-2 text-xs text-muted">
          We collect this information to run tournament registration, verify age-category
          eligibility, and contact you about the event. Age-proof and photo files are stored in a
          private cloud bucket, accessible only to tournament organizers — never made public. Data
          is retained only as long as needed to run this and future Nagarathar&apos;s Chess events,
          and you can request deletion at any time by contacting us. Read the full{" "}
          {/* New tab, so the half-filled form isn't lost. */}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-charcoal underline underline-offset-2"
          >
            privacy policy
          </Link>{" "}
          (opens in a new tab).
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
