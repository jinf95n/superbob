"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDisputeAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";

type Resolution = "work_confirmed" | "claim_rejected" | "unresolved";

const RESOLUTIONS: Array<{
  value: Resolution;
  label: string;
  description: string;
  variant: "primary" | "danger" | "ghost";
}> = [
  {
    value: "work_confirmed",
    label: "Confirmar trabajo",
    description:
      "Se habilitan las reseñas para ambas partes. El profesional no puede disputar otra vez.",
    variant: "primary",
  },
  {
    value: "claim_rejected",
    label: "Rechazar reclamo",
    description:
      "El work_record se cancela. Ninguna reseña. El contacto queda registrado internamente.",
    variant: "danger",
  },
  {
    value: "unresolved",
    label: "Cerrar sin resolución",
    description:
      "Sin evidencia suficiente. Ninguna reseña pública. La disputa queda registrada para auditoría.",
    variant: "ghost",
  },
];

type DisputeResolutionFormProps = {
  workRecordId: string;
};

export function DisputeResolutionForm({ workRecordId }: DisputeResolutionFormProps) {
  const router = useRouter();
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { execute, isPending, isSuccess, isError, error } = useServerAction(
    resolveDisputeAction,
    {
      onSuccess: () => {
        setTimeout(() => router.push("/admin/disputes"), 1500);
      },
    },
  );

  function handleSelect(resolution: Resolution) {
    setSelectedResolution(resolution);
    setShowConfirm(true);
  }

  function handleConfirm() {
    if (!selectedResolution) return;
    execute({ workRecordId, resolution: selectedResolution });
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl bg-white p-5 text-center">
        <p className="font-display text-[16px] font-semibold text-sb-success">
          Disputa resuelta
        </p>
        <p className="mt-1 text-[14px] text-sb-muted">
          Volviendo a la lista de disputas…
        </p>
      </div>
    );
  }

  const selected = RESOLUTIONS.find((r) => r.value === selectedResolution);

  return (
    <div className="rounded-2xl border border-sb-border bg-white p-5">
      <h2 className="font-display text-[16px] font-semibold text-sb-text">
        Resolución
      </h2>

      {!showConfirm ? (
        <div className="mt-4 space-y-2">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.value}
              type="button"
              onClick={() => handleSelect(res.value)}
              className="w-full rounded-xl border border-sb-border p-4 text-left transition-colors hover:border-sb-blue hover:bg-sb-bg"
            >
              <p className="text-[15px] font-medium text-sb-text">{res.label}</p>
              <p className="mt-0.5 text-[13px] text-sb-muted">{res.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <div className="rounded-xl bg-sb-bg p-4">
            <p className="text-[14px] font-medium text-sb-text">
              {selected?.label}
            </p>
            <p className="mt-0.5 text-[13px] text-sb-muted">
              {selected?.description}
            </p>
          </div>

          <p className="mt-3 text-[14px] text-sb-text">
            ¿Confirmás esta resolución? Esta acción no se puede deshacer.
          </p>

          {isError && error && (
            <p className="mt-2 text-[13px] text-sb-error">{error}</p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="flex-1 rounded-full border border-sb-border py-3 text-[14px] font-medium text-sb-muted disabled:opacity-50"
            >
              Cambiar
            </button>
            <Button
              type="button"
              onClick={handleConfirm}
              isPending={isPending}
              pendingText="Aplicando..."
              variant={selected?.variant === "danger" ? "danger" : "primary"}
              className="flex-1 rounded-full py-3 text-[14px]"
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
