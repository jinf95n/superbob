"use client";

import { useState, useEffect } from "react";
import { editWorkReviewAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";
import { REVIEW_EDIT_WINDOW_MINUTES } from "@/lib/config";
import { useServerAction } from "@/lib/hooks/useServerAction";

type ReviewPostSubmitPanelProps = {
  reviewId: string;
  submittedAt: Date;
  initialRating: number;
  initialComment: string;
  onNavigate: () => void;
  navigateLabel?: string;
  isPublishedImmediately?: boolean;
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ReviewPostSubmitPanel({
  reviewId,
  submittedAt,
  initialRating,
  initialComment,
  onNavigate,
  navigateLabel = "Volver",
  isPublishedImmediately = false,
}: ReviewPostSubmitPanelProps) {
  const editableUntil =
    submittedAt.getTime() + REVIEW_EDIT_WINDOW_MINUTES * 60 * 1000;

  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, editableUntil - Date.now()),
  );

  const canEdit = timeLeft > 0;

  useEffect(() => {
    const update = () => {
      const left = editableUntil - Date.now();
      setTimeLeft(Math.max(0, left));
      if (left <= 0) clearInterval(interval);
    };
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [editableUntil]);

  const {
    execute,
    isPending,
    isSuccess,
    isError,
    error: editError,
  } = useServerAction(editWorkReviewAction, {
    successDuration: 900,
    onSuccess: () => {
      setTimeout(() => setIsEditing(false), 900);
    },
  });

  const isLocked = isPending || isSuccess;

  function handleSaveEdit() {
    execute({ reviewId, rating, comment: comment.trim() || undefined });
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5">
          <p className="text-[14px] font-medium text-sb-muted">Calificación</p>
          <div className="mt-2 flex gap-1 text-3xl">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} estrella${value !== 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                disabled={isLocked}
                className={`disabled:cursor-default ${
                  value <= rating ? "text-sb-orange" : "text-sb-border"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <label
            htmlFor="edit-review-comment"
            className="mt-4 block text-[14px] font-medium text-sb-text"
          >
            Comentario{" "}
            <span className="font-normal text-sb-muted">(opcional)</span>
          </label>
          <textarea
            id="edit-review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            rows={4}
            disabled={isLocked}
            className="mt-2 w-full resize-none rounded-xl border border-sb-border px-3.5 py-3 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none focus:ring-2 focus:ring-sb-blue/10 disabled:opacity-60"
          />

          {isError && editError && (
            <p className="mt-2 text-[13px] text-sb-error">{editError}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={isLocked}
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-sb-border text-[15px] font-medium text-sb-text disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button
            type="button"
            onClick={handleSaveEdit}
            isPending={isPending}
            isSuccess={isSuccess}
            isError={isError}
            pendingText="Guardando..."
            successText="Guardado"
            fullWidth
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5">
        <p className="text-[15px] font-medium text-sb-text">
          Gracias por colaborar con la comunidad.
        </p>
        <p className="mt-1 text-[14px] text-sb-muted">
          {isPublishedImmediately
            ? "Tu reseña ya es visible en el perfil del profesional."
            : "Tu reseña queda privada hasta que el proceso de publicación termine."}
        </p>
        {canEdit && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-sb-bg px-3 py-2">
            <p className="text-[13px] text-sb-muted">
              Podés editarla durante{" "}
              <span className="font-medium tabular-nums text-sb-text">
                {formatCountdown(timeLeft)}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="ml-4 shrink-0 text-[13px] font-medium text-sb-blue"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNavigate}
        className="flex h-12 w-full items-center justify-center rounded-full border border-sb-border bg-white text-[15px] font-medium text-sb-text"
      >
        {navigateLabel}
      </button>
    </div>
  );
}
