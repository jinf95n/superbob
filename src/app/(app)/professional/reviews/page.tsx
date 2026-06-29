import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getProfessionalProfileIdByUserId,
  getProfessionalTradesForSelector,
  getPrivateSuperbobScore,
} from "@/modules/professionals/queries";
import { getProfessionalContactsForReview } from "@/modules/contacts/queries";
import {
  getPendingRatingsForProfessional,
  getPendingClaimsForProfessional,
  getPublishedReviewsForProfessional,
} from "@/modules/reviews/queries";
import { Badge } from "@/components/ui/Badge";
import { SuperbobScoreCard } from "@/components/shared/SuperbobScoreCard";
import { ContactsForReviewList } from "./ContactsForReviewList";
import { RateClientForm } from "./RateClientForm";
import { WORK_RECORD_PRO_CONFIRM_DAYS } from "@/lib/config";

export default async function ProfessionalReviewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) {
    redirect("/professional/onboarding");
  }

  const [contacts, professionalTrades, pendingRatings, pendingClaims, publishedReviews, scoreBreakdown] =
    await Promise.all([
      getProfessionalContactsForReview(professionalId),
      getProfessionalTradesForSelector(professionalId),
      getPendingRatingsForProfessional(professionalId),
      getPendingClaimsForProfessional(professionalId),
      getPublishedReviewsForProfessional(professionalId),
      getPrivateSuperbobScore(professionalId),
    ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Reseñas recibidas
      </h1>

      <div className="mt-6">
        <SuperbobScoreCard breakdown={scoreBreakdown} />
      </div>

      {pendingClaims.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-[18px] font-semibold text-sb-text">
            Reclamos pendientes
          </h2>
          <p className="mt-1 text-[13px] text-sb-muted">
            Tenés {WORK_RECORD_PRO_CONFIRM_DAYS} días para responder cada reclamo.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {pendingClaims.map((claim) => {
              const deadlineDate = new Date(
                claim.claimCreatedAt.getTime() +
                  WORK_RECORD_PRO_CONFIRM_DAYS * 24 * 60 * 60 * 1000,
              );
              const daysLeft = Math.ceil(
                (deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
              );
              return (
                <Link
                  key={claim.workRecordId}
                  href={`/professional/work-records/${claim.workRecordId}`}
                  className="flex items-center justify-between rounded-2xl border border-sb-warning/30 bg-sb-warning/5 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-sb-text">
                      {claim.clientName} · {claim.tradeName}
                    </p>
                    <p className="mt-0.5 text-[13px] text-sb-muted">
                      Contacto:{" "}
                      {claim.contactDate.toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                      })}
                      {" · "}
                      <span
                        className={
                          daysLeft <= 2 ? "font-medium text-sb-error" : "text-sb-muted"
                        }
                      >
                        {daysLeft > 0
                          ? `${daysLeft} día${daysLeft !== 1 ? "s" : ""} para responder`
                          : "Vence hoy"}
                      </span>
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-[13px] font-medium text-sb-warning">
                    Responder →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-display text-[18px] font-semibold text-sb-text">
          Contactos recientes
        </h2>
        <ContactsForReviewList contacts={contacts} trades={professionalTrades} />
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
