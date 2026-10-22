import { test } from "node:test";
import assert from "node:assert/strict";
import { adminCallbackPath } from "./safe-redirect";

test("admin paths are kept, with their query", () => {
  assert.equal(adminCallbackPath("/admin/tournaments/abc"), "/admin/tournaments/abc");
  assert.equal(adminCallbackPath("/admin/tournaments/abc/results?x=1"), "/admin/tournaments/abc/results?x=1");
  assert.equal(adminCallbackPath("/admin"), "/admin");
});

test("other origins and protocol-relative tricks fall back to the dashboard", () => {
  for (const bad of [
    "https://evil.example/admin",
    "//evil.example/admin",
    "/\\evil.example/admin",
    "javascript:alert(1)",
    "/admin@evil.example",
    "",
    null,
    undefined,
  ]) {
    assert.equal(adminCallbackPath(bad), "/admin", String(bad));
  }
});

test("public pages and the login page itself fall back too", () => {
  assert.equal(adminCallbackPath("/tournaments"), "/admin");
  assert.equal(adminCallbackPath("/administrator"), "/admin");
  assert.equal(adminCallbackPath("/admin/login"), "/admin");
});
