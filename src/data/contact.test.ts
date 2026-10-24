import { test } from "node:test";
import assert from "node:assert/strict";
import { WHATSAPP_NUMBER, whatsappLink } from "./contact";

test("whatsappLink: digits-only number and an encoded message", () => {
  assert.match(WHATSAPP_NUMBER, /^91\d{10}$/);
  assert.equal(
    whatsappLink("Hi, a question about U-11 & fees? 100%"),
    "https://wa.me/919500119200?text=Hi%2C%20a%20question%20about%20U-11%20%26%20fees%3F%20100%25"
  );
  const url = new URL(whatsappLink("Nagarathar's — 4 Jan\nline 2"));
  assert.equal(url.searchParams.get("text"), "Nagarathar's — 4 Jan\nline 2");
});
