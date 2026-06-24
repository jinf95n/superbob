import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getWeightedScores } from "@/modules/reviews/queries";
import {
  AdminProfessionalListItem,
  AdminProfessionalListParams,
  AdminProfessionalListResult,
  ProfessionalProfileDetail,
  ProfessionalProfileForEdit,
  ProfessionalSearchItem,
  ProfessionalTradeWithScore,
} from "./types";

/**
 * Todos los profesionales activos, sin filtrar ni paginar: el filtrado por
 * oficio/zona se hace 100% en memoria en el cliente (ver SearchClient.tsx).
 */
export async function getActiveProfessionalsForSearch(): Promise<
  ProfessionalSearchItem[]
> {
  const matches = await prisma.professionalProfile.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      bio: true,
      isVerified: true,
      createdAt: true,
      user: { select: { fullName: true, avatarUrl: true } },
      professionalTrades: {
        where: { trade: { isActive: true } },
        select: {
          isPrimary: true,
          trade: { select: { name: true, slug: true } },
        },
      },
      coverageAreas: {
        select: {
          department: { select: { name: true, slug: true } },
        },
      },
    },
  });

  const scores = await getWeightedScores(
    matches.map((professional) => professional.id),
  );

  const ranked = matches
    .map((professional) => {
      const primaryTrade =
        professional.professionalTrades.find((pt) => pt.isPrimary)?.trade ??
        null;
      const scoreEntry = scores.get(professional.id);

      const item: ProfessionalSearchItem & { createdAt: Date } = {
        id: professional.id,
        slug: professional.slug,
        fullName: professional.user.fullName,
        avatarUrl: professional.user.avatarUrl,
        bio: professional.bio,
        isVerified: professional.isVerified,
        primaryTrade,
        trades: professional.professionalTrades.map((pt) => pt.trade),
        departments: professional.coverageAreas.map(
          (coverage) => coverage.department,
        ),
        score: scoreEntry?.score ?? null,
        reviewCount: scoreEntry?.reviewCount ?? 0,
        createdAt: professional.createdAt,
      };

      return item;
    })
    .sort((a, b) => {
      if (a.score === null && b.score === null) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });

  const professionals: ProfessionalSearchItem[] = ranked.map(
    (professional) => ({
      id: professional.id,
      slug: professional.slug,
      fullName: professional.fullName,
      avatarUrl: professional.avatarUrl,
      bio: professional.bio,
      isVerified: professional.isVerified,
      primaryTrade: professional.primaryTrade,
      trades: professional.trades,
      departments: professional.departments,
      score: professional.score,
      reviewCount: professional.reviewCount,
    }),
  );

  return professionals;
}

export async function getProfessionalBySlug(
  slug: string,
): Promise<ProfessionalProfileDetail | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      userId: true,
      slug: true,
      bio: true,
      isVerified: true,
      isActive: true,
      user: { select: { fullName: true, avatarUrl: true } },
      professionalTrades: {
        where: { trade: { isActive: true } },
        select: {
          isPrimary: true,
          yearsExperience: true,
          trade: { select: { id: true, name: true, slug: true } },
        },
      },
      coverageAreas: {
        select: { department: { select: { name: true, slug: true } } },
      },
      workPhotos: {
        orderBy: { order: "asc" },
        take: 10,
        select: { id: true, url: true, thumbnailUrl: true, caption: true },
      },
      reviewsReceived: {
        where: { publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          type: true,
          rating: true,
          comment: true,
          publishedAt: true,
          reviewer: { select: { id: true, fullName: true } },
          trade: { select: { name: true } },
        },
      },
    },
  });

  if (!professional || !professional.isActive) {
    return null;
  }

  const scoresByTrade = await Promise.all(
    professional.professionalTrades.map((pt) =>
      getWeightedScores([professional.id], pt.trade.id).then(
        (scores) => scores.get(professional.id) ?? null,
      ),
    ),
  );

  const trades: ProfessionalTradeWithScore[] = professional.professionalTrades
    .map((pt, index) => ({
      name: pt.trade.name,
      slug: pt.trade.slug,
      isPrimary: pt.isPrimary,
      yearsExperience: pt.yearsExperience,
      score: scoresByTrade[index]?.score ?? null,
      reviewCount: scoresByTrade[index]?.reviewCount ?? 0,
    }))
    .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1));

  return {
    id: professional.id,
    userId: professional.userId,
    slug: professional.slug,
    fullName: professional.user.fullName,
    avatarUrl: professional.user.avatarUrl,
    bio: professional.bio,
    isVerified: professional.isVerified,
    trades,
    departments: professional.coverageAreas.map(
      (coverage) => coverage.department,
    ),
    photos: professional.workPhotos,
    reviews: professional.reviewsReceived.map((review) => ({
      id: review.id,
      reviewerId: review.reviewer.id,
      reviewerName: review.reviewer.fullName,
      tradeName: review.trade.name,
      type: review.type,
      rating: review.rating,
      comment: review.comment,
      publishedAt: review.publishedAt as Date,
    })),
  };
}

