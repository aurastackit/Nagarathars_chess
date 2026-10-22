import { test } from "node:test";
import assert from "node:assert/strict";
import { CARD_H, CARD_W, NAME_BOX_W, eventLine, fitName, maskMobile, nameWidth } from "./layout";
import { VERIFY_TOKEN_PATTERN, newVerifyToken } from "./verify-token";

test("CR80 portrait is 54 × 86 mm", () => {
  assert.equal(CARD_W.toFixed(2), "153.07");
  assert.equal(CARD_H.toFixed(2), "243.78");
});

test("mobile shows only the last four digits", () => {
  assert.equal(maskMobile("9876541000"), "••••••1000");
  assert.equal(maskMobile("+91 98765 41000"), "••••••1000");
  assert.equal(maskMobile("12"), "—");
});

test("a short name gets the largest size on one line", () => {
  assert.deepEqual(fitName("Palaniappan RM"), { size: 13, lines: ["Palaniappan RM"] });
});

test("a very long name shrinks to fit two lines, never wider than the box", () => {
  const { size, lines } = fitName("Ramanathan Chettiar Subramaniam Venkatachalam Annamalai");
  assert.ok(lines.length <= 2, `lines: ${lines.join(" / ")}`);
  assert.ok(size < 13);
  for (const l of lines) assert.ok(nameWidth(l, size) <= NAME_BOX_W + 0.01, l);
});

test("an absurdly long name is cut with an ellipsis at 7 pt", () => {
  const { size, lines } = fitName("Aaaaaaaaaa ".repeat(20));
  assert.equal(size, 7);
  assert.equal(lines.length, 2);
  assert.ok(lines[1].endsWith("…"));
});

test("Tamil names are measured with the Tamil font (non-zero width, fits)", () => {
  const w = nameWidth("முத்து கருப்பன்", 12);
  assert.ok(w > 40 && w < 200, `width ${w}`);
  assert.ok(fitName("முத்து கருப்பன் சுப்பிரமணியன்").lines.length <= 2);
});

test("verify tokens: random, 16 URL-safe chars, accepted by the pattern", () => {
  const tokens = new Set(Array.from({ length: 1000 }, () => newVerifyToken()));
  assert.equal(tokens.size, 1000);
  for (const t of tokens) {
    assert.match(t, /^[A-Za-z0-9_-]{16}$/);
    assert.ok(VERIFY_TOKEN_PATTERN.test(t));
  }
  // The migration backfill: base64url of a UUID's 16 bytes, 22 chars.
  assert.ok(VERIFY_TOKEN_PATTERN.test("q83vEjRWeJASNFZ4kBI0Vg"));
  assert.ok(!VERIFY_TOKEN_PATTERN.test("not a token"));
  assert.ok(!VERIFY_TOKEN_PATTERN.test("short"));
});

test("event line: date in IST and city", () => {
  // 18:30 UTC on 26 Dec is 00:00 IST on 27 Dec.
  assert.equal(
    eventLine(new Date("2026-12-26T18:30:00Z"), null, "Chennai"),
    "27 Dec 2026 · Chennai"
  );
  const d = new Date("2026-12-27T04:00:00Z");
  assert.equal(eventLine(d, d, " Chennai "), "27 Dec 2026 · Chennai");
  assert.equal(
    eventLine(d, new Date("2026-12-28T04:00:00Z"), "Karaikudi"),
    "27–28 Dec 2026 · Karaikudi"
  );
  assert.equal(
    eventLine(new Date("2026-11-30T04:00:00Z"), new Date("2026-12-01T04:00:00Z"), null),
    "30 Nov – 1 Dec 2026"
  );
  assert.equal(
    eventLine(new Date("2026-12-31T04:00:00Z"), new Date("2027-01-01T04:00:00Z"), ""),
    "31 Dec 2026 – 1 Jan 2027"
  );
});

test("detail lines shrink, then truncate, never overflowing", async () => {
  const { fitLine } = await import("./layout");
  assert.deepEqual(fitLine("Karaikudi", 62), { size: 6.2, text: "Karaikudi" });
  const tamil = fitLine("நாட்டரசன்கோட்டை", 62);
  assert.ok(tamil.size < 6.2 && nameWidth(tamil.text, tamil.size) <= 62, JSON.stringify(tamil));
  const long = fitLine("Kandanur Puduvayal Kothamangalam Pallathur", 62);
  assert.equal(long.size, 4.6);
  assert.ok(long.text.endsWith("…") && nameWidth(long.text, 4.6) <= 62);
});

test("a name that wraps stays small enough for two lines in the 27 pt box", () => {
  const fit = fitName("மீனாட்சி Annamalai Ramanathan");
  assert.equal(fit.lines.length, 2);
  assert.ok(fit.size <= 11.5, `size ${fit.size}`);
  assert.ok(fit.lines.length * fit.size * 1.08 <= 27);
});
