"use client";

import { useState, useTransition } from "react";
import { TradeCategoryWithTrades } from "@/modules/trades/queries";
import {
  createContactWorkRecordAction,
  createWorkRecordAction,
} from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type MarkWorkCompletedFormProps = {
  tradeCategories: TradeCategoryWithTrades[];
};

export function MarkWorkCompletedForm({
  tradeCategories,
}: MarkWorkCompletedFormProps) {
  const [type, setType] = useState<"completed" | "contact">("completed");
  const [tradeId, setTradeId] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();

  function handleSubmit() {
    if (!tradeId) {
      setError("Elegí el oficio en que trabajaste");
      return;
    }
    if (!clientPhone && !clientEmail) {
      setError("Ingresá el teléfono o el email del cliente");
      return;
    }
    setError(null);
    setSuccess(false);

    startSubmit(async () => {
      const action =
        type === "completed" ? createWorkRecordAction : createContactWorkRecordAction;
      const result = await action({
        tradeId,
        clientPhone: clientPhone || undefined,
        clientEmail: clientEmail || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setClientPhone("");
      setClientEmail("");
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("completed")}
          className={`flex-1 rounded px-3 py-2 text-[15px] font-medium ${
            type === "completed"
              ? "bg-sb-blue text-white"
              : "border border-sb-border text-sb-muted"
          }`}
        >
          Trabajo completado
        </button>
        <button
          type="button"
          onClick={() => setType("contact")}
          className={`flex-1 rounded px-3 py-2 text-[15px] font-medium ${
            type === "contact"
              ? "bg-sb-blue text-white"
              : "border border-sb-border text-sb-muted"
          }`}
        >
          Solo contacto
        </button>
      </div>

      <select
        value={tradeId}
        onChange={(e) => setTradeId(e.target.value)}
        className="w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
      >
        <option value="">Elegí el oficio</option>
        {tradeCategories.map((category) => (
          <optgroup key={category.id} label={category.name}>
            {category.trades.map((trade) => (
              <option key={trade.id} value={trade.id}>
                {trade.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <Input
        type="tel"
        placeholder="Teléfono del cliente"
        value={clientPhone}
        onChange={(e) => setClientPhone(e.target.value)}
      />
      <Input
        type="email"
        placeholder="Email del cliente"
        value={clientEmail}
        onChange={(e) => setClientEmail(e.target.value)}
      />

      {error && <p className="text-sm text-sb-error">{error}</p>}
      {success && (
        <p className="text-sm text-sb-success">
          Le avisamos al cliente. Va a poder dejarte una reseña.
        </p>
      )}

      <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Marcar trabajo"}
      </Button>
    </div>
  );
}
