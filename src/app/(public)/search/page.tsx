import { getAllProfessionalsForSearch } from "@/modules/professionals/queries";
import { getAllActiveTradesFlat } from "@/modules/trades/queries";
import { getSanJuanDepartments } from "@/modules/geography/queries";
import { SearchResults } from "@/components/shared/SearchResults";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const tradeParam =
    typeof params.trade === "string" ? params.trade : undefined;
  const deptParam =
    typeof params.department === "string" ? params.department : undefined;

  const [professionals, trades, sanJuanDepts] = await Promise.all([
    getAllProfessionalsForSearch(),
    getAllActiveTradesFlat(),
    getSanJuanDepartments(),
  ]);

  const initialDepartmentName = deptParam
    ? sanJuanDepts.find((d) => d.slug === deptParam)?.name
    : undefined;

  return (
    <div className="min-h-screen bg-sb-bg">
      <SearchResults
        professionals={professionals}
        trades={trades}
        initialTradeSlug={tradeParam}
        initialDepartmentName={initialDepartmentName}
      />
    </div>
  );
}
