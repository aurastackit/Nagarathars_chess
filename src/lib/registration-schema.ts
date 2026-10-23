import { z } from "@/lib/zod";
import { mightBeMinor } from "@/lib/age-category";
import { KOVILS } from "@/lib/kovils";

// Letters in any script (names are often written in Tamil too) plus the
// punctuation real names and places use.
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const PLACE_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .,'-]*$/u;
const NAME_LIST = /^[\p{L}\p{M}][\p{L}\p{M} .,'&/-]*$/u;

// Indian mobile numbers: exactly 10 digits, starting 6-9 (the form strips +91 / 0).
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export const AGE_PROOF_TYPES = [
  { value: "aadhaar_masked", label: "Aadhaar card (masked)" },
  { value: "birth_certificate", label: "Birth certificate" },
  { value: "school_id", label: "School ID" },
] as const;

/** A required name: letters, spaces and . ' - only. */
function personName(enterMessage: string, label: string) {
  return z
    .string()
    .trim()
    .min(2, enterMessage)
    .max(80, `${label} is too long`)
    .regex(PERSON_NAME, `${label} can only have letters, spaces and . ' -`);
}

/** A required place (city, native): letters, spaces and . , ' - only. */
function placeName(enterMessage: string, label: string) {
  return z
    .string()
    .trim()
    .min(2, enterMessage)
    .max(60, `${label} is too long`)
    .regex(PLACE_NAME, `${label} can only have letters, spaces and . , ' -`);
}

/** Required names of one or two people, e.g. "Meenakshi and Subbiah". */
function nameList(enterMessage: string, label: string) {
  return z
    .string()
    .trim()
    .min(2, enterMessage)
    .max(120, `${label} is too long`)
    .regex(NAME_LIST, `${label} can only have letters, spaces and . , ' & / -`);
}

/**
 * The wizard's field set as one schema, shared by the form and the register
 * API. Everything is required except the Sangam tick box, rating and FIDE ID
 * (which most local players don't have: they're checked only when filled in).
 * The age category isn't a field: it's worked out from the year of birth.
 */
export function createRegistrationWizardSchema() {
  const thisYear = new Date().getFullYear();

  return z
    .object({
      // Step 1: Player
      fullName: personName("Enter your full name", "Full name"),
      email: z.string().trim().email("Enter a valid email address").max(120, "Email is too long"),
      phone: z
        .string()
        .trim()
        .regex(INDIAN_MOBILE, "Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9)"),
      // The form holds the year as text, but what the form submits (and posts to the
      // API) is this schema's parsed output, where it's already a number — accept both.
      birthYear: z.preprocess(
        (year) => (typeof year === "number" ? String(year) : year),
        z
          .string()
          .trim()
          .regex(/^\d{4}$/, "Enter your 4-digit year of birth, e.g. 2014")
          .transform((year) => Number(year))
          .refine(
            (year) => year >= thisYear - 100 && year <= thisYear - 3,
            "Enter a valid year of birth"
          )
      ),
      // Choice and tick-box fields use refine() rather than z.enum / z.literal on
      // purpose: those fail in a way that makes zod skip the cross-field rules at
      // the bottom, which would hide them until the very last step.
      gender: z
        .string()
        .refine((v) => v === "male" || v === "female" || v === "other", "Select your gender"),
      city: placeName("Enter your city", "City"),
      address: z
        .string()
        .trim()
        .min(5, "Enter your full address")
        .max(200, "Address is too long (200 characters at most)"),

      // Step 2: Category (optional, but strictly formatted when filled in)
      rating: z
        .string()
        .trim()
        .regex(
          /^$|^[1-9]\d{3}$/,
          "Rating must be exactly 4 digits (1000 to 9999), or leave it blank if you don't have one"
        )
        .optional(),
      fideId: z
        .string()
        .trim()
        .regex(
          /^$|^\d{1,8}$/,
          "FIDE ID must be digits only, up to 8 digits, or leave it blank if you don't have one"
        )
        .optional(),

      // Step 3: Family
      fatherName: personName("Enter your father's name", "Father's name"),
      motherName: personName("Enter your mother's name", "Mother's name"),
      fatherGrandparents: nameList(
        "Enter your father's side grandparents' names",
        "Grandparents' names"
      ),
      motherGrandparents: nameList(
        "Enter your mother's side grandparents' names",
        "Grandparents' names"
      ),

      // Step 4: Community
      native: placeName("Enter your native place", "Native place"),
      kovil: z.string().refine((v) => KOVILS.some((k) => k.label === v), "Select your Kovil"),
      pirivu: z.string().min(1, "Select your Pirivu"),
      motherNative: placeName("Enter your mother's native place", "Native place"),
      motherKovil: z
        .string()
        .refine((v) => KOVILS.some((k) => k.label === v), "Select your mother's Kovil"),
      motherPirivu: z.string().min(1, "Select your mother's Pirivu"),
      sangamMember: z.boolean(),
      sangamRelativeName: z.string().trim().optional(),

      // Step 5: Documents
      ageProofType: z
        .string()
        .refine(
          (v) => AGE_PROOF_TYPES.some((t) => t.value === v),
          "Select the type of age proof you're uploading"
        ),
      ageProofKey: z.string().min(1, "Upload your age proof document"),
      passportPhotoKey: z.string().min(1, "Upload a passport-size photo"),
      consentAccepted: z
        .boolean()
        .refine((v) => v === true, "You must accept the privacy notice to continue"),
      guardianName: z.string().trim().optional(),
      guardianConsent: z.boolean(),
    })
    .superRefine((data, ctx) => {
      // A Pirivu belongs to a Kovil: it has to be one of the chosen Kovil's.
      const pairs = [
        { kovil: data.kovil, pirivu: data.pirivu, path: "pirivu", message: "Select your Pirivu" },
        {
          kovil: data.motherKovil,
          pirivu: data.motherPirivu,
          path: "motherPirivu",
          message: "Select your mother's Pirivu",
        },
      ] as const;
      for (const { kovil, pirivu, path, message } of pairs) {
        const match = KOVILS.find((k) => k.label === kovil);
        if (match && !match.pirivus.includes(pirivu)) {
          ctx.addIssue({ code: "custom", message, path: [path] });
        }
      }

      // The tick box is optional; ticking it makes the relative's name required.
      if (data.sangamMember) {
        const relative = data.sangamRelativeName ?? "";
        if (relative.length < 2) {
          ctx.addIssue({
            code: "custom",
            message: "Enter your relative's name",
            path: ["sangamRelativeName"],
          });
        } else if (relative.length > 80 || !PERSON_NAME.test(relative)) {
          ctx.addIssue({
            code: "custom",
            message: "Relative's name can only have letters, spaces and . ' -",
            path: ["sangamRelativeName"],
          });
        }
      }

      // Players who may be under 18 need a parent/guardian's name and consent.
      if (typeof data.birthYear === "number" && mightBeMinor(data.birthYear)) {
        const guardian = data.guardianName ?? "";
        if (guardian.length < 2) {
          ctx.addIssue({
            code: "custom",
            message: "Parent/guardian name is required for players under 18",
            path: ["guardianName"],
          });
        } else if (guardian.length > 80 || !PERSON_NAME.test(guardian)) {
          ctx.addIssue({
            code: "custom",
            message: "Parent/guardian name can only have letters, spaces and . ' -",
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
 * produce it (e.g. `birthYear` is the raw text of the input, not yet the
 * number the schema turns it into). Kept distinct from the schema's parsed
 * output type below, which is what the submit handler receives after
 * validation runs.
 */
export type RegistrationWizardValues = {
  fullName: string;
  email: string;
  phone: string;
  birthYear: string;
  gender: "male" | "female" | "other" | "";
  city: string;
  address: string;
  rating?: string;
  fideId?: string;
  fatherName: string;
  motherName: string;
  fatherGrandparents: string;
  motherGrandparents: string;
  native: string;
  kovil: string;
  pirivu: string;
  motherNative: string;
  motherKovil: string;
  motherPirivu: string;
  sangamMember: boolean;
  sangamRelativeName?: string;
  ageProofType: "aadhaar_masked" | "birth_certificate" | "school_id" | "";
  ageProofKey: string;
  passportPhotoKey: string;
  consentAccepted: boolean;
  guardianName?: string;
  guardianConsent: boolean;
};

/** The schema's parsed/coerced output: what the submit handler receives. */
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
  0: ["fullName", "email", "phone", "birthYear", "gender", "city", "address"],
  1: ["rating", "fideId"],
  2: ["fatherName", "motherName", "fatherGrandparents", "motherGrandparents"],
  3: [
    "native",
    "kovil",
    "pirivu",
    "motherNative",
    "motherKovil",
    "motherPirivu",
    "sangamMember",
    "sangamRelativeName",
  ],
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
