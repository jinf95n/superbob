import { prisma } from "@/lib/prisma";
import { ReviewType } from "@prisma/client";
import {
  REVIEW_WEIGHT_CONTACT,
  REVIEW_WEIGHT_WORK,
  REVIEW_BLIND_DAYS,
  REVIEW_CONTACT_MIN_HOURS,
  REVIEW_CONTACT_MAX_DAYS,
} from "@/lib/config";
import {
  ClientRatingForProfessional,
  DisputeContextForAdmin,
  PendingContactReviewForClient,
  PendingRatingForProfessional,
  PendingWorkReviewForClient,
  PublishedReviewForProfessional,
  WorkRecordForNewReviewPage,
  WorkRecordForReviewPage,
  WorkRecordStatus,
} from "./types";

const REVIEW_TYPE_WEIGHTS: Record<ReviewType, number> = {
  work_review: REVIEW_WEIGHT_WORK,
  contact_review: REVIEW_WEIGHT_CONTACT,
};

export type WeightedScore = {
  score: number;
  reviewCount: number;
};

/**
 * Score ponderado por profesional a partir de reseñas publicadas.
 * work_review pesa REVIEW_WEIGHT_WORK (1.0), contact_review pesa REVIEW_WEIGHT_CONTACT (0.3).
 * Fuente de verdad: regla #11 de CLAUDE.md y src/lib/config.ts.
 * No se cachea en Fase 1.
 */
export async function getWeightedScores(
  professionalIds: string[],
  tradeId?: string,
): Promise<Map<string, WeightedScore>> {
  if (professionalIds.length === 0) return new Map();

  const reviews = await prisma.review.findMany({
    where: {
      reviewedProfessionalId: { in: professionalIds },
      publishedAt: { not: null },
      suspendedAt: null,
      deletedAt: null,
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
    const entry = totals.get(review.reviewedProfessionalId) ?? {
      weightedSum: 0,
      weightTotal: 0,
      reviewCount: 0,
    };
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
  return prisma.review.count({
    where: { publishedAt: null, withdrawnAt: null, deletedAt: null },
  });
}

export async function getPendingReviews(page = 1): Promise<PendingReviewsResult> {
  const where = { publishedAt: null, withdrawnAt: null, deletedAt: null };
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
      reviewedProfessional: { select: { user: { select: { fullName: true } } } },
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
      ? new Date(row.submittedAt.getTime() + REVIEW_BLIND_DAYS * 24 * 60 * 60 * 1000)
      : null,
  }));

  return { reviews, total, page: currentPage, pageSize: ADMIN_REVIEWS_PAGE_SIZE, totalPages };
}

export async function getPendingReviewsToRespondCount(professionalId: string): Promise<number> {
  const reviews = await prisma.review.findMany({
    where: {
      reviewedProfessionalId: professionalId,
      submittedAt: { not: null },
      publishedAt: null,
      withdrawnAt: null,
      deletedAt: null,
    },
    select: { workRecordId: true },
  });

  if (reviews.length === 0) return 0;

  const workRecordIds = reviews.map((r) => r.workRecordId);

  const rated = await prisma.clientRating.findMany({
    where: { workRecordId: { in: workRecordIds }, ratedByProfessionalId: professionalId },
    select: { workRecordId: true },
  });

  const ratedIds = new Set(rated.map((r) => r.workRecordId));
  return workRecordIds.filter((id) => !ratedIds.has(id)).length;
}

export async function getWorkRecordForReviewPage(
  workRecordId: string,
): Promise<WorkRecordForReviewPage | null> {
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: {
      id: true,
      clientId: true,
      status: true,
      createdAt: true,
      professional: { select: { user: { select: { fullName: true } } } },
      trade: { select: { name: true } },
      reviews: { select: { id: true } },
    },
  });

  if (!workRecord) return null;

  return {
    id: workRecord.id,
    professionalName: workRecord.professional.user.fullName,
    tradeName: workRecord.trade.name,
    createdAt: workRecord.createdAt,
    clientId: workRecord.clientId,
    status: workRecord.status as WorkRecordStatus,
    alreadyReviewed: workRecord.reviews.length > 0,
  };
}

