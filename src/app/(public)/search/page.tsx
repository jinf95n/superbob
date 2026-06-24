import { getActiveProfessionalsForSearch } from "@/modules/professionals/queries";
import { getActiveTradesForFilter } from "@/modules/trades/queries";
import { getDepartmentsForFilter } from "@/modules/geography/queries";
import {
  SearchClient,
  type TradeSearchOption,
} from "@/components/shared/SearchClient";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams;
  const initialTradeSlug =
    typeof rawParams.trade === "string" ? rawParams.trade : undefined;

  const [professionals, tradeCategories, departments] = await Promise.all([
    getActiveProfessionalsForSearch(),
    getActiveTradesForFilter(),
    getDepartmentsForFilter(),
  ]);

  const trades: TradeSearchOption[] = tradeCategories.flatMap((category) =>
    category.trades.map((trade) => ({
      id: trade.id,
      name: trade.name,
      slug: trade.slug,
      categoryName: category.name,
    })),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-[24px] font-bold text-sb-text">
        Buscar profesionales
      </h1>

      <div className="mt-4">
        <SearchClient
          professionals={professionals}
          trades={trades}
          departments={departments}
          initialTradeSlug={initialTradeSlug}
        />
      </div>
    </main>
  );
}
