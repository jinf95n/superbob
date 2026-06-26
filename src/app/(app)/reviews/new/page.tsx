import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkRecordForNewReviewPage } from "@/modules/reviews/queries";
import { ReviewForm } from "./ReviewForm";

type Props = {
  searchParams: Promise<{ professional?: string }>;
};

export default async function NewReviewPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { professional: professionalId } = await searchParams;

  if (!professionalId) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            Enlace inválido
          </p>
          <p className="mt-2 text-[14px] text-sb-muted">
            No se encontró el profesional.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-[14px] font-medium text-sb-blue"
          >
            Ir al inicio
          </Link>
        </div>
      </main>
    );
  }

  const workRecord = await getWorkRecordForNewReviewPage(
    session.user.id,
    professionalId,
  );

  if (!workRecord) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            No encontramos un registro de trabajo
          </p>
          <p className="mt-2 text-[14px] text-sb-muted">
            Para dejar una reseña, el profesional primero tiene que confirmar que trabajaron juntos.
          </p>
          <Link
            href="/notifications"
            className="mt-4 inline-block text-[14px] font-medium text-sb-blue"
          >
            Ver mis notificaciones
          </Link>
        </div>
      </main>
    );
  }

  if (workRecord.alreadyReviewed) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] font-semibold text-sb-text">
            Ya enviaste tu reseña
          </p>
          <p className="mt-2 text-[14px] text-sb-muted">
            Tu reseña de {workRecord.professionalName} se publicará cuando ambas partes hayan
            participado o pasen 14 días.
          </p>
          <Link
            href={`/p/${workRecord.professionalSlug}`}
            className="mt-4 inline-block text-[14px] font-medium text-sb-blue"
          >
            Ver perfil de {workRecord.professionalName.split(" ")[0]}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <ReviewForm workRecord={workRecord} />
    </main>
  );
}
