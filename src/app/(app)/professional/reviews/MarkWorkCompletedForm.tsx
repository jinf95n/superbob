"use client";

import { useState, useTransition } from "react";
import { createProWorkRecordAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

// Este componente necesita ser rediseñado para el flujo v2: el profesional
// ya no busca al cliente por teléfono/email — selecciona desde sus contact_events.
// Por ahora no se renderiza en ninguna página.

type Contact = {
  contactEventId: string;
  clientName: string;
};

type MarkWorkCompletedFormProps = {
  contacts: Contact[];
  trades: Array<{ id: string; name: string }>;
};

export function MarkWorkCompletedForm({ contacts, trades }: MarkWorkCompletedFormProps) {
  const [contactEventId, setContactEventId] = useState("");
  const [tradeId, setTradeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();

  function handleSubmit() {
    if (!contactEventId) {
      setError("Elegí el contacto");
      return;
    }
    if (!tradeId) {
      setError("Elegí el oficio en que trabajaste");
      return;
    }
    setError(null);
    setSuccess(false);

    startSubmit(async () => {
      const result = await createProWorkRecordAction({ contactEventId, tradeId });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setContactEventId("");
      setTradeId("");
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <select
        value={contactEventId}
        onChange={(e) => setContactEventId(e.target.value)}
        className="w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
      >
        <option value="">Elegí el contacto</option>
        {contacts.map((c) => (
          <option key={c.contactEventId} value={c.contactEventId}>
            {c.clientName}
          </option>
        ))}
      </select>

      <select
        value={tradeId}
        onChange={(e) => setTradeId(e.target.value)}
        className="w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
      >
        <option value="">Elegí el oficio</option>
        {trades.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-sb-error">{error}</p>}
      {success && (
        <p className="text-sm text-sb-success">
          Le avisamos al cliente. Va a poder dejarte una reseña.
        </p>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2"
      >
        {isSubmitting && <Spinner className="h-4 w-4" />}
        {isSubmitting ? "Guardando..." : "Registrar trabajo"}
      </Button>
    </div>
  );
}