export async function getProfessionalProfileForEdit(
  userId: string,
): Promise<ProfessionalProfileForEdit | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      slug: true,
      bio: true,
      contactPhone: true,
      professionalTrades: {
        select: {
          isPrimary: true,
          tradeId: true,
          yearsExperience: true,
        },
      },
      coverageAreas: { select: { departmentId: true } },
    },
  });

  if (!professional) {
    return null;
  }

  const primaryTrade = professional.professionalTrades.find((pt) => pt.isPrimary);
  const secondaryTrades = professional.professionalTrades.filter(
    (pt) => !pt.isPrimary,
  );

  return {
    id: professional.id,
    slug: professional.slug,
    bio: professional.bio,
    contactPhone: professional.contactPhone,
    primaryTradeId: primaryTrade?.tradeId ?? null,
    primaryYearsExperience: primaryTrade?.yearsExperience ?? null,
    secondaryTrades: secondaryTrades.map((pt) => ({
      tradeId: pt.tradeId,
      yearsExperience: pt.yearsExperience,
    })),
    departmentIds: professional.coverageAreas.map((area) => area.departmentId),
  };
}

/**
 * Devuelve el teléfono de contacto de un profesional. Solo debe llamarse desde
 * código que ya verificó que hay una sesión activa (regla #4 de CLAUDE.md:
 * no exponer el teléfono en queries públicas).
 */
export async function getProfessionalContactPhone(
  professionalId: string,
): Promise<string | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    select: { contactPhone: true },
  });

  return professional?.contactPhone ?? null;
}

export async function getProfessionalProfileIdByUserId(
  userId: string,
): Promise<string | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return professional?.id ?? null;
}

export async function getProfessionalSlugByUserId(
  userId: string,
): Promise<string | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { userId },
    select: { slug: true },
  });

  return professional?.slug ?? null;
}

export async function getTotalProfessionalsCount(): Promise<number> {
  return prisma.professionalProfile.count();
}

const ADMIN_PROFESSIONALS_PAGE_SIZE = 20;

export async function getProfessionalsForAdmin(
  params: AdminProfessionalListParams,
): Promise<AdminProfessionalListResult> {
  const where: Prisma.ProfessionalProfileWhereInput = {
    ...(params.tradeId && {
      professionalTrades: { some: { tradeId: params.tradeId } },
    }),
    ...(params.departmentId && {
      coverageAreas: { some: { departmentId: params.departmentId } },
    }),
    ...(params.active && { isActive: params.active === "yes" }),
    ...(params.verified && { isVerified: params.verified === "yes" }),
  };

  const total = await prisma.professionalProfile.count({ where });
  const totalPages = Math.max(
    1,
    Math.ceil(total / ADMIN_PROFESSIONALS_PAGE_SIZE),
  );
  const page = Math.min(Math.max(params.page, 1), totalPages);

  const rows = await prisma.professionalProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ADMIN_PROFESSIONALS_PAGE_SIZE,
    take: ADMIN_PROFESSIONALS_PAGE_SIZE,
    select: {
      id: true,
      slug: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      user: { select: { fullName: true } },
      professionalTrades: {
        where: { isPrimary: true },
        select: { trade: { select: { name: true } } },
        take: 1,
      },
    },
  });

  const professionals: AdminProfessionalListItem[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    fullName: row.user.fullName,
    primaryTradeName: row.professionalTrades[0]?.trade.name ?? null,
    isActive: row.isActive,
    isVerified: row.isVerified,
    createdAt: row.createdAt,
  }));

  return {
    professionals,
    total,
    page,
    pageSize: ADMIN_PROFESSIONALS_PAGE_SIZE,
    totalPages,
  };
}
