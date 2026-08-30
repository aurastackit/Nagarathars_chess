import { z } from "zod";

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  dob: z.string().trim().optional().or(z.literal("")),
  gender: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  fideId: z.string().trim().optional().or(z.literal("")),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const enrollmentSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  message: z.string().trim().min(5, "Message is too short"),
});

export type ContactInput = z.infer<typeof contactSchema>;
