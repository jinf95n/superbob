import { prisma } from "@/lib/prisma";
import { ReviewType } from "@prisma/client";

const REVIEW_TYPE_WEIGHTS: Record<ReviewType, number> = {
  work_review: 1,
  contact_review: 0.3,
};

export type WeightedScore = {
  score: number;
  reviewCount: number;
};

/**
 * Score ponderado por profesional a partir de reseñas publicadas.
 * work_review pesa 100%, contact_review pesa 30% (regla #11 de CLAUDE.md).
 * No se cachea en Fase 1: se calcula en cada consulta.
 */
export async function getWeightedScores(
  professionalIds: string[],
  tradeId?: string,
): Promise<Map<string, WeightedScore>> {
  if (professionalIds.length === 0) {
    return new Map();
  }

  const reviews = await prisma.review.findMany({
    where: {
      reviewedProfessionalId: { in: professionalIds },
      publishedAt: { not: null },
      ...(tradeId ? { tradeId } : {}),
    },
    select: { reviewedProfessionalId: true, type: true, rating: true },
  });

  const totals = new Map<
    string,
    { weightedSum: number; weightTotal: number; reviewCount: number }
  >();

  for (const review of reviews) {
    const weight = REVIEW_TYPE_WEIGHTS[review.type];
    const entry =
      totals.get(review.reviewedProfessionalId) ??
      { weightedSum: 0, weightTotal: 0, reviewCount: 0 };
    entry.weightedSum += review.rating * weight;
    entry.weightTotal += weight;
    entry.reviewCount += 1;
    totals.set(review.reviewedProfessionalId, entry);
  }

  const scores = new Map<string, WeightedScore>();
  for (const [professionalId, totalsEntry] of totals) {
    scores.set(professionalId, {
      score: totalsEntry.weightedSum / totalsEntry.weightTotal,
      reviewCount: totalsEntry.reviewCount,
    });
  }

  return scores;
}

const ADMIN_REVIEWS_PAGE_SIZE = 20;
const AUTO_PUBLISH_DAYS = 14;

export type PendingReviewItem = {
  id: string;
  reviewerName: string;
  professionalName: string;
  type: ReviewType;
  rating: number;
  submittedAt: Date | null;
  createdAt: Date;
  autoPublishAt: Date | null;
};

export type PendingReviewsResult = {
  reviews: PendingReviewItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getPendingReviewsCount(): Promise<number> {
  return prisma.review.count({ where: { publishedAt: null } });
}

export async function getPendingReviews(
  page = 1,
): Promise<PendingReviewsResult> {
  const where = { publishedAt: null };
  const total = await prisma.review.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_REVIEWS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const rows = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ADMIN_REVIEWS_PAGE_SIZE,
    take: ADMIN_REVIEWS_PAGE_SIZE,
    select: {
      id: true,
      type: true,
      rating: true,
      submittedAt: true,
      createdAt: true,
      reviewer: { select: { fullName: true } },
      reviewedProfessional: {
        select: { user: { select: { fullName: true } } },
      },
    },
  });

  const reviews: PendingReviewItem[] = rows.map((row) => ({
    id: row.id,
    reviewerName: row.reviewer.fullName,
    professionalName: row.reviewedProfessional.user.fullName,
    type: row.type,
    rating: row.rating,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    autoPublishAt: row.submittedAt
      ? new Date(
          row.submittedAt.getTime() + AUTO_PUBLISH_DAYS * 24 * 60 * 60 * 1000,
        )
      : null,
  }));

  return {
    reviews,
    total,
    page: currentPage,
    pageSize: ADMIN_REVIEWS_PAGE_SIZE,
    totalPages,
  };
}
