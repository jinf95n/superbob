"use client";

import { useState, useTransition } from "react";
import { submitProfessionalRatingAction } from "@/modules/reviews/actions";

type RateClientModalProps = {
  workRecordId: string;
  clientName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function RateClientModal({
  workRecordId,
  clientName,
  onClose,
  onSuccess,
}: RateClientModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (rating === 0) {
      setError("Elegí una calificación");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitProfessionalRatingAction({
        workRecordId,
        rating,
        comment,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
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
          Calificar a {clientName}
        </h2>
        <p className="mt-1 text-[14px] text-sb-muted">
          Esta calificación es privada y solo visible para vos.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-[14px] font-medium text-sb-text">
              Calificación
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-[28px] transition-transform active:scale-110 ${
                    star <= rating ? "text-sb-orange" : "text-sb-border"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="rate-client-comment"
              className="mb-1.5 block text-[14px] font-medium text-sb-text"
            >
              Comentario (opcional)
            </label>
            <textarea
              id="rate-client-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="¿Cómo fue trabajar con este cliente?"
              className="w-full resize-none rounded-xl border border-sb-border px-3 py-2.5 text-[15px] text-sb-text placeholder:text-sb-muted focus:outline-none focus:ring-2 focus:ring-sb-blue"
            />
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
              disabled={isPending || rating === 0}
              className="flex-1 rounded-full bg-sb-blue py-3 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Calificar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
