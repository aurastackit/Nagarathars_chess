"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/modal";
import { Button, Input, Label } from "@/components/ui";

export type DeleteTournamentState = { error?: string } | null;

/**
 * Delete with a typed confirmation. A tournament with registrations can't be
 * deleted at all — the dialog says so instead of the button silently doing nothing.
 */
export function DeleteTournamentButton({
  title,
  registrations,
  action,
}: {
  title: string;
  registrations: number;
  action: (state: DeleteTournamentState, formData: FormData) => Promise<DeleteTournamentState>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, formAction, pending] = useActionState(action, null);
  const close = () => {
    setOpen(false);
    setTyped("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-red-600 hover:underline"
      >
        Delete
      </button>
      {open && (
        <Modal title="Delete tournament?" onClose={close}>
          {registrations > 0 ? (
            <div className="space-y-4 text-sm text-foreground/80">
              <p>
                <strong className="text-charcoal">{title}</strong> has {registrations}{" "}
                {registrations === 1 ? "registration" : "registrations"}, so it can&apos;t be
                deleted. Unpublish it or set its status to Closed instead.
              </p>
              <Button type="button" variant="outline" onClick={close}>
                OK
              </Button>
            </div>
          ) : (
            <form action={formAction} className="space-y-4 text-sm text-foreground/80">
              <p>
                This permanently deletes <strong className="text-charcoal">{title}</strong> and its
                rounds and results. Gallery photos linked to it are kept but unlinked.
              </p>
              <div>
                <Label htmlFor="confirm-title">Type the tournament title to confirm</Label>
                <Input
                  id="confirm-title"
                  name="confirmTitle"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              {state?.error && (
                <p role="alert" className="text-red-600">
                  {state.error}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="dark"
                  disabled={pending || typed.trim() !== title.trim()}
                  className="!bg-red-700 hover:!bg-red-800"
                >
                  {pending ? "Deleting…" : "Delete permanently"}
                </Button>
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
