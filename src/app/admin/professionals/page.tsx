import Link from "next/link";
import { getProfessionalsForAdmin } from "@/modules/professionals/queries";
import { AdminProfessionalListParamsSchema } from "@/modules/professionals/types";
import { getActiveTradesForFilter } from "@/modules/trades/queries";
import { getDepartmentsForFilter } from "@/modules/geography/queries";
import { Badge } from "@/components/ui/Badge";
import { ProfessionalStatusToggle } from "./ProfessionalStatusToggle";

type AdminProfessionalsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProfessionalsPage({
  searchParams,
}: AdminProfessionalsPageProps) {
  const rawParams = await searchParams;
  const parsed = AdminProfessionalListParamsSchema.parse({
    tradeId: typeof rawParams.tradeId === "string" ? rawParams.tradeId : undefined,
    departmentId:
      typeof rawParams.departmentId === "string"
        ? rawParams.departmentId
        : undefined,
    active: typeof rawParams.active === "string" ? rawParams.active : undefined,
    verified:
      typeof rawParams.verified === "string" ? rawParams.verified : undefined,
    page: typeof rawParams.page === "string" ? rawParams.page : undefined,
  });

  const [result, tradeCategories, departments] = await Promise.all([
    getProfessionalsForAdmin(parsed),
    getActiveTradesForFilter(),
    getDepartmentsForFilter(),
  ]);

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (parsed.tradeId) params.set("tradeId", parsed.tradeId);
    if (parsed.departmentId) params.set("departmentId", parsed.departmentId);
    if (parsed.active) params.set("active", parsed.active);
    if (parsed.verified) params.set("verified", parsed.verified);
    params.set("page", String(page));
    return `/admin/professionals?${params.toString()}`;
  };

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold">
        Profesionales
      </h1>

      <form className="mt-4 flex flex-wrap gap-3" method="get">
        <select
          name="tradeId"
          defaultValue={parsed.tradeId ?? ""}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        >
          <option value="">Todos los oficios</option>
          {tradeCategories.map((category) => (
            <optgroup key={category.id} label={category.name}>
              {category.trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <select
          name="departmentId"
          defaultValue={parsed.departmentId ?? ""}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        >
          <option value="">Todas las zonas</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name} ({department.provinceName})
            </option>
          ))}
        </select>

        <select
          name="active"
          defaultValue={parsed.active ?? ""}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        >
          <option value="">Activo: todos</option>
          <option value="yes">Activos</option>
          <option value="no">Inactivos</option>
        </select>

        <select
          name="verified"
          defaultValue={parsed.verified ?? ""}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        >
          <option value="">Verificado: todos</option>
          <option value="yes">Verificados</option>
          <option value="no">No verificados</option>
        </select>

        <button
          type="submit"
          className="rounded bg-sb-blue px-4 py-2 text-sm font-medium text-white"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-4 text-sm text-sb-muted dark:text-sb-muted-dark">
        {result.total} profesional{result.total === 1 ? "" : "es"}
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {result.professionals.map((professional) => (
          <div
            key={professional.id}
            className="flex flex-col gap-2 rounded-card border border-sb-border p-3 sm:flex-row sm:items-center sm:justify-between dark:border-sb-border-dark"
          >
            <div>
              <Link
                href={`/p/${professional.slug}`}
                className="font-medium text-sb-blue underline"
              >
                {professional.fullName}
              </Link>
              <p className="text-sm text-sb-muted dark:text-sb-muted-dark">
                {professional.primaryTradeName ?? "Sin oficio principal"} ·
                Registrado el {professional.createdAt.toLocaleDateString("es-AR")}
              </p>
              <div className="mt-1 flex gap-2">
                {professional.isActive ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="error">Inactivo</Badge>
                )}
                {professional.isVerified && (
                  <Badge variant="info">Verificado</Badge>
                )}
              </div>
            </div>

            <ProfessionalStatusToggle
              professionalId={professional.id}
              isActive={professional.isActive}
              isVerified={professional.isVerified}
            />
          </div>
        ))}
      </div>

      {result.professionals.length === 0 && (
        <p className="mt-8 text-center text-sb-muted dark:text-sb-muted-dark">
          No encontramos profesionales con esos filtros.
        </p>
      )}

      {result.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4">
          <Link
            href={buildPageHref(Math.max(1, result.page - 1))}
            className={`text-sm ${result.page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Anterior
          </Link>
          <span className="text-sm text-sb-muted dark:text-sb-muted-dark">
            Página {result.page} de {result.totalPages}
          </span>
          <Link
            href={buildPageHref(Math.min(result.totalPages, result.page + 1))}
            className={`text-sm ${result.page >= result.totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            Siguiente
          </Link>
        </nav>
      )}
    </div>
  );
}
