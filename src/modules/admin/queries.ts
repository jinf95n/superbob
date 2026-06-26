import { prisma } from "@/lib/prisma";

// ── MÉTRICAS PRINCIPALES ──────────────────────────────

export async function getAdminDashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisWeek,
    totalProfessionals,
    activeProfessionals,
    professionalsWithReviews,
    professionalsWithCompleteProfile,
    totalReviews,
    publishedReviews,
    pendingReviews,
    lowRatingReviews,
    totalContacts,
    contactsThisWeek,
    pendingReports,
    oldPendingReports,
    inactiveProfessionals,
  ] = await Promise.all([
    // Usuarios
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),

    // Profesionales
    prisma.professionalProfile.count(),
    prisma.professionalProfile.count({ where: { isActive: true } }),

    // Profesionales con al menos 1 reseña publicada
    prisma.professionalProfile.count({
      where: {
        isActive: true,
        reviewsReceived: {
          some: { publishedAt: { not: null } },
        },
      },
    }),

    // Profesionales verificados (proxy de "perfil completo")
    prisma.professionalProfile.count({
      where: {
        isActive: true,
        isVerified: true,
      },
    }),

    // Reseñas
    prisma.review.count(),
    prisma.review.count({ where: { publishedAt: { not: null } } }),
    prisma.review.count({
      where: { publishedAt: null, submittedAt: { not: null } },
    }),
    prisma.review.count({
      where: { publishedAt: { not: null }, rating: { lte: 2 } },
    }),

    // Contactos
    prisma.contactEvent.count(),
    prisma.contactEvent.count({ where: { createdAt: { gte: weekAgo } } }),

    // Reportes pendientes
    prisma.report.count({ where: { status: "pending" } }),
    // Reportes pendientes con más de 3 días
    prisma.report.count({
      where: {
        status: "pending",
        createdAt: {
          lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Profesionales sin actividad en 30 días
    prisma.professionalProfile.count({
      where: {
        isActive: true,
        updatedAt: { lte: monthAgo },
      },
    }),
  ]);

  return {
    users: { total: totalUsers, newThisWeek: newUsersThisWeek },
    professionals: {
      total: totalProfessionals,
      active: activeProfessionals,
      withReviews: professionalsWithReviews,
      completeProfile: professionalsWithCompleteProfile,
      inactive30Days: inactiveProfessionals,
    },
    reviews: {
      total: totalReviews,
      published: publishedReviews,
      pending: pendingReviews,
      lowRating: lowRatingReviews,
    },
    contacts: {
      total: totalContacts,
      thisWeek: contactsThisWeek,
      conversionRate:
        totalContacts > 0
          ? Math.round((publishedReviews / totalContacts) * 100)
          : 0,
    },
    reports: {
      pending: pendingReports,
      oldPending: oldPendingReports,
    },
  };
}

// ── DISTRIBUCIÓN POR OFICIO ──────────────────────────

export async function getProfessionalsByTrade() {
  const trades = await prisma.trade.findMany({
    where: { isActive: true },
    include: {
      professionalTrades: {
        where: {
          isPrimary: true,
          professional: { isActive: true },
        },
        include: {
          professional: {
            include: {
              reviewsReceived: {
                where: { publishedAt: { not: null } },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return trades
    .map((trade) => ({
      tradeName: trade.name,
      tradeSlug: trade.slug,
      totalProfessionals: trade.professionalTrades.length,
      withReviews: trade.professionalTrades.filter(
        (pt) => pt.professional.reviewsReceived.length > 0,
      ).length,
    }))
    .filter((t) => t.totalProfessionals > 0);
}

// ── CRECIMIENTO SEMANAL (últimas 8 semanas) ──────────

export async function getWeeklyGrowth() {
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { start, end, label: `Sem ${8 - i}` };
  }).reverse();

  const data = await Promise.all(
    weeks.map(async (week) => {
      const [users, professionals, contacts] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: week.start, lt: week.end } },
        }),
        prisma.professionalProfile.count({
          where: { createdAt: { gte: week.start, lt: week.end } },
        }),
        prisma.contactEvent.count({
          where: { createdAt: { gte: week.start, lt: week.end } },
        }),
      ]);
      return { label: week.label, users, professionals, contacts };
    }),
  );

  return data;
}

// ── REPORTES PENDIENTES CON DETALLE ──────────────────

export async function getPendingReportsWithDetail() {
  return prisma.report.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 20,
    include: {
      reporter: { select: { fullName: true, email: true } },
      reportedUser: { select: { fullName: true, email: true } },
      reportedProfessional: {
        select: {
          id: true,
          user: { select: { fullName: true } },
        },
      },
    },
  });
}

// ── PROFESIONALES SIN ACTIVIDAD ───────────────────────

export async function getInactiveProfessionals() {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  return prisma.professionalProfile.findMany({
    where: {
      isActive: true,
      updatedAt: { lte: monthAgo },
    },
    take: 10,
    orderBy: { updatedAt: "asc" },
    include: {
      user: { select: { fullName: true, email: true } },
      professionalTrades: {
        where: { isPrimary: true },
        include: { trade: { select: { name: true } } },
      },
    },
  });
}
