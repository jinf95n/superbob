import Link from "next/link";
import { getReportsForAdmin } from "@/modules/reports/queries";
import { Badge } from "@/components/ui/Badge";
import { ReportStatusButton } from "./ReportStatusButton";

type AdminReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_BADGE: Record<string, "warning" | "info" | "success"> = {
  pending: "warning",
  reviewed: "info",
  resolved: "success",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
};

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const rawParams = await searchParams;
  const page =
    typeof rawParams.page === "string" ? Number(rawParams.page) || 1 : 1;

  const result = await getReportsForAdmin(page);

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold">Reportes</h1>

      <p className="mt-4 text-sm text-sb-muted dark:text-sb-muted-dark">
        {result.total} reporte{result.total === 1 ? "" : "s"}
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {result.reports.map((report) => (
          <div
            key={report.id}
            className="flex flex-col gap-2 rounded-card border border-sb-border p-3 sm:flex-row sm:items-start sm:justify-between dark:border-sb-border-dark"
          >
            <div>
              <p className="font-medium">{report.reason}</p>
              {report.description && (
                <p className="mt-1 text-sm text-sb-muted dark:text-sb-muted-dark">
                  {report.description}
                </p>
              )}
              <p className="mt-1 text-sm text-sb-muted dark:text-sb-muted-dark">
                Reportado por {report.reporterName} contra{" "}
                {report.reportedUserName}
                {report.reportedProfessionalSlug && (
                  <>
                    {" "}
                    (
                    <Link
                      href={`/p/${report.reportedProfessionalSlug}`}
                      className="text-sb-blue underline"
                    >
                      ver perfil
                    </Link>
                    )
                  </>
                )}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={STATUS_BADGE[report.status]}>
                  {STATUS_LABEL[report.status]}
                </Badge>
                <span className="text-xs text-sb-muted dark:text-sb-muted-dark">
                  {report.createdAt.toLocaleDateString("es-AR")}
                </span>
              </div>
            </div>

            <ReportStatusButton reportId={report.id} status={report.status} />
          </div>
        ))}
      </div>

      {result.reports.length === 0 && (
        <p className="mt-8 text-center text-sb-muted dark:text-sb-muted-dark">
          No hay reportes todavía.
        </p>
      )}

      {result.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4">
          <Link
            href={`/admin/reports?page=${Math.max(1, result.page - 1)}`}
            className={`text-sm ${result.page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Anterior
          </Link>
          <span className="text-sm text-sb-muted dark:text-sb-muted-dark">
            Página {result.page} de {result.totalPages}
          </span>
          <Link
            href={`/admin/reports?page=${Math.min(result.totalPages, result.page + 1)}`}
            className={`text-sm ${result.page >= result.totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            Siguiente
          </Link>
        </nav>
      )}
    </div>
  );
}
