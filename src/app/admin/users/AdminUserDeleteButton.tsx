"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteAccountAction } from "@/modules/users/actions";
import { AccountDeletionBlocker } from "@/modules/users/types";

function blockerMessage(blocker: AccountDeletionBlocker): string {
  switch (blocker.type) {
    case "disputed_work_records":
      return `${blocker.count} disputa${blocker.count > 1 ? "s" : ""} activa${blocker.count > 1 ? "s" : ""}`;
    case "pending_pro_confirmation_as_professional":
      return `${blocker.count} reclamo${blocker.count > 1 ? "s" : ""} sin respuesta`;
  }
}

export function AdminUserDeleteButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await adminDeleteAccountAction(userId);

      if ("success" in result) {
        router.refresh();
        return;
      }

      if ("blocked" in result) {
        setError(
          `No se puede eliminar: ${result.blockers.map(blockerMessage).join(", ")}.`,
        );
        setConfirming(false);
        return;
      }

      setError(result.error);
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-[12px] font-medium text-sb-error hover:underline"
        >
          Eliminar
        </button>
        {error && (
          <p className="text-[11px] text-sb-error">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-[12px] font-semibold text-sb-error hover:underline disabled:opacity-50"
        >
          {isPending ? "..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-[12px] text-sb-muted hover:underline disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
