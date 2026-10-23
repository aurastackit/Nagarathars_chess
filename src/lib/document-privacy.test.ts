import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { File } from "node:buffer";
import { checkFileContent, detectFileType, typeFromKey } from "./file-signature";
import { inspectFile } from "./upload-checks";
import { OTP_SEND_LIMITS, otpSendLimitMessage } from "./otp";
import {
  DEFAULT_AGE_PROOF_RETENTION_DAYS,
  ageProofDeleteOn,
  ageProofRetentionDays,
  dueCutoff,
  isAgeProofDue,
} from "./retention";
import { DOCUMENT_URL_TTL_SECONDS, UPLOAD_URL_TTL_SECONDS } from "./upload-limits";
import { emailSamples } from "./email/samples";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...Buffer.from(p)] : p)));
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10], "JFIF");
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d], "IHDR");
const WEBP = bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 ");
const PDF = bytes("%PDF-1.7\n%âãÏÓ\n1 0 obj");

test("file type comes from the content, not the name", () => {
  assert.equal(detectFileType(JPEG), "image/jpeg");
  assert.equal(detectFileType(PNG), "image/png");
  assert.equal(detectFileType(WEBP), "image/webp");
  assert.equal(detectFileType(PDF), "application/pdf");
  assert.equal(
    detectFileType(bytes("\n\n  ", [...PDF])),
    "application/pdf",
    "PDF after a little junk"
  );
  assert.equal(detectFileType(bytes("<!doctype html><script>alert(1)</script>")), null);
  assert.equal(detectFileType(bytes("RIFF....WAVEfmt ")), null, "a WAV is RIFF but not WEBP");
  assert.equal(detectFileType(bytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])), null, "GIF");
  assert.equal(detectFileType(new Uint8Array()), null);

  assert.ok(checkFileContent("ageProof", PDF).ok);
  assert.ok(!checkFileContent("passportPhoto", PDF).ok, "a PDF is no photo");
  assert.match(
    (checkFileContent("passportPhoto", bytes("hello")) as { message: string }).message,
    /isn't a real JPG, PNG or WEBP image/
  );
  assert.equal(typeFromKey("registrations/x/ageProof-1.pdf"), "application/pdf");
  assert.equal(typeFromKey("registrations/x/passportPhoto-1.jpg"), "image/jpeg");
  assert.equal(typeFromKey("registrations/x/thing.exe"), null);
});

test("a chosen file is judged by its content", async () => {
  const fake = new File(["just some text"], "photo.jpg", { type: "image/jpeg" });
  const r1 = await inspectFile("passportPhoto", fake as unknown as globalThis.File);
  assert.ok("problem" in r1 && /isn't a real/.test(r1.problem), "text renamed to .jpg");

  const pngNamedJpg = new File([PNG], "scan.jpg", { type: "image/jpeg" });
  const r2 = await inspectFile("ageProof", pngNamedJpg as unknown as globalThis.File);
  assert.ok("file" in r2 && r2.file.type === "image/png", "typed by what it really is");

  const noType = new File([PDF], "birth-certificate", { type: "" });
  const r3 = await inspectFile("ageProof", noType as unknown as globalThis.File);
  assert.ok("file" in r3 && r3.file.type === "application/pdf", "no extension is fine");

  const bigPdf = new File([PDF, new Uint8Array(2 * 1024 * 1024)], "a.pdf", {
    type: "application/pdf",
  });
  const r4 = await inspectFile("ageProof", bigPdf as unknown as globalThis.File);
  assert.ok("problem" in r4 && /must be under 1 MB/.test(r4.problem));
});

test("sign-in codes per email: 3 in 10 minutes, 10 a day", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  const ago = (min: number) => new Date(now.getTime() - min * 60_000);
  assert.equal(otpSendLimitMessage([], now), null);
  assert.equal(otpSendLimitMessage([ago(1), ago(2)], now), null);
  assert.equal(otpSendLimitMessage([ago(1), ago(2), ago(3)], now), OTP_SEND_LIMITS[0].message);
  assert.equal(otpSendLimitMessage([ago(11), ago(12), ago(13)], now), null, "older than 10 min");
  const spread = Array.from({ length: 10 }, (_, i) => ago(30 + i * 60));
  assert.equal(otpSendLimitMessage(spread, now), OTP_SEND_LIMITS[1].message);
  assert.equal(
    otpSendLimitMessage(spread.slice(1).concat(ago(25 * 60)), now),
    null,
    "older than a day"
  );
});

test("age proofs: kept 90 days after the tournament unless configured", () => {
  assert.equal(ageProofRetentionDays(undefined), DEFAULT_AGE_PROOF_RETENTION_DAYS);
  assert.equal(DEFAULT_AGE_PROOF_RETENTION_DAYS, 90);
  assert.equal(ageProofRetentionDays("30"), 30);
  for (const bad of ["", "0", "-5", "abc", "2.5", "99999"]) {
    assert.equal(ageProofRetentionDays(bad), 90, bad);
  }
  const end = new Date("2026-12-27T00:00:00Z");
  assert.equal(ageProofDeleteOn(end, 90).toISOString(), "2027-03-27T00:00:00.000Z");
  assert.ok(!isAgeProofDue(end, 90, new Date("2027-03-26T23:59:59Z")));
  assert.ok(isAgeProofDue(end, 90, new Date("2027-03-27T00:00:00Z")));
  assert.equal(dueCutoff(90, new Date("2027-03-27T00:00:00Z")).toISOString(), end.toISOString());
});

test("signed document links are short-lived (5 minutes at most)", () => {
  assert.ok(UPLOAD_URL_TTL_SECONDS <= 300);
  assert.ok(DOCUMENT_URL_TTL_SECONDS <= 300);
});

const source = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? source(join(dir, e.name))
      : /\.tsx?$/.test(e.name) && !e.name.includes(".test.")
        ? [readFileSync(join(dir, e.name), "utf8")]
        : []
  );

test("age proofs never go into emails, ID cards or exports", () => {
  // Emails and ID cards don't touch the age proof at all…
  for (const dir of ["src/lib/email", "src/lib/id-card"]) {
    for (const code of source(dir)) assert.doesNotMatch(code, /ageProof|aadhaar/i, dir);
  }
  // …and no rendered email carries a document link.
  for (const s of emailSamples()) {
    for (const out of [s.content.html, s.content.text]) {
      assert.doesNotMatch(
        out,
        /api\/admin\/uploads|amazonaws\.com|X-Amz-|(ageProof|passportPhoto)-[0-9a-f]{8}/,
        s.key
      );
    }
  }
  // Exports say only whether a document was uploaded.
  const exportLines = readFileSync("src/lib/player-list.ts", "utf8")
    .split("\n")
    .filter((l) => /ageProofKey|aadhaarImageData|passportPhotoKey|passportPhotoData/.test(l));
  assert.ok(exportLines.length > 0);
  for (const l of exportLines) assert.match(l, /\? "Yes" : "No"/, l.trim());
});
