"use client";

import { useState } from "react";
import { ProfessionalReviewForProfile } from "@/modules/professionals/types";
import { ReportModal } from "@/components/shared/ReportModal";

type ReviewsListProps = {
  reviews: ProfessionalReviewForProfile[];
  weightedScore: number;
  ratingHistogram: Record<1 | 2 | 3 | 4 | 5, number>;
  totalCount: number;
};

const INITIAL_VISIBLE = 5;
const STAR_LEVELS = [5, 4, 3, 2, 1] as const;

function formatRelativeDate(date: Date): string {
  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "hace 1 día";
  if (diffDays < 7) return `hace ${diffDays} días`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `hace ${diffWeeks} semana${diffWeeks === 1 ? "" : "s"}`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `hace ${diffMonths} mes${diffMonths === 1 ? "" : "es"}`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `hace ${diffYears} año${diffYears === 1 ? "" : "s"}`;
}

export function ReviewsList({
  reviews,
  weightedScore,
  ratingHistogram,
  totalCount,
}: ReviewsListProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleReviews = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE);
  const maxBarCount = Math.max(...STAR_LEVELS.map((s) => ratingHistogram[s]), 1);
  const roundedScore = Math.round(weightedScore);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex items-center gap-3">
          <span className="font-display text-[40px] font-extrabold text-sb-orange">
            {weightedScore.toFixed(1)}
          </span>
          <div>
            <p aria-hidden="true" className="text-xl text-sb-orange">
              {"★".repeat(roundedScore)}
              {"☆".repeat(5 - roundedScore)}
            </p>
            <p className="text-[13px] text-sb-muted">
              {totalCount} reseña{totalCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          {STAR_LEVELS.map((stars) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="w-3 text-[13px] text-sb-muted">{stars}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sb-bg">
                <div
                  className="h-full rounded-full bg-sb-orange"
                  style={{
                    width: `${(ratingHistogram[stars] / maxBarCount) * 100}%`,
                  }}
                />
              </div>
              <span className="w-6 text-right text-[13px] text-sb-muted">
                {ratingHistogram[stars]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {visibleReviews.map((review) => (
          <li
            key={review.id}
            className="rounded-card border border-sb-border bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sb-card-blue">
                  {review.reviewerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.reviewerAvatarUrl}
                      alt={review.reviewerDisplayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[12px] font-semibold text-sb-blue">
                      {review.reviewerDisplayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-display text-[15px] font-semibold text-sb-text">
                    {review.reviewerDisplayName}
                  </p>
                  <p className="text-[12px] text-sb-muted">
                    {review.reviewsGivenCount} reseña{review.reviewsGivenCount === 1 ? "" : "s"} en SUPERBOB
                  </p>
                </div>
              </div>
              <span aria-hidden="true" className="shrink-0 text-sb-orange">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-sb-muted">
              {review.tradeName} · {formatRelativeDate(review.publishedAt)}
            </p>
            {review.comment && (
              <p className="mt-2 text-[15px] leading-relaxed text-sb-text">
                {review.comment}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-sb-success/10 px-2.5 py-0.5 text-[12px] font-medium text-sb-success">
                {review.reviewType === "work_review"
                  ? "Trabajo verificado en plataforma"
                  : "Contacto verificado"}
              </span>
              <ReportModal
                reportedUserId={review.reviewerId}
                triggerLabel="Reportar reseña"
                triggerClassName="shrink-0 text-[12px] text-sb-muted underline"
              />
            </div>
          </li>
        ))}
      </ul>

      {!showAll && reviews.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-center text-[14px] font-medium text-sb-blue underline"
        >
          Ver todas las reseñas
        </button>
      )}
    </div>
  );
}
