"use client";

import { useState, type FormEvent } from "react";
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

const SECTIONS = [
  { id: "personal", label: "Personal details" },
  { id: "membership", label: "Membership details" },
  { id: "family", label: "Family details" },
  { id: "community-self", label: "Community details (self)" },
  { id: "community-mother", label: "Community details (mother)" },
  { id: "sangam", label: "Sangam membership" },
  { id: "documents", label: "Documents & photo" },
];

export function CommunityRegisterWizard() {
  const [submitted, setSubmitted] = useState(false);
  const [kovilValue, setKovilValue] = useState("");
  const [motherKovilValue, setMotherKovilValue] = useState("");
  const [sangamMember, setSangamMember] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<string | null>(null);

  const selectedKovil = KOVILS.find((k) => k.value === kovilValue);
  const selectedMotherKovil = KOVILS.find((k) => k.value === motherKovilValue);

  function handleSubmitForm(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#d8cfa8] bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0e4f45]/10 text-[#0e4f45]">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#12312d]">Registration received</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#6b6555]">
          Thanks — your details have been captured. Our team will verify your submission and confirm
          your seat shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-full border border-[#0e4f45] px-5 py-2 text-sm font-semibold text-[#0e4f45] transition-colors hover:bg-[#0e4f45] hover:text-white"
        >
          Register another member
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr] md:gap-8">
      <aside className="rounded-2xl bg-[#0e4f45] p-6 text-white md:sticky md:top-6 md:h-fit">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#c8922f]">
          Championship registration
        </p>
        <h2 className="mt-1 text-lg font-bold">Registration form</h2>
        <p className="mt-2 text-xs text-white/60">
          Ensure the form is filled out correctly and completely. All submissions are verified and
          approved by the admin before acceptance.
        </p>
        <nav className="mt-6 space-y-1 border-t border-white/10 pt-4">
          {SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-[#c8922f]">
                {i + 1}
              </span>
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      <form
        onSubmit={handleSubmitForm}
        className="space-y-10 rounded-2xl border border-[#e5ddc8] bg-white p-6 shadow-sm sm:p-8"
      >
        <div id="personal" className="scroll-mt-6">
          <Section index={1} title="Personal details">
            <TextField
              label="Full name (as per Aadhaar)"
              name="fullName"
              required
              placeholder="Eg: John Deo"
            />
            <SelectField label="Gender" name="gender" required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </SelectField>
            <TextField label="Date of birth (as per Aadhaar)" name="dob" type="date" required />
            <TextField
              label="Mobile"
              name="mobile"
              type="tel"
              required
              placeholder="10-digit mobile number"
            />
            <TextAreaField
              label="Resident address"
              name="address"
              required
              className="sm:col-span-2"
            />
          </Section>
        </div>

        <div id="membership" className="scroll-mt-6">
          <Section index={2} title="Membership details">
            <TextField label="FIDE ID" name="fideId" placeholder="Optional" />
            <TextField label="Rating" name="rating" type="number" min={0} placeholder="Optional" />
          </Section>
        </div>

        <div id="family" className="scroll-mt-6">
          <Section index={3} title="Family details">
            <TextField label="Father name" name="fatherName" required />
            <TextField label="Mother name" name="motherName" required />
            <TextField
              label="Father side grandparents name"
              name="fatherGrandparents"
              required
              placeholder="Eg: Grandfather / Grandmother"
            />
            <TextField
              label="Mother side grandparents name"
              name="motherGrandparents"
              required
              placeholder="Eg: Grandfather / Grandmother"
            />
          </Section>
        </div>

        <div id="community-self" className="scroll-mt-6">
          <Section index={4} title="Community details (self)">
            <TextField label="Native" name="native" required placeholder="Eg: Devakottai" />
            <SelectField
              label="Kovil"
              name="kovil"
              required
              value={kovilValue}
              onChange={(e) => setKovilValue(e.target.value)}
            >
              <option value="">Select</option>
              {KOVILS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Pirivu"
              name="pirivu"
              required={!!selectedKovil?.pirivus.length}
              disabled={!selectedKovil?.pirivus.length}
              helper={selectedKovil ? "Required if Pirivu exists for selected Kovil" : undefined}
            >
              <option value="">{selectedKovil?.pirivus.length ? "Select" : "NA"}</option>
              {selectedKovil?.pirivus.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectField>
          </Section>
        </div>

        <div id="community-mother" className="scroll-mt-6">
          <Section index={5} title="Community details (mother)">
            <TextField
              label="Mother native"
              name="motherNative"
              required
              placeholder="Eg: Devakottai"
            />
            <SelectField
              label="Mother Kovil"
              name="motherKovil"
              required
              value={motherKovilValue}
              onChange={(e) => setMotherKovilValue(e.target.value)}
            >
              <option value="">Select</option>
              {KOVILS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Mother Pirivu"
              name="motherPirivu"
              required={!!selectedMotherKovil?.pirivus.length}
              disabled={!selectedMotherKovil?.pirivus.length}
              helper={
                selectedMotherKovil
                  ? "Required if Pirivu exists for selected Mother Kovil"
                  : undefined
              }
            >
              <option value="">{selectedMotherKovil?.pirivus.length ? "Select" : "NA"}</option>
              {selectedMotherKovil?.pirivus.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectField>
          </Section>
        </div>

        <div id="sangam" className="scroll-mt-6">
          <Section index={6} title="Sangam membership">
            <label className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={sangamMember}
                onChange={(e) => setSangamMember(e.target.checked)}
                className="h-4 w-4 rounded border-[#d8cfa8] text-[#0e4f45] focus:ring-[#c8922f]"
              />
              <span className="text-sm text-[#12312d]">Member of any Nagarathar Sangam</span>
            </label>
          </Section>
        </div>

        <div id="documents" className="scroll-mt-6">
          <Section index={7} title="Documents & photo">
            <FileField
              label="Aadhaar image"
              name="aadhaarImage"
              required
              helper="Upload the latest Aadhaar card downloaded from the official UIDAI portal. File size must be under 1 MB."
              fileName={aadhaarFile}
              onFileChange={setAadhaarFile}
            />
            <FileField
              label="Passport photo"
              name="passportPhoto"
              required
              helper="Upload a recent passport-size photograph (without borders), under 512 KB."
              fileName={passportFile}
              onFileChange={setPassportFile}
            />
          </Section>
        </div>

        <div className="border-t border-[#e5ddc8] pt-6">
          <PrimaryButton type="submit" className="sm:w-auto">
            Submit registration
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
