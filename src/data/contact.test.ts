import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_MESSAGE_MAX,
  WHATSAPP_NUMBER,
  contactWhatsappText,
  whatsappLink,
} from "./contact";

test("contactWhatsappText: name, email and message; long messages trimmed; link-safe", () => {
  assert.equal(
    contactWhatsappText({ name: "  Meena R ", email: " meena@example.com ", message: " When? \n" }),
    "Hi, I'm Meena R (meena@example.com). When?"
  );

  const long = contactWhatsappText({ name: "A", email: "a@b.co", message: "x".repeat(2000) });
  const body = long.slice("Hi, I'm A (a@b.co). ".length);
  assert.equal(body.length, WHATSAPP_MESSAGE_MAX);
  assert.ok(body.endsWith("…"));
  assert.equal(
    contactWhatsappText({ name: "A", email: "a@b.co", message: "y".repeat(WHATSAPP_MESSAGE_MAX) }),
    `Hi, I'm A (a@b.co). ${"y".repeat(WHATSAPP_MESSAGE_MAX)}`,
    "exactly the limit is kept whole"
  );

  const text = contactWhatsappText({ name: "R&K", email: "r+k@x.in", message: "Fee 100%? #U11" });
  const url = new URL(whatsappLink(text));
  assert.equal(url.searchParams.get("text"), text);
  assert.ok(!url.search.includes("&K") && !url.search.includes("#"), "special characters encoded");
});

test("whatsappLink: digits-only number and an encoded message", () => {
  assert.match(WHATSAPP_NUMBER, /^91\d{10}$/);
  assert.equal(
    whatsappLink("Hi, a question about U-11 & fees? 100%"),
    "https://wa.me/919500119200?text=Hi%2C%20a%20question%20about%20U-11%20%26%20fees%3F%20100%25"
  );
  const url = new URL(whatsappLink("Nagarathar's — 4 Jan\nline 2"));
  assert.equal(url.searchParams.get("text"), "Nagarathar's — 4 Jan\nline 2");
});
