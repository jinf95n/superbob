import {
  getAdminDashboardStats,
  getProfessionalsByTrade,
  getWeeklyGrowth,
  getPendingReportsWithDetail,
  getInactiveProfessionals,
} from "@/modules/admin/queries";

export default async function AdminDashboard() {
  const [stats, byTrade, weeklyGrowth, pendingReports, inactivePros] =
    await Promise.all([
      getAdminDashboardStats(),
      getProfessionalsByTrade(),
      getWeeklyGrowth(),
      getPendingReportsWithDetail(),
      getInactiveProfessionals(),
    ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-sb-text">
          Panel de administración
        </h1>
        <p className="mt-1 text-sm text-sb-muted">
          SUPERBOB · Fase 1
        </p>
      </div>

      {/* Alerta reportes urgentes */}
      {stats.reports.oldPending > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-sb-error/20 bg-sb-error/10 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-sm font-medium text-sb-error">
                {stats.reports.oldPending} reporte
                {stats.reports.oldPending !== 1 ? "s" : ""} con más de 3 días
                sin resolver
              </p>
              <p className="mt-0.5 text-xs text-sb-muted">
                Requieren atención inmediata
              </p>
            </div>
          </div>
          <a
            href="/admin/reports"
            className="rounded-lg bg-sb-error px-4 py-2 text-sm font-medium text-white"
          >
            Ver reportes
          </a>
        </div>
      )}

      {/* KPIs principales — 4 cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Usuarios registrados",
            value: stats.users.total,
            sub: `+${stats.users.newThisWeek} esta semana`,
            emoji: "👥",
            highlight: false,
          },
          {
            label: "Profesionales activos",
            value: stats.professionals.active,
            sub: `${stats.professionals.withReviews} con reseñas`,
            emoji: "🔧",
            highlight: false,
          },
          {
            label: "Contactos generados",
            value: stats.contacts.total,
            sub: `+${stats.contacts.thisWeek} esta semana`,
            emoji: "📞",
            highlight: false,
          },
          {
            label: "Tasa contacto→reseña",
            value: `${stats.contacts.conversionRate}%`,
            sub: `${stats.reviews.published} reseñas publicadas`,
            emoji: "⭐",
            highlight: stats.contacts.conversionRate < 20,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border p-5 ${
              kpi.highlight
                ? "border-sb-warning/40 bg-sb-warning/5"
                : "border-sb-border bg-white"
            }`}
          >
            <span className="text-2xl">{kpi.emoji}</span>
            <p className="font-display mt-3 text-3xl font-bold text-sb-text">
              {kpi.value}
            </p>
            <p className="mt-1 text-sm font-medium text-sb-text">
              {kpi.label}
            </p>
            <p className="mt-0.5 text-xs text-sb-muted">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Fila: Estado del lanzamiento + Reportes */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Estado pre-lanzamiento */}
        <div className="rounded-2xl border border-sb-border bg-white p-5">
          <h2 className="font-display mb-4 text-lg font-bold text-sb-text">
            Estado del lanzamiento
          </h2>
          {[
            {
              label: "Profesionales activos",
              value: stats.professionals.active,
              target: 25,
              emoji: "🔧",
            },
            {
              label: "Con al menos 1 reseña",
              value: stats.professionals.withReviews,
              target: 25,
              emoji: "⭐",
            },
            {
              label: "Perfiles verificados",
              value: stats.professionals.completeProfile,
              target: 15,
              emoji: "✅",
            },
            {
              label: "Reseñas publicadas",
              value: stats.reviews.published,
              target: 50,
              emoji: "📝",
            },
          ].map((item) => {
            const pct = Math.min(
              Math.round((item.value / item.target) * 100),
              100,
            );
            return (
              <div key={item.label} className="mb-4 last:mb-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-sb-text">
                    {item.emoji} {item.label}
                  </span>
                  <span className="text-sm font-medium text-sb-text">
                    {item.value}/{item.target}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sb-bg">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 100
                        ? "bg-sb-success"
                        : pct >= 60
                          ? "bg-sb-blue"
                          : "bg-sb-warning"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Reportes pendientes */}
        <div className="rounded-2xl border border-sb-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-sb-text">
              Reportes pendientes
            </h2>
            {stats.reports.pending > 0 && (
              <span className="rounded-full bg-sb-error px-2.5 py-1 text-xs font-bold text-white">
                {stats.reports.pending}
              </span>
            )}
          </div>

          {pendingReports.length === 0 ? (
            <div className="py-6 text-center">
              <p className="mb-2 text-4xl">✅</p>
              <p className="text-sm text-sb-muted">Sin reportes pendientes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingReports.slice(0, 5).map((report) => {
                const daysOld = Math.floor(
                  (Date.now() - report.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                return (
                  <div
                    key={report.id}
                    className={`flex items-start gap-3 rounded-xl p-3 ${
                      daysOld >= 3
                        ? "border border-sb-error/20 bg-sb-error/5"
                        : "bg-sb-bg"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sb-text">
                        {report.reportedUser.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-sb-muted">
                        Por: {report.reporter.fullName} ·{" "}
                        {daysOld === 0
                          ? "hoy"
                          : `hace ${daysOld} día${daysOld !== 1 ? "s" : ""}`}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-sb-muted">
                        {report.reason}
                      </p>
                    </div>
                    <a
                      href="/admin/reports"
                      className="flex-shrink-0 text-xs font-medium text-sb-blue"
                    >
                      Ver →
                    </a>
                  </div>
                );
              })}
              {pendingReports.length > 5 && (
                <a
                  href="/admin/reports"
                  className="py-2 text-center text-sm font-medium text-sb-blue"
                >
                  Ver todos ({pendingReports.length}) →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Distribución por oficio */}
      <div className="mb-6 rounded-2xl border border-sb-border bg-white p-5">
        <h2 className="font-display mb-4 text-lg font-bold text-sb-text">
          Profesionales por oficio
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {byTrade.map((trade) => (
            <div
              key={trade.tradeSlug}
              className="flex items-center justify-between rounded-xl bg-sb-bg px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-sb-text">
                  {trade.tradeName}
                </p>
                <p className="mt-0.5 text-xs text-sb-muted">
                  {trade.withReviews} con reseñas
                </p>
              </div>
              <span className="font-display text-xl font-bold text-sb-blue">
                {trade.totalProfessionals}
              </span>
            </div>
          ))}
          {byTrade.length === 0 && (
            <p className="col-span-full py-4 text-center text-sm text-sb-muted">
              Sin profesionales registrados todavía
            </p>
          )}
        </div>
      </div>

      {/* Crecimiento semanal */}
      <div className="mb-6 rounded-2xl border border-sb-border bg-white p-5">
        <h2 className="font-display mb-4 text-lg font-bold text-sb-text">
          Crecimiento — últimas 8 semanas
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sb-border">
                {["Semana", "Usuarios", "Profesionales", "Contactos"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`pb-3 text-xs font-medium uppercase tracking-wider text-sb-muted ${
                        i === 0 ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {weeklyGrowth.map((week, i) => (
                <tr
                  key={week.label}
                  className={`border-b border-sb-border/50 last:border-0 ${
                    i === weeklyGrowth.length - 1 ? "font-medium" : ""
                  }`}
                >
                  <td className="py-3 text-sb-text">
                    {week.label}
                    {i === weeklyGrowth.length - 1 && (
                      <span className="ml-2 rounded-full bg-sb-blue/10 px-1.5 py-0.5 text-[10px] text-sb-blue">
                        actual
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right text-sb-text">
                    {week.users > 0 ? `+${week.users}` : "—"}
                  </td>
                  <td className="py-3 text-right text-sb-text">
                    {week.professionals > 0 ? `+${week.professionals}` : "—"}
                  </td>
                  <td className="py-3 text-right text-sb-text">
                    {week.contacts > 0 ? `+${week.contacts}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profesionales sin actividad */}
      {inactivePros.length > 0 && (
        <div className="rounded-2xl border border-sb-warning/30 bg-white p-5">
          <h2 className="font-display mb-1 text-lg font-bold text-sb-text">
            ⚠️ Profesionales sin actividad (30 días)
          </h2>
          <p className="mb-4 text-sm text-sb-muted">
            Considerar contactarlos para reactivar su perfil.
          </p>
          <div className="flex flex-col gap-2">
            {inactivePros.map((pro) => (
              <div
                key={pro.id}
                className="flex items-center justify-between rounded-xl bg-sb-bg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-sb-text">
                    {pro.user.fullName}
                  </p>
                  <p className="mt-0.5 text-xs text-sb-muted">
                    {pro.professionalTrades[0]?.trade.name ?? "Sin oficio"} ·{" "}
                    {pro.user.email}
                  </p>
                </div>
                <p className="text-xs text-sb-muted">
                  {Math.floor(
                    (Date.now() - pro.updatedAt.getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  días
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
