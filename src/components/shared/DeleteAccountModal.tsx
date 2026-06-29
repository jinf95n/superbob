"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { deleteAccountAction } from "@/modules/users/actions";
import { AccountDeletionBlocker } from "@/modules/users/types";

const CONFIRM_WORD = "ELIMINAR";

function blockerMessage(blocker: AccountDeletionBlocker): string {
  switch (blocker.type) {
    case "disputed_work_records":
      return `Tenés ${blocker.count} disputa${blocker.count > 1 ? "s" : ""} activa${blocker.count > 1 ? "s" : ""} pendiente de resolución por el equipo de SUPERBOB.`;
    case "pending_pro_confirmation_as_professional":
      return `Tenés ${blocker.count} reclamo${blocker.count > 1 ? "s" : ""} de trabajo esperando tu respuesta. Respondelos antes de eliminar tu cuenta.`;
  }
}

type Props = {
  onClose: () => void;
};

export function DeleteAccountModal({ onClose }: Props) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [blockers, setBlockers] = useState<AccountDeletionBlocker[] | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canConfirm = confirmText === CONFIRM_WORD && !isPending;

  function handleSubmit() {
    if (!canConfirm) return;
    setBlockers(null);
    setGenericError(null);

    startTransition(async () => {
      const result = await deleteAccountAction();

      if ("success" in result) {
        await authClient.signOut();
        router.push("/");
        return;
      }

      if ("blocked" in result) {
        setBlockers(result.blockers);
        return;
      }

      setGenericError(result.error);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-[18px] font-bold text-sb-text">
          Eliminar cuenta
        </h2>

        <div className="mt-4 flex flex-col gap-3 text-[14px] text-sb-muted">
          <p>Al eliminar tu cuenta:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Tus datos personales (nombre, email, teléfono) serán anonimizados.</li>
            <li>Las reseñas que escribiste permanecerán publicadas con autor anónimo.</li>
            <li>Tus trabajos en curso serán cancelados y la otra parte será notificada.</li>
            <li>Tu perfil profesional (si tenés) será desactivado permanentemente.</li>
            <li>Esta acción no se puede deshacer.</li>
          </ul>
        </div>

        {blockers && blockers.length > 0 && (
          <div className="mt-4 rounded-xl border border-sb-error/30 bg-[#FEF2F2] p-4">
            <p className="text-[13px] font-semibold text-sb-error">
              No podés eliminar tu cuenta todavía:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {blockers.map((b, i) => (
                <li key={i} className="text-[13px] text-sb-error">
                  {blockerMessage(b)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {genericError && (
          <p className="mt-4 text-[13px] text-sb-error">{genericError}</p>
        )}

        {!blockers && (
          <div className="mt-5">
            <label className="text-[13px] text-sb-muted">
              Escribí{" "}
              <span className="font-mono font-semibold text-sb-text">
                {CONFIRM_WORD}
              </span>{" "}
              para confirmar:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              autoFocus
              className="mt-2 w-full rounded-xl border border-sb-border px-3.5 py-2.5 font-mono text-[15px] text-sb-text outline-none focus:border-sb-error focus:ring-2 focus:ring-sb-error/10"
              placeholder={CONFIRM_WORD}
            />
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-sb-border text-[14px] font-medium text-sb-text disabled:opacity-50"
          >
            Cancelar
          </button>

          {!blockers && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canConfirm}
              className="flex h-11 flex-1 items-center justify-center rounded-full bg-sb-error text-[14px] font-medium text-white disabled:opacity-40"
            >
              {isPending ? "Eliminando..." : "Eliminar cuenta"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
