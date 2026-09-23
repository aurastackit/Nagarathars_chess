import * as XLSX from "xlsx";

export function toXlsxBuffer(
  sheetName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const data = [
    headers,
    ...rows.map((row) => row.map((v) => (v === null || v === undefined ? "" : v))),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
