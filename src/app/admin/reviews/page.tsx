import Link from "next/link";
import { getPendingReviews } from "@/modules/reviews/queries";

type AdminReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TYPE_LABEL: Record<string, string> = {
  work_review: "Trabajo completado",
  contact_review: "Contacto",
};

export default async function AdminPendingReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const rawParams = await searchParams;
  const page =
    typeof rawParams.page === "string" ? Number(rawParams.page) || 1 : 1;

  const result = await getPendingReviews(page);

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold">
        Reseñas pendientes de publicar
      </h1>
      <p className="mt-1 text-sm text-sb-muted dark:text-sb-muted-dark">
        Se publican cuando ambas partes califican, o a los 14 días de
        enviada.
      </p>

      <p className="mt-4 text-sm text-sb-muted dark:text-sb-muted-dark">
        {result.total} reseña{result.total === 1 ? "" : "s"} pendiente
        {result.total === 1 ? "" : "s"}
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {result.reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-card border border-sb-border p-3 dark:border-sb-border-dark"
          >
            <p className="font-medium">
              {review.reviewerName} → {review.professionalName}
            </p>
            <p className="text-sm text-sb-muted dark:text-sb-muted-dark">
              {TYPE_LABEL[review.type]} · {review.rating}/5
            </p>
            <p className="mt-1 text-xs text-sb-muted dark:text-sb-muted-dark">
              {review.submittedAt
                ? `Enviada el ${review.submittedAt.toLocaleDateString("es-AR")}. Se publica automáticamente el ${review.autoPublishAt?.toLocaleDateString("es-AR")} si la otra parte no califica antes.`
                : "Todavía no fue enviada por el autor."}
            </p>
          </div>
        ))}
      </div>

      {result.reviews.length === 0 && (
        <p className="mt-8 text-center text-sb-muted dark:text-sb-muted-dark">
          No hay reseñas pendientes de publicar.
        </p>
      )}

      {result.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4">
          <Link
            href={`/admin/reviews?page=${Math.max(1, result.page - 1)}`}
            className={`text-sm ${result.page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Anterior
          </Link>
          <span className="text-sm text-sb-muted dark:text-sb-muted-dark">
            Página {result.page} de {result.totalPages}
          </span>
          <Link
            href={`/admin/reviews?page=${Math.min(result.totalPages, result.page + 1)}`}
            className={`text-sm ${result.page >= result.totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            Siguiente
          </Link>
        </nav>
      )}
    </div>
  );
}
