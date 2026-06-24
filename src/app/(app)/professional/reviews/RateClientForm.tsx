"use client";

import { useState, useTransition } from "react";
import { submitProfessionalRatingAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";

type RateClientFormProps = {
  workRecordId: string;
};

export function RateClientForm({ workRecordId }: RateClientFormProps) {
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
      const result = await submitProfessionalRatingAction({
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
      <p className="mt-2 text-sm text-sb-success">
        Calificación guardada. Es privada, el cliente no la ve.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-1 text-2xl">
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
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Comentario privado (opcional)"
        className="mt-2 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none"
      />
      {error && <p className="mt-1 text-sm text-sb-error">{error}</p>}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-2"
      >
        {isSubmitting ? "Guardando..." : "Calificar cliente"}
      </Button>
    </div>
  );
}
