import { z } from "zod";
import { AGE_CATEGORY_VALUES } from "@/lib/age-category";

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  dob: z.string().trim().optional().or(z.literal("")),
  gender: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  fideId: z.string().trim().optional().or(z.literal("")),
  rating: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), "Rating must be a number"),
  kovil: z.string().trim().optional().or(z.literal("")),
  pirivu: z.string().trim().optional().or(z.literal("")),
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
