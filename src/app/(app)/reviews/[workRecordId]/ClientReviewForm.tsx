"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitWorkReviewAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { ReviewInfoModal } from "@/components/shared/ReviewInfoModal";
import { ReviewSubmitConfirmModal } from "@/components/shared/ReviewSubmitConfirmModal";
import { ReviewPostSubmitPanel } from "@/components/shared/ReviewPostSubmitPanel";

type ClientReviewFormProps = {
  workRecordId: string;
};

type SubmittedReview = {
  reviewId: string;
  submittedAt: Date;
  rating: number;
  comment: string;
};

export function ClientReviewForm({ workRecordId }: ClientReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<SubmittedReview | null>(null);

  const { execute, isPending, isSuccess, isError, error } = useServerAction(
    submitWorkReviewAction,
    {
      onSuccess: (result) => {
        const r = result as { reviewId?: string };
        if (r.reviewId) {
          setSubmittedReview({
            reviewId: r.reviewId,
            submittedAt: new Date(),
            rating,
            comment,
          });
        } else {
          router.push("/notifications");
        }
      },
    },
  );

  function handleSubmitClick() {
    if (rating === 0) {
      setRatingError("Elegí una calificación");
      return;
    }
    setRatingError(null);
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    execute({ workRecordId, rating, comment: comment || undefined });
  }

  if (submittedReview) {
    return (
      <div className="mt-6">
        <ReviewPostSubmitPanel
          reviewId={submittedReview.reviewId}
          submittedAt={submittedReview.submittedAt}
          initialRating={submittedReview.rating}
          initialComment={submittedReview.comment}
          onNavigate={() => router.push("/notifications")}
          navigateLabel="Ver notificaciones"
        />
      </div>
    );
  }

  const isLocked = isPending || isSuccess;

  return (
    <>
      {showConfirm && (
        <ReviewSubmitConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-white p-5">
          <p className="font-display text-[16px] font-semibold text-sb-text">
            Ayudá a otros clientes.
          </p>
          <p className="mt-1 text-[14px] text-sb-muted">
            Tu reseña refleja únicamente tu experiencia con este profesional.
            Las reseñas falsas o hechas bajo presión perjudican a toda la
            comunidad.
          </p>
          <div className="mt-2">
            <ReviewInfoModal />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5">
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
        </div>

        <Button
          type="button"
          onClick={handleSubmitClick}
          isPending={isPending}
          isSuccess={isSuccess}
          isError={isError}
          pendingText="Enviando reseña..."
          successText="Reseña enviada"
          fullWidth
        >
          Publicar reseña
        </Button>
      </div>
    </>
  );
}
