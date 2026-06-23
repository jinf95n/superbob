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

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (parsed.trade) params.set("trade", parsed.trade);
    if (parsed.department) params.set("department", parsed.department);
    params.set("page", String(page));
    return `/search?${params.toString()}`;
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Buscar profesionales</h1>

      <form className="mt-4 flex flex-wrap gap-3" method="get">
        <select
          name="trade"
          defaultValue={parsed.trade ?? ""}
          className="rounded border border-neutral-300 px-3 py-2"
        >
          <option value="">Todos los oficios</option>
          {tradeCategories.map((category) => (
            <optgroup key={category.id} label={category.name}>
              {category.trades.map((trade) => (
                <option key={trade.id} value={trade.slug}>
                  {trade.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <select
          name="department"
          defaultValue={parsed.department ?? ""}
          className="rounded border border-neutral-300 px-3 py-2"
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
          className="rounded bg-neutral-900 px-4 py-2 text-white"
        >
          Buscar
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        {result.total} profesional{result.total === 1 ? "" : "es"}{" "}
        encontrado{result.total === 1 ? "" : "s"}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.professionals.map((professional) => (
          <ProfessionalCard key={professional.id} professional={professional} />
        ))}
      </div>

      {result.professionals.length === 0 && (
        <p className="mt-8 text-center text-neutral-500">
          No encontramos profesionales con esos filtros.
        </p>
      )}

      {result.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4">
          <Link
            href={buildPageHref(Math.max(1, result.page - 1))}
            aria-disabled={result.page <= 1}
            className={`rounded border px-3 py-1 ${
              result.page <= 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Anterior
          </Link>
          <span className="text-sm text-neutral-600">
            Página {result.page} de {result.totalPages}
          </span>
          <Link
            href={buildPageHref(Math.min(result.totalPages, result.page + 1))}
            aria-disabled={result.page >= result.totalPages}
            className={`rounded border px-3 py-1 ${
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
