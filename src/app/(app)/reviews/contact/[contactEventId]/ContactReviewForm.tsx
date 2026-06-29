"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitContactReviewAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";

type Trade = { id: string; name: string };

type ContactReviewFormProps = {
  contactEventId: string;
  trades: Trade[];
};

const SUCCESS_REDIRECT_DELAY_MS = 2000;

export function ContactReviewForm({ contactEventId, trades }: ContactReviewFormProps) {
  const router = useRouter();
  const [tradeId, setTradeId] = useState(trades[0]?.id ?? "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState(false);

  const { execute, isPending, isSuccess, isError, error } = useServerAction(
    submitContactReviewAction,
    {
      successDuration: SUCCESS_REDIRECT_DELAY_MS,
      onSuccess: () => {
        setTimeout(() => router.push("/dashboard"), SUCCESS_REDIRECT_DELAY_MS);
      },
    },
  );

  function handleSubmit() {
    if (rating === 0) {
      setRatingError(true);
      return;
    }
    setRatingError(false);
    execute({
      contactEventId,
      tradeId,
      rating,
      comment: comment.trim() || undefined,
    });
  }

  const isLocked = isPending || isSuccess;

  return (
    <div className="mt-5 space-y-4">
      {trades.length > 1 && (
        <div className="rounded-2xl bg-white p-5">
          <label
            htmlFor="trade-select"
            className="block text-[14px] font-medium text-sb-text"
          >
            Oficio
          </label>
          <select
            id="trade-select"
            value={tradeId}
            onChange={(e) => setTradeId(e.target.value)}
            disabled={isLocked}
            className="mt-2 w-full rounded-xl border border-sb-border bg-white px-3 py-3 text-[15px] text-sb-text focus:outline-none focus:ring-2 focus:ring-sb-blue disabled:opacity-60"
          >
            {trades.map((trade) => (
              <option key={trade.id} value={trade.id}>
                {trade.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-2xl bg-white p-5">
        <p className="text-[14px] font-medium text-sb-text">Calificación</p>
        <div className="mt-2 flex gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} estrellas`}
              onClick={() => {
                setRating(value);
                setRatingError(false);
              }}
              disabled={isLocked}
              className={value <= rating ? "text-sb-orange" : "text-sb-border"}
            >
              ★
            </button>
          ))}
        </div>
        {ratingError && (
          <p className="mt-1 text-[13px] text-sb-error">
            Elegí una calificación para continuar.
          </p>
        )}

        <label
          htmlFor="comment"
          className="mt-4 block text-[14px] font-medium text-sb-text"
        >
          Comentario (opcional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          disabled={isLocked}
          placeholder="¿Cómo fue el primer contacto con este profesional?"
          className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text placeholder:text-sb-muted focus:border-sb-blue focus:outline-none disabled:opacity-60"
        />
      </div>

      {isError && error && (
        <p className="text-[14px] text-sb-error">{error}</p>
      )}

      {isSuccess && (
        <p className="rounded-2xl bg-white p-4 text-[15px] text-sb-muted">
          Tu reseña ya está publicada. Gracias por calificar.
        </p>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        isPending={isPending}
        isSuccess={isSuccess}
        isError={isError}
        pendingText="Publicando reseña..."
        successText="Reseña publicada"
        fullWidth
        size="lg"
      >
        Publicar reseña de contacto
      </Button>
    </div>
  );
}
