import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const enrollmentSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  fideId: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;

/** Client-side variant that also enforces the FIDE ID requirement for non-beginner classes. */
export function createEnrollmentSchema(fideRequired: boolean) {
  return enrollmentSchema.refine((data) => !fideRequired || Boolean(data.fideId), {
    error: "A FIDE ID is required for this class",
    path: ["fideId"],
  });
}

export const classWaitlistSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional().or(z.literal("")),
});

export type ClassWaitlistInput = z.infer<typeof classWaitlistSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  message: z.string().trim().min(5, "Message is too short"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const tournamentSchema = z
  .object({
    title: z.string().trim().min(2, "Enter a title"),
    description: z.string().trim().min(1, "Enter a description"),
    category: z.string().trim().min(1, "Enter a category"),
    format: z.enum(["classical", "rapid", "blitz"]),
    startDate: z.coerce.date({ error: "Enter a valid start date" }),
    endDate: z.coerce.date({ error: "Enter a valid end date" }),
    venue: z.string().trim().min(1, "Enter a venue"),
    city: z.string().trim().min(1, "Enter a city"),
    entryFee: z.coerce.number().int().min(0),
    maxParticipants: z.coerce.number().int().min(1).optional().nullable(),
    registrationDeadline: z.coerce.date({ error: "Enter a valid registration deadline" }),
    posterImageUrl: optionalText,
    brochurePdfUrl: optionalText,
    timeControl: optionalText,
    rounds: z.coerce.number().int().min(1).optional().nullable(),
    prizeStructure: optionalText,
    rulesText: optionalText,
  })
  .refine((data) => data.endDate >= data.startDate, {
    error: "End date must be on or after the start date",
    path: ["endDate"],
  })
  .refine((data) => data.registrationDeadline < data.startDate, {
    error: "Registration deadline must be before the start date",
    path: ["registrationDeadline"],
  });

export type TournamentInput = z.infer<typeof tournamentSchema>;
