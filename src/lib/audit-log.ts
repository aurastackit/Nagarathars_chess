import { prisma } from "@/lib/prisma";

export type AdminAction =
  | "tournament.create"
  | "tournament.update"
  | "tournament.publish"
  | "tournament.unpublish"
  | "tournament.delete"
  | "registration.confirm"
  | "registration.reject"
  | "class.create"
  | "class.update";

/** Records an admin action. Never throws — a logging failure shouldn't block the action itself. */
export async function logAdminAction(params: {
  actorEmail: string;
  action: AdminAction;
  targetType: "Tournament" | "Registration" | "ClassProgram";
  targetId: string;
  summary: string;
}) {
  try {
    await prisma.adminActivityLog.create({ data: params });
  } catch (err) {
    console.error("[audit-log] failed to record admin action", params.action, err);
  }
}
