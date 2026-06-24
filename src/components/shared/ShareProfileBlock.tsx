"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type ShareProfileBlockProps = {
  profileUrl: string;
  slug: string;
};

export function ShareProfileBlock({ profileUrl, slug }: ShareProfileBlockProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: profileUrl, title: "SUPERBOB" });
      } catch {
        // El usuario cerró el share sheet sin elegir nada: no es un error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setFeedback("Link copiado");
    } catch {
      setFeedback("No pudimos copiar el link");
    }
    setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="border-t border-sb-border bg-white p-4">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white"
        >
          Compartir perfil
        </button>
        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          className="flex h-12 items-center justify-center rounded-full border border-sb-blue px-5 text-[15px] font-medium text-sb-blue"
        >
          Ver QR
        </button>
      </div>

      {feedback && (
        <p className="mt-2 text-center text-[13px] text-sb-success">
          {feedback}
        </p>
      )}

      <p className="mt-2 text-center text-[13px] text-sb-muted">
        superbob.com.ar/p/{slug}
      </p>

      {isQrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setIsQrOpen(false)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <QRCodeSVG value={profileUrl} size={220} />
            <p className="text-[14px] text-sb-muted">
              superbob.com.ar/p/{slug}
            </p>
            <button
              type="button"
              onClick={() => setIsQrOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
