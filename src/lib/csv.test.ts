import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./csv";

test("starts with a UTF-8 BOM and uses CRLF between rows", () => {
  const csv = toCsv(["Name", "Native"], [["முத்து", "நாட்டரசன்கோட்டை"]]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.slice(1), "Name,Native\r\nமுத்து,நாட்டரசன்கோட்டை");
  // Encoded as UTF-8, the file starts with EF BB BF.
  assert.deepEqual([...Buffer.from(csv, "utf8").subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});

test("quotes commas, quotes and line breaks", () => {
  const csv = toCsv(["A"], [['He said "hi", then\nleft'], ["x\r\ny"], [null], [42]]);
  assert.equal(csv.slice(1), 'A\r\n"He said ""hi"", then\nleft"\r\n"x\r\ny"\r\n\r\n42');
});
