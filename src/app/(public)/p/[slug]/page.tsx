import { notFound } from "next/navigation";
import { getProfessionalBySlug } from "@/modules/professionals/queries";
import { PhoneReveal } from "@/components/shared/PhoneReveal";
import { ReportModal } from "@/components/shared/ReportModal";

type ProfessionalPublicProfilePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const REVIEW_TYPE_LABEL: Record<string, string> = {
  work_review: "Trabajo completado",
  contact_review: "Contacto",
};

export default async function ProfessionalPublicProfilePage({
  params,
  searchParams,
}: ProfessionalPublicProfilePageProps) {
  const { slug } = await params;
  const { updated } = await searchParams;
  const professional = await getProfessionalBySlug(slug);

  if (!professional) {
    notFound();
  }

  const primaryTrade = professional.trades.find((trade) => trade.isPrimary);
  const overallScores = professional.trades.filter(
    (trade) => trade.score !== null,
  );
  const overallScore =
    overallScores.length > 0
      ? overallScores.reduce((sum, trade) => sum + (trade.score ?? 0), 0) /
        overallScores.length
      : null;
  const totalReviewCount = professional.trades.reduce(
    (sum, trade) => sum + trade.reviewCount,
    0,
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-32 sm:pb-12">
      {updated === "1" && (
        <p className="mb-6 rounded-2xl bg-sb-card-blue p-4 text-center text-[15px] text-sb-text">
          Guardado. Tu perfil ya está actualizado.
        </p>
      )}

      <div className="flex flex-col items-center text-center">
        {professional.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={professional.avatarUrl}
            alt={professional.fullName}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sb-card-blue text-3xl font-semibold text-sb-blue">
            {professional.fullName.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="font-display mt-4 text-[28px] font-extrabold text-sb-text">
          {professional.fullName}
        </h1>

        {primaryTrade && (
          <p className="mt-1 text-[16px] text-sb-muted">{primaryTrade.name}</p>
        )}

        {professional.isVerified && (
          <span className="mt-2 inline-flex items-center rounded-full bg-[#E8F8EE] px-3 py-1 text-sm font-medium text-sb-success">
            Verificado ✓
          </span>
        )}

        {overallScore !== null && (
          <div className="mt-4 flex items-center gap-2">
            <span className="font-display text-[32px] font-bold text-sb-text">
              {overallScore.toFixed(1)}
            </span>
            <span aria-hidden="true" className="text-2xl text-sb-orange">
              {"★".repeat(Math.round(overallScore))}
              {"☆".repeat(5 - Math.round(overallScore))}
            </span>
            <span className="text-sm text-sb-muted">
              ({totalReviewCount} reseña{totalReviewCount === 1 ? "" : "s"})
            </span>
          </div>
        )}

        {professional.bio && (
          <p className="mt-4 text-[16px] leading-relaxed text-sb-text">
            {professional.bio}
          </p>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-[18px] font-semibold text-sb-text">
          Oficios
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {professional.trades.map((trade) => (
            <span
              key={trade.slug}
              className="rounded-full bg-sb-card-orange px-4 py-1.5 text-sm font-medium text-sb-orange"
            >
              {trade.name}
              {trade.isPrimary ? " · Principal" : ""}
            </span>
          ))}
        </div>
        {professional.trades.length === 0 && (
          <p className="mt-2 text-sm text-sb-muted">
            Todavía no agregó oficios.
          </p>
        )}
      </section>

      {professional.departments.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-[18px] font-semibold text-sb-text">
            Zonas de cobertura
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {professional.departments.map((department) => (
              <span
                key={department.slug}
                className="rounded-full bg-sb-card-blue px-4 py-1.5 text-sm font-medium text-sb-blue"
              >
                {department.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {professional.photos.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-[18px] font-semibold text-sb-text">
            Trabajos realizados
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {professional.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.caption ?? professional.fullName}
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-[18px] font-semibold text-sb-text">
          Reseñas
        </h2>
        {professional.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-sb-muted">
            Todavía no tiene reseñas publicadas.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {professional.reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sb-card-blue text-sm font-semibold text-sb-blue">
                    {review.reviewerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display text-[15px] font-semibold text-sb-text">
                      {review.reviewerName}
                    </p>
                    <p className="text-xs text-sb-muted">
                      {review.publishedAt.toLocaleDateString("es-AR")} ·{" "}
                      {review.tradeName} · {REVIEW_TYPE_LABEL[review.type]}
                    </p>
                  </div>
                </div>
                <span aria-hidden="true" className="mt-2 inline-block text-sb-orange">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
                {review.comment && (
                  <p className="mt-1 text-sm leading-relaxed text-sb-text">
                    {review.comment}
                  </p>
                )}
                <div className="mt-2">
                  <ReportModal
                    reportedUserId={review.reviewerId}
                    triggerLabel="Reportar reseña"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PhoneReveal professionalId={professional.id} source="profile" />

      <div className="mt-10 text-center">
        <ReportModal
          reportedUserId={professional.userId}
          reportedProfessionalId={professional.id}
          triggerLabel="Reportar perfil"
        />
      </div>
    </main>
  );
}
