import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserAccountProfile, getUserProfileStats, getUserRole } from "@/modules/users/queries";
import {
  getProfessionalProfileIdByUserId,
  getDashboardMetricsForProfessional,
} from "@/modules/professionals/queries";
import {
  getPendingWorkReviewsForClientCount,
  getPendingContactReviewsForClientCount,
  getPendingClaimsForProfessionalCount,
  getPendingReviewsToRespondCount,
} from "@/modules/reviews/queries";
import {
  getPendingContactsCount,
  getClaimableContactsForClientCount,
} from "@/modules/contacts/queries";

function UserAvatar({
  avatarUrl,
  fullName,
  size = "md",
}: {
  avatarUrl: string | null;
  fullName: string;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-xl";
  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full bg-sb-card-blue flex items-center justify-center`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={fullName}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-display font-bold text-sb-blue">
          {fullName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function MetricCard({
  value,
  label,
  sublabel,
  color = "default",
  emoji,
}: {
  value: string | number;
  label: string;
  sublabel?: string;
  color?: "default" | "blue" | "green" | "orange" | "muted";
  emoji: string;
}) {
  const valueColor = {
    default: "text-sb-text",
    blue: "text-sb-blue",
    green: "text-sb-success",
    orange: "text-sb-orange",
    muted: "text-sb-muted",
  }[color];

  return (
    <div className="rounded-2xl bg-white p-5">
      <span className="text-xl">{emoji}</span>
      <p className={`font-display mt-3 text-[34px] font-bold leading-none tabular-nums ${valueColor}`}>
        {value}
      </p>
      <p className="mt-2 text-[13px] font-medium text-sb-text">{label}</p>
      {sublabel && (
        <p className="mt-0.5 text-[12px] text-sb-muted">{sublabel}</p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const role = session ? await getUserRole(session.user.id) : null;
  if (role === "admin") {
    redirect("/admin");
  }

  const [accountProfile, professionalId] = await Promise.all([
    session ? getUserAccountProfile(session.user.id) : Promise.resolve(null),
    session
      ? getProfessionalProfileIdByUserId(session.user.id)
      : Promise.resolve(null),
  ]);

  const firstName = accountProfile?.fullName?.split(" ")[0] ?? "";

  // ── Vista profesional ──
  if (professionalId) {
    const [
      metrics,
      pendingReviews,
      pendingContacts,
      pendingClaims,
    ] = await Promise.all([
      getDashboardMetricsForProfessional(professionalId),
      getPendingReviewsToRespondCount(professionalId),
      getPendingContactsCount(professionalId),
      getPendingClaimsForProfessionalCount(professionalId),
    ]);

    const conversionColor =
      metrics.conversionRate >= 30
        ? "green"
        : metrics.conversionRate >= 10
          ? "blue"
          : "muted";

    const hasPendingActions =
      pendingClaims > 0 || pendingContacts > 0 || pendingReviews > 0;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Saludo */}
        <div className="mb-8 flex items-center gap-4">
          <UserAvatar
            avatarUrl={accountProfile?.avatarUrl ?? null}
            fullName={accountProfile?.fullName ?? ""}
            size="lg"
          />
          <div>
            <h1 className="font-display text-[26px] font-bold leading-tight text-sb-text">
              Hola, {firstName}
            </h1>
            <p className="mt-0.5 text-[14px] text-sb-muted">Panel profesional</p>
          </div>
        </div>

        {/* Métricas 2×2 */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <MetricCard
            emoji="📞"
            value={metrics.contacts30d}
            label="Contactos este mes"
            sublabel={`${metrics.totalContacts} en total`}
            color="blue"
          />
          <MetricCard
            emoji="✅"
            value={metrics.verifiedWorkRecords}
            label="Trabajos verificados"
            sublabel="con reseña confirmada"
            color={metrics.verifiedWorkRecords > 0 ? "green" : "default"}
          />
          <MetricCard
            emoji="⭐"
            value={metrics.reviewsReceived}
            label="Reseñas recibidas"
            sublabel="publicadas en tu perfil"
            color="orange"
          />
          <MetricCard
            emoji="🔄"
            value={`${metrics.conversionRate}%`}
            label="Tasa de conversión"
            sublabel="contactos → trabajo registrado"
            color={conversionColor}
          />
        </div>

        {/* Acciones pendientes */}
        {hasPendingActions && (
          <div className="mb-6 flex flex-col gap-3">
            {pendingClaims > 0 && (
              <Link
                href="/professional/reviews"
                className="flex items-center justify-between rounded-2xl border border-sb-warning/30 bg-sb-warning/5 p-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-sb-warning">
                    {pendingClaims} reclamo
                    {pendingClaims === 1 ? "" : "s"} pendiente
                    {pendingClaims === 1 ? "" : "s"}
                  </p>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    Un cliente inició un reclamo. Respondé antes de que venza el plazo.
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-sb-warning">→</span>
              </Link>
            )}

            {pendingContacts > 0 && (
              <Link
                href="/professional/reviews"
                className="flex items-center justify-between rounded-2xl bg-sb-card-blue p-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-sb-blue">
                    {pendingContacts} contacto
                    {pendingContacts === 1 ? "" : "s"} sin registrar
                  </p>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    Registrá el trabajo para que el cliente pueda dejarte una reseña
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-sb-blue">→</span>
              </Link>
            )}

            {pendingReviews > 0 && (
              <Link
                href="/professional/reviews"
                className="flex items-center justify-between rounded-2xl border border-sb-border bg-white p-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-sb-text">
                    {pendingReviews} reseña
                    {pendingReviews === 1 ? "" : "s"} pendiente
                    {pendingReviews === 1 ? "" : "s"} de responder
                  </p>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    Calificá al cliente y respondé la reseña
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-sb-muted">→</span>
              </Link>
            )}
          </div>
        )}

        {/* ¿Necesitás contratar? */}
        <div className="rounded-2xl border border-sb-border bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-sb-text">
                ¿Necesitás contratar a alguien?
              </p>
              <p className="mt-0.5 text-[13px] text-sb-muted">
                Encontrá profesionales de confianza en tu zona.
              </p>
            </div>
            <Link
              href="/search"
              className="shrink-0 text-[13px] font-medium text-sb-blue hover:underline"
            >
              Buscar →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista cliente ──
  const [
    userStats,
    pendingClientWorkReviews,
    pendingContactReviews,
    claimableContacts,
  ] = await Promise.all([
    session
      ? getUserProfileStats(session.user.id)
      : Promise.resolve({ contactsCount: 0, reviewsGiven: 0, reviewsPending: 0 }),
    session
      ? getPendingWorkReviewsForClientCount(session.user.id)
      : Promise.resolve(0),
    session
      ? getPendingContactReviewsForClientCount(session.user.id)
      : Promise.resolve(0),
    session
      ? getClaimableContactsForClientCount(session.user.id)
      : Promise.resolve(0),
  ]);

  const memberSince = accountProfile?.createdAt
    ? new Date(accountProfile.createdAt).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      })
    : null;

  const hasPendingActions =
    pendingClientWorkReviews > 0 || pendingContactReviews > 0 || claimableContacts > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Saludo */}
      <div className="mb-8 flex items-center gap-4">
        <UserAvatar
          avatarUrl={accountProfile?.avatarUrl ?? null}
          fullName={accountProfile?.fullName ?? ""}
          size="lg"
        />
        <div>
          <h1 className="font-display text-[26px] font-bold leading-tight text-sb-text">
            Hola, {firstName}
          </h1>
          {memberSince && (
            <p className="mt-0.5 text-[14px] text-sb-muted">
              Miembro desde {memberSince}
            </p>
          )}
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-5">
          <p className="font-display text-[32px] font-bold leading-none tabular-nums text-sb-blue">
            {userStats.contactsCount}
          </p>
          <p className="mt-2 text-[13px] text-sb-muted">
            Profesional{userStats.contactsCount === 1 ? "" : "es"} contactado
            {userStats.contactsCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5">
          <p className="font-display text-[32px] font-bold leading-none tabular-nums text-sb-success">
            {userStats.reviewsGiven}
          </p>
          <p className="mt-2 text-[13px] text-sb-muted">
            Reseña{userStats.reviewsGiven === 1 ? "" : "s"} escrita
            {userStats.reviewsGiven === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Acciones pendientes */}
      {hasPendingActions && (
        <div className="mb-6 flex flex-col gap-3">
          {pendingClientWorkReviews > 0 && (
            <Link
              href="/notifications"
              className="flex items-center justify-between rounded-2xl bg-sb-card-orange p-4"
            >
              <div>
                <p className="text-[15px] font-semibold text-sb-orange">
                  {pendingClientWorkReviews} reseña
                  {pendingClientWorkReviews === 1 ? "" : "s"} de trabajo
                  pendiente{pendingClientWorkReviews === 1 ? "" : "s"}
                </p>
                <p className="mt-0.5 text-[13px] text-sb-muted">
                  Calificá a los profesionales con los que trabajaste
                </p>
              </div>
              <span className="ml-3 shrink-0 text-sb-orange">→</span>
            </Link>
          )}

          {pendingContactReviews > 0 && (
            <Link
              href="/reviews/contact"
              className="flex items-center justify-between rounded-2xl bg-sb-card-blue p-4"
            >
              <div>
                <p className="text-[15px] font-semibold text-sb-blue">
                  {pendingContactReviews} reseña
                  {pendingContactReviews === 1 ? "" : "s"} de contacto
                  disponible{pendingContactReviews === 1 ? "" : "s"}
                </p>
                <p className="mt-0.5 text-[13px] text-sb-muted">
                  Calificá cómo te atendieron en el primer contacto
                </p>
              </div>
              <span className="ml-3 shrink-0 text-sb-blue">→</span>
            </Link>
          )}

          {claimableContacts > 0 && (
            <Link
              href="/reviews/claim"
              className="flex items-center justify-between rounded-2xl border border-sb-border bg-white p-4"
            >
              <div>
                <p className="text-[15px] font-semibold text-sb-text">
                  {claimableContacts} trabajo
                  {claimableContacts === 1 ? "" : "s"} sin registrar
                </p>
                <p className="mt-0.5 text-[13px] text-sb-muted">
                  ¿El profesional no registró el trabajo? Podés iniciar un reclamo.
                </p>
              </div>
              <span className="ml-3 shrink-0 text-sb-muted">→</span>
            </Link>
          )}
        </div>
      )}

      {/* CTA perfil profesional */}
      <div className="mb-3 rounded-2xl bg-sb-blue p-5 text-white">
        <h2 className="font-display text-[18px] font-semibold">
          Activá tu perfil profesional gratis
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/90">
          Los clientes te encuentran por oficio y zona, ven tus reseñas y te
          contactan directo. Sin costo.
        </p>
        <Link
          href="/professional/onboarding"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[15px] font-medium text-sb-blue"
        >
          Activar perfil profesional
        </Link>
      </div>

      {/* Buscar */}
      <Link
        href="/search"
        className="flex items-center justify-between rounded-2xl bg-white p-5"
      >
        <div>
          <h2 className="font-display text-[17px] font-semibold text-sb-text">
            Buscar profesionales
          </h2>
          <p className="mt-0.5 text-[13px] text-sb-muted">
            Encontrá plomeros, electricistas y más en tu zona.
          </p>
        </div>
        <span className="ml-3 shrink-0 text-sb-muted">→</span>
      </Link>
    </div>
  );
}
