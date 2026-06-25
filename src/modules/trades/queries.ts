import { prisma } from "@/lib/prisma";

export type TradeFilterOption = {
  id: string;
  name: string;
  slug: string;
};

export type TradeCategoryWithTrades = {
  id: string;
  name: string;
  trades: TradeFilterOption[];
};

export async function getActiveTradesForFilter(): Promise<
  TradeCategoryWithTrades[]
> {
  const categories = await prisma.tradeCategory.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      trades: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return categories.filter((category) => category.trades.length > 0);
}

export type CategoryWithCount = {
  id: string;
  name: string;
  icon: string | null;
  /** Slug del primer trade activo de la categoría, para armar /search?trade=. */
  slug: string;
  professionalCount: number;
};

const MAX_HOME_CATEGORIES = 6;

/**
 * Categorías con al menos 1 profesional activo en alguno de sus oficios,
 * ordenadas por cantidad de profesionales DESC. Para la home.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const categories = await prisma.tradeCategory.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
      trades: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          slug: true,
          professionalTrades: {
            where: { professional: { isActive: true } },
            select: { professionalId: true },
          },
        },
      },
    },
  });

  return categories
    .map((category) => {
      const uniqueProfessionalIds = new Set<string>();
      for (const trade of category.trades) {
        for (const professionalTrade of trade.professionalTrades) {
          uniqueProfessionalIds.add(professionalTrade.professionalId);
        }
      }

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        slug: category.trades[0]?.slug ?? "",
        professionalCount: uniqueProfessionalIds.size,
      };
    })
    .filter((category) => category.professionalCount > 0 && category.slug)
    .sort((a, b) => b.professionalCount - a.professionalCount)
    .slice(0, MAX_HOME_CATEGORIES);
}

export type ActiveTradeOption = {
  name: string;
  slug: string;
};

/** Todos los trades activos, para el autocomplete del buscador de la home. */
export async function getAllActiveTrades(): Promise<ActiveTradeOption[]> {
  return prisma.trade.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { name: true, slug: true },
  });
}

export type ActiveTradeWithCategory = {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
};

/**
 * Todos los trades activos en forma plana (con el nombre de su categoría),
 * para el dropdown de filtro de oficios de /search. Viene de la base de
 * datos completa, no de los profesionales cargados: con pocos profesionales
 * activos el filtro no debe quedar vacío.
 */
export async function getAllActiveTradesFlat(): Promise<
  ActiveTradeWithCategory[]
> {
  const trades = await prisma.trade.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { name: true } },
    },
  });

  return trades.map((trade) => ({
    id: trade.id,
    name: trade.name,
    slug: trade.slug,
    categoryName: trade.category.name,
  }));
}
