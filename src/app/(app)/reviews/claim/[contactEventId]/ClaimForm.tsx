"use client";

import { useState } from "react";
import Link from "next/link";
import { createClientClaimAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { WORK_RECORD_PRO_CONFIRM_DAYS } from "@/lib/config";

type Trade = { id: string; name: string };

type ClaimFormProps = {
  contactEventId: string;
  professionalName: string;
  trades: Trade[];
};

export function ClaimForm({ contactEventId, professionalName, trades }: ClaimFormProps) {
  const [tradeId, setTradeId] = useState(trades[0]?.id ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  const { execute, isPending, isSuccess, isError, error } = useServerAction(
    createClientClaimAction,
  );

  function handleSubmit() {
    if (!confirmed) {
      setConfirmError(true);
      return;
    }
    setConfirmError(false);
    execute({ contactEventId, tradeId });
  }

  if (isSuccess) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6">
        <p className="font-display text-[18px] font-semibold text-sb-success">
          Reclamo enviado
        </p>
        <p className="mt-2 text-[15px] text-sb-text">
          Le avisamos a {professionalName} que iniciaste un reclamo. Tiene{" "}
          {WORK_RECORD_PRO_CONFIRM_DAYS} días para confirmar o disputar.
        </p>
        <p className="mt-3 text-[15px] text-sb-muted">
          Si confirma, ambos pueden dejar una reseña del trabajo.
        </p>
        <Link
          href="/notifications"
          className="mt-5 inline-block text-[15px] font-medium text-sb-blue"
        >
          Ver mis notificaciones →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl bg-white p-5">
        <p className="text-[14px] font-medium text-sb-text">
          ¿Para qué oficio?
        </p>
        <select
          value={tradeId}
          onChange={(e) => setTradeId(e.target.value)}
          disabled={isPending}
          className="mt-2 w-full rounded-xl border border-sb-border bg-white px-3 py-3 text-[15px] text-sb-text focus:outline-none focus:ring-2 focus:ring-sb-blue disabled:opacity-60"
        >
          {trades.map((trade) => (
            <option key={trade.id} value={trade.id}>
              {trade.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl bg-white p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              setConfirmError(false);
            }}
            disabled={isPending}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-sb-border accent-sb-blue disabled:opacity-60"
          />
          <span className="text-[15px] text-sb-text">
            Confirmo que hubo un trabajo real con {professionalName} y que el
            profesional no lo registró.
          </span>
        </label>
        {confirmError && (
          <p className="mt-2 text-[13px] text-sb-error">
            Confirmá que hubo un trabajo real para continuar.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-sb-border bg-sb-bg p-4">
        <p className="text-[13px] text-sb-muted">
          {professionalName} tiene {WORK_RECORD_PRO_CONFIRM_DAYS} días para confirmar o
          disputar este reclamo. Si no responde, el caso va a revisión del
          equipo de SUPERBOB.
        </p>
      </div>

      {isError && error && (
        <p className="text-[14px] text-sb-error">{error}</p>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        isPending={isPending}
        pendingText="Enviando reclamo..."
        fullWidth
        size="lg"
      >
        Enviar reclamo
      </Button>
    </div>
  );
}
