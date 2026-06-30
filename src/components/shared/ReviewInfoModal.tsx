"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "¿Quién puede dejar una reseña?",
    a: "Solo personas que tuvieron un contacto registrado en SUPERBOB.",
  },
  {
    q: "¿Qué pasa cuando enviás una reseña?",
    a: "Se guarda al instante. La otra parte no puede verla. Se publica cuando ambas responden, o a los 14 días.",
  },
  {
    q: "¿Puedo cambiarla?",
    a: "Sí, durante los primeros 15 minutos después de enviarla.",
  },
  {
    q: "¿Qué pasa si alguien miente?",
    a: "SUPERBOB registra cada interacción y monitorea patrones. Las cuentas que intentan manipular reseñas pueden ser suspendidas.",
  },
];

export function ReviewInfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[13px] text-sb-blue hover:underline"
      >
        ℹ️ Cómo funcionan las reseñas
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold text-sb-text">
                Cómo funcionan las reseñas
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
                className="text-[20px] leading-none text-sb-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {FAQ_ITEMS.map(({ q, a }) => (
                <div key={q}>
                  <p className="text-[14px] font-semibold text-sb-text">{q}</p>
                  <p className="mt-0.5 text-[14px] text-sb-muted">{a}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[13px] text-sb-muted">
              Escribí pensando en los próximos clientes. Tu opinión los ayuda a
              decidir mejor.
            </p>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-5 flex h-[48px] w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
