import { HONEYPOT_FIELD } from "@/lib/honeypot";
import type { RegistrationWizardOutput } from "@/lib/registration-schema";

/**
 * The JSON body the registration wizard posts to the register API: the form's
 * values as its resolver hands them to onSubmit (the schema's parsed output),
 * plus the honeypot field. The wizard and the payload test both build it here,
 * so the test checks exactly what players' browsers send.
 */
export function buildRegisterPayload(values: RegistrationWizardOutput, honeypot: string) {
  return { ...values, [HONEYPOT_FIELD]: honeypot };
}
