import { prisma } from "@/lib/prisma";
import { ReviewType } from "@prisma/client";
import {
  ClientRatingForProfessional,
  PendingRatingForProfessional,
  PendingReviewForClient,
  PublishedReviewForProfessional,
  WorkRecordForReviewPage,
} from "./types";

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

/**
 * Reseñas que el cliente ya envió (submittedAt) pero todavía no se
 * publicaron (publishedAt null) porque el profesional no respondió con su
 * propia calificación del cliente (ClientRating) para ese work_record.
 */
export async function getPendingReviewsToRespondCount(
  professionalId: string,
): Promise<number> {
  const reviews = await prisma.review.findMany({
    where: {
      reviewedProfessionalId: professionalId,
      submittedAt: { not: null },
      publishedAt: null,
    },
    select: { workRecordId: true },
  });

  if (reviews.length === 0) {
    return 0;
  }

  const workRecordIds = reviews.map((review) => review.workRecordId);

  const rated = await prisma.clientRating.findMany({
    where: {
      workRecordId: { in: workRecordIds },
      ratedByProfessionalId: professionalId,
    },
    select: { workRecordId: true },
  });

  const ratedWorkRecordIds = new Set(rated.map((r) => r.workRecordId));

  return workRecordIds.filter((id) => !ratedWorkRecordIds.has(id)).length;
}

export async function getWorkRecordForReviewPage(
  workRecordId: string,
): Promise<WorkRecordForReviewPage | null> {
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: {
      id: true,
      clientId: true,
      createdAt: true,
      professional: { select: { user: { select: { fullName: true } } } },
      trade: { select: { name: true } },
      reviews: { select: { id: true } },
    },
  });

  if (!workRecord) {
    return null;
  }

  return {
    id: workRecord.id,
    professionalName: workRecord.professional.user.fullName,
    tradeName: workRecord.trade.name,
    createdAt: workRecord.createdAt,
    clientId: workRecord.clientId,
    alreadyReviewed: workRecord.reviews.length > 0,
  };
}

/**
 * work_records del cliente todavía sin reseña enviada.
 */
export async function getPendingReviewsForClient(
  userId: string,
): Promise<PendingReviewForClient[]> {
  const workRecords = await prisma.workRecord.findMany({
    where: { clientId: userId, reviews: { none: {} } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      createdAt: true,
      professional: {
        select: { slug: true, user: { select: { fullName: true } } },
      },
      trade: { select: { name: true } },
    },
  });

  return workRecords.map((workRecord) => ({
    workRecordId: workRecord.id,
    professionalName: workRecord.professional.user.fullName,
    professionalSlug: workRecord.professional.slug,
    tradeName: workRecord.trade.name,
    type: workRecord.type,
    createdAt: workRecord.createdAt,
  }));
}

/**
 * work_records del profesional donde todavía no calificó al cliente
 * (ClientRating, privada).
 */
export async function getPendingReviewsForProfessional(
  professionalId: string,
): Promise<PendingRatingForProfessional[]> {
  const workRecords = await prisma.workRecord.findMany({
    where: {
      professionalId,
      clientRatings: { none: { ratedByProfessionalId: professionalId } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      createdAt: true,
      client: { select: { fullName: true } },
      trade: { select: { name: true } },
    },
  });

  return workRecords.map((workRecord) => ({
    workRecordId: workRecord.id,
    clientName: workRecord.client.fullName,
    tradeName: workRecord.trade.name,
    type: workRecord.type,
    createdAt: workRecord.createdAt,
  }));
}

export async function getPublishedReviewsForProfessional(
  professionalId: string,
): Promise<PublishedReviewForProfessional[]> {
  const reviews = await prisma.review.findMany({
    where: { reviewedProfessionalId: professionalId, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      type: true,
      rating: true,
      comment: true,
      publishedAt: true,
      reviewer: { select: { fullName: true } },
      trade: { select: { name: true } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    reviewerName: review.reviewer.fullName,
    tradeName: review.trade.name,
    type: review.type,
    rating: review.rating,
    comment: review.comment,
    publishedAt: review.publishedAt as Date,
  }));
}

/**
 * Calificación privada del cliente: solo debe mostrarse al profesional que
 * la escribió (regla del módulo reviews — nunca se expone públicamente).
 */
export async function getClientRatingForProfessional(
  clientId: string,
  professionalId: string,
): Promise<ClientRatingForProfessional | null> {
  return prisma.clientRating.findFirst({
    where: { clientId, ratedByProfessionalId: professionalId },
    select: { rating: true, comment: true, createdAt: true },
  });
}
