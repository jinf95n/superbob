import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getContactMetrics,
  getProfessionalBadges,
  getProfessionalProfileBySlug,
  getProfileCompleteness,
  getSuperbobScoreBreakdown,
} from "@/modules/professionals/queries";
import { PhoneReveal } from "@/components/shared/PhoneReveal";
import { ProfileAvatarWithModal } from "@/components/shared/ProfileAvatarWithModal";
import { ReportModal } from "@/components/shared/ReportModal";
import { BadgeRow } from "@/components/shared/BadgePill";
import { ProfileCompletionCard } from "@/components/shared/ProfileCompletionCard";
import { ReviewsList } from "@/components/shared/ReviewsList";
import { PortfolioGrid } from "@/components/shared/PortfolioGrid";
import { ShareProfileBlock } from "@/components/shared/ShareProfileBlock";

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

  const professional = await getProfessionalProfileBySlug(slug);
  if (!professional) {
    notFound();
  }

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const isOwner = session?.user.id === professional.userId;

  const [badges, contactMetrics, scoreBreakdown, completeness] =
    await Promise.all([
      getProfessionalBadges(professional.id),
      getContactMetrics(professional.id),
      getSuperbobScoreBreakdown(professional.id),
      isOwner ? getProfileCompleteness(professional.id) : Promise.resolve(null),
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

  return (
    <main className="min-h-screen bg-sb-bg pb-32 sm:pb-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
        {updated === "1" && (
          <p className="rounded-2xl bg-sb-card-blue p-4 text-center text-[15px] text-sb-text">
            Guardado. Tu perfil ya está actualizado.
          </p>
        )}

        {/* 1. HERO */}
        <section className="rounded-2xl border-b border-sb-border bg-white p-6">
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
            <PhoneReveal professionalId={professional.id} source="profile" />
          </div>
        </section>

        {/* COMPLETITUD — solo visible para el dueño del perfil */}
        {isOwner && completeness && (
          <ProfileCompletionCard completeness={completeness} />
        )}

        {/* 2. STRIP DE MÉTRICAS */}
        {hasMetrics && (
          <section className="rounded-2xl bg-white p-5">
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

        {/* 3. SCORE SUPERBOB */}
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
                      className="h-full rounded-full bg-sb-orange"
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

        {/* 4. OFICIOS Y COBERTURA */}
        {hasTradesOrCoverage && (
          <section className="rounded-2xl bg-white p-5">
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
                          {trade.completedWorkCount === 1 ? "" : "s"} en
                          plataforma
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
          </section>
        )}

        {/* 5. BIO Y ESPECIALIDADES */}
        {professional.bio && (
          <section className="rounded-2xl bg-white p-5">
            <p className="text-[15px] italic leading-relaxed text-sb-muted">
              “{professional.bio}”
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

        {/* 6. PORTAFOLIO */}
        {professional.photos.length > 0 && (
          <section className="rounded-2xl bg-white p-5">
            <h2 className="font-display text-[18px] font-semibold text-sb-text">
              Trabajos realizados
            </h2>
            <div className="mt-3">
              <PortfolioGrid
                photos={professional.photos}
                professionalName={professional.fullName}
              />
            </div>
          </section>
        )}

        {/* 7. RESEÑAS */}
        {professional.reviews.length > 0 && professional.weightedScore !== null && (
          <section className="rounded-2xl bg-white p-5">
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

        {/* 8. CREDENCIALES */}
        {professional.isVerified && (
          <section className="rounded-2xl bg-white p-5">
            <h2 className="font-display text-[18px] font-semibold text-sb-text">
              Credenciales
            </h2>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-sb-success/10 px-3 py-1.5 text-[14px] font-medium text-sb-success">
              🛡 Identidad verificada por SUPERBOB
            </span>
          </section>
        )}

        <div className="text-center">
          <ReportModal
            reportedUserId={professional.userId}
            reportedProfessionalId={professional.id}
            triggerLabel="Reportar perfil"
          />
        </div>
      </div>

      {/* 9. COMPARTIR EL PERFIL — bloque normal al final del scroll, no sticky */}
      <ShareProfileBlock profileUrl={profileUrl} slug={professional.slug} />
    </main>
  );
}
