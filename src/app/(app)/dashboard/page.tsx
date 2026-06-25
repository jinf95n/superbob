import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import {
  getContactEventsCountForProfessionalSince,
  getPendingContactsCount,
} from "@/modules/contacts/queries";
import {
  getPendingReviewsForClientCount,
  getPendingReviewsToRespondCount,
} from "@/modules/reviews/queries";
import { getUserRole } from "@/modules/users/queries";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const fullName = session?.user.name ?? "";

  const role = session ? await getUserRole(session.user.id) : null;
  if (role === "admin") {
    redirect("/admin");
  }

  const professionalId = session
    ? await getProfessionalProfileIdByUserId(session.user.id)
    : null;

  const [contactEvents30d, pendingReviews, pendingContacts, pendingClientReviews] =
    professionalId
      ? await Promise.all([
          getContactEventsCountForProfessionalSince(
            professionalId,
            new Date(Date.now() - THIRTY_DAYS_MS),
          ),
          getPendingReviewsToRespondCount(professionalId),
          getPendingContactsCount(professionalId),
          Promise.resolve(0),
        ])
      : await Promise.all([
          Promise.resolve(0),
          Promise.resolve(0),
          Promise.resolve(0),
          session ? getPendingReviewsForClientCount(session.user.id) : Promise.resolve(0),
        ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Hola, {fullName}
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        {professionalId ? (
          <>
            {pendingContacts > 0 && (
              <Link
                href="/professional/reviews"
                className="flex items-center justify-between rounded-2xl bg-sb-card-blue p-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-sb-blue">
                    {pendingContacts} contacto{pendingContacts === 1 ? "" : "s"} sin registrar
                  </p>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    Registrá el trabajo para que el cliente pueda dejarte una reseña
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-sb-blue">→</span>
              </Link>
            )}

            <div className="rounded-2xl bg-white p-5">
              <h2 className="font-display text-[18px] font-semibold text-sb-text">
                Tu actividad
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="font-display text-[28px] font-bold text-sb-text">
                    {contactEvents30d}
                  </p>
                  <p className="text-sm text-sb-muted">
                    Contacto{contactEvents30d === 1 ? "" : "s"} (30 días)
                  </p>
                </div>
                <div>
                  <p className="font-display text-[28px] font-bold text-sb-text">
                    {pendingReviews}
                  </p>
                  <p className="text-sm text-sb-muted">
                    Reseña{pendingReviews === 1 ? "" : "s"} pendiente
                    {pendingReviews === 1 ? "" : "s"} de responder
                  </p>
                </div>
              </div>
              {pendingReviews > 0 && (
                <Link
                  href="/professional/reviews"
                  className="mt-4 inline-block text-sm font-medium text-sb-blue"
                >
                  Ver reseñas pendientes →
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            {pendingClientReviews > 0 && (
              <Link
                href="/notifications"
                className="flex items-center justify-between rounded-2xl bg-sb-card-orange p-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-sb-orange">
                    {pendingClientReviews} reseña{pendingClientReviews === 1 ? "" : "s"} pendiente{pendingClientReviews === 1 ? "" : "s"}
                  </p>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    Ayudá a otros calificando a los profesionales con los que trabajaste
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-sb-orange">→</span>
              </Link>
            )}

            <div className="rounded-2xl bg-sb-blue p-5 text-white">
              <h2 className="font-display text-[18px] font-semibold">
                Activá tu perfil profesional gratis
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/90">
                Los clientes te encuentran por oficio y zona, ven tus reseñas y
                te contactan directo. Sin costo.
              </p>
              <Link
                href="/professional/onboarding"
                className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[15px] font-medium text-sb-blue"
              >
                Activar perfil profesional
              </Link>
            </div>
          </>
        )}

        <Link
          href="/search"
          className="rounded-2xl bg-white p-5"
        >
          <h2 className="font-display text-[18px] font-semibold text-sb-text">
            Buscar profesionales
          </h2>
          <p className="mt-1 text-sm text-sb-muted">
            Encontrá plomeros, electricistas y más en tu zona.
          </p>
        </Link>
      </div>
    </main>
  );
}
