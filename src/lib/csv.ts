/**
 * CSV for spreadsheet apps. Starts with a UTF-8 byte-order mark so Excel reads
 * Tamil (and any non-English) text correctly instead of showing mojibake, and
 * uses CRLF line endings, which Excel expects.
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))];
  return "﻿" + lines.join("\r\n");
}
