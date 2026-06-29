import Link from "next/link";
import { notFound } from "next/navigation";
import { getDisputeContextForAdmin } from "@/modules/reviews/queries";
import { Badge } from "@/components/ui/Badge";
import { DisputeResolutionForm } from "./DisputeResolutionForm";

const STATUS_BADGE: Record<string, "warning" | "info" | "success" | "error"> = {
  disputed: "warning",
  cancelled: "error",
  active: "info",
  completed: "success",
  pending_pro_confirmation: "warning",
};

const STATUS_LABEL: Record<string, string> = {
  disputed: "Disputado",
  cancelled: "Cancelado",
  active: "Activo",
  completed: "Completado",
  pending_pro_confirmation: "Pendiente",
};

const RESOLUTION_LABEL: Record<string, string> = {
  work_confirmed: "Trabajo confirmado",
  claim_rejected: "Reclamo rechazado",
  unresolved: "Sin resolución",
};

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ workRecordId: string }>;
}) {
  const { workRecordId } = await params;
  const context = await getDisputeContextForAdmin(workRecordId);

  if (!context || context.workRecord.status !== "disputed") notFound();

  const { workRecord, proDisputes, clientClaims } = context;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/admin/disputes"
          className="text-sm text-sb-muted hover:text-sb-text"
        >
          ← Disputas
        </Link>
      </div>

      <h1 className="font-display text-[20px] font-semibold">
        Resolver disputa
      </h1>

      {/* Datos del caso */}
      <section className="mt-4 rounded-2xl border border-sb-border bg-white p-5">
        <h2 className="font-display text-[16px] font-semibold text-sb-text">
          Datos del caso
        </h2>
        <dl className="mt-3 space-y-2 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-sb-muted">Cliente</dt>
            <dd className="font-medium text-sb-text">{workRecord.client.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Email cliente</dt>
            <dd className="text-sb-text">{workRecord.client.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Profesional</dt>
            <dd className="font-medium text-sb-text">
              {workRecord.professional.fullName}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Email profesional</dt>
            <dd className="text-sb-text">{workRecord.professional.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Oficio</dt>
            <dd className="text-sb-text">{workRecord.tradeName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Contacto original</dt>
            <dd className="text-sb-text">
              {workRecord.contactEventCreatedAt.toLocaleDateString("es-AR")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Reclamo creado</dt>
            <dd className="text-sb-text">
              {workRecord.createdAt.toLocaleDateString("es-AR")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sb-muted">Iniciado por</dt>
            <dd className="text-sb-text capitalize">
              {workRecord.initiatedBy === "client" ? "Cliente" : "Profesional"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Historial del profesional */}
      <section className="mt-4 rounded-2xl border border-sb-border bg-white p-5">
        <h2 className="font-display text-[16px] font-semibold text-sb-text">
          Historial de disputas del profesional
        </h2>
        {proDisputes.length === 0 ? (
          <p className="mt-2 text-[14px] text-sb-muted">
            Sin disputas previas.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-sb-border">
            {proDisputes.map((d) => (
              <div key={d.id} className="py-3 text-[14px]">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sb-text">{d.clientName}</p>
                  <Badge variant={STATUS_BADGE[d.status] ?? "info"}>
                    {d.disputeResolution
                      ? RESOLUTION_LABEL[d.disputeResolution]
                      : STATUS_LABEL[d.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sb-muted">
                  {d.createdAt.toLocaleDateString("es-AR")}
                  {d.disputeResolvedAt && (
                    <> · Resuelto: {d.disputeResolvedAt.toLocaleDateString("es-AR")}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historial del cliente */}
      <section className="mt-4 rounded-2xl border border-sb-border bg-white p-5">
        <h2 className="font-display text-[16px] font-semibold text-sb-text">
          Historial de reclamos del cliente
        </h2>
        {clientClaims.length === 0 ? (
          <p className="mt-2 text-[14px] text-sb-muted">
            Sin reclamos previos.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-sb-border">
            {clientClaims.map((c) => (
              <div key={c.id} className="py-3 text-[14px]">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sb-text">{c.professionalName}</p>
                  <Badge variant={STATUS_BADGE[c.status] ?? "info"}>
                    {c.disputeResolution
                      ? RESOLUTION_LABEL[c.disputeResolution]
                      : STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sb-muted">
                  {c.createdAt.toLocaleDateString("es-AR")}
                  {c.disputeResolvedAt && (
                    <> · Resuelto: {c.disputeResolvedAt.toLocaleDateString("es-AR")}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Formulario de resolución */}
      <section className="mt-4">
        <DisputeResolutionForm workRecordId={workRecordId} />
      </section>
    </div>
  );
}
