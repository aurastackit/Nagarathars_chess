import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { toXlsxBuffer } from "@/lib/xlsx";
import { formatDateTimeIST } from "@/lib/format";
import { WAITLIST_INTEREST_LABEL } from "@/lib/validations";

type Table = { name: string; headers: string[]; rows: (string | number | null)[][] };

/** Contact-form messages, newest first. */
export async function contactMessagesTable(): Promise<Table> {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  return {
    name: "Messages",
    headers: ["Received (IST)", "Name", "Email", "Message"],
    rows: messages.map((m) => [formatDateTimeIST(m.createdAt), m.name, m.email, m.message]),
  };
}

/** Online-classes waitlist, newest first. */
export async function waitlistTable(): Promise<Table> {
  const entries = await prisma.classWaitlist.findMany({ orderBy: { createdAt: "desc" } });
  return {
    name: "Waitlist",
    headers: ["Joined (IST)", "Email", "Phone", "Interested in"],
    rows: entries.map((w) => [
      formatDateTimeIST(w.createdAt),
      w.email,
      w.phone ?? "",
      w.interestLevel ? (WAITLIST_INTEREST_LABEL[w.interestLevel] ?? w.interestLevel) : "",
    ]),
  };
}

/**
 * A CSV download. Sent as raw bytes with a non-text content type: Amplify's
 * response layer decodes text/* bodies as text, which silently drops the
 * byte-order mark Excel needs to read Tamil correctly.
 */
export function csvDownload(csv: string, disposition: string) {
  return new NextResponse(new Uint8Array(Buffer.from(csv, "utf8")), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": disposition,
    },
  });
}

/** A table as a CSV or XLSX download named `<filename>-<yyyy-mm-dd>.<ext>`. */
export function exportResponse(table: Table, format: "csv" | "xlsx", filename: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const disposition = `attachment; filename="${filename}-${stamp}.${format}"`;
  if (format === "csv") return csvDownload(toCsv(table.headers, table.rows), disposition);
  return new NextResponse(new Uint8Array(toXlsxBuffer(table.name, table.headers, table.rows)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
