import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import { getActiveTradesForFilter } from "@/modules/trades/queries";
import {
  getPendingReviewsForProfessional,
  getPublishedReviewsForProfessional,
} from "@/modules/reviews/queries";
import { Badge } from "@/components/ui/Badge";
import { MarkWorkCompletedForm } from "./MarkWorkCompletedForm";
import { RateClientForm } from "./RateClientForm";

export default async function ProfessionalReviewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) {
    redirect("/professional/onboarding");
  }

  const [tradeCategories, pendingRatings, publishedReviews] = await Promise.all([
    getActiveTradesForFilter(),
    getPendingReviewsForProfessional(professionalId),
    getPublishedReviewsForProfessional(professionalId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Reseñas recibidas
      </h1>

      <section className="mt-6 rounded-2xl bg-white p-5">
        <h2 className="font-display text-[18px] font-semibold text-sb-text">
          Marcar un trabajo con un cliente
        </h2>
        <MarkWorkCompletedForm tradeCategories={tradeCategories} />
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[18px] font-semibold text-sb-text">
          Calificá a tus clientes
        </h2>
        {pendingRatings.length === 0 ? (
          <p className="mt-2 text-[15px] text-sb-muted">
            No tenés clientes pendientes de calificar.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {pendingRatings.map((pending) => (
              <div
                key={pending.workRecordId}
                className="rounded-2xl bg-white p-5"
              >
                <p className="text-[15px] font-medium text-sb-text">
                  {pending.clientName} · {pending.tradeName}
                </p>
                <RateClientForm workRecordId={pending.workRecordId} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[18px] font-semibold text-sb-text">
          Reseñas publicadas
        </h2>
        {publishedReviews.length === 0 ? (
          <p className="mt-2 text-[15px] text-sb-muted">
            Todavía no tenés reseñas. Cuando termines un trabajo, pedile al
            cliente que te califique.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {publishedReviews.map((review) => (
              <div key={review.id} className="rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-medium text-sb-text">
                    {review.reviewerName} · {review.tradeName}
                  </p>
                  <Badge variant={review.type === "work_review" ? "success" : "info"}>
                    {review.type === "work_review" ? "Trabajo" : "Contacto"}
                  </Badge>
                </div>
                <p className="mt-1 text-sb-orange">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </p>
                {review.comment && (
                  <p className="mt-1 text-[15px] text-sb-text">
                    {review.comment}
                  </p>
                )}
                <p className="mt-1 text-sm text-sb-muted">
                  {review.publishedAt.toLocaleDateString("es-AR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
