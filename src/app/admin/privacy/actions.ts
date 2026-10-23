"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/require-admin";
import { deleteDueAgeProofs } from "@/lib/document-retention";

export type RetentionResult = { ok: boolean; message: string } | null;

/** "Delete now" on /admin/privacy: the same clean-up the daily job runs. */
export async function deleteDueAgeProofsNow(
  _state: RetentionResult,
  formData: FormData
): Promise<RetentionResult> {
  const session = await requireAdminPage();
  if (formData.get("confirm") !== "yes") {
    return { ok: false, message: "Tick the box to confirm first." };
  }
  const { deleted, failed } = await deleteDueAgeProofs({
    type: "admin",
    email: session.user?.email,
  });
  revalidatePath("/admin/privacy");
  revalidatePath("/admin/activity");
  if (failed.length) {
    return {
      ok: false,
      message: `Deleted ${deleted.length}; ${failed.length} couldn't be deleted (they'll be retried by the daily job): ${failed.map((f) => f.error).join(", ")}`,
    };
  }
  return {
    ok: true,
    message: deleted.length
      ? `Deleted ${deleted.length} age proof(s).`
      : "Nothing was due — nothing deleted.",
  };
}
