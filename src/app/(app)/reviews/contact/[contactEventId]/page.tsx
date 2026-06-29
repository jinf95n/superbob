import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getContactEventDetails } from "@/modules/contacts/queries";
import {
  REVIEW_CONTACT_MIN_HOURS,
  REVIEW_CONTACT_MAX_DAYS,
} from "@/lib/config";
import { ContactReviewForm } from "./ContactReviewForm";

export default async function ContactReviewPage({
  params,
}: {
  params: Promise<{ contactEventId: string }>;
}) {
  const { contactEventId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const contact = await getContactEventDetails(contactEventId, session.user.id);
  if (!contact) notFound();

  if (contact.hasActiveWorkRecord) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            Ya hay un trabajo registrado para este contacto
          </p>
          <p className="mt-2 text-[15px] text-sb-muted">
            Podés dejar una reseña de trabajo en cambio.
          </p>
        </div>
      </main>
    );
  }

  const ageHours = (Date.now() - contact.createdAt.getTime()) / (60 * 60 * 1000);
  const ageDays = ageHours / 24;

  if (ageHours < REVIEW_CONTACT_MIN_HOURS) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            Todavía no podés dejar esta reseña
          </p>
          <p className="mt-2 text-[15px] text-sb-muted">
            Podés dejar la reseña a partir de las {REVIEW_CONTACT_MIN_HOURS}{" "}
            horas del contacto.
          </p>
        </div>
      </main>
    );
  }

  if (ageDays > REVIEW_CONTACT_MAX_DAYS) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            El plazo para esta reseña venció
          </p>
          <p className="mt-2 text-[15px] text-sb-muted">
            Las reseñas de contacto solo están disponibles durante{" "}
            {REVIEW_CONTACT_MAX_DAYS} días del primer contacto.
          </p>
        </div>
      </main>
    );
  }

  if (contact.availableTrades.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            No hay oficios disponibles
          </p>
          <p className="mt-2 text-[15px] text-sb-muted">
            {contact.professionalName} no tiene oficios activos para calificar.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Reseña de contacto
      </h1>
      <p className="mt-2 text-[15px] text-sb-muted">
        {contact.professionalName} ·{" "}
        {contact.createdAt.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
        })}
      </p>

      <div className="mt-4 rounded-2xl border border-sb-border bg-sb-bg p-4">
        <p className="text-[13px] text-sb-muted">
          Esta reseña es sobre el primer contacto: si atendió bien, si fue
          claro, si se presentó a tiempo. No sobre un trabajo terminado.
        </p>
      </div>

      <ContactReviewForm
        contactEventId={contactEventId}
        trades={contact.availableTrades}
      />
    </main>
  );
}
