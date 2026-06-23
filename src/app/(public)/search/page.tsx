import Link from "next/link";
import { searchProfessionals } from "@/modules/professionals/queries";
import { SearchProfessionalsParamsSchema } from "@/modules/professionals/types";
import { getActiveTradesForFilter } from "@/modules/trades/queries";
import { getDepartmentsForFilter } from "@/modules/geography/queries";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams;
  const parsed = SearchProfessionalsParamsSchema.parse({
    trade: typeof rawParams.trade === "string" ? rawParams.trade : undefined,
    department:
      typeof rawParams.department === "string"
        ? rawParams.department
        : undefined,
    page: typeof rawParams.page === "string" ? rawParams.page : undefined,
  });

  const [result, tradeCategories, departments] = await Promise.all([
    searchProfessionals({
      tradeSlug: parsed.trade,
      departmentSlug: parsed.department,
      page: parsed.page,
    }),
    getActiveTradesForFilter(),
    getDepartmentsForFilter(),
  ]);

  const buildTradeHref = (tradeSlug: string | undefined) => {
    const params = new URLSearchParams();
    if (tradeSlug) params.set("trade", tradeSlug);
    if (parsed.department) params.set("department", parsed.department);
    return `/search?${params.toString()}`;
  };

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (parsed.trade) params.set("trade", parsed.trade);
    if (parsed.department) params.set("department", parsed.department);
    params.set("page", String(page));
    return `/search?${params.toString()}`;
  };

  const allTrades = tradeCategories.flatMap((category) => category.trades);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-[24px] font-bold text-sb-text">
        Buscar profesionales
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildTradeHref(undefined)}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            !parsed.trade
              ? "bg-sb-blue text-white"
              : "bg-sb-card-blue text-sb-blue"
          }`}
        >
          Todos los oficios
        </Link>
        {allTrades.map((trade) => (
          <Link
            key={trade.id}
            href={buildTradeHref(trade.slug)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              parsed.trade === trade.slug
                ? "bg-sb-blue text-white"
                : "bg-sb-card-blue text-sb-blue"
            }`}
          >
            {trade.name}
          </Link>
        ))}
      </div>

      <form className="mt-4 flex flex-wrap gap-3" method="get">
        {parsed.trade && <input type="hidden" name="trade" value={parsed.trade} />}
        <select
          name="department"
          defaultValue={parsed.department ?? ""}
          className="rounded-full border border-sb-border px-4 py-2 text-sm"
        >
          <option value="">Todas las zonas</option>
          {departments.map((department) => (
            <option key={department.id} value={department.slug}>
              {department.name} ({department.provinceName})
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-full bg-sb-blue px-5 py-2 text-sm font-medium text-white"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-4 text-sm text-sb-muted">
        {result.total} profesional{result.total === 1 ? "" : "es"}{" "}
        encontrado{result.total === 1 ? "" : "s"}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.professionals.map((professional) => (
          <ProfessionalCard key={professional.id} professional={professional} />
        ))}
      </div>

      {result.professionals.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="text-[64px]">🔍</span>
          <p className="text-sb-muted">
            No encontramos profesionales con esos filtros. Probá con otro
            oficio o zona.
          </p>
        </div>
      )}

      {result.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4">
          <Link
            href={buildPageHref(Math.max(1, result.page - 1))}
            aria-disabled={result.page <= 1}
            className={`rounded-full border border-sb-border px-3 py-1 text-sm ${
              result.page <= 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Anterior
          </Link>
          <span className="text-sm text-sb-muted">
            Página {result.page} de {result.totalPages}
          </span>
          <Link
            href={buildPageHref(Math.min(result.totalPages, result.page + 1))}
            aria-disabled={result.page >= result.totalPages}
            className={`rounded-full border border-sb-border px-3 py-1 text-sm ${
              result.page >= result.totalPages
                ? "pointer-events-none opacity-40"
                : ""
            }`}
          >
            Siguiente
          </Link>
        </nav>
      )}
    </main>
  );
}
