"use client";

import { NotificationListItem } from "@/modules/notifications/types";

const TITLES: Record<string, string> = {
  review_received: "Nueva reseña recibida",
  review_published: "Reseña publicada",
  work_record_created: "Trabajo registrado",
  work_claim_received: "Reclamo recibido",
  work_claim_confirmed: "Reclamo confirmado",
  work_claim_disputed: "Reclamo en revisión",
  dispute_resolved: "Disputa resuelta",
  dispute_resolved_pro: "Disputa resuelta",
  review_suspended: "Reseña suspendida temporalmente",
  review_unsuspended: "Reseña restaurada",
  review_deleted: "Reseña eliminada",
};

const MODERATION_TYPES = new Set([
  "review_suspended",
  "review_unsuspended",
  "review_deleted",
]);

function getCtaLabel(actionUrl: string): string {
  if (actionUrl.startsWith("/professional/reviews")) return "Ver mis reseñas";
  if (actionUrl.startsWith("/professional/work-records")) return "Ver el trabajo";
  if (actionUrl.startsWith("/reviews")) return "Ir a la reseña";
  return "Ver más";
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-lg text-sb-orange">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

type Props = {
  notification: NotificationListItem;
  onClose: () => void;
  onNavigate: (url: string) => void;
};

export function NotificationModal({ notification, onClose, onNavigate }: Props) {
  const { type, payload } = notification;
  const title = TITLES[type] ?? "Notificación";
  const isModeration = MODERATION_TYPES.has(type);
  const actionUrl = payload?.actionUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-[18px] font-bold text-sb-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="mt-0.5 shrink-0 rounded-full p-1 text-sb-muted hover:bg-sb-bg"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {isModeration && payload?.reviewRating !== undefined && (
          <div className="mb-4 rounded-xl border border-sb-border bg-sb-bg p-3">
            <div className="flex items-center gap-2">
              <Stars rating={payload.reviewRating} />
              <span className="text-[13px] text-sb-muted">
                {payload.reviewRating}/5
              </span>
            </div>
            {payload.reviewTradeName && (
              <p className="mt-1 text-[13px] text-sb-muted">
                {payload.reviewTradeName}
                {payload.reviewType === "work_review"
                  ? " · Trabajo"
                  : " · Contacto"}
              </p>
            )}
            {payload.reviewComment && (
              <p className="mt-2 text-[14px] text-sb-text">
                &ldquo;{payload.reviewComment}&rdquo;
              </p>
            )}
          </div>
        )}

        {payload?.message && (
          <p className="text-[15px] leading-relaxed text-sb-text">
            {payload.message}
          </p>
        )}

        {isModeration && (
          <p className="mt-3 text-[13px] text-sb-muted">
            Para consultas:{" "}
            <a
              href="mailto:soporte@superbob.com.ar"
              className="text-sb-blue underline underline-offset-2"
            >
              soporte@superbob.com.ar
            </a>
          </p>
        )}

        <div className="mt-5 flex gap-2">
          {actionUrl && (
            <button
              type="button"
              onClick={() => onNavigate(actionUrl)}
              className="flex-1 rounded-xl bg-sb-blue px-4 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
            >
              {getCtaLabel(actionUrl)}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border border-sb-border px-4 py-2.5 text-[14px] font-medium text-sb-text hover:bg-sb-bg ${
              actionUrl ? "" : "flex-1"
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
