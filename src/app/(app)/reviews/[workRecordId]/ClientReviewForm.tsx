"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitClientReviewAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";

type ClientReviewFormProps = {
  workRecordId: string;
};

const SUCCESS_REDIRECT_DELAY_MS = 1500;

export function ClientReviewForm({ workRecordId }: ClientReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);

  const { execute, isPending, isSuccess, isError, error } = useServerAction(
    submitClientReviewAction,
    {
      successDuration: SUCCESS_REDIRECT_DELAY_MS,
      onSuccess: () => {
        setTimeout(() => router.push("/notifications"), SUCCESS_REDIRECT_DELAY_MS);
      },
    },
  );

  function handleSubmit() {
    if (rating === 0) {
      setRatingError("Elegí una calificación");
      return;
    }
    setRatingError(null);
    execute({ workRecordId, rating, comment: comment || undefined });
  }

  const isLocked = isPending || isSuccess;

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
            disabled={isLocked}
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
        disabled={isLocked}
        className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none disabled:opacity-60"
      />

      {(ratingError || (isError && error)) && (
        <p className="mt-2 text-sm text-sb-error">{ratingError ?? error}</p>
      )}

      {isSuccess && (
        <p className="mt-2 text-sm text-sb-muted">
          Tu reseña se publica en 14 días o antes si el profesional también
          califica.
        </p>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        isPending={isPending}
        isSuccess={isSuccess}
        isError={isError}
        pendingText="Enviando reseña..."
        successText="Reseña enviada"
        fullWidth
        className="mt-4"
      >
        Publicar reseña
      </Button>
    </div>
  );
}
