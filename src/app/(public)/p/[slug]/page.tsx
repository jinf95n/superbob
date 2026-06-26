import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getContactMetrics,
  getProfessionalBadges,
  getProfessionalContactPhone,
  getProfessionalProfileBySlug,
  getProfileCompleteness,
  getSuperbobScoreBreakdown,
} from "@/modules/professionals/queries";
import { checkUserHasPendingReview } from "@/modules/reviews/queries";
import { checkUserHadContact } from "@/modules/contacts/queries";
import { PhoneReveal } from "@/components/shared/PhoneReveal";
import { ProfileAvatarWithModal } from "@/components/shared/ProfileAvatarWithModal";
import { ReportModal } from "@/components/shared/ReportModal";
import { BadgeRow } from "@/components/shared/BadgePill";
import { ProfileCompletionCard } from "@/components/shared/ProfileCompletionCard";
import { ReviewsList } from "@/components/shared/ReviewsList";
import { PhotoGallery } from "@/components/shared/PhotoGallery";
import { ShareProfileBlock } from "@/components/shared/ShareProfileBlock";
import { DesktopShareButtons } from "@/components/shared/DesktopShareButtons";

type ProfessionalPublicProfilePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatMonthYear(date: Date): string {
  const formatted = date.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default async function ProfessionalPublicProfilePage({
  params,
  searchParams,
}: ProfessionalPublicProfilePageProps) {
  const { slug } = await params;
  const { updated } = await searchParams;

  const requestHeaders = await headers();
  const [professional, session] = await Promise.all([
    getProfessionalProfileBySlug(slug),
    auth.api.getSession({ headers: requestHeaders }),
  ]);
  if (!professional) {
    notFound();
  }

  const isOwner = session?.user.id === professional.userId;
  const isClient = session && !isOwner;

  const [badges, contactMetrics, scoreBreakdown, completeness, contactPhone, pendingReview, hasContact] =
    await Promise.all([
      getProfessionalBadges(professional.id),
      getContactMetrics(professional.id),
      getSuperbobScoreBreakdown(professional.id),
      isOwner ? getProfileCompleteness(professional.id) : Promise.resolve(null),
      session ? getProfessionalContactPhone(professional.id) : Promise.resolve(null),
      isClient
        ? checkUserHasPendingReview(session.user.id, professional.id)
        : Promise.resolve(null),
      isClient
        ? checkUserHadContact(session.user.id, professional.id)
        : Promise.resolve(false),
    ]);

  const host = requestHeaders.get("host");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (host ? `${process.env.NODE_ENV === "development" ? "http" : "https"}://${host}` : "");
  const profileUrl = `${baseUrl}/p/${professional.slug}`;

  const hasMetrics =
    professional.weightedScore !== null ||
    professional.satisfactionRate !== null ||
    professional.primaryTrade !== null;

  const primaryTradeExperience = professional.trades.find(
    (trade) => trade.isPrimary,
  )?.yearsExperience;

  const hasTradesOrCoverage =
    professional.trades.length > 0 || professional.departments.length > 0;

  // JSX compartido para la sección de oficios+cobertura (versiones mobile y desktop)
  const TradesAndCoverageContent = (
    <>
      {professional.trades.length > 0 && (
        <div>
          <h2 className="font-display text-[18px] font-semibold text-sb-text">
            Oficios
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {professional.trades.map((trade) => (
              <li
                key={trade.tradeId}
                className="flex items-center justify-between gap-3 rounded-card border border-sb-border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-medium text-sb-text">
                      {trade.name}
                    </p>
                    {trade.isPrimary && (
                      <span className="rounded-full bg-sb-card-orange px-2 py-0.5 text-[12px] font-medium text-sb-orange">
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    {trade.yearsExperience != null
                      ? `${trade.yearsExperience} año${trade.yearsExperience === 1 ? "" : "s"} de experiencia · `
                      : ""}
                    {trade.completedWorkCount} trabajo
                    {trade.completedWorkCount === 1 ? "" : "s"} en plataforma
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {professional.departments.length > 0 && (
        <div className={professional.trades.length > 0 ? "mt-5" : ""}>
          <h2 className="font-display text-[18px] font-semibold text-sb-text">
            Cobertura
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {professional.departments.map((department) => (
              <span
                key={department.slug}
                className="rounded-full border border-sb-border bg-sb-bg px-3 py-1 text-[13px] font-medium text-sb-text"
              >
                {department.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <main className="min-h-screen bg-sb-bg pb-32 sm:pb-12 lg:pb-8">
      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* Banners full-width */}
        {(updated === "1" || pendingReview || hasContact) && (
          <div className="mb-6 flex flex-col gap-3">
            {updated === "1" && (
              <p className="rounded-2xl bg-sb-card-blue p-4 text-center text-[15px] text-sb-text">
                Guardado. Tu perfil ya está actualizado.
              </p>
            )}
            {hasContact && !pendingReview && (
              <a
                href="/notifications"
                className="flex items-center justify-between rounded-2xl bg-sb-card-blue p-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-sb-blue">
                    ¿Trabajaste con {professional.fullName.split(" ")[0]}?
                  </p>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    Revisá tus notificaciones para dejar una reseña cuando esté disponible.
                  </p>
                </div>
                <span className="ml-4 shrink-0 whitespace-nowrap rounded-xl bg-sb-blue px-4 py-2 text-[14px] font-medium text-white">
                  Ver notificaciones
                </span>
              </a>
            )}
            {pendingReview && (
              <a
                href={`/reviews/${pendingReview.workRecordId}`}
                className="flex items-center justify-between rounded-2xl bg-sb-card-orange p-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-sb-orange">
                    Tenés una reseña pendiente
                  </p>
                  <p className="mt-0.5 text-[13px] text-sb-muted">
                    Contá cómo fue tu experiencia con {professional.fullName}
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-sb-orange">→</span>
              </a>
            )}
          </div>
        )}

        {/* Layout de dos columnas */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* ── COLUMNA IZQUIERDA — sticky en desktop ── */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto lg:pb-4">

            {/* Card principal: hero + secciones compactas desktop */}
            <div className="overflow-hidden rounded-2xl bg-white">

              {/* Hero */}
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <ProfileAvatarWithModal
                    avatarUrl={professional.avatarUrl}
                    fullName={professional.fullName}
                  />
                  <div>
                    <h1 className="font-display text-[24px] font-extrabold text-sb-text">
                      {professional.fullName}
                    </h1>
                    {(professional.primaryTrade || professional.primaryDepartmentName) && (
                      <p className="mt-0.5 text-[15px] text-sb-muted">
                        {professional.primaryTrade?.name}
                        {professional.primaryTrade && professional.primaryDepartmentName
                          ? " · "
                          : ""}
                        {professional.primaryDepartmentName &&
                          `Atiende en ${professional.primaryDepartmentName}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5 text-[13px] text-sb-muted">
                  <p>⏱ {contactMetrics.responseTimeLabel}</p>
                  <p>📅 En SUPERBOB desde {formatMonthYear(professional.createdAt)}</p>
                  <p>
                    💬 {contactMetrics.contactsThisMonth} contacto
                    {contactMetrics.contactsThisMonth === 1 ? "" : "s"} este mes
                  </p>
                </div>

                {badges.length > 0 && (
                  <div className="mt-4">
                    <BadgeRow badges={badges} />
                  </div>
                )}

                <div className="mt-5">
                  {isOwner ? (
                    <Link
                      href="/professional/edit"
                      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-sb-blue text-[15px] font-semibold text-sb-blue transition-colors hover:bg-sb-card-blue"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Editar perfil
                    </Link>
                  ) : (
                    <PhoneReveal
                      professionalId={professional.id}
                      source="profile"
                      preloadedPhone={contactPhone}
                    />
                  )}
                </div>
              </div>

              {/* Métricas compactas — solo desktop */}
              <div className="hidden border-t border-sb-border px-5 py-4 lg:grid lg:grid-cols-3">
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-sb-text">
                    {professional.weightedScore !== null
                      ? professional.weightedScore.toFixed(1)
                      : "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-sb-muted">calificación</p>
                </div>
                <div className="border-x border-sb-border text-center">
                  <p className="font-display text-xl font-bold text-sb-text">
                    {professional.publishedReviewsCount}
                  </p>
                  <p className="mt-0.5 text-xs text-sb-muted">reseñas</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-sb-text">
                    {professional.completedWorkRecordsCount}
                  </p>
                  <p className="mt-0.5 text-xs text-sb-muted">trabajos</p>
                </div>
              </div>

              {/* Oficios compactos — solo desktop */}
              {professional.trades.length > 0 && (
                <div className="hidden border-t border-sb-border px-5 py-4 lg:block">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
                    Oficios
                  </p>
                  {professional.trades.map((trade) => (
                    <div
                      key={trade.tradeId}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-sb-text">{trade.name}</span>
                      {trade.isPrimary && (
                        <span className="rounded-full bg-sb-card-blue px-2 py-0.5 text-[11px] font-medium text-sb-blue">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cobertura compacta — solo desktop */}
              {professional.departments.length > 0 && (
                <div className="hidden border-t border-sb-border px-5 py-4 lg:block">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
                    Atiende en
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {professional.departments.map((dept) => (
                      <span
                        key={dept.slug}
                        className="rounded-full border border-sb-border bg-sb-bg px-2.5 py-1 text-xs text-sb-muted"
                      >
                        {dept.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compartir / Ver QR — solo desktop */}
              <div className="hidden border-t border-sb-border px-5 py-4 lg:block">
                <DesktopShareButtons profileUrl={profileUrl} slug={professional.slug} />
              </div>

            </div>

            {/* Completitud del perfil — solo para el dueño */}
            {isOwner && completeness && (
              <ProfileCompletionCard completeness={completeness} />
            )}

          </div>

          {/* ── COLUMNA DERECHA — scroll normal ── */}
          {/*
            Orden en mobile (DOM order, sin lg:order-*): strip-métricas, score,
            oficios-mobile, bio, portafolio, reseñas, credenciales, reportar.
            Orden en desktop (lg:order-*): score(0), portafolio(2), reseñas(3),
            bio(4), oficios-detailed(5), credenciales(6), reportar(7).
          */}
          <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-1">

            {/* Strip de métricas — solo mobile */}
            {hasMetrics && (
              <section className="rounded-2xl bg-white p-5 lg:hidden">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {professional.weightedScore !== null && (
                    <div className="rounded-card bg-sb-bg p-4">
                      <p className="font-display text-[24px] font-extrabold text-sb-text">
                        {professional.weightedScore.toFixed(1)}
                      </p>
                      <p aria-hidden="true" className="mt-0.5 text-sb-orange">
                        {"★".repeat(Math.round(professional.weightedScore))}
                        {"☆".repeat(5 - Math.round(professional.weightedScore))}
                      </p>
                      <p className="mt-1 text-[13px] text-sb-muted">
                        {professional.publishedReviewsCount} reseña
                        {professional.publishedReviewsCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  )}
                  <div className="rounded-card bg-sb-bg p-4">
                    <p className="font-display text-[24px] font-extrabold text-sb-text">
                      {professional.completedWorkRecordsCount}
                    </p>
                    <p className="mt-1 text-[13px] text-sb-muted">
                      Trabajos en plataforma
                    </p>
                    <p className="text-[13px] text-sb-muted">verificados</p>
                  </div>
                  {professional.satisfactionRate !== null && (
                    <div className="rounded-card bg-sb-bg p-4">
                      <p className="font-display text-[24px] font-extrabold text-sb-text">
                        {professional.satisfactionRate}%
                      </p>
                      <p className="mt-1 text-[13px] text-sb-muted">
                        Clientes satisfechos
                      </p>
                    </div>
                  )}
                  {primaryTradeExperience != null && (
                    <div className="rounded-card bg-sb-bg p-4">
                      <p className="font-display text-[24px] font-extrabold text-sb-text">
                        {primaryTradeExperience}
                      </p>
                      <p className="mt-1 text-[13px] text-sb-muted">
                        Años de experiencia
                      </p>
                      <p className="text-[13px] text-sb-muted">
                        {professional.primaryTrade?.name}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Índice SUPERBOB — desktop: posición 1 (order 0, primero por defecto) */}
            {scoreBreakdown && (
              <section className="rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-[18px] font-semibold text-sb-text">
                    Índice SUPERBOB
                  </h2>
                  <span className="font-display text-[32px] font-extrabold text-sb-blue">
                    {scoreBreakdown.total}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sb-bg">
                  <div
                    className="h-full rounded-full bg-sb-blue"
                    style={{ width: `${scoreBreakdown.total}%` }}
                  />
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  {scoreBreakdown.components.map((component) => (
                    <div key={component.label}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-sb-text">{component.label}</span>
                        <span className="text-sb-muted">
                          {component.value}/{component.max}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sb-bg">
                        <div
                          className="h-full rounded-full bg-sb-blue"
                          style={{
                            width: `${(component.value / component.max) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Oficios y cobertura — solo mobile (desktop: compacto en col. izq. + detalle abajo) */}
            {hasTradesOrCoverage && (
              <section className="rounded-2xl bg-white p-5 lg:hidden">
                {TradesAndCoverageContent}
              </section>
            )}

            {/* Bio — mobile: pos. 4 · desktop: pos. 4 (después de reseñas) */}
            {professional.bio && (
              <section className="rounded-2xl bg-white p-5 lg:order-4">
                <p className="text-[15px] italic leading-relaxed text-sb-muted">
                  &ldquo;{professional.bio}&rdquo;
                </p>
                {professional.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {professional.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full border border-sb-border bg-sb-bg px-3 py-1 text-[13px] font-medium text-sb-text"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Portafolio — mobile: pos. 5 · desktop: pos. 2 (después de score) */}
            {professional.photos.length > 0 && (
              <section className="rounded-2xl bg-white p-5 lg:order-2">
                <h2 className="font-display text-[18px] font-semibold text-sb-text">
                  Trabajos realizados
                </h2>
                <div className="mt-3">
                  <PhotoGallery
                    photos={professional.photos}
                    professionalName={professional.fullName}
                  />
                </div>
              </section>
            )}

            {/* Reseñas — mobile: pos. 6 · desktop: pos. 3 */}
            {professional.reviews.length > 0 && professional.weightedScore !== null && (
              <section className="rounded-2xl bg-white p-5 lg:order-3">
                <h2 className="font-display text-[18px] font-semibold text-sb-text">
                  Reseñas
                </h2>
                <div className="mt-3">
                  <ReviewsList
                    reviews={professional.reviews}
                    weightedScore={professional.weightedScore}
                    ratingHistogram={professional.ratingHistogram}
                    totalCount={professional.publishedReviewsCount}
                  />
                </div>
              </section>
            )}

            {/* Oficios detallados — solo desktop, pos. 5 (después de bio) */}
            {hasTradesOrCoverage && (
              <section className="hidden rounded-2xl bg-white p-5 lg:block lg:order-5">
                {TradesAndCoverageContent}
              </section>
            )}

            {/* Credenciales */}
            {professional.isVerified && (
              <section className="rounded-2xl bg-white p-5 lg:order-6">
                <h2 className="font-display text-[18px] font-semibold text-sb-text">
                  Credenciales
                </h2>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-sb-success/10 px-3 py-1.5 text-[14px] font-medium text-sb-success">
                  🛡 Identidad verificada por SUPERBOB
                </span>
              </section>
            )}

            {/* Reportar */}
            <div className="text-center lg:order-7">
              <ReportModal
                reportedUserId={professional.userId}
                reportedProfessionalId={professional.id}
                triggerLabel="Reportar perfil"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Compartir — solo mobile (desktop tiene botones inline en col. izq.) */}
      <div className="lg:hidden">
        <ShareProfileBlock profileUrl={profileUrl} slug={professional.slug} />
      </div>
    </main>
  );
}
