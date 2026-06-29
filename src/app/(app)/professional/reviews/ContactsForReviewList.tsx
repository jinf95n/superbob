"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContactForReview } from "@/modules/contacts/queries";
import { ConfirmWorkModal } from "./ConfirmWorkModal";
import { RateClientModal } from "./RateClientModal";

type Trade = { id: string; name: string };

type ContactsForReviewListProps = {
  contacts: ContactForReview[];
  trades: Trade[];
};

type ConfirmModalState = {
  contactEventId: string;
  clientName: string;
};

type RateModalState = {
  workRecordId: string;
  clientName: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

export function ContactsForReviewList({
  contacts,
  trades,
}: ContactsForReviewListProps) {
  const router = useRouter();
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [rateModal, setRateModal] = useState<RateModalState | null>(null);
  // contactEventId → workRecordId (optimistic: populated after confirm, before refresh)
  const [confirmedMap, setConfirmedMap] = useState<Map<string, string>>(new Map());
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  if (contacts.length === 0) {
    return (
      <p className="mt-2 text-[15px] text-sb-muted">
        Todavía no tenés contactos. Cuando un cliente vea tu teléfono en SUPERBOB, aparecerá acá.
      </p>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-3">
        {contacts.map((contact) => {
          const workRecord = contact.workRecord;
          const optimisticWorkRecordId = confirmedMap.get(contact.contactEventId);
          const isConfirmed = Boolean(optimisticWorkRecordId);
          const effectiveWorkRecordId = workRecord?.id ?? optimisticWorkRecordId ?? "";
          const isRated =
            ratedIds.has(effectiveWorkRecordId) || workRecord?.hasClientRating;

          let cta: React.ReactNode;

          if (!workRecord && !isConfirmed) {
            cta =
              trades.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModal({
                      contactEventId: contact.contactEventId,
                      clientName: contact.clientName,
                    })
                  }
                  className="shrink-0 rounded-full border border-sb-blue px-4 py-1.5 text-[13px] font-medium text-sb-blue"
                >
                  Registrar
                </button>
              ) : (
                <span className="shrink-0 text-[13px] text-sb-muted">
                  Agregá un oficio primero
                </span>
              );
          } else if ((isConfirmed || workRecord) && !isRated) {
            cta = (
              <button
                type="button"
                onClick={() =>
                  setRateModal({
                    workRecordId: effectiveWorkRecordId,
                    clientName: contact.clientName,
                  })
                }
                className="shrink-0 rounded-full border border-sb-blue px-4 py-1.5 text-[13px] font-medium text-sb-blue"
              >
                Calificar
              </button>
            );
          } else if (workRecord?.hasClientReview) {
            cta = (
              <span className="shrink-0 rounded-full bg-sb-success/10 px-3 py-1.5 text-[13px] font-medium text-sb-success">
                Reseñado
              </span>
            );
          } else {
            cta = (
              <span className="shrink-0 rounded-full bg-sb-bg px-3 py-1.5 text-[13px] text-sb-muted">
                Calificado
              </span>
            );
          }

          return (
            <div
              key={contact.contactEventId}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sb-card-blue text-[14px] font-semibold text-sb-blue">
                {getInitials(contact.clientName)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-sb-text">
                  {contact.clientName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-sb-muted">
                  <span>{formatRelativeDate(contact.contactDate)}</span>
                  {workRecord && (
                    <>
                      <span>·</span>
                      <span>Trabajo</span>
                    </>
                  )}
                </div>
              </div>

              {cta}
            </div>
          );
        })}
      </div>

      {confirmModal && trades.length > 0 && (
        <ConfirmWorkModal
          contactEventId={confirmModal.contactEventId}
          clientName={confirmModal.clientName}
          trades={trades}
          onClose={() => setConfirmModal(null)}
          onSuccess={(workRecordId) => {
            setConfirmedMap((prev) => new Map(prev).set(confirmModal.contactEventId, workRecordId));
            setConfirmModal(null);
            setRateModal({
              workRecordId,
              clientName: confirmModal.clientName,
            });
            router.refresh();
          }}
        />
      )}

      {rateModal && (
        <RateClientModal
          workRecordId={rateModal.workRecordId}
          clientName={rateModal.clientName}
          onClose={() => setRateModal(null)}
          onSuccess={() => {
            if (rateModal.workRecordId) {
              setRatedIds((prev) => {
                const next = new Set(prev);
                next.add(rateModal.workRecordId);
                return next;
              });
            }
            setRateModal(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
