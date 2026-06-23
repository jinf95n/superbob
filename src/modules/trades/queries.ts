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
