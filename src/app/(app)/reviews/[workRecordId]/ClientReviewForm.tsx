"use client";

import { useState, useTransition } from "react";
import { submitClientReviewAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";

type ClientReviewFormProps = {
  workRecordId: string;
};

export function ClientReviewForm({ workRecordId }: ClientReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();

  function handleSubmit() {
    if (rating === 0) {
      setError("Elegí una calificación");
      return;
    }
    setError(null);

    startSubmit(async () => {
      const result = await submitClientReviewAction({
        workRecordId,
        rating,
        comment: comment || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
    });
  }

  if (success) {
    return (
      <p className="mt-6 rounded-2xl bg-sb-card-blue p-5 text-[15px] text-sb-text">
        Listo. Tu reseña se publica en 14 días o antes si el profesional
        también califica.
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5">
      <p className="text-sm font-medium text-sb-text">Calificación</p>
      <div className="mt-2 flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} estrellas`}
            onClick={() => setRating(value)}
            className={value <= rating ? "text-sb-orange" : "text-sb-border"}
          >
            ★
          </button>
        ))}
      </div>

      <label
        htmlFor="comment"
        className="mt-4 block text-sm font-medium text-sb-text"
      >
        Comentario (opcional)
      </label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={4}
        className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none"
      />

      {error && <p className="mt-2 text-sm text-sb-error">{error}</p>}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-4 w-full"
      >
        {isSubmitting ? "Publicando..." : "Publicar reseña"}
      </Button>
    </div>
  );
}
