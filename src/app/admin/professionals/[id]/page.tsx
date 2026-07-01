import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfessionalForAdminDetail } from "@/modules/professionals/queries";
import { Badge } from "@/components/ui/Badge";
import { BioDisplay } from "@/components/shared/BioDisplay";
import { AdminActionsPanel } from "./AdminActionsPanel";
import { SanctionForm } from "./SanctionForm";
import { ReviewModerationPanel } from "./ReviewModerationPanel";

type Props = {
  params: Promise<{ id: string }>;
};

const SANCTION_TYPE_LABELS: Record<string, string> = {
  warning: "Nota interna",
  temporary_suspension: "Suspensión temporal",
  permanent_deactivation: "Desactivación permanente",
};

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  disputed: "Disputa abierta",
  cancelled: "Cancelado",
  active: "Activo",
  completed: "Completado",
  pending_pro_confirmation: "Pendiente de confirmación",
};

const DISPUTE_RESOLUTION_LABELS: Record<string, string> = {
  work_confirmed: "Trabajo confirmado",
  claim_rejected: "Reclamo rechazado",
  unresolved: "No resuelto",
};

export default async function AdminProfessionalDetailPage({ params }: Props) {
  const { id } = await params;
  const professional = await getProfessionalForAdminDetail(id);

  if (!professional) {
    notFound();
  }

  const now = new Date();

  const hasPermanentDeactivation = professional.sanctions.some(
    (s) => s.type === "permanent_deactivation" && !s.liftedAt,
  );

  const boostActive =
    professional.newProfessionalBoostUntil !== null &&
    professional.newProfessionalBoostUntil > now;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Nav */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/professionals"
          className="text-sm text-sb-blue hover:underline"
        >
          ← Profesionales
        </Link>
        <Link
          href={`/p/${professional.slug}`}
          target="_blank"
          className="text-sm text-sb-muted hover:underline dark:text-sb-muted-dark"
        >
          Ver perfil público ↗
        </Link>
      </div>

      {/* Cabecera */}
      <div className="mb-4">
        <h1 className="font-display text-[22px] font-semibold">
          {professional.fullName}
        </h1>
        <p className="mt-0.5 text-sm text-sb-muted dark:text-sb-muted-dark">
          {[
            professional.primaryTradeName,
            professional.primaryDepartmentName,
            `Registrado el ${professional.createdAt.toLocaleDateString("es-AR")}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {professional.isActive ? (
            <Badge variant="success">Activo</Badge>
          ) : (
            <Badge variant="error">Inactivo</Badge>
          )}
          {professional.isVerified && <Badge variant="info">Verificado</Badge>}
          {boostActive && (
            <Badge variant="warning">
              Boost hasta{" "}
              {professional.newProfessionalBoostUntil!.toLocaleDateString(
                "es-AR",
              )}
            </Badge>
          )}
          {hasPermanentDeactivation && (
            <Badge variant="error">Desactivación permanente</Badge>
          )}
        </div>
      </div>

      {/* Alerta de sanción activa */}
      {professional.activeSanction && (
        <div className="mb-4 rounded-card border border-sb-error/40 bg-sb-error/5 p-3">
          <p className="text-sm font-medium text-sb-error">
            {professional.activeSanction.type === "temporary_suspension"
              ? `Suspendido hasta el ${professional.activeSanction.expiresAt?.toLocaleDateString("es-AR")}`
              : "Desactivación permanente activa"}
          </p>
          <p className="mt-0.5 text-sm text-sb-muted dark:text-sb-muted-dark">
            {professional.activeSanction.reason}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Acciones rápidas */}
        <AdminActionsPanel
          professionalId={professional.id}
          isActive={professional.isActive}
          isVerified={professional.isVerified}
          newProfessionalBoostUntil={professional.newProfessionalBoostUntil}
          hasPermanentDeactivation={hasPermanentDeactivation}
        />

        {/* Datos del perfil */}
        <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
          <h2 className="mb-3 font-display text-[15px] font-semibold">
            Perfil
          </h2>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-sb-muted dark:text-sb-muted-dark">
                Teléfono de contacto
              </dt>
              <dd>{professional.contactPhone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sb-muted dark:text-sb-muted-dark">
                Oficios
              </dt>
              <dd>{professional.allTrades.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-sb-muted dark:text-sb-muted-dark">Zonas</dt>
              <dd>{professional.departments.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-sb-muted dark:text-sb-muted-dark">
                Reseñas publicadas
              </dt>
              <dd>{professional.publishedReviewCount}</dd>
            </div>
          </dl>
          {professional.bio && (
            <div className="mt-3 border-t border-sb-border pt-3 dark:border-sb-border-dark">
              <BioDisplay
                rawBio={professional.bio}
                professionalName={professional.fullName}
              />
            </div>
          )}
        </section>

        {/* Métricas */}
        <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
          <h2 className="mb-3 font-display text-[15px] font-semibold">
            Métricas de actividad
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-[22px] font-bold text-sb-blue">
                {professional.totalContacts}
              </p>
              <p className="text-sb-muted dark:text-sb-muted-dark">
                Contactos totales
              </p>
            </div>
            <div>
              <p className="text-[22px] font-bold">
                {professional.activeWorkRecords}
              </p>
              <p className="text-sb-muted dark:text-sb-muted-dark">
                Trabajos registrados
              </p>
            </div>
            <div>
              <p className="text-[22px] font-bold">
                {professional.totalContacts > 0
                  ? `${Math.round((professional.activeWorkRecords / professional.totalContacts) * 100)}%`
                  : "—"}
              </p>
              <p className="text-sb-muted dark:text-sb-muted-dark">
                Contactos → trabajos
              </p>
            </div>
          </div>
        </section>

        {/* Sanciones */}
        <SanctionForm
          professionalId={professional.id}
          professionalName={professional.fullName}
        />

        {professional.sanctions.length > 0 && (
          <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
            <h2 className="mb-3 font-display text-[15px] font-semibold">
              Historial de sanciones ({professional.sanctions.length})
            </h2>
            <div className="flex flex-col divide-y divide-sb-border dark:divide-sb-border-dark">
              {professional.sanctions.map((sanction) => (
                <div key={sanction.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">
                      {SANCTION_TYPE_LABELS[sanction.type] ?? sanction.type}
                    </span>
                    <span className="shrink-0 text-sb-muted dark:text-sb-muted-dark">
                      {sanction.imposedAt.toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sb-muted dark:text-sb-muted-dark">
                    {sanction.reason}
                  </p>
                  {sanction.expiresAt && (
                    <p className="mt-0.5 text-sb-muted dark:text-sb-muted-dark">
                      Vence:{" "}
                      {sanction.expiresAt.toLocaleDateString("es-AR")}
                      {sanction.liftedAt ? " · Levantada manualmente" : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disputas */}
        {professional.disputes.length > 0 && (
          <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
            <h2 className="mb-3 font-display text-[15px] font-semibold">
              Disputas ({professional.disputes.length})
            </h2>
            <div className="flex flex-col divide-y divide-sb-border dark:divide-sb-border-dark">
              {professional.disputes.map((dispute) => (
                <div key={dispute.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{dispute.clientName}</p>
                      <p className="text-sb-muted dark:text-sb-muted-dark">
                        {[dispute.tradeName, dispute.createdAt.toLocaleDateString("es-AR")]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sb-muted dark:text-sb-muted-dark">
                        {DISPUTE_STATUS_LABELS[dispute.status] ?? dispute.status}
                      </p>
                      {dispute.disputeResolution && (
                        <p className="text-sb-muted dark:text-sb-muted-dark">
                          {DISPUTE_RESOLUTION_LABELS[dispute.disputeResolution] ??
                            dispute.disputeResolution}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/disputes/${dispute.id}`}
                    className="mt-1 inline-block text-xs text-sb-blue hover:underline"
                  >
                    Ver disputa →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reseñas */}
        {professional.publishedReviews.length > 0 && (
          <section className="rounded-card border border-sb-border p-4 dark:border-sb-border-dark">
            <h2 className="mb-3 font-display text-[15px] font-semibold">
              Reseñas ({professional.publishedReviewCount} visibles
              {professional.publishedReviews.length >
                professional.publishedReviewCount &&
                `, ${professional.publishedReviews.length - professional.publishedReviewCount} suspendida${professional.publishedReviews.length - professional.publishedReviewCount !== 1 ? "s" : ""}`}
              )
            </h2>
            <div className="flex flex-col divide-y divide-sb-border dark:divide-sb-border-dark">
              {professional.publishedReviews.map((review) => (
                <div
                  key={review.id}
                  className={`py-3 text-sm ${review.suspendedAt ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium">{review.reviewerName}</p>
                        {review.suspendedAt && (
                          <Badge variant="warning">Suspendida</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sb-warning">
                        {"★".repeat(review.rating)}
                        <span className="text-sb-muted opacity-40 dark:text-sb-muted-dark">
                          {"★".repeat(5 - review.rating)}
                        </span>
                      </p>
                      <p className="text-sb-muted dark:text-sb-muted-dark">
                        {review.tradeName} ·{" "}
                        {review.publishedAt.toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-sb-border/40 px-1.5 py-0.5 text-xs dark:bg-sb-border-dark/40">
                      {review.type === "work_review" ? "Trabajo" : "Contacto"}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-sb-muted dark:text-sb-muted-dark">
                      {review.comment}
                    </p>
                  )}
                  {review.moderationEvents.length > 0 && (
                    <div className="mt-2 rounded border border-sb-border/60 bg-sb-surface/40 p-2 dark:border-sb-border-dark/60 dark:bg-sb-surface-dark/40">
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-sb-muted dark:text-sb-muted-dark">
                        Historial de moderación
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {review.moderationEvents.map((event, i) => (
                          <div key={i} className="text-xs">
                            <span className="font-medium">
                              {event.action === "suspend"
                                ? "Suspendida"
                                : event.action === "unsuspend"
                                  ? "Levantada"
                                  : "Eliminada"}
                            </span>
                            {" · "}
                            <span className="text-sb-muted dark:text-sb-muted-dark">
                              {event.adminName} ·{" "}
                              {event.createdAt.toLocaleDateString("es-AR")}
                            </span>
                            <p className="mt-0.5 text-sb-muted dark:text-sb-muted-dark">
                              {event.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <ReviewModerationPanel
                    reviewId={review.id}
                    isSuspended={review.suspendedAt !== null}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
