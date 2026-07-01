"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSanctionAction } from "@/modules/professionals/actions";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/ui/Button";

type SanctionType = "warning" | "temporary_suspension" | "permanent_deactivation";

const LABELS: Record<SanctionType, string> = {
  warning: "Nota interna",
  temporary_suspension: "Suspensión temporal",
  permanent_deactivation: "Desactivación permanente",
};

type Props = {
  professionalId: string;
  professionalName: string;
};

export function SanctionForm({ professionalId, professionalName }: Props) {
  const router = useRouter();
  const [openType, setOpenType] = useState<SanctionType | null>(null);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [confirmName, setConfirmName] = useState("");

  const sanctionAction = useServerAction(createSanctionAction, {
    onSuccess: () => {
      router.refresh();
      setOpenType(null);
      setReason("");
      setExpiresAt("");
      setConfirmName("");
    },
  });

  const isNameMatch =
    confirmName.trim().toLowerCase() === professionalName.trim().toLowerCase();

  const canSubmit = (type: SanctionType): boolean => {
    if (reason.trim().length < 3) return false;
    if (type === "temporary_suspension" && !expiresAt) return false;
    if (type === "permanent_deactivation" && !isNameMatch) return false;
    return true;
  };

  const handleSubmit = (type: SanctionType) => {
    sanctionAction.execute({
      professionalId,
      type,
      reason: reason.trim(),
      expiresAt: type === "temporary_suspension" ? expiresAt : undefined,
      confirmName: type === "permanent_deactivation" ? confirmName : undefined,
    });
  };

  const handleCancel = () => {
    setOpenType(null);
    setReason("");
    setExpiresAt("");
    setConfirmName("");
  };

  if (openType === null) {
    return (
      <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
        <h2 className="mb-3 font-display text-[15px] font-semibold">Sanciones</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpenType("warning")}
          >
            + Nota interna
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpenType("temporary_suspension")}
          >
            Suspender temporalmente
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setOpenType("permanent_deactivation")}
          >
            Desactivación permanente
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
      <h2 className="mb-3 font-display text-[15px] font-semibold">
        {LABELS[openType]}
      </h2>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {openType === "warning" ? "Texto de la nota" : "Motivo"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded border border-sb-border px-3 py-2 text-sm dark:border-sb-border-dark"
            placeholder={
              openType === "warning"
                ? "Descripción de la situación para el registro interno..."
                : "Motivo de la sanción..."
            }
          />
        </div>

        {openType === "temporary_suspension" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Vence el</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="rounded border border-sb-border px-3 py-1.5 text-sm dark:border-sb-border-dark"
            />
          </div>
        )}

        {openType === "permanent_deactivation" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Para confirmar, escribí exactamente el nombre:{" "}
              <span className="font-bold">{professionalName}</span>
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full rounded border border-sb-border px-3 py-1.5 text-sm dark:border-sb-border-dark"
              placeholder={professionalName}
            />
            {confirmName.length > 0 && !isNameMatch && (
              <p className="mt-1 text-xs text-sb-error">
                El nombre no coincide.
              </p>
            )}
          </div>
        )}

        {sanctionAction.isError && (
          <p className="text-sm text-sb-error">{sanctionAction.error}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant={
              openType === "permanent_deactivation" ? "danger" : "primary"
            }
            size="sm"
            isPending={sanctionAction.isPending}
            isSuccess={sanctionAction.isSuccess}
            disabled={!canSubmit(openType)}
            onClick={() => handleSubmit(openType)}
          >
            {openType === "warning" ? "Guardar nota" : "Confirmar"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </section>
  );
}
