import { Card } from "@/components/ui/Card";
import { getTotalUsersCount } from "@/modules/users/queries";
import { getTotalProfessionalsCount } from "@/modules/professionals/queries";
import { getContactEventsCountSince } from "@/modules/contacts/queries";
import { getPendingReviewsCount } from "@/modules/reviews/queries";
import { getUnresolvedReportsCount } from "@/modules/reports/queries";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const [
    totalUsers,
    totalProfessionals,
    contactEvents30d,
    pendingReviews,
    unresolvedReports,
  ] = await Promise.all([
    getTotalUsersCount(),
    getTotalProfessionalsCount(),
    getContactEventsCountSince(thirtyDaysAgo),
    getPendingReviewsCount(),
    getUnresolvedReportsCount(),
  ]);

  const metrics = [
    { label: "Usuarios totales", value: totalUsers },
    { label: "Profesionales totales", value: totalProfessionals },
    { label: "Contactos (30 días)", value: contactEvents30d },
    { label: "Reseñas pendientes de publicar", value: pendingReviews },
    { label: "Reportes sin resolver", value: unresolvedReports },
  ];

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold">Dashboard</h1>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-[13px] text-sb-muted dark:text-sb-muted-dark">
              {metric.label}
            </p>
            <p className="font-display mt-1 text-[28px] font-bold">
              {metric.value}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
