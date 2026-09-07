"use client";

import { useState, type FormEvent } from "react";
import { AGE_CATEGORIES } from "@/lib/age-category";
import { KOVILS } from "@/lib/kovils";
import {
  CheckIcon,
  FileField,
  PrimaryButton,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form-fields";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function RegistrationForm({ tournamentSlug }: { tournamentSlug: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [kovilLabel, setKovilLabel] = useState("");
  const [motherKovilLabel, setMotherKovilLabel] = useState("");
  const [sangamMember, setSangamMember] = useState(false);
  const [aadhaarFileName, setAadhaarFileName] = useState<string | null>(null);
  const [passportFileName, setPassportFileName] = useState<string | null>(null);

  const selectedKovil = KOVILS.find((k) => k.label === kovilLabel);
  const pirivuOptions = selectedKovil?.pirivus ?? [];
  const selectedMotherKovil = KOVILS.find((k) => k.label === motherKovilLabel);
  const motherPirivuOptions = selectedMotherKovil?.pirivus ?? [];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data: Record<string, unknown> = Object.fromEntries(formData.entries());
    data.sangamMember = formData.get("sangamMember") === "on";

    const aadhaarFile = formData.get("aadhaarImageData");
    if (aadhaarFile instanceof File && aadhaarFile.size > 0) {
      data.aadhaarImageData = await fileToDataUrl(aadhaarFile);
    } else {
      delete data.aadhaarImageData;
    }

    const passportFile = formData.get("passportPhotoData");
    if (passportFile instanceof File && passportFile.size > 0) {
      data.passportPhotoData = await fileToDataUrl(passportFile);
    } else {
      delete data.passportPhotoData;
    }

    const res = await fetch(`/api/tournaments/${tournamentSlug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setStatus("success");
      form.reset();
      setKovilLabel("");
      setMotherKovilLabel("");
      setSangamMember(false);
      setAadhaarFileName(null);
      setPassportFileName(null);
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-[#d8cfa8] bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0e4f45]/10 text-[#0e4f45]">
          <CheckIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-[#12312d]">You&apos;re registered!</h3>
        <p className="mt-1 text-sm text-[#6b6555]">
          We&apos;ll be in touch with more details before the tournament.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-[#e5ddc8] bg-white p-6 shadow-sm sm:p-8">
      <Section index={1} title="Personal details">
        <TextField label="Full name" name="fullName" required className="sm:col-span-2" />
        <TextField label="Email" name="email" type="email" required />
        <TextField label="Phone" name="phone" type="tel" required />
        <TextField label="Date of birth" name="dob" type="date" />
        <SelectField label="Gender" name="gender" defaultValue="">
          <option value="">Optional</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </SelectField>
        <TextField label="City" name="city" placeholder="Optional" />
        <TextAreaField label="Resident address" name="address" placeholder="Optional" className="sm:col-span-2" />
      </Section>

      <Section index={2} title="Tournament category">
        <SelectField label="Age category" name="ageCategory" required defaultValue="">
          <option value="" disabled>
            Select your age category
          </option>
          {AGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <TextField label="Rating" name="rating" type="number" min={0} placeholder="Optional — local/state rating" />
        <TextField label="FIDE ID" name="fideId" placeholder="Optional — leave blank if unrated" />
        <p className="text-xs text-[#8a8471] sm:col-span-2 sm:-mt-3">
          You can play up in an older category if you&apos;d like, but not down.
        </p>
      </Section>

      <Section index={3} title="Family details">
        <TextField label="Father name" name="fatherName" placeholder="Optional" />
        <TextField label="Mother name" name="motherName" placeholder="Optional" />
        <TextField label="Father side grandparents name" name="fatherGrandparents" placeholder="Eg: Grandfather / Grandmother" />
        <TextField label="Mother side grandparents name" name="motherGrandparents" placeholder="Eg: Grandfather / Grandmother" />
      </Section>

      <Section index={4} title="Community details (self)">
        <TextField label="Native" name="native" placeholder="Optional" />
        <SelectField label="Kovil" name="kovil" value={kovilLabel} onChange={(e) => setKovilLabel(e.target.value)}>
          <option value="">Optional — select your Kovil</option>
          {KOVILS.map((k) => (
            <option key={k.value} value={k.label}>
              {k.label}
            </option>
          ))}
        </SelectField>
        {!kovilLabel ? (
          <SelectField label="Pirivu" name="pirivu" disabled defaultValue="">
            <option value="">Select Kovil first</option>
          </SelectField>
        ) : pirivuOptions.length === 0 ? (
          <SelectField label="Pirivu" name="pirivu" disabled defaultValue="">
            <option value="">NA</option>
          </SelectField>
        ) : (
          <SelectField key={kovilLabel} label="Pirivu" name="pirivu" defaultValue="">
            <option value="">Optional — select your Pirivu</option>
            {pirivuOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </SelectField>
        )}
      </Section>

      <Section index={5} title="Community details (mother)">
        <TextField label="Mother native" name="motherNative" placeholder="Optional" />
        <SelectField
          label="Mother Kovil"
          name="motherKovil"
          value={motherKovilLabel}
          onChange={(e) => setMotherKovilLabel(e.target.value)}
        >
          <option value="">Optional — select Kovil</option>
          {KOVILS.map((k) => (
            <option key={k.value} value={k.label}>
              {k.label}
            </option>
          ))}
        </SelectField>
        {!motherKovilLabel ? (
          <SelectField label="Mother Pirivu" name="motherPirivu" disabled defaultValue="">
            <option value="">Select Kovil first</option>
          </SelectField>
        ) : motherPirivuOptions.length === 0 ? (
          <SelectField label="Mother Pirivu" name="motherPirivu" disabled defaultValue="">
            <option value="">NA</option>
          </SelectField>
        ) : (
          <SelectField key={motherKovilLabel} label="Mother Pirivu" name="motherPirivu" defaultValue="">
            <option value="">Optional — select Pirivu</option>
            {motherPirivuOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </SelectField>
        )}
      </Section>

      <Section index={6} title="Sangam membership">
        <label className="flex items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            name="sangamMember"
            checked={sangamMember}
            onChange={(e) => setSangamMember(e.target.checked)}
            className="h-4 w-4 rounded border-[#d8cfa8] text-[#0e4f45] focus:ring-[#c8922f]"
          />
          <span className="text-sm text-[#12312d]">Member of any Nagarathar Sangam</span>
        </label>
      </Section>

      <Section index={7} title="Documents & photo">
        <FileField
          label="Aadhaar image"
          name="aadhaarImageData"
          helper="Upload the latest Aadhaar card downloaded from the official UIDAI portal. File size must be under 1 MB."
          fileName={aadhaarFileName}
          onFileChange={setAadhaarFileName}
        />
        <FileField
          label="Passport photo"
          name="passportPhotoData"
          helper="Upload a recent passport-size photograph (without borders), under 512 KB."
          fileName={passportFileName}
          onFileChange={setPassportFileName}
        />
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <PrimaryButton type="submit" disabled={status === "submitting"} className="sm:w-auto">
        {status === "submitting" ? "Registering…" : "Register for this tournament"}
      </PrimaryButton>
    </form>
  );
}
