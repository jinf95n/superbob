import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorkRecordForReviewPage } from "@/modules/reviews/queries";
import { ClientReviewForm } from "./ClientReviewForm";

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ workRecordId: string }>;
}) {
  const { workRecordId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const workRecord = await getWorkRecordForReviewPage(workRecordId);

  if (!workRecord || workRecord.clientId !== session.user.id) {
    redirect("/notifications");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Dejar una reseña
      </h1>
      <p className="mt-2 text-[15px] text-sb-muted">
        {workRecord.professionalName} · {workRecord.tradeName} ·{" "}
        {workRecord.createdAt.toLocaleDateString("es-AR")}
      </p>

      {workRecord.alreadyReviewed ? (
        <p className="mt-6 rounded-2xl bg-white p-5 text-[15px] text-sb-muted">
          Ya enviaste tu reseña para este trabajo.
        </p>
      ) : (
        <ClientReviewForm workRecordId={workRecord.id} />
      )}
    </main>
  );
}
