import { normalizeStatus, type RegistrationStatus } from "@/lib/registration-status";
import type { RegistrationWizardValues } from "@/lib/registration-schema";

/**
 * Rules and helpers for players managing their own registrations
 * (/my-registration). Pure — the pages, the API and the tests share them.
 */

/** Statuses a player may edit: an edit sends it (back) to review. */
export const PLAYER_EDITABLE: RegistrationStatus[] = ["pending", "changes_requested", "rejected"];

/** Editing is open until the tournament starts. */
export function canPlayerEdit(status: string, tournamentStart: Date, now = new Date()) {
  return PLAYER_EDITABLE.includes(normalizeStatus(status)) && now < tournamentStart;
}

/** Withdrawing is open for any live registration until the tournament ends. */
export function canPlayerWithdraw(status: string, tournamentEnd: Date, now = new Date()) {
  return normalizeStatus(status) !== "withdrawn" && now < tournamentEnd;
}

/** What happens next, in a sentence, for each status. */
export function nextStep(status: string) {
  switch (normalizeStatus(status)) {
    case "pending":
      return "The organisers are reviewing your application. You'll get an email as soon as it's decided — you can still update it until then.";
    case "changes_requested":
      return "Please update your application as asked below, before the “Fix by” date. Your seat is held until then.";
    case "rejected":
      return "Your application wasn't accepted. If you can fix the reason below, update it and it goes back for review — or contact the organisers.";
    case "confirmed":
      return "You're confirmed. Download your player ID card and bring it on the day.";
    case "withdrawn":
      return "This registration is withdrawn. Contact the organisers if that's a mistake.";
  }
}

type FieldName = keyof RegistrationWizardValues;

/**
 * Which form fields an organiser's note is about, so the update form can
 * highlight them. A best-effort match on the words organisers (and the reason
 * templates) use; the note itself is always shown in full above the form.
 */
const ATTENTION_RULES: [RegExp, FieldName[]][] = [
  [/\bphoto|photograph|picture|selfie/i, ["passportPhotoKey"]],
  [/age proof|aadhaa?r|birth certificate|school id|document/i, ["ageProofType", "ageProofKey"]],
  [/year of birth|birth year|date of birth|\bdob\b|\bage\b(?! proof)/i, ["birthYear"]],
  [/grand ?parent/i, ["fatherGrandparents", "motherGrandparents"]],
  [/father'?s? name/i, ["fatherName"]],
  [/mother'?s? name/i, ["motherName"]],
  [/kovil|temple/i, ["kovil", "motherKovil"]],
  [/pirivu/i, ["pirivu", "motherPirivu"]],
  [/native/i, ["native", "motherNative"]],
  [/address/i, ["address"]],
  [/\bcity\b/i, ["city"]],
  [/phone|mobile|contact number/i, ["phone"]],
  [/\bgender\b/i, ["gender"]],
  [/full name|player'?s name|spelling of (the|your) name|name is (wrong|misspel)/i, ["fullName"]],
  [/sangam/i, ["sangamMember", "sangamRelativeName"]],
  [/guardian|parent'?s? consent/i, ["guardianName", "guardianConsent"]],
  [/rating|fide/i, ["rating", "fideId"]],
];

export function fieldsNeedingAttention(note: string | null | undefined): FieldName[] {
  if (!note?.trim()) return [];
  const found = new Set<FieldName>();
  for (const [pattern, fields] of ATTENTION_RULES) {
    if (pattern.test(note)) fields.forEach((f) => found.add(f));
  }
  return [...found];
}

/** A stored registration as the update form's starting values (documents kept unless replaced). */
export function registrationToFormValues(r: {
  fullName: string;
  email: string;
  phone: string;
  dob: Date | null;
  gender: string | null;
  city: string | null;
  address: string | null;
  rating: number | null;
  fideId: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherGrandparents: string | null;
  motherGrandparents: string | null;
  native: string | null;
  kovil: string | null;
  pirivu: string | null;
  motherNative: string | null;
  motherKovil: string | null;
  motherPirivu: string | null;
  sangamMember: boolean;
  sangamRelativeName: string | null;
  ageProofType: string | null;
  ageProofKey: string | null;
  passportPhotoKey: string | null;
  consentAccepted: boolean;
  guardianName: string | null;
  guardianConsent: boolean;
}): RegistrationWizardValues {
  const s = (v: string | null | undefined) => v ?? "";
  const gender =
    r.gender === "male" || r.gender === "female" || r.gender === "other" ? r.gender : "";
  const proof =
    r.ageProofType === "aadhaar_masked" ||
    r.ageProofType === "birth_certificate" ||
    r.ageProofType === "school_id"
      ? r.ageProofType
      : "";
  return {
    fullName: r.fullName,
    email: r.email,
    // The form wants the 10-digit number; stored ones may carry +91 or spaces.
    phone: r.phone.replace(/\D/g, "").slice(-10),
    birthYear: r.dob ? String(r.dob.getUTCFullYear()) : "",
    gender,
    city: s(r.city),
    address: s(r.address),
    rating: r.rating ? String(r.rating) : "",
    fideId: s(r.fideId),
    fatherName: s(r.fatherName),
    motherName: s(r.motherName),
    fatherGrandparents: s(r.fatherGrandparents),
    motherGrandparents: s(r.motherGrandparents),
    native: s(r.native),
    kovil: s(r.kovil),
    pirivu: s(r.pirivu),
    motherNative: s(r.motherNative),
    motherKovil: s(r.motherKovil),
    motherPirivu: s(r.motherPirivu),
    sangamMember: r.sangamMember,
    sangamRelativeName: s(r.sangamRelativeName),
    ageProofType: proof,
    ageProofKey: s(r.ageProofKey),
    passportPhotoKey: s(r.passportPhotoKey),
    consentAccepted: r.consentAccepted,
    guardianName: s(r.guardianName),
    guardianConsent: r.guardianConsent,
  };
}

/**
 * Uploaded files may only be the registration's current ones or fresh uploads
 * for the same tournament and kind (keys made by createUploadUrl).
 */
export function isAcceptableUploadKey(
  key: string,
  kind: "ageProof" | "passportPhoto",
  tournamentSlug: string,
  current: string | null
) {
  if (key === current) return true;
  const escaped = tournamentSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^registrations/${escaped}/${kind}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp|pdf)$`
  ).test(key);
}
