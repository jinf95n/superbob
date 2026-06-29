import Link from "next/link";
import { getUsersForAdmin } from "@/modules/users/queries";
import { AdminUserListParamsSchema } from "@/modules/users/types";
import { getProvincesWithDepartments, getDepartmentsForFilter } from "@/modules/geography/queries";
import { Badge } from "@/components/ui/Badge";
import { AdminUserDeleteButton } from "./AdminUserDeleteButton";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toDateInputValue(date: Date | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const rawParams = await searchParams;
  const parsed = AdminUserListParamsSchema.parse({
    provinceId:
      typeof rawParams.provinceId === "string"
        ? rawParams.provinceId
        : undefined,
    departmentId:
      typeof rawParams.departmentId === "string"
        ? rawParams.departmentId
        : undefined,
    registeredFrom:
      typeof rawParams.registeredFrom === "string"
        ? rawParams.registeredFrom
        : undefined,
    registeredTo:
      typeof rawParams.registeredTo === "string"
        ? rawParams.registeredTo
        : undefined,
    page: typeof rawParams.page === "string" ? rawParams.page : undefined,
  });

  const [result, provinces, departments] = await Promise.all([
    getUsersForAdmin(parsed),
    getProvincesWithDepartments(),
    getDepartmentsForFilter(),
  ]);

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (parsed.provinceId) params.set("provinceId", parsed.provinceId);
    if (parsed.departmentId) params.set("departmentId", parsed.departmentId);
    if (parsed.registeredFrom)
      params.set(
        "registeredFrom",
        toDateInputValue(parsed.registeredFrom),
      );
    if (parsed.registeredTo)
      params.set("registeredTo", toDateInputValue(parsed.registeredTo));
    params.set("page", String(page));
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold">Usuarios</h1>

      <form className="mt-4 flex flex-wrap gap-3" method="get">
        <select
          name="provinceId"
          defaultValue={parsed.provinceId ?? ""}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        >
          <option value="">Todas las provincias</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>

        <select
          name="departmentId"
          defaultValue={parsed.departmentId ?? ""}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        >
          <option value="">Todos los departamentos</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name} ({department.provinceName})
            </option>
          ))}
        </select>

        <input
          type="date"
          name="registeredFrom"
          defaultValue={toDateInputValue(parsed.registeredFrom)}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        />
        <input
          type="date"
          name="registeredTo"
          defaultValue={toDateInputValue(parsed.registeredTo)}
          className="rounded border border-sb-border px-3 py-2 dark:border-sb-border-dark"
        />

        <button
          type="submit"
          className="rounded bg-sb-blue px-4 py-2 text-sm font-medium text-white"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-4 text-sm text-sb-muted dark:text-sb-muted-dark">
        {result.total} usuario{result.total === 1 ? "" : "s"}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-sb-border text-sb-muted dark:border-sb-border-dark dark:text-sb-muted-dark">
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Teléfono</th>
              <th className="py-2 pr-4">Zona</th>
              <th className="py-2 pr-4">Rol</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Registrado</th>
              <th className="py-2 pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {result.users.map((user) => (
              <tr
                key={user.id}
                className={`border-b border-sb-border dark:border-sb-border-dark ${user.deletedAt ? "opacity-60" : ""}`}
              >
                <td className="py-2 pr-4">{user.fullName}</td>
                <td className="py-2 pr-4">{user.email}</td>
                <td className="py-2 pr-4">{user.phone ?? "—"}</td>
                <td className="py-2 pr-4">
                  {user.departmentName
                    ? `${user.departmentName} (${user.provinceName})`
                    : "—"}
                </td>
                <td className="py-2 pr-4">
                  {user.role === "admin" ? (
                    <Badge variant="info">Admin</Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4">
                  {user.deletedAt ? (
                    <Badge variant="error">Eliminado</Badge>
                  ) : user.isActive ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="error">Inactivo</Badge>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {user.createdAt.toLocaleDateString("es-AR")}
                </td>
                <td className="py-2 pr-4">
                  {!user.deletedAt && (
                    <AdminUserDeleteButton userId={user.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.users.length === 0 && (
        <p className="mt-8 text-center text-sb-muted dark:text-sb-muted-dark">
          No encontramos usuarios con esos filtros.
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
