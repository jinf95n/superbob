import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getWeightedScores } from "@/modules/reviews/queries";
import {
  AdminProfessionalDetail,
  AdminProfessionalListItem,
  AdminProfessionalListParams,
  AdminProfessionalListResult,
  ContactMetrics,
  FeaturedProfessional,
  PlatformStats,
  ProfessionalBadge,
  ProfessionalDashboardMetrics,
  ProfessionalFullProfile,
  ProfessionalProfileForEdit,
  ProfessionalReviewForProfile,
  ProfessionalSanctionType,
  ProfessionalTradeForProfile,
  ProfileCompleteness,
  ProfileCompletenessLevel,
  ProfileCompletionItem,
  SearchableProfessional,
  PrivateSuperbobScoreBreakdown,
  PrivateSuperbobScoreComponent,
} from "./types";

const PROFILE_SCORE_POINTS = {
  avatar: 10,
  bio: 10,
  primaryTrade: 10,
  coverage: 10,
  contactPhone: 15,
  threePhotos: 10,
  firstReview: 10,
  verified: 15,
  fiveReviews: 10,
};

// Devuelve el filtro Prisma para sanciones activas (suspensión temporal o
// desactivación permanente, no levantadas, no vencidas). Se llama en runtime
// para que new Date() sea el momento de la consulta, no del import.
function buildActiveSanctionFilter(): Prisma.ProfessionalSanctionWhereInput {
  return {
    liftedAt: null,
    type: { in: ["temporary_suspension", "permanent_deactivation"] },
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

/**
 * Todos los profesionales activos, sin filtrar ni paginar: el filtrado por
 * texto y por los filtros del panel se hace 100% en memoria en el cliente
 * (ver SearchResults.tsx).
 */
export async function getAllProfessionalsForSearch(): Promise<
  SearchableProfessional[]
> {
  const professionals = await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
      NOT: { sanctions: { some: buildActiveSanctionFilter() } },
    },
    select: {
      id: true,
      slug: true,
      bio: true,
      contactPhone: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
      primaryDepartment: { select: { name: true } },
      user: { select: { fullName: true, avatarUrl: true } },
      professionalTrades: {
        where: { trade: { isActive: true } },
        select: {
          isPrimary: true,
          yearsExperience: true,
          trade: {
            select: {
              name: true,
              slug: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      coverageAreas: {
        select: { department: { select: { name: true } } },
      },
      _count: { select: { workPhotos: true } },
      reviewsReceived: {
        where: { publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: {
          rating: true,
          comment: true,
          reviewer: { select: { fullName: true } },
        },
      },
    },
  });

  const professionalIds = professionals.map((professional) => professional.id);

  const [scores, completedCounts, contactCounts, firstReviewDates] = await Promise.all([
    getWeightedScores(professionalIds),
    prisma.workRecord.groupBy({
      by: ["professionalId"],
      where: { professionalId: { in: professionalIds }, status: "completed" },
      _count: { _all: true },
    }),
    prisma.contactEvent.groupBy({
      by: ["professionalId"],
      where: { professionalId: { in: professionalIds } },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["reviewedProfessionalId"],
      where: { reviewedProfessionalId: { in: professionalIds }, publishedAt: { not: null } },
      _min: { publishedAt: true },
    }),
  ]);

  const completedCountByProfessional = new Map(
    completedCounts.map((row) => [row.professionalId, row._count?._all ?? 0]),
  );
  const contactCountByProfessional = new Map(
    contactCounts.map((row) => [row.professionalId, row._count?._all ?? 0]),
  );
  const firstReviewByProfessional = new Map(
    firstReviewDates.map((row) => [row.reviewedProfessionalId, row._min?.publishedAt ?? null]),
  );

  return professionals.map((professional) => {
    const primaryTradeEntry = professional.professionalTrades.find(
      (pt) => pt.isPrimary,
    );
    const primaryTrade = primaryTradeEntry
      ? {
          name: primaryTradeEntry.trade.name,
          slug: primaryTradeEntry.trade.slug,
          categoryName: primaryTradeEntry.trade.category.name,
        }
      : null;

    const scoreEntry = scores.get(professional.id) ?? null;
    const reviewCount = scoreEntry?.reviewCount ?? 0;
    const hasBio = Boolean(professional.bio && professional.bio.trim().length > 20);

    const profileScore =
      (professional.user.avatarUrl ? PROFILE_SCORE_POINTS.avatar : 0) +
      (hasBio ? PROFILE_SCORE_POINTS.bio : 0) +
      (primaryTrade ? PROFILE_SCORE_POINTS.primaryTrade : 0) +
      (professional.coverageAreas.length > 0 ? PROFILE_SCORE_POINTS.coverage : 0) +
      (professional.contactPhone ? PROFILE_SCORE_POINTS.contactPhone : 0) +
      (professional._count.workPhotos >= 3 ? PROFILE_SCORE_POINTS.threePhotos : 0) +
      (reviewCount >= 1 ? PROFILE_SCORE_POINTS.firstReview : 0) +
      (professional.isVerified ? PROFILE_SCORE_POINTS.verified : 0) +
      (reviewCount >= 5 ? PROFILE_SCORE_POINTS.fiveReviews : 0);

    // Índice SUPERBOB: misma lógica que getPrivateSuperbobScore, calculada en bulk
    const totalContacts = contactCountByProfessional.get(professional.id) ?? 0;
    const firstReviewDate = firstReviewByProfessional.get(professional.id) ?? null;

    const confidence = reviewCount === 0 ? 0 : reviewCount >= 3 ? 1 : reviewCount === 2 ? 0.75 : 0.5;
    const reviewQualityValue = Math.round(((scoreEntry?.score ?? 0) / 5) * 45 * confidence);

    const completenessChecks = [
      Boolean(professional.user.avatarUrl),
      hasBio,
      Boolean(primaryTrade),
      professional.coverageAreas.length > 0,
      Boolean(professional.contactPhone),
      professional._count.workPhotos >= 3,
    ];
    const completenessValue = Math.round((completenessChecks.filter(Boolean).length / 6) * 25);

    const contactVolumeValue = Math.round(
      Math.min(Math.log10(totalContacts + 1) / Math.log10(101), 1) * 20,
    );

    let tenureValue = 0;
    if (firstReviewDate) {
      const monthsActive = (Date.now() - new Date(firstReviewDate).getTime()) / MS_PER_MONTH;
      tenureValue = Math.round(Math.min(monthsActive / 24, 1) * 10);
    }

    const superbobScore = reviewQualityValue + completenessValue + contactVolumeValue + tenureValue;

    return {
      id: professional.id,
      slug: professional.slug,
      fullName: professional.user.fullName,
      avatarUrl: professional.user.avatarUrl,
      isVerified: professional.isVerified,
      isActive: professional.isActive,
      createdAt: professional.createdAt,
      primaryTrade,
      allTrades: professional.professionalTrades.map((pt) => pt.trade.name),
      departments: professional.coverageAreas.map(
        (coverage) => coverage.department.name,
      ),
      primaryDepartmentName:
        professional.primaryDepartment?.name ??
        professional.coverageAreas[0]?.department.name ??
        null,
      averageRating: scoreEntry?.score ?? 0,
      reviewCount,
      completedJobsCount: completedCountByProfessional.get(professional.id) ?? 0,
      yearsExperience: primaryTradeEntry?.yearsExperience ?? 0,
      profileScore,
      superbobScore,
      latestReview: professional.reviewsReceived[0]
        ? {
            rating: professional.reviewsReceived[0].rating,
            comment: professional.reviewsReceived[0].comment,
            reviewerName: formatReviewerDisplayName(
              professional.reviewsReceived[0].reviewer.fullName,
            ),
          }
        : null,
    };
  });
}

/**
 * Profesionales activos con al menos 1 reseña publicada, en la forma que
 * necesita la home (FeaturedProfessional). Comparte la selección entre
 * getFeaturedProfessionals y getTopRatedProfessionals; cada una aplica su
 * propio orden y filtro de cantidad mínima de reseñas.
 */
async function getRankedProfessionalsWithPublishedReviews(
  minReviewCount: number,
): Promise<FeaturedProfessional[]> {
  const candidates = await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
      reviewsReceived: { some: { publishedAt: { not: null } } },
      NOT: { sanctions: { some: buildActiveSanctionFilter() } },
    },
    select: {
      id: true,
      slug: true,
      isVerified: true,
      user: { select: { fullName: true, avatarUrl: true } },
      professionalTrades: {
        where: { isPrimary: true, trade: { isActive: true } },
        select: { trade: { select: { name: true } } },
        take: 1,
      },
      primaryDepartment: { select: { name: true } },
      coverageAreas: {
        select: { department: { select: { name: true } } },
        take: 1,
      },
    },
  });

  const scores = await getWeightedScores(candidates.map((c) => c.id));

  const featured: FeaturedProfessional[] = [];
  for (const candidate of candidates) {
    const primaryTrade = candidate.professionalTrades[0]?.trade.name ?? null;
    const department =
      candidate.primaryDepartment?.name ??
      candidate.coverageAreas[0]?.department.name ??
      null;
    const scoreEntry = scores.get(candidate.id) ?? null;

    if (!primaryTrade || !scoreEntry) {
      continue;
    }
    if (scoreEntry.reviewCount < minReviewCount) {
      continue;
    }

    featured.push({
      id: candidate.id,
      slug: candidate.slug,
      fullName: candidate.user.fullName,
      avatarUrl: candidate.user.avatarUrl,
      isVerified: candidate.isVerified,
      primaryTrade,
      department,
      averageRating: scoreEntry.score,
      reviewCount: scoreEntry.reviewCount,
    });
  }

  return featured;
}

/**
 * Top profesionales para la home: verificados primero, luego por score
 * ponderado DESC, luego por cantidad de reseñas DESC. Requiere al menos
 * 1 reseña publicada.
 */
export async function getFeaturedProfessionals(
  limit: number,
): Promise<FeaturedProfessional[]> {
  const ranked = await getRankedProfessionalsWithPublishedReviews(1);

  return ranked
    .sort((a, b) => {
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.reviewCount - a.reviewCount;
    })
    .slice(0, limit);
}

/**
 * Los profesionales con mayor score ponderado, con mínimo 3 reseñas
 * publicadas (para que el score sea representativo). Para la home.
 */
export async function getTopRatedProfessionals(
  limit: number,
): Promise<FeaturedProfessional[]> {
  const ranked = await getRankedProfessionalsWithPublishedReviews(3);

  return ranked
    .sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

/** Conteos globales para el hero de la home. */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [totalProfessionals, totalReviews, verifiedProfessionals] =
    await Promise.all([
      prisma.professionalProfile.count({ where: { isActive: true } }),
      prisma.review.count({ where: { publishedAt: { not: null } } }),
      prisma.professionalProfile.count({ where: { isVerified: true } }),
    ]);

  return { totalProfessionals, totalReviews, verifiedProfessionals };
}

// Cantidad de reseñas a hidratar completas (con reviewer/trade/workRecord)
// para la carga inicial de /p/[slug]. Las estadísticas (histograma,
// satisfactionRate, publishedReviewsCount) NO dependen de este límite: se
// calculan con agregados de Prisma sobre todas las reseñas publicadas, no
// sobre este array. "Ver todas las reseñas" del cliente sigue mostrando como
// máximo esta cantidad — Fase 1 no tiene paginación de reseñas.
const MAX_PROFILE_REVIEWS_LOADED = 10;

/**
 * "Claudia M." — nombre + inicial del apellido, por privacidad en reseñas
 * públicas.
 */
function formatReviewerDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Usuario";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

/**
 * Extrae "especialidades" de la bio en texto libre (Fase 1, sin campo
 * dedicado): usa una lista separada por comas o palabras entre comillas
 * simples si existen, y si no, las primeras 5 palabras de más de 5 letras
 * (deduplicadas). Ver sección BIO Y ESPECIALIDADES del rediseño.
 */
function extractSpecialtiesFromBio(bio: string): string[] {
  const commaParts = bio
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (commaParts.length >= 3) {
    return commaParts.slice(0, 5);
  }

  const quoted = [...bio.matchAll(/'([^']{2,})'/g)].map((match) =>
    match[1].trim(),
  );
  if (quoted.length > 0) {
    return quoted.slice(0, 5);
  }

  const words = bio
    .replace(/[.,;:!?()"]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 5);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const word of words) {
    const key = word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(word);
    }
  }

  return unique.slice(0, 5);
}

