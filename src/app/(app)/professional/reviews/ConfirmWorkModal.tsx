"use client";

import { useState, useTransition } from "react";
import { createProWorkRecordAction } from "@/modules/reviews/actions";

type Trade = { id: string; name: string };

type ConfirmWorkModalProps = {
  contactEventId: string;
  clientName: string;
  trades: Trade[];
  onClose: () => void;
  onSuccess: (workRecordId: string) => void;
};

export function ConfirmWorkModal({
  contactEventId,
  clientName,
  trades,
  onClose,
  onSuccess,
}: ConfirmWorkModalProps) {
  const [tradeId, setTradeId] = useState(trades[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!tradeId) {
      setError("Elegí un oficio");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createProWorkRecordAction({ contactEventId, tradeId });
      if (result.error) {
        setError(result.error);
      } else if (result.workRecordId) {
        onSuccess(result.workRecordId);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <h2 className="font-display text-[20px] font-semibold text-sb-text">
          Registrar trabajo con {clientName}
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label
              htmlFor="confirm-trade"
              className="mb-1.5 block text-[14px] font-medium text-sb-text"
            >
              Oficio
            </label>
            <select
              id="confirm-trade"
              value={tradeId}
              onChange={(e) => setTradeId(e.target.value)}
              className="w-full rounded-xl border border-sb-border bg-white px-3 py-3 text-[15px] text-sb-text focus:outline-none focus:ring-2 focus:ring-sb-blue"
            >
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[14px] text-sb-error">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-full border border-sb-border py-3 text-[15px] font-medium text-sb-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !tradeId}
              className="flex-1 rounded-full bg-sb-blue py-3 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Registrar trabajo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
