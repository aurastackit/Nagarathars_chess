import { test } from "node:test";
import assert from "node:assert/strict";
import { signPlayerToken, verifyPlayerToken, PLAYER_SESSION_HOURS } from "./player-token";
import {
  canPlayerEdit,
  canPlayerWithdraw,
  fieldsNeedingAttention,
  isAcceptableUploadKey,
  nextStep,
  registrationToFormValues,
} from "./self-service";
import { REASON_TEMPLATES } from "./registration-review";
import {
  FRAME,
  centreOnFace,
  clampCenter,
  coverScale,
  initialPlacement,
  sourceRect,
  zoomAroundMiddle,
} from "./photo-crop";
import { checkBeforeUpload, formatBytes } from "./upload-checks";

test("player session token: email round-trip, tamper-proof, expires", () => {
  const t0 = Date.UTC(2026, 9, 23, 6, 0);
  const token = signPlayerToken("  Parent@Example.com ", "s3cret", t0);
  assert.equal(verifyPlayerToken(token, "s3cret", t0 + 60_000), "parent@example.com");
  assert.equal(verifyPlayerToken(token, "other", t0), null, "other secret");
  const [email, exp, sig] = token.split(".");
  const forged = `${Buffer.from("someone@else.com").toString("base64url")}.${exp}.${sig}`;
  assert.equal(verifyPlayerToken(forged, "s3cret", t0), null, "swapped email");
  assert.equal(
    verifyPlayerToken(`${email}.${Number(exp) + 3600}.${sig}`, "s3cret", t0),
    null,
    "longer expiry"
  );
  assert.equal(
    verifyPlayerToken(token, "s3cret", t0 + (PLAYER_SESSION_HOURS * 3600 + 1) * 1000),
    null,
    "expired"
  );
  assert.equal(verifyPlayerToken(undefined, "s3cret"), null);
  assert.equal(verifyPlayerToken("garbage", "s3cret"), null);
  assert.equal(verifyPlayerToken(token, "", t0), null, "no secret configured");
});

test("who may edit or withdraw, and when", () => {
  const start = new Date("2026-12-27T00:00:00Z");
  const end = new Date("2026-12-27T00:00:00Z");
  const before = new Date("2026-12-20T00:00:00Z");
  for (const s of ["pending", "changes_requested", "rejected"])
    assert.ok(canPlayerEdit(s, start, before), s);
  for (const s of ["confirmed", "withdrawn", "registered"])
    assert.ok(!canPlayerEdit(s, start, before), s);
  assert.ok(!canPlayerEdit("pending", start, new Date("2026-12-27T01:00:00Z")), "after the start");
  for (const s of ["pending", "confirmed", "changes_requested", "rejected"])
    assert.ok(canPlayerWithdraw(s, end, before), s);
  assert.ok(!canPlayerWithdraw("withdrawn", end, before));
  assert.ok(
    !canPlayerWithdraw("confirmed", end, new Date("2026-12-28T00:00:00Z")),
    "after the end"
  );
  for (const s of ["pending", "changes_requested", "rejected", "confirmed", "withdrawn"])
    assert.ok(nextStep(s).length > 20);
});

test("fields needing attention, from the organisers' note", () => {
  assert.deepEqual(fieldsNeedingAttention(null), []);
  assert.deepEqual(fieldsNeedingAttention("Please upload a clear, front-facing passport photo."), [
    "passportPhotoKey",
  ]);
  assert.deepEqual(fieldsNeedingAttention("The age proof is hard to read."), [
    "ageProofType",
    "ageProofKey",
  ]);
  assert.deepEqual(
    new Set(fieldsNeedingAttention("The year of birth on the form doesn't match the age proof.")),
    new Set(["ageProofType", "ageProofKey", "birthYear"])
  );
  assert.deepEqual(fieldsNeedingAttention("Please add your kovil and pirivu."), [
    "kovil",
    "motherKovil",
    "pirivu",
    "motherPirivu",
  ]);
  assert.deepEqual(
    fieldsNeedingAttention(
      "Please complete the family details (father's and mother's grandparents)."
    ),
    ["fatherGrandparents", "motherGrandparents"]
  );
  // Every changes template points at something.
  for (const t of REASON_TEMPLATES.changes) assert.ok(fieldsNeedingAttention(t).length > 0, t);
});

