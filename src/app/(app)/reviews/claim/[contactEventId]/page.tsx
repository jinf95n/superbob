import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getContactEventDetails } from "@/modules/contacts/queries";
import {
  WORK_RECORD_CLIENT_CLAIM_MIN_DAYS,
  WORK_RECORD_CLIENT_CLAIM_MAX_DAYS,
} from "@/lib/config";
import { ClaimForm } from "./ClaimForm";

export default async function ClaimPage({
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
    redirect(`/dashboard`);
  }

  const ageDays =
    (Date.now() - contact.createdAt.getTime()) / (24 * 60 * 60 * 1000);

  if (ageDays < WORK_RECORD_CLIENT_CLAIM_MIN_DAYS) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            Todavía no podés iniciar un reclamo
          </p>
          <p className="mt-2 text-[15px] text-sb-muted">
            Podés reclamar a partir de los {WORK_RECORD_CLIENT_CLAIM_MIN_DAYS}{" "}
            días del contacto. Volvé en{" "}
            {Math.ceil(WORK_RECORD_CLIENT_CLAIM_MIN_DAYS - ageDays)} día
            {Math.ceil(WORK_RECORD_CLIENT_CLAIM_MIN_DAYS - ageDays) !== 1 ? "s" : ""}.
          </p>
        </div>
      </main>
    );
  }

  if (ageDays > WORK_RECORD_CLIENT_CLAIM_MAX_DAYS) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            El plazo para iniciar un reclamo venció
          </p>
          <p className="mt-2 text-[15px] text-sb-muted">
            Solo podés reclamar dentro de los {WORK_RECORD_CLIENT_CLAIM_MAX_DAYS} días del contacto.
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
            {contact.professionalName} no tiene oficios activos para asociar al reclamo.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Iniciar reclamo
      </h1>
      <p className="mt-2 text-[15px] text-sb-muted">
        {contact.professionalName} ·{" "}
        {contact.createdAt.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
        })}
      </p>

      <ClaimForm
        contactEventId={contactEventId}
        professionalName={contact.professionalName}
        trades={contact.availableTrades}
      />
    </main>
  );
}
