"use client";

import { useState, useTransition } from "react";
import { createReportAction } from "@/modules/reports/actions";
import { REPORT_REASONS } from "@/modules/reports/types";

type ReportModalProps = {
  reportedUserId: string;
  reportedProfessionalId?: string;
  triggerLabel: string;
  triggerClassName?: string;
};

export function ReportModal({
  reportedUserId,
  reportedProfessionalId,
  triggerLabel,
  triggerClassName,
}: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<typeof REPORT_REASONS[number]>(
    REPORT_REASONS[0],
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();

  function close() {
    setIsOpen(false);
    setError(null);
    setSuccess(false);
    setDescription("");
    setReason(REPORT_REASONS[0]);
  }

  function handleSubmit() {
    setError(null);

    startSubmit(async () => {
      const result = await createReportAction({
        reportedUserId,
        reportedProfessionalId,
        reason,
        description: description || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName ?? "text-xs text-sb-muted underline"}
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            {success ? (
              <>
                <p className="text-[15px] text-sb-text">
                  Tu reporte fue recibido. Lo vamos a revisar en los próximos
                  días.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 flex h-[52px] w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white"
                >
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-[18px] font-semibold text-sb-text">
                    Reportar
                  </h2>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Cerrar"
                    className="text-sb-muted"
                  >
                    ✕
                  </button>
                </div>

                <label htmlFor="report-reason" className="mt-4 block text-sm font-medium text-sb-text">
                  Razón
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value as (typeof REPORT_REASONS)[number])
                  }
                  className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
                >
                  {REPORT_REASONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <label htmlFor="report-description" className="mt-4 block text-sm font-medium text-sb-text">
                  Descripción (opcional)
                </label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none"
                />

                {error && <p className="mt-2 text-sm text-sb-error">{error}</p>}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="mt-4 flex h-[52px] w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Enviando..." : "Enviar reporte"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
