"use client";

import { Button } from "@/components/ui/Button";

type ReviewSubmitConfirmModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function ReviewSubmitConfirmModal({
  onConfirm,
  onCancel,
}: ReviewSubmitConfirmModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <h2 className="font-display text-[18px] font-semibold text-sb-text">
          ¿Publicar esta reseña?
        </h2>
        <p className="mt-2 text-[15px] text-sb-muted">
          Confirmás que refleja tu experiencia real. Otros usuarios la van a
          usar para decidir a quién contratar.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button type="button" onClick={onConfirm} fullWidth size="lg">
            Enviar
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            fullWidth
            size="lg"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