test("a stored registration becomes the update form's values", () => {
  const v = registrationToFormValues({
    fullName: "Meena",
    email: "Meena@Example.com",
    phone: "+91 98765 43210",
    dob: new Date(Date.UTC(2014, 0, 1)),
    gender: "female",
    city: "Chennai",
    address: null,
    rating: 1450,
    fideId: null,
    fatherName: "F",
    motherName: "M",
    fatherGrandparents: null,
    motherGrandparents: null,
    native: "Karaikudi",
    kovil: null,
    pirivu: null,
    motherNative: null,
    motherKovil: null,
    motherPirivu: null,
    sangamMember: false,
    sangamRelativeName: null,
    ageProofType: "legacy_value",
    ageProofKey: "registrations/x/ageProof-1.jpg",
    passportPhotoKey: null,
    consentAccepted: true,
    guardianName: "F",
    guardianConsent: true,
  });
  assert.equal(v.phone, "9876543210");
  assert.equal(v.birthYear, "2014");
  assert.equal(v.rating, "1450");
  assert.equal(v.address, "");
  assert.equal(v.ageProofType, "", "unknown types are cleared so the form asks again");
  assert.equal(v.passportPhotoKey, "");
});

test("upload keys: the current file or a fresh upload for the same tournament and kind", () => {
  const fresh = "registrations/open-2026/passportPhoto-0f6a2fa9-4257-437a-82c0-c8557ad8824b.jpg";
  assert.ok(isAcceptableUploadKey(fresh, "passportPhoto", "open-2026", null));
  assert.ok(
    isAcceptableUploadKey("anything-on-record", "passportPhoto", "open-2026", "anything-on-record")
  );
  assert.ok(!isAcceptableUploadKey(fresh, "ageProof", "open-2026", null), "other kind");
  assert.ok(!isAcceptableUploadKey(fresh, "passportPhoto", "other-2026", null), "other tournament");
  assert.ok(
    !isAcceptableUploadKey(
      "registrations/open-2026/../secret.jpg",
      "passportPhoto",
      "open-2026",
      null
    )
  );
});

test("photo crop: always covers the frame, centres a face, zooms around the middle", () => {
  const img = { w: 1200, h: 900 };
  const s = coverScale(img);
  assert.equal(s, FRAME.h / img.h, "landscape: height fits");
  const start = initialPlacement(img);
  const r = sourceRect(start.center, img, start.zoom);
  assert.ok(r.sx >= 0 && r.sy >= 0 && r.sx + r.sw <= img.w + 1e-6 && r.sy + r.sh <= img.h + 1e-6);
  assert.ok(Math.abs(r.sw / r.sh - FRAME.w / FRAME.h) < 1e-9, "4:5 crop");
  // Dragging far away is stopped at the edge.
  const clamped = clampCenter({ x: 10_000, y: -10_000 }, img, 1);
  const edge = sourceRect(clamped, img, 1);
  assert.ok(Math.abs(edge.sx) < 1e-6 && Math.abs(edge.sy + edge.sh - img.h) < 1e-6);
  // A face on the right of the photo ends up in the oval.
  const face = { x: 800, y: 200, width: 200, height: 240 };
  const placed = centreOnFace(face, img);
  const crop = sourceRect(placed.center, img, placed.zoom);
  const fx = (face.x + face.width / 2 - crop.sx) / crop.sw;
  const fy = (face.y + face.height / 2 - crop.sy) / crop.sh;
  assert.ok(
    Math.abs(fx - 0.5) < 0.05 && Math.abs(fy - 0.43) < 0.05,
    `face at ${fx.toFixed(2)}, ${fy.toFixed(2)}`
  );
  assert.ok(placed.zoom > 1);
  const z = zoomAroundMiddle(start.center, img, 1, 10);
  assert.equal(z.zoom, 4, "zoom is capped");
});

test("upload checks in the browser: type, PDF size, absurd images", () => {
  assert.equal(
    checkBeforeUpload("passportPhoto", { type: "image/jpeg", size: 5_000_000 }),
    null,
    "big photos are shrunk"
  );
  assert.match(
    checkBeforeUpload("passportPhoto", { type: "application/pdf", size: 1000 })!,
    /photo must be a JPG, PNG or WEBP/
  );
  assert.match(
    checkBeforeUpload("ageProof", { type: "application/pdf", size: 2 * 1024 * 1024 })!,
    /This PDF is 2\.0 MB — it must be under 1 MB/
  );
  assert.equal(checkBeforeUpload("ageProof", { type: "application/pdf", size: 900 * 1024 }), null);
  assert.match(
    checkBeforeUpload("ageProof", { type: "image/png", size: 30 * 1024 * 1024 })!,
    /too large to process/
  );
  assert.match(
    checkBeforeUpload("ageProof", { type: "text/plain", size: 10 })!,
    /age proof must be/
  );
  assert.equal(formatBytes(1536), "2 KB");
  assert.equal(formatBytes(3 * 1024 * 1024), "3.0 MB");
});
