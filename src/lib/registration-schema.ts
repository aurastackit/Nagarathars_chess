import { z } from "zod";
import {
  AGE_CATEGORY_VALUES,
  ageAt,
  isAgeCategoryAllowed,
  naturalAgeCategory,
  type AgeCategoryValue,
} from "@/lib/age-category";

const optionalText = z.string().trim().optional().or(z.literal(""));

// Indian mobile numbers: 10 digits starting 6-9, optional +91 / 0 prefix.
const INDIAN_PHONE = /^(?:\+91[-\s]?|0)?[6-9]\d{9}$/;

export const AGE_PROOF_TYPES = [
  { value: "aadhaar_masked", label: "Aadhaar card (masked)" },
  { value: "birth_certificate", label: "Birth certificate" },
  { value: "school_id", label: "School ID" },
] as const;

export function isMinorToday(dob: Date) {
  return ageAt(dob, new Date()) < 18;
}

/**
 * The wizard's field set as one schema, built per-tournament so the
 * age-category cross-check can use that tournament's start date (the
 * competitive-eligibility standard), while the minor/guardian-consent check
 * always uses today's date (the legal-capacity standard).
 */
export function createRegistrationWizardSchema(tournamentStartDate: Date) {
  return z
    .object({
      // Step 1 — Player
      fullName: z.string().trim().min(2, "Enter your full name"),
      email: z.string().trim().email("Enter a valid email"),
      phone: z.string().trim().regex(INDIAN_PHONE, "Enter a valid 10-digit Indian mobile number"),
      dob: z.coerce
        .date({ error: "Enter your date of birth" })
        .max(new Date(), "Date of birth can't be in the future"),
      gender: optionalText,
      city: optionalText,
      address: optionalText,

      // Step 2 — Category
      ageCategory: z.enum(AGE_CATEGORY_VALUES, { error: "Select an age category" }),
      rating: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((v) => !v || /^\d+$/.test(v), "Rating must be a number"),
      fideId: optionalText,

      // Step 3 — Family
      fatherName: optionalText,
      motherName: optionalText,
      fatherGrandparents: optionalText,
      motherGrandparents: optionalText,

      // Step 4 — Community
      native: optionalText,
      kovil: optionalText,
      pirivu: optionalText,
      motherNative: optionalText,
      motherKovil: optionalText,
      motherPirivu: optionalText,
      sangamMember: z.boolean(),

      // Step 5 — Documents
      ageProofType: z.enum(["aadhaar_masked", "birth_certificate", "school_id"], {
        error: "Select the type of age proof you're uploading",
      }),
      ageProofKey: z.string().min(1, "Upload your age proof document"),
      passportPhotoKey: z.string().min(1, "Upload a passport-size photo"),
      consentAccepted: z.literal(true, { error: "You must accept the privacy notice to continue" }),
      guardianName: optionalText,
      guardianConsent: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const natural = naturalAgeCategory(ageAt(data.dob, tournamentStartDate));
      if (!isAgeCategoryAllowed(data.ageCategory as AgeCategoryValue, natural)) {
        ctx.addIssue({
          code: "custom",
          message: "You can register in your own age category or a higher one, not a lower one",
          path: ["ageCategory"],
        });
      }

      if (isMinorToday(data.dob)) {
        if (!data.guardianName) {
          ctx.addIssue({
            code: "custom",
            message: "Parent/guardian name is required for players under 18",
            path: ["guardianName"],
          });
        }
        if (!data.guardianConsent) {
          ctx.addIssue({
            code: "custom",
            message: "Parent/guardian consent is required for players under 18",
            path: ["guardianConsent"],
          });
        }
      }
    });
}

/**
 * The wizard's live form state, as react-hook-form/native inputs actually
 * produce it (e.g. `dob` is the raw <input type="date"> string, not yet the
 * `Date` that z.coerce.date() turns it into). Kept distinct from the zod
 * schema's parsed output type below, which is what the submit handler
 * receives after validation runs.
 */
export type RegistrationWizardValues = {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender?: string;
  city?: string;
  address?: string;
  ageCategory: AgeCategoryValue | "";
  rating?: string;
  fideId?: string;
  fatherName?: string;
  motherName?: string;
  fatherGrandparents?: string;
  motherGrandparents?: string;
  native?: string;
  kovil?: string;
  pirivu?: string;
  motherNative?: string;
  motherKovil?: string;
  motherPirivu?: string;
  sangamMember: boolean;
  ageProofType: "aadhaar_masked" | "birth_certificate" | "school_id" | "";
  ageProofKey: string;
  passportPhotoKey: string;
  consentAccepted: boolean;
  guardianName?: string;
  guardianConsent: boolean;
};

/** The schema's parsed/coerced output — what the submit handler receives. */
export type RegistrationWizardOutput = z.infer<ReturnType<typeof createRegistrationWizardSchema>>;

export const REGISTRATION_STEPS = [
  "Player",
  "Category",
  "Family",
  "Community",
  "Documents",
  "Review & Pay",
] as const;

export const STEP_FIELDS: Record<number, (keyof RegistrationWizardValues)[]> = {
  0: ["fullName", "email", "phone", "dob", "gender", "city", "address"],
  1: ["ageCategory", "rating", "fideId"],
  2: ["fatherName", "motherName", "fatherGrandparents", "motherGrandparents"],
  3: ["native", "kovil", "pirivu", "motherNative", "motherKovil", "motherPirivu", "sangamMember"],
  4: [
    "ageProofType",
    "ageProofKey",
    "passportPhotoKey",
    "consentAccepted",
    "guardianName",
    "guardianConsent",
  ],
  5: [],
};
