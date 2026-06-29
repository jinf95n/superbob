"use client";

import { useState } from "react";
import Link from "next/link";
import { respondToWorkRecordAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";

type RespondToClaimFormProps = {
  workRecordId: string;
  clientName: string;
};

type ResponseOutcome = "confirmed" | "disputed" | null;

export function RespondToClaimForm({ workRecordId, clientName }: RespondToClaimFormProps) {
  const [outcome, setOutcome] = useState<ResponseOutcome>(null);
  const [pendingResponse, setPendingResponse] = useState<"confirm" | "dispute" | null>(null);

  const { execute, isPending, isSuccess, isError, error } = useServerAction(
    respondToWorkRecordAction,
    {
      onSuccess: () => {
        setOutcome(pendingResponse === "confirm" ? "confirmed" : "disputed");
      },
    },
  );

  function handleConfirm() {
    setPendingResponse("confirm");
    execute({ workRecordId, response: "confirm" });
  }

  function handleDispute() {
    setPendingResponse("dispute");
    execute({ workRecordId, response: "dispute" });
  }

  if (isSuccess && outcome === "confirmed") {
    return (
      <div className="mt-5 rounded-2xl bg-white p-6">
        <p className="font-display text-[18px] font-semibold text-sb-success">
          Trabajo confirmado
        </p>
        <p className="mt-2 text-[15px] text-sb-text">
          {clientName} ya recibió la confirmación y puede dejar su reseña.
          Vos también podés calificar a {clientName.split(" ")[0]}.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Link
            href="/professional/reviews"
            className="flex h-12 items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white"
          >
            Calificar a {clientName.split(" ")[0]}
          </Link>
          <Link
            href="/dashboard"
            className="flex h-12 items-center justify-center rounded-full border border-sb-border text-[15px] font-medium text-sb-muted"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess && outcome === "disputed") {
    return (
      <div className="mt-5 rounded-2xl bg-white p-6">
        <p className="font-display text-[18px] font-semibold text-sb-text">
          Disputa enviada
        </p>
        <p className="mt-2 text-[15px] text-sb-muted">
          El equipo de SUPERBOB revisará el caso y te notificará la resolución.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block text-[15px] font-medium text-sb-blue"
        >
          Volver al inicio →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {isError && error && (
        <p className="text-[14px] text-sb-error">{error}</p>
      )}

      <Button
        type="button"
        onClick={handleConfirm}
        isPending={isPending && pendingResponse === "confirm"}
        pendingText="Confirmando..."
        fullWidth
        size="lg"
        disabled={isPending}
      >
        Confirmar el trabajo
      </Button>

      <Button
        type="button"
        onClick={handleDispute}
        isPending={isPending && pendingResponse === "dispute"}
        pendingText="Enviando disputa..."
        variant="secondary"
        fullWidth
        size="lg"
        disabled={isPending}
      >
        Disputar el reclamo
      </Button>
    </div>
  );
}
