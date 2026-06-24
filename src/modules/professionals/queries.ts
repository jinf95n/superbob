import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getWeightedScores } from "@/modules/reviews/queries";
import {
  AdminProfessionalListItem,
  AdminProfessionalListParams,
  AdminProfessionalListResult,
  ContactMetrics,
  ProfessionalBadge,
  ProfessionalFullProfile,
  ProfessionalProfileForEdit,
  ProfessionalReviewForProfile,
  ProfessionalSearchItem,
  ProfessionalTradeForProfile,
  ProfileCompleteness,
  ProfileCompletenessLevel,
  ProfileCompletionItem,
  SuperbobScoreBreakdown,
  SuperbobScoreComponent,
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

const MAX_PROFILE_REVIEWS_LOADED = 200;

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
          rating: true,
          comment: true,
          publishedAt: true,
          reviewer: { select: { id: true, fullName: true } },
          trade: { select: { name: true } },
          workRecord: { select: { type: true } },
        },
      },
    },
  });

  if (!professional || !professional.isActive) {
    return null;
  }

  const tradeIds = professional.professionalTrades.map((pt) => pt.tradeId);

  const completedByTrade = tradeIds.length
    ? await prisma.workRecord.groupBy({
        by: ["tradeId"],
        where: {
          professionalId: professional.id,
          type: "completed",
          tradeId: { in: tradeIds },
        },
        _count: { _all: true },
      })
    : [];
  const completedByTradeMap = new Map(
    completedByTrade.map((row) => [row.tradeId, row._count._all]),
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

  const [scores, completedWorkRecordsCount] = await Promise.all([
    getWeightedScores([professional.id]),
    prisma.workRecord.count({
      where: { professionalId: professional.id, type: "completed" },
    }),
  ]);
  const scoreEntry = scores.get(professional.id) ?? null;

  const ratingHistogram: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const review of professional.reviewsReceived) {
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    ratingHistogram[bucket] += 1;
  }

  const publishedReviewsCount = professional.reviewsReceived.length;
  const satisfiedCount = professional.reviewsReceived.filter(
    (review) => review.rating >= 4,
  ).length;
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
      workRecordType: review.workRecord.type,
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
    primaryDepartmentName: professional.coverageAreas[0]?.department.name ?? null,
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
  const professional = await prisma.professionalProfile.findUnique({
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
  });

  if (!professional) {
    return { score: 0, level: "Básico", items: [] };
  }

  const publishedReviewsCount = await prisma.review.count({
    where: { reviewedProfessionalId: professionalId, publishedAt: { not: null } },
  });

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
      label: "Identidad verificada",
      completed: professional.isVerified,
      points: 15,
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

const SUPERBOB_SCORE_NEUTRAL_RESPONSE_TIME_POINTS = 7;
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

/**
 * Desglose completo del Índice SUPERBOB (los 5 componentes definidos en el
 * rediseño) para la card de score. Devuelve null si el profesional no tiene
 * ninguna reseña publicada: sin reseñas el componente de calidad (35 de los
 * 100 puntos) no se puede calcular y el número total no sería representativo.
 */
export async function getSuperbobScoreBreakdown(
  professionalId: string,
): Promise<SuperbobScoreBreakdown | null> {
  const scores = await getWeightedScores([professionalId]);
  const scoreEntry = scores.get(professionalId);

  if (!scoreEntry) {
    return null;
  }

  const [completedWorkRecordsCount, completeness, professional] =
    await Promise.all([
      prisma.workRecord.count({
        where: { professionalId, type: "completed" },
      }),
      getProfileCompleteness(professionalId),
      prisma.professionalProfile.findUnique({
        where: { id: professionalId },
        select: { createdAt: true },
      }),
    ]);

  if (!professional) {
    return null;
  }

  const reviewQuality = (scoreEntry.score / 5) * 35;
  const volume = Math.min(completedWorkRecordsCount / 50, 1) * 25;
  const completenessPoints = (completeness.score / 100) * 15;
  const monthsOnPlatform =
    (Date.now() - professional.createdAt.getTime()) / MS_PER_MONTH;
  const tenure = Math.min(monthsOnPlatform / 24, 1) * 10;

  const components: SuperbobScoreComponent[] = [
    { label: "Calidad de reseñas", value: Math.round(reviewQuality), max: 35 },
    { label: "Volumen de trabajos", value: Math.round(volume), max: 25 },
    {
      label: "Tiempo de respuesta",
      value: SUPERBOB_SCORE_NEUTRAL_RESPONSE_TIME_POINTS,
      max: 15,
    },
    {
      label: "Completitud del perfil",
      value: Math.round(completenessPoints),
      max: 15,
    },
    { label: "Antigüedad en la plataforma", value: Math.round(tenure), max: 10 },
  ];

  const total = components.reduce((sum, component) => sum + component.value, 0);

  return { total, components };
}

export async function calculateSuperbobScore(
  professionalId: string,
): Promise<number> {
  const breakdown = await getSuperbobScoreBreakdown(professionalId);
  return breakdown?.total ?? 0;
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
  const professional = await prisma.professionalProfile.findUnique({
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
  });

  if (!professional) {
    return [];
  }

  const badges: ProfessionalBadge[] = [];

  if (professional.isVerified) {
    badges.push({ id: "verified", label: "Identidad verificada" });
  }

  const primaryTradeId = professional.professionalTrades[0]?.tradeId;
  if (primaryTradeId) {
    for (const area of professional.coverageAreas) {
      const rank = await getDepartmentTopRank(
        professionalId,
        primaryTradeId,
        area.departmentId,
      );
      if (rank !== null && rank <= TOP_DEPARTMENT_RANK_THRESHOLD) {
        badges.push({
          id: "top-department",
          label: `Top ${area.department.name}`,
        });
        break;
      }
    }
  }

  const workRecords = await prisma.workRecord.findMany({
    where: { professionalId },
    select: { clientId: true, type: true },
  });

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
    (record) => record.type === "completed",
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
