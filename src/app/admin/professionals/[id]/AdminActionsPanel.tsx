"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateProfessionalActiveStatusAction,
  updateProfessionalVerifiedStatusAction,
  setBoostAction,
} from "@/modules/professionals/actions";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/ui/Button";

type View =
  | "idle"
  | "confirm_deactivate"
  | "confirm_activate"
  | "confirm_verify"
  | "confirm_unverify"
  | "boost";

type Props = {
  professionalId: string;
  isActive: boolean;
  isVerified: boolean;
  newProfessionalBoostUntil: Date | null;
  hasPermanentDeactivation: boolean;
};

export function AdminActionsPanel({
  professionalId,
  isActive,
  isVerified,
  newProfessionalBoostUntil,
  hasPermanentDeactivation,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("idle");
  const [boostDate, setBoostDate] = useState(
    newProfessionalBoostUntil
      ? newProfessionalBoostUntil.toISOString().split("T")[0]
      : "",
  );

  const onDone = () => {
    router.refresh();
    setView("idle");
  };

  const activeToggle = useServerAction(updateProfessionalActiveStatusAction, {
    onSuccess: onDone,
  });
  const verifiedToggle = useServerAction(updateProfessionalVerifiedStatusAction, {
    onSuccess: onDone,
  });
  const boostSave = useServerAction(setBoostAction, { onSuccess: onDone });

  return (
    <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
      <h2 className="mb-3 font-display text-[15px] font-semibold">Acciones</h2>

      {view === "idle" && (
        <div className="flex flex-wrap gap-2">
          {!hasPermanentDeactivation && (
            <Button
              variant={isActive ? "danger" : "primary"}
              size="sm"
              onClick={() =>
                setView(isActive ? "confirm_deactivate" : "confirm_activate")
              }
            >
              {isActive ? "Desactivar" : "Activar"}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setView(isVerified ? "confirm_unverify" : "confirm_verify")
            }
          >
            {isVerified ? "Quitar verificación" : "Marcar verificado"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setView("boost")}
          >
            {newProfessionalBoostUntil ? "Editar boost" : "Activar boost"}
          </Button>
        </div>
      )}

      {(view === "confirm_deactivate" || view === "confirm_activate") && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {view === "confirm_deactivate"
              ? "¿Desactivar este perfil? No aparecerá en búsquedas ni podrá recibir contactos."
              : "¿Reactivar este perfil? Volverá a aparecer en búsquedas."}
          </p>
          <div className="flex gap-2">
            <Button
              variant={view === "confirm_deactivate" ? "danger" : "primary"}
              size="sm"
              isPending={activeToggle.isPending}
              isSuccess={activeToggle.isSuccess}
              onClick={() =>
                activeToggle.execute(
                  professionalId,
                  view === "confirm_activate",
                )
              }
            >
              Confirmar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView("idle")}>
              Cancelar
            </Button>
          </div>
          {activeToggle.isError && (
            <p className="text-sm text-sb-error">{activeToggle.error}</p>
          )}
        </div>
      )}

      {(view === "confirm_verify" || view === "confirm_unverify") && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {view === "confirm_verify"
              ? "¿Marcar como verificado? Aparecerá el badge de verificación en su perfil público."
              : "¿Quitar la verificación? Se retirará el badge de su perfil público."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              isPending={verifiedToggle.isPending}
              isSuccess={verifiedToggle.isSuccess}
              onClick={() =>
                verifiedToggle.execute(
                  professionalId,
                  view === "confirm_verify",
                )
              }
            >
              Confirmar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView("idle")}>
              Cancelar
            </Button>
          </div>
          {verifiedToggle.isError && (
            <p className="text-sm text-sb-error">{verifiedToggle.error}</p>
          )}
        </div>
      )}

      {view === "boost" && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Boost activo hasta
            </label>
            <input
              type="date"
              value={boostDate}
              onChange={(e) => setBoostDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="rounded border border-sb-border px-3 py-1.5 text-sm dark:border-sb-border-dark"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              isPending={boostSave.isPending}
              isSuccess={boostSave.isSuccess}
              disabled={!boostDate}
              onClick={() =>
                boostSave.execute({ professionalId, boostUntil: boostDate })
              }
            >
              Guardar
            </Button>
            {newProfessionalBoostUntil && (
              <Button
                variant="ghost"
                size="sm"
                isPending={boostSave.isPending}
                onClick={() =>
                  boostSave.execute({
                    professionalId,
                    boostUntil: undefined,
                  })
                }
              >
                Quitar boost
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setView("idle")}>
              Cancelar
            </Button>
          </div>
          {boostSave.isError && (
            <p className="text-sm text-sb-error">{boostSave.error}</p>
          )}
        </div>
      )}
    </section>
  );
}
