import { notFound } from "next/navigation";
import { getProfessionalBySlug } from "@/modules/professionals/queries";
import { StarRating } from "@/components/shared/StarRating";
import { PhoneReveal } from "@/components/shared/PhoneReveal";

type ProfessionalPublicProfilePageProps = {
  params: Promise<{ slug: string }>;
};

const REVIEW_TYPE_LABEL: Record<string, string> = {
  work_review: "Trabajo completado",
  contact_review: "Contacto",
};

export default async function ProfessionalPublicProfilePage({
  params,
}: ProfessionalPublicProfilePageProps) {
  const { slug } = await params;
  const professional = await getProfessionalBySlug(slug);

  if (!professional) {
    notFound();
  }

  const primaryTrade = professional.trades.find((trade) => trade.isPrimary);
  const secondaryTrades = professional.trades.filter(
    (trade) => !trade.isPrimary,
  );

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-4">
        {professional.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={professional.avatarUrl}
            alt={professional.fullName}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 text-2xl font-medium text-neutral-600">
            {professional.fullName.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h1 className="flex items-center gap-1 text-2xl font-bold">
            {professional.fullName}
            {professional.isVerified && (
              <span
                title="Profesional verificado"
                className="text-blue-600"
                aria-label="Verificado"
              >
                ✓
              </span>
            )}
          </h1>
          {primaryTrade && (
            <p className="text-neutral-600">{primaryTrade.name}</p>
          )}
        </div>
      </div>

      {professional.bio && (
        <p className="mt-4 text-neutral-700">{professional.bio}</p>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">Oficios</h2>
        <ul className="mt-2 space-y-2">
          {professional.trades.map((trade) => (
            <li
              key={trade.slug}
              className="flex items-center justify-between rounded border border-neutral-200 p-3"
            >
              <div>
                <p className="font-medium">
                  {trade.name}
                  {trade.isPrimary && (
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      Principal
                    </span>
                  )}
                </p>
                {trade.yearsExperience !== null && (
                  <p className="text-sm text-neutral-500">
                    {trade.yearsExperience} años de experiencia
                  </p>
                )}
              </div>
              <StarRating score={trade.score} reviewCount={trade.reviewCount} />
            </li>
          ))}
        </ul>
        {secondaryTrades.length === 0 && professional.trades.length === 0 && (
          <p className="mt-2 text-sm text-neutral-500">
            Todavía no agregó oficios.
          </p>
        )}
      </section>

      {professional.departments.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Zonas de cobertura</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {professional.departments.map((department) => (
              <span
                key={department.slug}
                className="rounded bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
              >
                {department.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">Contacto</h2>
        <div className="mt-2">
          <PhoneReveal professionalId={professional.id} source="profile" />
        </div>
      </section>

      {professional.photos.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Trabajos realizados</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {professional.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.caption ?? professional.fullName}
                className="aspect-square w-full rounded object-cover"
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">Reseñas</h2>
        {professional.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            Todavía no tiene reseñas publicadas.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {professional.reviews.map((review) => (
              <li
                key={review.id}
                className="rounded border border-neutral-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{review.reviewerName}</p>
                  <span aria-hidden="true" className="text-amber-500">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {review.tradeName} · {REVIEW_TYPE_LABEL[review.type]}
                </p>
                {review.comment && (
                  <p className="mt-1 text-sm text-neutral-700">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
