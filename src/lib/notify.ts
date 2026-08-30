// Stubbed for the trial phase: logs instead of sending a real email.
// Swap the body of this function for a Resend call later — nothing else needs to change,
// since every call site already awaits this function and only cares that it resolves.
export async function notifyRegistration(params: {
  to: string;
  fullName: string;
  subject: string;
  context: string;
}) {
  console.log(
    `[notify:stub] Would email ${params.to} (${params.fullName}) — "${params.subject}" — ${params.context}`
  );
  return { status: "stubbed" as const };
}
