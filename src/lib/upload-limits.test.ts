import { test } from "node:test";
import assert from "node:assert/strict";
import { formatUploadLimit, isAllowedUpload } from "./upload-limits";

test("age proof: images and PDF up to 1 MB", () => {
  assert.equal(isAllowedUpload("ageProof", "application/pdf", 1024 * 1024), true);
  assert.equal(isAllowedUpload("ageProof", "application/pdf", 1024 * 1024 + 1), false);
  assert.equal(isAllowedUpload("ageProof", "image/gif", 1000), false);
});

test("passport photo: images only, up to 512 KB", () => {
  assert.equal(isAllowedUpload("passportPhoto", "image/jpeg", 512 * 1024), true);
  assert.equal(isAllowedUpload("passportPhoto", "image/jpeg", 512 * 1024 + 1), false);
  assert.equal(isAllowedUpload("passportPhoto", "application/pdf", 1000), false);
});

test("empty or fractional sizes are rejected", () => {
  assert.equal(isAllowedUpload("ageProof", "image/png", 0), false);
  assert.equal(isAllowedUpload("ageProof", "image/png", 10.5), false);
});

test("limits read naturally", () => {
  assert.equal(formatUploadLimit("ageProof"), "1 MB");
  assert.equal(formatUploadLimit("passportPhoto"), "512 KB");
});
