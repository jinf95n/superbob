import Link from "next/link";
import { getDisputedWorkRecords } from "@/modules/reviews/queries";

export default async function AdminDisputesPage() {
  const disputes = await getDisputedWorkRecords();

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold">Disputas</h1>

      <p className="mt-4 text-sm text-sb-muted">
        {disputes.length} disputa{disputes.length !== 1 ? "s" : ""} pendiente
        {disputes.length !== 1 ? "s" : ""}
      </p>

      {disputes.length === 0 ? (
        <div className="mt-8 py-12 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-3 text-sb-muted">Sin disputas pendientes.</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {disputes.map((dispute) => {
            const ageDays = Math.floor(
              (Date.now() - dispute.createdAt.getTime()) / (1000 * 60 * 60 * 24),
            );
            return (
              <div
                key={dispute.id}
                className="flex flex-col gap-3 rounded-2xl border border-sb-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sb-text">
                    {dispute.client.fullName}{" "}
                    <span className="text-sb-muted">vs</span>{" "}
                    {dispute.professional.user.fullName}
                  </p>
                  <p className="mt-0.5 text-sm text-sb-muted">
                    {dispute.trade.name} ·{" "}
                    {dispute.createdAt.toLocaleDateString("es-AR")}
                    {ageDays >= 3 && (
                      <span className="ml-2 rounded-full bg-sb-error/10 px-2 py-0.5 text-xs font-medium text-sb-error">
                        {ageDays} días sin resolver
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-sb-muted">
                    Iniciado por el{" "}
                    {dispute.initiatedBy === "client" ? "cliente" : "profesional"}
                  </p>
                </div>

                <Link
                  href={`/admin/disputes/${dispute.id}`}
                  className="shrink-0 rounded-full bg-sb-blue px-5 py-2 text-sm font-medium text-white"
                >
                  Resolver
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
