import { z } from "zod";
import { AGE_CATEGORY_VALUES } from "@/lib/age-category";

const optionalText = z.string().trim().optional().or(z.literal(""));

// Data-URL image fields: base64 inflates ~4/3, so cap the encoded string a little above the
// stated file-size limits (Aadhaar 1MB, passport 512KB).
const aadhaarImage = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || v.startsWith("data:image/"), "Aadhaar image must be an image file")
  .refine((v) => !v || v.length <= 1_400_000, "Aadhaar image must be under 1 MB");
const passportPhoto = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || v.startsWith("data:image/"), "Passport photo must be an image file")
  .refine((v) => !v || v.length <= 700_000, "Passport photo must be under 512 KB");

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  dob: optionalText,
  gender: optionalText,
  city: optionalText,
  address: optionalText,
  fideId: optionalText,
  rating: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), "Rating must be a number"),
  kovil: optionalText,
  pirivu: optionalText,
  native: optionalText,
  fatherName: optionalText,
  motherName: optionalText,
  fatherGrandparents: optionalText,
  motherGrandparents: optionalText,
  motherNative: optionalText,
  motherKovil: optionalText,
  motherPirivu: optionalText,
  sangamMember: z.boolean().optional(),
  aadhaarImageData: aadhaarImage,
  passportPhotoData: passportPhoto,
  ageCategory: z.enum(AGE_CATEGORY_VALUES, { error: "Select an age category" }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const enrollmentSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  fideId: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  message: z.string().trim().min(5, "Message is too short"),
});

export type ContactInput = z.infer<typeof contactSchema>;
