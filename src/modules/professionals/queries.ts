import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getWeightedScores } from "@/modules/reviews/queries";
import {
  AdminProfessionalListItem,
  AdminProfessionalListParams,
  AdminProfessionalListResult,
  ContactMetrics,
  FeaturedProfessional,
  PlatformStats,
  ProfessionalBadge,
  ProfessionalFullProfile,
  ProfessionalProfileForEdit,
  ProfessionalReviewForProfile,
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

/**
 * Todos los profesionales activos, sin filtrar ni paginar: el filtrado por
 * texto y por los filtros del panel se hace 100% en memoria en el cliente
 * (ver SearchResults.tsx).
 */
export async function getAllProfessionalsForSearch(): Promise<
  SearchableProfessional[]
> {
  const professionals = await prisma.professionalProfile.findMany({
    where: { isActive: true },
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

  const [scores, completedCounts] = await Promise.all([
    getWeightedScores(professionalIds),
    prisma.workRecord.groupBy({
      by: ["professionalId"],
      where: { professionalId: { in: professionalIds }, status: "completed" },
      _count: { _all: true },
    }),
  ]);

  const completedCountByProfessional = new Map(
    completedCounts.map((row) => [row.professionalId, row._count?._all ?? 0]),
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
        where: { publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: MAX_PROFILE_REVIEWS_LOADED,
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

  const tradeIds = professional.professionalTrades.map((pt) => pt.tradeId);
  const publishedReviewsWhere = {
    reviewedProfessionalId: professional.id,
    publishedAt: { not: null },
  };

  // Las 6 queries de abajo son independientes entre sí (todas solo dependen
  // de professional.id / tradeIds, ya resueltos) — antes algunas se esperaban
  // en serie sin necesidad, lo que sumaba tiempo de ida y vuelta a la DB.
  const [
    completedByTrade,
    scores,
    completedWorkRecordsCount,
    ratingGroups,
    publishedReviewsCount,
    satisfiedCount,
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
  ]);

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
 * Métricas: calidad de reseñas (40), completitud de perfil (20),
 * volumen de contactos (20), verificación (10), antigüedad activa (10).
 * Cada componente lleva un hint explicando qué mejorar.
 */
export async function getPrivateSuperbobScore(
  professionalId: string,
): Promise<PrivateSuperbobScoreBreakdown> {
  const [scoreEntry, professional, totalContacts, firstReview] = await Promise.all([
    getWeightedScores([professionalId]).then((scores) => scores.get(professionalId) ?? null),
    prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: {
        isVerified: true,
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

  // ── 1. Calidad de reseñas (40 pts) ──
  // Penalizar con factor de confianza cuando hay menos de 3 reseñas,
  // para evitar que un perfil con 1 reseña de 5 estrellas puntúe perfecto.
  const reviewCount = scoreEntry?.reviewCount ?? 0;
  let reviewQualityValue = 0;
  let reviewHint: string | null = null;
  if (reviewCount === 0) {
    reviewHint = "Pedí tu primera reseña a clientes con los que ya trabajaste.";
  } else {
    const confidence = reviewCount >= 3 ? 1 : reviewCount === 2 ? 0.75 : 0.5;
    reviewQualityValue = Math.round(((scoreEntry?.score ?? 0) / 5) * 40 * confidence);
    if (reviewCount < 3) {
      reviewHint = `Con ${reviewCount} reseña${reviewCount > 1 ? "s" : ""}, el puntaje lleva un ajuste de confianza. Llegá a 3 para que cuente al 100%.`;
    } else if (reviewQualityValue < 32) {
      reviewHint = "Mantené la calidad en cada trabajo para seguir subiendo.";
    }
  }

  // ── 2. Completitud del perfil (20 pts) ──
  const completenessChecks = [
    Boolean(professional?.user.avatarUrl),
    Boolean(professional?.bio && professional.bio.trim().length > 20),
    (professional?.professionalTrades.length ?? 0) > 0,
    (professional?.coverageAreas.length ?? 0) > 0,
    Boolean(professional?.contactPhone),
    (professional?._count.workPhotos ?? 0) >= 3,
  ];
  const completedFields = completenessChecks.filter(Boolean).length;
  const completenessValue = Math.round((completedFields / 6) * 20);
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
  // Escala logarítmica: los primeros contactos suman más que los siguientes.
  // 100 contactos = puntaje máximo.
  const contactVolumeValue = Math.round(
    Math.min(Math.log10(totalContacts + 1) / Math.log10(101), 1) * 20,
  );
  let contactHint: string | null = null;
  if (totalContacts === 0) {
    contactHint = "Aún no recibiste contactos. Compartí tu perfil o código QR para que te encuentren.";
  } else if (totalContacts < 10) {
    contactHint = "Compartí tu perfil en WhatsApp o redes para sumar más contactos.";
  } else if (contactVolumeValue < 17) {
    contactHint = "Seguí activo. Este puntaje crece logarítmicamente a medida que recibís más contactos.";
  }

  // ── 4. Verificación (10 pts) ──
  const verificationValue = professional?.isVerified ? 10 : 0;
  const verificationHint = professional?.isVerified
    ? null
    : "Verificá tu identidad con SUPERBOB para sumar los 10 puntos.";

  // ── 5. Antigüedad activa (10 pts) ──
  // Empieza desde la primera reseña recibida, no desde el registro.
  // 24 meses de actividad = puntaje máximo.
  let tenureValue = 0;
  let tenureHint: string | null = null;
  if (!firstReview?.publishedAt) {
    tenureHint = "Este puntaje empieza a acumularse desde tu primera reseña publicada.";
  } else {
    const monthsActive =
      (Date.now() - new Date(firstReview.publishedAt).getTime()) / MS_PER_MONTH;
    tenureValue = Math.round(Math.min(monthsActive / 24, 1) * 10);
    if (tenureValue < 10) {
      tenureHint =
        monthsActive < 6
          ? "Este puntaje crece con el tiempo. Seguí activo en la plataforma."
          : monthsActive < 12
            ? "Vas bien. El puntaje de antigüedad sigue subiendo con el tiempo."
            : "Buen historial. Llegás al máximo a los 2 años de actividad continua.";
    }
  }

  const components: PrivateSuperbobScoreComponent[] = [
    { label: "Calidad de reseñas", emoji: "⭐", value: reviewQualityValue, max: 40, hint: reviewHint },
    { label: "Completitud del perfil", emoji: "📋", value: completenessValue, max: 20, hint: completenessHint },
    { label: "Volumen de contactos", emoji: "📞", value: contactVolumeValue, max: 20, hint: contactHint },
    { label: "Verificación", emoji: "🛡️", value: verificationValue, max: 10, hint: verificationHint },
    { label: "Antigüedad activa", emoji: "📅", value: tenureValue, max: 10, hint: tenureHint },
  ];

  const total = components.reduce((sum, c) => sum + c.value, 0);
  return { total, components };
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
