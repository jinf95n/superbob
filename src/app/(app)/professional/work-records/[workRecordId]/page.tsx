import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import { getPendingClaimDetail } from "@/modules/reviews/queries";
import { WORK_RECORD_PRO_CONFIRM_DAYS } from "@/lib/config";
import { RespondToClaimForm } from "./RespondToClaimForm";

export default async function RespondToClaimPage({
  params,
}: {
  params: Promise<{ workRecordId: string }>;
}) {
  const { workRecordId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) redirect("/professional/onboarding");

  const claim = await getPendingClaimDetail(workRecordId, professionalId);
  if (!claim) notFound();

  const deadlineDate = new Date(
    claim.claimCreatedAt.getTime() +
      WORK_RECORD_PRO_CONFIRM_DAYS * 24 * 60 * 60 * 1000,
  );

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Reclamo de trabajo
      </h1>

      <div className="mt-4 rounded-2xl bg-white p-5">
        <dl className="space-y-2 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-sb-muted">Cliente</dt>
            <dd className="font-medium text-sb-text">{claim.clientName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Oficio</dt>
            <dd className="font-medium text-sb-text">{claim.tradeName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Contacto original</dt>
            <dd className="font-medium text-sb-text">
              {claim.contactDate.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
              })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Reclamo recibido</dt>
            <dd className="font-medium text-sb-text">
              {claim.claimCreatedAt.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
              })}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5">
        <p className="font-display text-[16px] font-semibold text-sb-text">
          ¿Qué significa cada opción?
        </p>
        <div className="mt-3 space-y-3">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sb-success/15 text-[12px] font-bold text-sb-success">
              ✓
            </span>
            <div>
              <p className="text-[15px] font-medium text-sb-text">Confirmar</p>
              <p className="mt-0.5 text-[13px] text-sb-muted">
                Reconocés que trabajaste con {claim.clientName}. Ambos quedan
                habilitados para dejar una reseña del trabajo.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sb-error/15 text-[12px] font-bold text-sb-error">
              ✕
            </span>
            <div>
              <p className="text-[15px] font-medium text-sb-text">Disputar</p>
              <p className="mt-0.5 text-[13px] text-sb-muted">
                No reconocés este trabajo. El caso va a revisión del equipo de
                SUPERBOB, que decidirá con el contexto disponible.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-sb-warning/30 bg-sb-warning/5 p-4">
        <p className="text-[13px] text-sb-muted">
          Tenés hasta el{" "}
          <span className="font-medium text-sb-text">
            {deadlineDate.toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
            })}
          </span>{" "}
          para responder. Si no respondés, el caso pasa a revisión de SUPERBOB
          automáticamente.
        </p>
      </div>

      <RespondToClaimForm
        workRecordId={workRecordId}
        clientName={claim.clientName}
      />
    </main>
  );
}
