import { getAllProfessionalsForSearch } from "@/modules/professionals/queries";
import { getAllActiveTradesFlat } from "@/modules/trades/queries";
import { SearchResults } from "@/components/shared/SearchResults";

export default async function SearchPage() {
  const [professionals, trades] = await Promise.all([
    getAllProfessionalsForSearch(),
    getAllActiveTradesFlat(),
  ]);

  return (
    <div className="min-h-screen bg-sb-bg">
      <SearchResults professionals={professionals} trades={trades} />
    </div>
  );
}
