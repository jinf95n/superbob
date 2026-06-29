import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPendingContactReviewsForClient } from "@/modules/reviews/queries";

export default async function PendingContactReviewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const contacts = await getPendingContactReviewsForClient(session.user.id);

  if (contacts.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-display text-[28px] font-bold text-sb-text">
          Reseñas de contacto
        </h1>
        <p className="mt-4 text-[15px] text-sb-muted">
          No tenés reseñas de contacto pendientes.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-[15px] font-medium text-sb-blue"
        >
          Volver al inicio →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Reseñas de contacto
      </h1>
      <p className="mt-2 text-[15px] text-sb-muted">
        Calificá cómo te atendieron en el primer contacto con estos profesionales.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {contacts.map((contact) => (
          <Link
            key={contact.contactEventId}
            href={`/reviews/contact/${contact.contactEventId}`}
            className="flex items-center justify-between rounded-2xl bg-white p-5"
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-sb-text">
                {contact.professionalName}
              </p>
              <p className="mt-0.5 text-[13px] text-sb-muted">
                {contact.availableTrades.map((t) => t.name).join(", ")} ·{" "}
                {contact.contactDate.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <span className="ml-3 shrink-0 font-medium text-sb-blue">
              Calificar →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
