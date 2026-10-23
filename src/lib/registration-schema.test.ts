import { test } from "node:test";
import assert from "node:assert/strict";
import { createRegistrationWizardSchema } from "./registration-schema";
import { KOVILS } from "./kovils";

// What the wizard sends end to end is tested in registration-payload.test.ts.

const k = KOVILS[0];
const valid = {
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

test("birth year: text (the form) or a number (what the form submits), 4 digits, a sensible year", () => {
  const parse = (birthYear: unknown) =>
    createRegistrationWizardSchema().safeParse({ ...valid, birthYear });
  assert.ok(parse("2014").success);
  assert.ok(parse(2014).success);
  assert.ok(parse(" 2014 ").success);
  assert.ok(!parse("14").success);
  assert.ok(!parse("1800").success);
  assert.ok(!parse(new Date().getFullYear()).success, "younger than 3");
  assert.ok(!parse(null).success);
});
