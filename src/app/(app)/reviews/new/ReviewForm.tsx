"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitWorkReviewAction } from "@/modules/reviews/actions";
import { WorkRecordForNewReviewPage } from "@/modules/reviews/types";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { ReviewInfoModal } from "@/components/shared/ReviewInfoModal";
import { ReviewSubmitConfirmModal } from "@/components/shared/ReviewSubmitConfirmModal";
import { ReviewPostSubmitPanel } from "@/components/shared/ReviewPostSubmitPanel";

const STAR_LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
const MAX_CHARS = 500;

type ReviewFormProps = {
  workRecord: WorkRecordForNewReviewPage;
};

type SubmittedReview = {
  reviewId: string;
  submittedAt: Date;
  rating: number;
  comment: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ReviewForm({ workRecord }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
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
          router.push(`/p/${workRecord.professionalSlug}`);
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
    execute({
      workRecordId: workRecord.id,
      rating,
      comment: comment || undefined,
    });
  }

  if (submittedReview) {
    return (
      <div className="flex flex-col gap-4">
        {/* Encabezado del profesional — se mantiene visible */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sb-card-blue text-[14px] font-semibold text-sb-blue">
            {getInitials(workRecord.professionalName)}
          </div>
          <div>
            <p className="font-display text-[17px] font-semibold text-sb-text">
              {workRecord.professionalName}
            </p>
            <p className="text-[13px] text-sb-muted">{workRecord.tradeName}</p>
          </div>
        </div>

        <ReviewPostSubmitPanel
          reviewId={submittedReview.reviewId}
          submittedAt={submittedReview.submittedAt}
          initialRating={submittedReview.rating}
          initialComment={submittedReview.comment}
          onNavigate={() => router.push(`/p/${workRecord.professionalSlug}`)}
          navigateLabel="Ver perfil del profesional"
        />
      </div>
    );
  }

  const isLocked = isPending || isSuccess;
  const displayRating = hovered || rating;

  return (
    <>
      {showConfirm && (
        <ReviewSubmitConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Encabezado del profesional */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sb-card-blue text-[14px] font-semibold text-sb-blue">
            {getInitials(workRecord.professionalName)}
          </div>
          <div>
            <p className="font-display text-[17px] font-semibold text-sb-text">
              {workRecord.professionalName}
            </p>
            <p className="text-[13px] text-sb-muted">{workRecord.tradeName}</p>
          </div>
        </div>

        <h1 className="font-display text-[22px] font-bold text-sb-text">
          Reseña de trabajo
        </h1>

        {/* Header educativo */}
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

        {/* Estrellas */}
        <div className="rounded-2xl bg-white p-5">
          <p className="text-[14px] font-medium text-sb-muted">Calificación</p>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} estrella${value > 1 ? "s" : ""}`}
                onClick={() => {
                  if (!isLocked) setRating(value);
                }}
                onMouseEnter={() => {
                  if (!isLocked) setHovered(value);
                }}
                onMouseLeave={() => setHovered(0)}
                disabled={isLocked}
                className={`text-4xl transition-colors disabled:cursor-default ${
                  value <= displayRating ? "text-sb-orange" : "text-sb-border"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className="mt-2 text-[14px] font-medium text-sb-blue">
              {STAR_LABELS[displayRating]}
            </p>
          )}
          {ratingError && (
            <p className="mt-1 text-[13px] text-sb-error">{ratingError}</p>
          )}
        </div>

        {/* Comentario */}
        <div className="rounded-2xl bg-white p-5">
          <label
            htmlFor="comment"
            className="text-[14px] font-medium text-sb-muted"
          >
            Comentario{" "}
            <span className="font-normal text-sb-muted">(opcional)</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_CHARS))}
            rows={4}
            disabled={isLocked}
            placeholder="Contá tu experiencia..."
            className="mt-2 w-full resize-none rounded-xl border border-sb-border px-3.5 py-3 text-[15px] text-sb-text placeholder:text-sb-muted focus:border-sb-blue focus:outline-none focus:ring-2 focus:ring-sb-blue/10 disabled:opacity-60"
          />
          <p className="mt-1 text-right text-[12px] text-sb-muted">
            {comment.length}/{MAX_CHARS}
          </p>
        </div>

        {/* Info double-blind */}
        <div className="rounded-2xl bg-sb-card-blue p-4">
          <p className="text-[13px] text-sb-muted">
            Tu reseña se publicará cuando el profesional también haya
            participado, o automáticamente después de 14 días.
          </p>
        </div>

        {isError && error && (
          <p className="text-[13px] text-sb-error">{error}</p>
        )}

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
