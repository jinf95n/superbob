"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  suspendReviewAction,
  liftReviewSuspensionAction,
  deleteReviewAction,
} from "@/modules/reviews/actions";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/ui/Button";

type View =
  | "idle"
  | "confirm_suspend"
  | "confirm_unsuspend"
  | "confirm_delete";

type Props = {
  reviewId: string;
  isSuspended: boolean;
};

const VIEW_LABELS: Record<Exclude<View, "idle">, string> = {
  confirm_suspend: "Suspender reseña",
  confirm_unsuspend: "Levantar suspensión",
  confirm_delete: "Eliminar reseña",
};

export function ReviewModerationPanel({ reviewId, isSuspended }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("idle");
  const [reason, setReason] = useState("");

  const onDone = () => {
    router.refresh();
    setView("idle");
    setReason("");
  };

  const suspendAction = useServerAction(suspendReviewAction, { onSuccess: onDone });
  const unsuspendAction = useServerAction(liftReviewSuspensionAction, { onSuccess: onDone });
  const deleteAction = useServerAction(deleteReviewAction, { onSuccess: onDone });

  const activeAction =
    view === "confirm_suspend"
      ? suspendAction
      : view === "confirm_unsuspend"
        ? unsuspendAction
        : deleteAction;

  const canSubmit = reason.trim().length >= 3;

  const handleSubmit = () => {
    if (!canSubmit) return;
    activeAction.execute({ reviewId, reason: reason.trim() });
  };

  if (view === "idle") {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {isSuspended ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setView("confirm_unsuspend")}
          >
            Levantar suspensión
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setView("confirm_suspend")}
          >
            Suspender
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={() => setView("confirm_delete")}
        >
          Eliminar
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded border border-sb-border bg-sb-surface/60 p-3 dark:border-sb-border-dark dark:bg-sb-surface-dark/60">
      <p className="mb-2 text-xs font-medium">{VIEW_LABELS[view as Exclude<View, "idle">]}</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Motivo (mínimo 3 caracteres)..."
        className="mb-2 w-full rounded border border-sb-border px-2 py-1.5 text-xs dark:border-sb-border-dark"
      />
      {activeAction.isError && (
        <p className="mb-1 text-xs text-sb-error">{activeAction.error}</p>
      )}
      <div className="flex gap-1.5">
        <Button
          variant={view === "confirm_delete" ? "danger" : "primary"}
          size="sm"
          isPending={activeAction.isPending}
          isSuccess={activeAction.isSuccess}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Confirmar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setView("idle");
            setReason("");
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
