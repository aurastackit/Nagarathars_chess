import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { requireAdminPage } from "@/lib/require-admin";
import { formatDateTimeIST } from "@/lib/format";
import { ExportLinks } from "@/components/admin/export-links";

export const dynamic = "force-dynamic";

/** Read-only inbox for the public contact form. */
export default async function AdminMessagesPage() {
  await requireAdminPage();
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Messages</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {messages.length} {messages.length === 1 ? "message" : "messages"} from the contact
            form, newest first. Reply from your own email.
          </p>
        </div>
        {messages.length > 0 && (
          <ExportLinks csv="/admin/messages/messages.csv" xlsx="/admin/messages/messages.xlsx" />
        )}
      </div>

      {messages.length === 0 ? (
        <EmptyState className="mt-6" message="No messages from the contact form yet." />
      ) : (
        <ul className="mt-6 space-y-4">
          {messages.map((m) => (
            <li key={m.id}>
              <Card padding="md">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-semibold text-charcoal">
                    {m.name}{" "}
                    <a
                      href={`mailto:${m.email}`}
                      className="break-all text-sm font-medium text-gold-ink hover:underline"
                    >
                      {m.email}
                    </a>
                  </p>
                  <time dateTime={m.createdAt.toISOString()} className="text-xs text-foreground/50">
                    {formatDateTimeIST(m.createdAt)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-foreground/80">
                  {m.message}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