/**
 * Query principal del perfil público /p/[slug]. Trae en un solo viaje todo
 * lo necesario para el hero, oficios, cobertura, portafolio y reseñas. Los
 * contact_events del mes (para el hero) se cargan aparte en
 * getContactMetrics para no impactar este query.
 */
export async function getProfessionalProfileBySlug(
  slug: string,
): Promise<ProfessionalFullProfile | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      userId: true,
      slug: true,
      bio: true,
      isVerified: true,
      isActive: true,
      qrCodeUrl: true,
      createdAt: true,
      primaryDepartment: { select: { name: true } },
      user: { select: { fullName: true, avatarUrl: true } },
      professionalTrades: {
        where: { trade: { isActive: true } },
        select: {
          isPrimary: true,
          yearsExperience: true,
          tradeId: true,
          specialties: true,
          trade: { select: { name: true, slug: true } },
        },
      },
      coverageAreas: {
        select: { department: { select: { name: true, slug: true } } },
      },
      workPhotos: {
        orderBy: { order: "asc" },
        select: { id: true, url: true, thumbnailUrl: true, caption: true },
      },
      reviewsReceived: {
        where: { publishedAt: { not: null }, suspendedAt: null, deletedAt: null },
        orderBy: { publishedAt: "desc" },
        take: MAX_PROFILE_REVIEWS_LOADED,
        select: {
          id: true,
          type: true,
          rating: true,
          comment: true,
          publishedAt: true,
          reviewer: { select: { id: true, fullName: true, avatarUrl: true } },
          trade: { select: { name: true } },
        },
      },
      sanctions: {
        where: buildActiveSanctionFilter(),
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!professional || !professional.isActive || professional.sanctions.length > 0) {
    return null;
  }

  const tradeIds = professional.professionalTrades.map((pt) => pt.tradeId);
  const publishedReviewsWhere = {
    reviewedProfessionalId: professional.id,
    publishedAt: { not: null },
    suspendedAt: null as null,
    deletedAt: null as null,
  };

  // Las 6 queries de abajo son independientes entre sí (todas solo dependen
  // de professional.id / tradeIds, ya resueltos) — antes algunas se esperaban
  // en serie sin necesidad, lo que sumaba tiempo de ida y vuelta a la DB.
  const reviewerIds = professional.reviewsReceived.map((r) => r.reviewer.id);

  const [
    completedByTrade,
    scores,
    completedWorkRecordsCount,
    ratingGroups,
    publishedReviewsCount,
    satisfiedCount,
    reviewerCountsRaw,
  ] = await Promise.all([
    tradeIds.length
      ? prisma.workRecord.groupBy({
          by: ["tradeId"],
          where: {
            professionalId: professional.id,
            status: "completed",
            tradeId: { in: tradeIds },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    getWeightedScores([professional.id]),
    prisma.workRecord.count({
      where: { professionalId: professional.id, status: "completed" },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: publishedReviewsWhere,
      _count: { _all: true },
    }),
    prisma.review.count({ where: publishedReviewsWhere }),
    prisma.review.count({
      where: { ...publishedReviewsWhere, rating: { gte: 4 } },
    }),
    reviewerIds.length
      ? prisma.review.groupBy({
          by: ["reviewerId"],
          where: {
            reviewerId: { in: reviewerIds },
            publishedAt: { not: null },
            suspendedAt: null,
            deletedAt: null,
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const reviewCountByReviewer = new Map(
    reviewerCountsRaw.map((row) => [row.reviewerId, row._count._all]),
  );

  const completedByTradeMap = new Map(
    completedByTrade.map((row) => [row.tradeId, row._count?._all ?? 0]),
  );

  const trades: ProfessionalTradeForProfile[] = professional.professionalTrades
    .map((pt) => ({
      tradeId: pt.tradeId,
      name: pt.trade.name,
      slug: pt.trade.slug,
      isPrimary: pt.isPrimary,
      yearsExperience: pt.yearsExperience,
      specialties: pt.specialties,
      completedWorkCount: completedByTradeMap.get(pt.tradeId) ?? 0,
    }))
    .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1));

  const primaryTradeEntry =
    professional.professionalTrades.find((pt) => pt.isPrimary) ?? null;

  const scoreEntry = scores.get(professional.id) ?? null;

  // Histograma calculado sobre TODAS las reseñas publicadas (agregado de
  // Prisma), no sobre professional.reviewsReceived — ese array está acotado
  // a MAX_PROFILE_REVIEWS_LOADED para la carga inicial y subestimaría el
  // conteo real si se usara acá.
  const ratingHistogram: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const group of ratingGroups) {
    const bucket = Math.min(5, Math.max(1, Math.round(group.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    ratingHistogram[bucket] += group._count._all;
  }

  const satisfactionRate =
    publishedReviewsCount >= 3
      ? Math.round((satisfiedCount / publishedReviewsCount) * 100)
      : null;

  const reviews: ProfessionalReviewForProfile[] =
    professional.reviewsReceived.map((review) => ({
      id: review.id,
      reviewerId: review.reviewer.id,
      reviewerDisplayName: formatReviewerDisplayName(review.reviewer.fullName),
      reviewerAvatarUrl: review.reviewer.avatarUrl,
      reviewsGivenCount: reviewCountByReviewer.get(review.reviewer.id) ?? 1,
      tradeName: review.trade.name,
      rating: review.rating,
      comment: review.comment,
      publishedAt: review.publishedAt as Date,
      reviewType: review.type,
    }));

  const bio = professional.bio?.trim() || null;

  return {
    id: professional.id,
    userId: professional.userId,
    slug: professional.slug,
    fullName: professional.user.fullName,
    avatarUrl: professional.user.avatarUrl,
    bio,
    specialties: bio ? extractSpecialtiesFromBio(bio) : [],
    isVerified: professional.isVerified,
    qrCodeUrl: professional.qrCodeUrl,
    createdAt: professional.createdAt,
    primaryTrade: primaryTradeEntry
      ? {
          name: primaryTradeEntry.trade.name,
          slug: primaryTradeEntry.trade.slug,
        }
      : null,
    primaryDepartmentName:
      professional.primaryDepartment?.name ??
      professional.coverageAreas[0]?.department.name ??
      null,
    trades,
    departments: professional.coverageAreas.map(
      (coverage) => coverage.department,
    ),
    photos: professional.workPhotos,
    reviews,
    weightedScore: scoreEntry?.score ?? null,
    publishedReviewsCount,
    ratingHistogram,
    completedWorkRecordsCount,
    satisfactionRate,
  };
}

/**
 * Contactos del mes y tiempo de respuesta para el hero. Separado de
 * getProfessionalProfileBySlug para no atar el tiempo de carga principal a
 * esta métrica (pedido explícito del rediseño).
 *
 * El tiempo de respuesta real (mediana entre contact_event.created_at y la
 * primera respuesta del profesional) no se puede calcular en Fase 1: el
 * schema no registra cuándo responde el profesional a un contacto. Por eso
 * siempre se devuelve la etiqueta neutra; el día que exista ese dato, esta
 * función es el único lugar a tocar.
 */
export async function getContactMetrics(
  professionalId: string,
): Promise<ContactMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const contactsThisMonth = await prisma.contactEvent.count({
    where: { professionalId, createdAt: { gte: startOfMonth } },
  });

  return {
    contactsThisMonth,
    responseTimeLabel: "Tiempo de respuesta variable",
  };
}

function getCompletenessLevel(score: number): ProfileCompletenessLevel {
  if (score >= 90) return "Verificado";
  if (score >= 70) return "Destacado";
  if (score >= 40) return "Completo";
  return "Básico";
}

/**
 * Completitud del perfil profesional, solo para mostrarle al propio dueño
 * (la página verifica la sesión antes de llamar a esta función).
 */
export async function getProfileCompleteness(
  professionalId: string,
): Promise<ProfileCompleteness> {
  const [professional, publishedReviewsCount] = await Promise.all([
    prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: {
        bio: true,
        contactPhone: true,
        isVerified: true,
        user: { select: { avatarUrl: true } },
        professionalTrades: {
          where: { isPrimary: true },
          select: { id: true },
          take: 1,
        },
        coverageAreas: { select: { id: true }, take: 1 },
        _count: { select: { workPhotos: true } },
      },
    }),
    prisma.review.count({
      where: { reviewedProfessionalId: professionalId, publishedAt: { not: null } },
    }),
  ]);

  if (!professional) {
    return { score: 0, level: "Básico", items: [] };
  }

  const items: ProfileCompletionItem[] = [
    {
      label: "Foto de perfil",
      completed: Boolean(professional.user.avatarUrl),
      points: 10,
      actionHref: "/professional/edit",
    },
    {
      label: "Bio completada",
      completed: Boolean(
        professional.bio && professional.bio.trim().length > 20,
      ),
      points: 10,
      actionHref: "/professional/edit",
    },
    {
      label: "Oficio principal definido",
      completed: professional.professionalTrades.length > 0,
      points: 10,
      actionHref: "/professional/edit",
    },
    {
      label: "Zonas de cobertura",
      completed: professional.coverageAreas.length > 0,
      points: 10,
      actionHref: "/professional/edit",
    },
    {
      label: "Teléfono verificado",
      completed: Boolean(professional.contactPhone),
      points: 15,
      actionHref: "/professional/edit",
    },
    {
      label: "Al menos 3 fotos de portafolio",
      completed: professional._count.workPhotos >= 3,
      points: 10,
      actionHref: "/professional/edit",
    },
    {
      label: "Primera reseña recibida",
      completed: publishedReviewsCount >= 1,
      points: 10,
    },
    {
      label: "Al menos 5 reseñas publicadas",
      completed: publishedReviewsCount >= 5,
      points: 10,
    },
  ];

  const score = items.reduce(
    (sum, item) => sum + (item.completed ? item.points : 0),
    0,
  );

  return { score, level: getCompletenessLevel(score), items };
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

/**
 * Desglose privado del Índice SUPERBOB para mostrarle al propio profesional.
 * Métricas: calidad de reseñas (45), completitud de perfil (25),
 * volumen de contactos (20), antigüedad activa (10).
 * La verificación es un badge independiente, no puntúa en el índice.
 */
export async function getPrivateSuperbobScore(
  professionalId: string,
): Promise<PrivateSuperbobScoreBreakdown> {
  const [scoreEntry, professional, totalContacts, firstReview] = await Promise.all([
    getWeightedScores([professionalId]).then((scores) => scores.get(professionalId) ?? null),
    prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: {
        bio: true,
        contactPhone: true,
        user: { select: { avatarUrl: true } },
        professionalTrades: {
          where: { isPrimary: true, trade: { isActive: true } },
          select: { id: true },
          take: 1,
        },
        coverageAreas: { select: { id: true }, take: 1 },
        _count: { select: { workPhotos: true } },
      },
    }),
    prisma.contactEvent.count({ where: { professionalId } }),
    prisma.review.findFirst({
      where: { reviewedProfessionalId: professionalId, publishedAt: { not: null } },
      orderBy: { publishedAt: "asc" },
      select: { publishedAt: true },
    }),
  ]);

  // ── 1. Calidad de reseñas (45 pts) ──
  // Factor de confianza: con menos de 3 reseñas el score no vale al 100%,
  // para no inflar perfiles con una sola reseña de 5 estrellas.
  const reviewCount = scoreEntry?.reviewCount ?? 0;
  let reviewQualityValue = 0;
  let reviewHint: string | null = null;
  if (reviewCount === 0) {
    reviewHint = "Pedí tu primera reseña a un cliente con quien ya trabajaste.";
  } else {
    const confidence = reviewCount >= 3 ? 1 : reviewCount === 2 ? 0.75 : 0.5;
    reviewQualityValue = Math.round(((scoreEntry?.score ?? 0) / 5) * 45 * confidence);
    if (reviewCount < 3) {
      reviewHint = `Tenés ${reviewCount} reseña${reviewCount > 1 ? "s" : ""}. Con 3 o más, el puntaje cuenta al 100%.`;
    } else if (reviewQualityValue < 36) {
      reviewHint = "Mantené la calidad en cada trabajo para seguir subiendo.";
    }
  }

  // ── 2. Completitud del perfil (25 pts) ──
  const completenessChecks = [
    Boolean(professional?.user.avatarUrl),
    Boolean(professional?.bio && professional.bio.trim().length > 20),
    (professional?.professionalTrades.length ?? 0) > 0,
    (professional?.coverageAreas.length ?? 0) > 0,
    Boolean(professional?.contactPhone),
    (professional?._count.workPhotos ?? 0) >= 3,
  ];
  const completedFields = completenessChecks.filter(Boolean).length;
  const completenessValue = Math.round((completedFields / 6) * 25);
  const missingLabels = [
    "foto de perfil",
    "bio",
    "oficio principal",
    "zona de cobertura",
    "teléfono de contacto",
    "3 fotos de portafolio",
  ].filter((_, i) => !completenessChecks[i]);
  const completenessHint =
    missingLabels.length > 0 ? `Completá: ${missingLabels.join(", ")}.` : null;

  // ── 3. Volumen de contactos (20 pts) ──
  // Escala logarítmica: 100 contactos = puntaje máximo.
  const contactVolumeValue = Math.round(
    Math.min(Math.log10(totalContacts + 1) / Math.log10(101), 1) * 20,
  );
  let contactHint: string | null = null;
  if (totalContacts === 0) {
    contactHint = "Compartí tu perfil o código QR para recibir tus primeros contactos.";
  } else if (totalContacts < 10) {
    contactHint = "Compartí tu perfil en WhatsApp o redes para sumar más contactos.";
  } else if (contactVolumeValue < 17) {
    contactHint = "Cada contacto que recibís suma puntos. Los primeros valen más.";
  }

  // ── 4. Antigüedad activa (10 pts) ──
  // Empieza a correr desde la primera reseña publicada, no desde el registro.
  // 24 meses de actividad = puntaje máximo.
  let tenureValue = 0;
  let tenureHint: string | null = null;
  if (!firstReview?.publishedAt) {
    tenureHint = "Crece desde tu primera reseña publicada. Todavía no tenés ninguna.";
  } else {
    const monthsActive =
      (Date.now() - new Date(firstReview.publishedAt).getTime()) / MS_PER_MONTH;
    tenureValue = Math.round(Math.min(monthsActive / 24, 1) * 10);
    if (tenureValue < 10) {
      tenureHint =
        monthsActive < 6
          ? "Crece con el tiempo que llevás activo en SUPERBOB."
          : monthsActive < 12
            ? "Vas bien. Llegás al máximo a los 2 años de actividad."
            : "Casi en el máximo. Llegás a los 10 puntos a los 2 años de actividad.";
    }
  }

  const components: PrivateSuperbobScoreComponent[] = [
    { label: "Calidad de reseñas", emoji: "⭐", value: reviewQualityValue, max: 45, hint: reviewHint },
    { label: "Completitud del perfil", emoji: "📋", value: completenessValue, max: 25, hint: completenessHint },
    { label: "Volumen de contactos", emoji: "📞", value: contactVolumeValue, max: 20, hint: contactHint },
    { label: "Antigüedad activa", emoji: "📅", value: tenureValue, max: 10, hint: tenureHint },
  ];

  const total = components.reduce((sum, c) => sum + c.value, 0);
  return { total, components };
}

export async function getDashboardMetricsForProfessional(
  professionalId: string,
): Promise<ProfessionalDashboardMetrics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalContacts,
    contacts30d,
    reviewsReceived,
    verifiedWorkRecords,
    uniqueContactClients,
    clientsWithWorkRecord,
  ] = await Promise.all([
    prisma.contactEvent.count({ where: { professionalId } }),
    prisma.contactEvent.count({
      where: { professionalId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.review.count({
      where: {
        reviewedProfessionalId: professionalId,
        publishedAt: { not: null },
        suspendedAt: null,
        deletedAt: null,
      },
    }),
    prisma.workRecord.count({
      where: {
        professionalId,
        reviews: { some: { publishedAt: { not: null }, type: "work_review" } },
      },
    }),
    prisma.contactEvent.findMany({
      where: { professionalId },
      select: { clientId: true },
      distinct: ["clientId"],
    }),
    prisma.workRecord.findMany({
      where: { professionalId, status: { not: "cancelled" } },
      select: { clientId: true },
      distinct: ["clientId"],
    }),
  ]);

  const conversionRate =
    uniqueContactClients.length > 0
      ? Math.round(
          (clientsWithWorkRecord.length / uniqueContactClients.length) * 100,
        )
      : 0;

  return {
    totalContacts,
    contacts30d,
    reviewsReceived,
    verifiedWorkRecords,
    conversionRate,
  };
}

async function getDepartmentTopRank(
  professionalId: string,
  tradeId: string,
  departmentId: string,
): Promise<number | null> {
  const candidates = await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
      professionalTrades: { some: { isPrimary: true, tradeId } },
      coverageAreas: { some: { departmentId } },
    },
    select: { id: true },
  });

  const candidateIds = candidates.map((candidate) => candidate.id);
  if (!candidateIds.includes(professionalId)) {
    return null;
  }

  const scores = await getWeightedScores(candidateIds, tradeId);
  const ranked = candidateIds
    .filter((id) => scores.has(id))
    .sort(
      (a, b) => (scores.get(b)?.score ?? 0) - (scores.get(a)?.score ?? 0),
    );

  const rank = ranked.indexOf(professionalId);
  return rank === -1 ? null : rank + 1;
}

const TOP_DEPARTMENT_RANK_THRESHOLD = 10;
const FREQUENT_CLIENTS_MIN_UNIQUE = 5;
const FREQUENT_CLIENTS_RATIO_THRESHOLD = 0.3;
const HUNDRED_JOBS_THRESHOLD = 100;

/**
 * Badges que aplican para este profesional. "Respuesta rápida" nunca se
 * activa en Fase 1 (ver getContactMetrics: no hay dato de tiempo de
 * respuesta en el schema actual).
 */
export async function getProfessionalBadges(
  professionalId: string,
): Promise<ProfessionalBadge[]> {
  const [professional, workRecords] = await Promise.all([
    prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: {
        isVerified: true,
        professionalTrades: {
          where: { isPrimary: true },
          select: { tradeId: true },
          take: 1,
        },
        coverageAreas: {
          select: { departmentId: true, department: { select: { name: true } } },
        },
      },
    }),
    prisma.workRecord.findMany({
      where: { professionalId },
      select: { clientId: true, status: true },
    }),
  ]);

  if (!professional) {
    return [];
  }

  const badges: ProfessionalBadge[] = [];

  if (professional.isVerified) {
    badges.push({ id: "verified", label: "Identidad verificada" });
  }

  const primaryTradeId = professional.professionalTrades[0]?.tradeId;
  if (primaryTradeId) {
    // Antes era un for-loop secuencial (await por cada área de cobertura,
    // cada uno con 2 queries adentro de getDepartmentTopRank) — con varias
    // decenas de departamentos esto sumaba segundos. Se piden todos los
    // ranks en paralelo y se elige el mejor resultado.
    const ranks = await Promise.all(
      professional.coverageAreas.map((area) =>
        getDepartmentTopRank(professionalId, primaryTradeId, area.departmentId).then(
          (rank) => ({ rank, area }),
        ),
      ),
    );
    const topDepartment = ranks.find(
      ({ rank }) => rank !== null && rank <= TOP_DEPARTMENT_RANK_THRESHOLD,
    );
    if (topDepartment) {
      badges.push({
        id: "top-department",
        label: `Top ${topDepartment.area.department.name}`,
      });
    }
  }

  const clientCounts = new Map<string, number>();
  for (const record of workRecords) {
    clientCounts.set(record.clientId, (clientCounts.get(record.clientId) ?? 0) + 1);
  }
  const totalUniqueClients = clientCounts.size;
  if (totalUniqueClients >= FREQUENT_CLIENTS_MIN_UNIQUE) {
    const repeatClients = [...clientCounts.values()].filter(
      (count) => count > 1,
    ).length;
    if (repeatClients / totalUniqueClients > FREQUENT_CLIENTS_RATIO_THRESHOLD) {
      badges.push({ id: "frequent-clients", label: "Clientes frecuentes" });
    }
  }

  const completedCount = workRecords.filter(
    (record) => record.status === "completed",
  ).length;
  if (completedCount >= HUNDRED_JOBS_THRESHOLD) {
    badges.push({ id: "100-jobs", label: "100 trabajos" });
  }

  return badges;
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
      primaryDepartmentId: true,
      professionalTrades: {
        select: {
          isPrimary: true,
          tradeId: true,
          yearsExperience: true,
          specialties: true,
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
    primaryDepartmentId: professional.primaryDepartmentId ?? null,
    primaryTradeId: primaryTrade?.tradeId ?? null,
    primaryYearsExperience: primaryTrade?.yearsExperience ?? null,
    primarySpecialties: primaryTrade?.specialties ?? [],
    secondaryTrades: secondaryTrades.map((pt) => ({
      tradeId: pt.tradeId,
      yearsExperience: pt.yearsExperience,
      specialties: pt.specialties,
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

/**
 * Slug del perfil profesional solo si está activo. Usado en /profile para
 * no ofrecer el link público a "Ver mi perfil profesional" cuando el
 * profesional fue desactivado (is_active = false).
 */
export async function getActiveProfessionalSlugByUserId(
  userId: string,
): Promise<string | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { userId },
    select: { slug: true, isActive: true },
  });

  if (!professional || !professional.isActive) {
    return null;
  }

  return professional.slug;
}

export async function getTotalProfessionalsCount(): Promise<number> {
  return prisma.professionalProfile.count();
}

const ADMIN_PROFESSIONALS_PAGE_SIZE = 20;

export async function getProfessionalsForAdmin(
  params: AdminProfessionalListParams,
): Promise<AdminProfessionalListResult> {
  const searchTerm = params.search?.trim();

  const where: Prisma.ProfessionalProfileWhereInput = {
    ...(searchTerm && {
      user: {
        fullName: { contains: searchTerm, mode: "insensitive" as const },
      },
    }),
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
      primaryDepartment: { select: { name: true } },
      professionalTrades: {
        where: { isPrimary: true },
        select: { trade: { select: { name: true } } },
        take: 1,
      },
    },
  });

  const professionals: AdminProfessionalListItem[] = [];

  if (rows.length > 0) {
    const professionalIds = rows.map((row) => row.id);
    const reviewCountRows = await prisma.review.groupBy({
      by: ["reviewedProfessionalId"],
      where: {
        reviewedProfessionalId: { in: professionalIds },
        publishedAt: { not: null },
        deletedAt: null,
      },
      _count: { _all: true },
    });
    const reviewCountMap = new Map(
      reviewCountRows.map((row) => [row.reviewedProfessionalId, row._count._all]),
    );

    for (const row of rows) {
      professionals.push({
        id: row.id,
        slug: row.slug,
        fullName: row.user.fullName,
        primaryTradeName: row.professionalTrades[0]?.trade.name ?? null,
        primaryDepartmentName: row.primaryDepartment?.name ?? null,
        isActive: row.isActive,
        isVerified: row.isVerified,
        createdAt: row.createdAt,
        publishedReviewCount: reviewCountMap.get(row.id) ?? 0,
      });
    }
  }

  return {
    professionals,
    total,
    page,
    pageSize: ADMIN_PROFESSIONALS_PAGE_SIZE,
    totalPages,
  };
}