// work_records en active/completed del cliente donde aún no envió ninguna reseña
// (incluso retirada — el retiro bloquea el reenvío).
export async function getPendingWorkReviewsForClient(
  userId: string,
): Promise<PendingWorkReviewForClient[]> {
  const workRecords = await prisma.workRecord.findMany({
    where: {
      clientId: userId,
      status: { in: ["active", "completed"] },
      reviews: { none: { reviewerId: userId } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      professional: { select: { slug: true, user: { select: { fullName: true } } } },
      trade: { select: { name: true } },
    },
  });

  return workRecords.map((wr) => ({
    workRecordId: wr.id,
    professionalName: wr.professional.user.fullName,
    professionalSlug: wr.professional.slug,
    tradeName: wr.trade.name,
    status: wr.status as WorkRecordStatus,
    createdAt: wr.createdAt,
  }));
}

// contact_events elegibles para contact_review: sin work_record, dentro de la ventana temporal.
export async function getPendingContactReviewsForClient(
  userId: string,
): Promise<PendingContactReviewForClient[]> {
  const minAgo = new Date(Date.now() - REVIEW_CONTACT_MIN_HOURS * 60 * 60 * 1000);
  const maxAgo = new Date(Date.now() - REVIEW_CONTACT_MAX_DAYS * 24 * 60 * 60 * 1000);

  const contactEvents = await prisma.contactEvent.findMany({
    where: {
      clientId: userId,
      createdAt: { lte: minAgo, gte: maxAgo },
      workRecords: { none: { status: { not: "cancelled" } } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      professional: {
        select: {
          id: true,
          slug: true,
          user: { select: { fullName: true } },
          professionalTrades: {
            where: { trade: { isActive: true } },
            select: { trade: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  return contactEvents.map((ce) => ({
    contactEventId: ce.id,
    professionalName: ce.professional.user.fullName,
    professionalSlug: ce.professional.slug,
    professionalId: ce.professional.id,
    contactDate: ce.createdAt,
    availableTrades: ce.professional.professionalTrades.map((pt) => ({
      id: pt.trade.id,
      name: pt.trade.name,
    })),
  }));
}

// work_records del profesional donde aún no calificó al cliente (ClientRating, privada).
export async function getPendingRatingsForProfessional(
  professionalId: string,
): Promise<PendingRatingForProfessional[]> {
  const workRecords = await prisma.workRecord.findMany({
    where: {
      professionalId,
      status: { in: ["active", "completed"] },
      clientRatings: { none: { ratedByProfessionalId: professionalId } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      client: { select: { fullName: true } },
      trade: { select: { name: true } },
    },
  });

  return workRecords.map((wr) => ({
    workRecordId: wr.id,
    clientName: wr.client.fullName,
    tradeName: wr.trade.name,
    status: wr.status as WorkRecordStatus,
    createdAt: wr.createdAt,
  }));
}

export async function getPublishedReviewsForProfessional(
  professionalId: string,
): Promise<PublishedReviewForProfessional[]> {
  const reviews = await prisma.review.findMany({
    where: {
      reviewedProfessionalId: professionalId,
      publishedAt: { not: null },
      suspendedAt: null,
      deletedAt: null,
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      type: true,
      rating: true,
      comment: true,
      publishedAt: true,
      responseText: true,
      responsePublishedAt: true,
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
    responseText: review.responseText,
    responsePublishedAt: review.responsePublishedAt,
  }));
}

// Cuenta work_records activos/completados sin reseña del cliente (incluyendo retiradas).
export async function getPendingWorkReviewsForClientCount(userId: string): Promise<number> {
  return prisma.workRecord.count({
    where: {
      clientId: userId,
      status: { in: ["active", "completed"] },
      reviews: { none: { reviewerId: userId } },
    },
  });
}

export async function checkUserHasPendingReview(
  clientId: string,
  professionalId: string,
): Promise<{ workRecordId: string } | null> {
  const workRecord = await prisma.workRecord.findFirst({
    where: {
      clientId,
      professionalId,
      status: { in: ["active", "completed"] },
      reviews: { none: { reviewerId: clientId } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return workRecord ? { workRecordId: workRecord.id } : null;
}

export async function getClientRatingForProfessional(
  clientId: string,
  professionalId: string,
): Promise<ClientRatingForProfessional | null> {
  return prisma.clientRating.findFirst({
    where: { clientId, ratedByProfessionalId: professionalId },
    select: { rating: true, comment: true, createdAt: true },
  });
}

export async function getWorkRecordForNewReviewPage(
  clientId: string,
  professionalId: string,
): Promise<WorkRecordForNewReviewPage | null> {
  const workRecord = await prisma.workRecord.findFirst({
    where: {
      clientId,
      professionalId,
      status: { in: ["active", "completed"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      professional: { select: { slug: true, user: { select: { fullName: true } } } },
      trade: { select: { name: true } },
      reviews: { where: { reviewerId: clientId }, select: { id: true } },
    },
  });

  if (!workRecord) return null;

  return {
    id: workRecord.id,
    status: workRecord.status as WorkRecordStatus,
    professionalName: workRecord.professional.user.fullName,
    professionalSlug: workRecord.professional.slug,
    tradeName: workRecord.trade.name,
    alreadyReviewed: workRecord.reviews.length > 0,
  };
}

export type PendingClaimForProfessional = {
  workRecordId: string;
  clientName: string;
  tradeName: string;
  contactDate: Date;
  claimCreatedAt: Date;
};

export async function getPendingClaimsForProfessional(
  professionalId: string,
): Promise<PendingClaimForProfessional[]> {
  const workRecords = await prisma.workRecord.findMany({
    where: {
      professionalId,
      status: "pending_pro_confirmation",
      initiatedBy: "client",
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      client: { select: { fullName: true } },
      trade: { select: { name: true } },
      contactEvent: { select: { createdAt: true } },
    },
  });

  return workRecords.map((wr) => ({
    workRecordId: wr.id,
    clientName: wr.client.fullName,
    tradeName: wr.trade.name,
    contactDate: wr.contactEvent.createdAt,
    claimCreatedAt: wr.createdAt,
  }));
}

export async function getPendingClaimsForProfessionalCount(
  professionalId: string,
): Promise<number> {
  return prisma.workRecord.count({
    where: {
      professionalId,
      status: "pending_pro_confirmation",
      initiatedBy: "client",
    },
  });
}

export type PendingClaimDetail = {
  workRecordId: string;
  professionalId: string;
  clientName: string;
  tradeName: string;
  contactDate: Date;
  claimCreatedAt: Date;
};

export async function getPendingClaimDetail(
  workRecordId: string,
  professionalId: string,
): Promise<PendingClaimDetail | null> {
  const wr = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: {
      id: true,
      status: true,
      initiatedBy: true,
      professionalId: true,
      createdAt: true,
      client: { select: { fullName: true } },
      trade: { select: { name: true } },
      contactEvent: { select: { createdAt: true } },
    },
  });

  if (!wr || wr.professionalId !== professionalId) return null;
  if (wr.status !== "pending_pro_confirmation" || wr.initiatedBy !== "client") return null;

  return {
    workRecordId: wr.id,
    professionalId: wr.professionalId,
    clientName: wr.client.fullName,
    tradeName: wr.trade.name,
    contactDate: wr.contactEvent.createdAt,
    claimCreatedAt: wr.createdAt,
  };
}

export async function getPendingContactReviewsForClientCount(userId: string): Promise<number> {
  const minAgo = new Date(Date.now() - REVIEW_CONTACT_MIN_HOURS * 60 * 60 * 1000);
  const maxAgo = new Date(Date.now() - REVIEW_CONTACT_MAX_DAYS * 24 * 60 * 60 * 1000);

  return prisma.contactEvent.count({
    where: {
      clientId: userId,
      createdAt: { lte: minAgo, gte: maxAgo },
      workRecords: { none: { status: { not: "cancelled" } } },
    },
  });
}

// Todos los work_records disputados (para la vista admin).
export async function getDisputedWorkRecords() {
  return prisma.workRecord.findMany({
    where: { status: "disputed" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      initiatedBy: true,
      professional: { select: { id: true, user: { select: { fullName: true } } } },
      client: { select: { id: true, fullName: true } },
      trade: { select: { name: true } },
    },
  });
}

// Contexto completo de una disputa para que el admin pueda tomar una decisión informada.
export async function getDisputeContextForAdmin(
  workRecordId: string,
): Promise<DisputeContextForAdmin | null> {
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: {
      id: true,
      status: true,
      initiatedBy: true,
      createdAt: true,
      contactEvent: { select: { createdAt: true } },
      trade: { select: { name: true } },
      professional: {
        select: {
          id: true,
          user: { select: { fullName: true, email: true } },
        },
      },
      client: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!workRecord) return null;

  const [proDisputes, clientClaims] = await Promise.all([
    // Historial de disputas del profesional (excluyendo el actual)
    prisma.workRecord.findMany({
      where: {
        id: { not: workRecordId },
        professionalId: workRecord.professional.id,
        status: { in: ["disputed", "cancelled"] },
        initiatedBy: "client",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        disputeResolution: true,
        createdAt: true,
        disputeResolvedAt: true,
        client: { select: { fullName: true } },
      },
    }),
    // Historial de reclamos del cliente (excluyendo el actual)
    prisma.workRecord.findMany({
      where: {
        id: { not: workRecordId },
        clientId: workRecord.client.id,
        initiatedBy: "client",
        status: { in: ["disputed", "cancelled", "active", "completed"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        disputeResolution: true,
        createdAt: true,
        disputeResolvedAt: true,
        professional: { select: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  return {
    workRecord: {
      id: workRecord.id,
      status: workRecord.status as WorkRecordStatus,
      initiatedBy: workRecord.initiatedBy,
      createdAt: workRecord.createdAt,
      contactEventCreatedAt: workRecord.contactEvent.createdAt,
      tradeName: workRecord.trade.name,
      professional: {
        id: workRecord.professional.id,
        fullName: workRecord.professional.user.fullName,
        email: workRecord.professional.user.email,
      },
      client: {
        id: workRecord.client.id,
        fullName: workRecord.client.fullName,
        email: workRecord.client.email,
      },
    },
    proDisputes: proDisputes.map((wr) => ({
      id: wr.id,
      status: wr.status as WorkRecordStatus,
      disputeResolution: wr.disputeResolution,
      createdAt: wr.createdAt,
      disputeResolvedAt: wr.disputeResolvedAt,
      clientName: wr.client.fullName,
    })),
    clientClaims: clientClaims.map((wr) => ({
      id: wr.id,
      status: wr.status as WorkRecordStatus,
      disputeResolution: wr.disputeResolution,
      createdAt: wr.createdAt,
      disputeResolvedAt: wr.disputeResolvedAt,
      professionalName: wr.professional.user.fullName,
    })),
  };
}
