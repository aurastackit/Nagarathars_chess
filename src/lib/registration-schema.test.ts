import { test } from "node:test";
import assert from "node:assert/strict";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRegistrationWizardSchema } from "./registration-schema";
import { KOVILS } from "./kovils";

const k = KOVILS[0];
/** The wizard's form state: every input holds text. */
const formState = {
  fullName: "Test Player",
  email: "player@example.com",
  phone: "9876543210",
  birthYear: "2014",
  gender: "male",
  city: "Chennai",
  address: "1 Test Street",
  rating: "",
  fideId: "",
  fatherName: "Father Name",
  motherName: "Mother Name",
  fatherGrandparents: "Grand Parents",
  motherGrandparents: "Grand Parents",
  native: "Karaikudi",
  kovil: k.label,
  pirivu: k.pirivus[0],
  motherNative: "Devakottai",
  motherKovil: k.label,
  motherPirivu: k.pirivus[0],
  sangamMember: false,
  sangamRelativeName: "",
  ageProofType: "school_id",
  ageProofKey: "registrations/x/ageProof-1.jpg",
  passportPhotoKey: "registrations/x/passportPhoto-1.jpg",
  consentAccepted: true,
  guardianName: "Parent Name",
  guardianConsent: true,
};

type ResolverFn = (
  values: unknown,
  context: unknown,
  options: unknown
) => Promise<{ values: Record<string, unknown>; errors: Record<string, unknown> }>;

test("what the wizard submits is accepted by the register API (regression: birthYear arrived as a number)", async () => {
  // The wizard: react-hook-form hands onSubmit the resolver's parsed values, and posts them as JSON.
  const resolver = zodResolver(createRegistrationWizardSchema() as never) as unknown as ResolverFn;
  const submitted = await resolver(formState, undefined, {
    fields: {},
    shouldUseNativeValidation: false,
  });
  assert.deepEqual(submitted.errors, {});
  assert.equal(submitted.values.birthYear, 2014);
  // The register route parses the posted body with the same schema.
  const posted = JSON.parse(JSON.stringify(submitted.values));
  const api = createRegistrationWizardSchema().safeParse(posted);
  assert.ok(api.success, api.success ? "" : JSON.stringify(api.error.issues));
  assert.equal(api.data.birthYear, 2014);
});

test("birth year: text or number, 4 digits, a sensible year", () => {
  const parse = (birthYear: unknown) =>
    createRegistrationWizardSchema().safeParse({ ...formState, birthYear });
  assert.ok(parse("2014").success);
  assert.ok(parse(2014).success);
  assert.ok(parse(" 2014 ").success);
  assert.ok(!parse("14").success);
  assert.ok(!parse("1800").success);
  assert.ok(!parse(new Date().getFullYear()).success, "younger than 3");
  assert.ok(!parse(null).success);
});
