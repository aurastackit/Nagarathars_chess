import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRegistrationWizardSchema,
  type RegistrationWizardOutput,
  type RegistrationWizardValues,
} from "./registration-schema";
import { buildRegisterPayload } from "./registration-payload";
import { isHoneypotTriggered } from "./honeypot";
import { KOVILS } from "./kovils";

/**
 * Guards the contract between the registration wizard and the register API
 * (on 14 Oct a mismatch made every submission fail). It builds the request
 * exactly as the wizard does — the form's text values through the wizard's
 * resolver, then buildRegisterPayload — and checks the API's schema accepts it.
 * The same payload is kept in scripts/fixtures/register-dry-run.json for the
 * daily live dry-run (.github/workflows/daily-jobs.yml).
 */

const FIXTURE = path.join(process.cwd(), "scripts/fixtures/register-dry-run.json");
const k = KOVILS[0];

/** The wizard's form state just before Submit: every input holds text, as in the browser. */
const formState: RegistrationWizardValues = {
  fullName: "Dry Run Player",
  email: "dry-run@example.com",
  phone: "9876543210",
  birthYear: "2014",
  gender: "female",
  city: "Chennai",
  address: "1, Test Street, Chennai",
  rating: "",
  fideId: "",
  fatherName: "Test Father",
  motherName: "Test Mother",
  fatherGrandparents: "Test Grandfather and Test Grandmother",
  motherGrandparents: "Test Grandparents",
  native: "Karaikudi",
  kovil: k.label,
  pirivu: k.pirivus[0],
  motherNative: "Devakottai",
  motherKovil: k.label,
  motherPirivu: k.pirivus[0],
  sangamMember: false,
  sangamRelativeName: "",
  ageProofType: "school_id",
  ageProofKey: "registrations/dry-run/ageProof-00000000-0000-0000-0000-000000000000.jpg",
  passportPhotoKey: "registrations/dry-run/passportPhoto-00000000-0000-0000-0000-000000000000.jpg",
  consentAccepted: true,
  guardianName: "Test Parent",
  guardianConsent: true,
};

type ResolverFn = (
  values: unknown,
  context: unknown,
  options: unknown
) => Promise<{ values: RegistrationWizardOutput; errors: Record<string, unknown> }>;

async function wizardPayload() {
  // Same resolver as the wizard's useForm; react-hook-form gives onSubmit these values.
  const resolver = zodResolver(createRegistrationWizardSchema() as never) as unknown as ResolverFn;
  const { values, errors } = await resolver(formState, undefined, {
    fields: {},
    shouldUseNativeValidation: false,
  });
  assert.deepEqual(errors, {}, "the wizard's own validation should pass");
  // What fetch sends: JSON of the wizard's payload (an empty honeypot from a real person).
  return JSON.parse(JSON.stringify(buildRegisterPayload(values, "")));
}

test("the register API's schema accepts exactly what the wizard sends", async () => {
  const payload = await wizardPayload();
  assert.equal(isHoneypotTriggered(payload), false);
  const parsed = createRegistrationWizardSchema().safeParse(payload);
  assert.ok(
    parsed.success,
    parsed.success
      ? ""
      : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
  );
});

test("the live dry-run fixture is what the wizard sends today (UPDATE_FIXTURES=1 npm test to refresh)", async () => {
  const payload = await wizardPayload();
  if (process.env.UPDATE_FIXTURES) {
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, `${JSON.stringify(payload, null, 2)}\n`);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(FIXTURE, "utf8")), payload);
});