export async function getProfessionalForAdminDetail(
  id: string,
): Promise<AdminProfessionalDetail | null> {
  const professional = await prisma.professionalProfile.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      bio: true,
      contactPhone: true,
      isActive: true,
      isVerified: true,
      newProfessionalBoostUntil: true,
      createdAt: true,
      user: { select: { fullName: true, avatarUrl: true } },
      primaryDepartment: { select: { name: true } },
      professionalTrades: {
        select: {
          isPrimary: true,
          trade: { select: { name: true } },
        },
      },
      coverageAreas: {
        select: { department: { select: { name: true } } },
      },
      sanctions: {
        orderBy: { imposedAt: "desc" },
        select: {
          id: true,
          type: true,
          reason: true,
          notes: true,
          imposedAt: true,
          expiresAt: true,
          liftedAt: true,
        },
      },
    },
  });

  if (!professional) return null;

  const now = new Date();

  const [disputes, totalContacts, activeWorkRecords, publishedReviews] =
    await Promise.all([
      prisma.workRecord.findMany({
        where: {
          professionalId: id,
          OR: [{ status: "disputed" }, { disputeResolution: { not: null } }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          disputeResolution: true,
          createdAt: true,
          disputeResolvedAt: true,
          client: { select: { fullName: true } },
          trade: { select: { name: true } },
        },
      }),
      prisma.contactEvent.count({ where: { professionalId: id } }),
      prisma.workRecord.count({
        where: { professionalId: id, status: { not: "cancelled" } },
      }),
      prisma.review.findMany({
        where: {
          reviewedProfessionalId: id,
          publishedAt: { not: null },
          deletedAt: null,
        },
        orderBy: { publishedAt: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          rating: true,
          comment: true,
          publishedAt: true,
          suspendedAt: true,
          reviewer: { select: { fullName: true } },
          trade: { select: { name: true } },
          moderationEvents: {
            orderBy: { createdAt: "asc" },
            select: {
              action: true,
              reason: true,
              createdAt: true,
              admin: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

  const activeSanction =
    professional.sanctions.find((s) => {
      if (s.liftedAt) return false;
      if (s.type === "permanent_deactivation") return true;
      if (s.type === "temporary_suspension" && s.expiresAt && s.expiresAt > now)
        return true;
      return false;
    }) ?? null;

  return {
    id: professional.id,
    slug: professional.slug,
    fullName: professional.user.fullName,
    avatarUrl: professional.user.avatarUrl,
    bio: professional.bio,
    contactPhone: professional.contactPhone,
    isActive: professional.isActive,
    isVerified: professional.isVerified,
    newProfessionalBoostUntil: professional.newProfessionalBoostUntil,
    createdAt: professional.createdAt,
    primaryTradeName:
      professional.professionalTrades.find((pt) => pt.isPrimary)?.trade.name ??
      null,
    primaryDepartmentName:
      professional.primaryDepartment?.name ??
      professional.coverageAreas[0]?.department.name ??
      null,
    allTrades: professional.professionalTrades.map((pt) => pt.trade.name),
    departments: professional.coverageAreas.map((ca) => ca.department.name),
    sanctions: professional.sanctions.map((s) => ({
      id: s.id,
      type: s.type as ProfessionalSanctionType,
      reason: s.reason,
      notes: s.notes,
      imposedAt: s.imposedAt,
      expiresAt: s.expiresAt,
      liftedAt: s.liftedAt,
    })),
    activeSanction: activeSanction
      ? {
          id: activeSanction.id,
          type: activeSanction.type as ProfessionalSanctionType,
          reason: activeSanction.reason,
          notes: activeSanction.notes,
          imposedAt: activeSanction.imposedAt,
          expiresAt: activeSanction.expiresAt,
          liftedAt: activeSanction.liftedAt,
        }
      : null,
    disputes: disputes.map((d) => ({
      id: d.id,
      clientName: d.client.fullName,
      tradeName: d.trade.name,
      status: d.status,
      disputeResolution: d.disputeResolution,
      createdAt: d.createdAt,
      disputeResolvedAt: d.disputeResolvedAt,
    })),
    totalContacts,
    activeWorkRecords,
    publishedReviewCount: publishedReviews.filter((r) => !r.suspendedAt).length,
    publishedReviews: publishedReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.reviewer.fullName,
      publishedAt: r.publishedAt as Date,
      type: r.type,
      tradeName: r.trade.name,
      suspendedAt: r.suspendedAt,
      moderationEvents: r.moderationEvents.map((e) => ({
        action: e.action,
        reason: e.reason,
        adminName: e.admin.fullName,
        createdAt: e.createdAt,
      })),
    })),
  };
}

export async function getProfessionalTradesForSelector(
  professionalId: string,
): Promise<{ id: string; name: string }[]> {
  const pts = await prisma.professionalTrade.findMany({
    where: { professionalId, trade: { isActive: true } },
    orderBy: { isPrimary: "desc" },
    select: { trade: { select: { id: true, name: true } } },
  });
  return pts.map((pt) => pt.trade);
}
