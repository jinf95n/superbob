"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/lib/contexts/ToastContext";

type DesktopShareButtonsProps = {
  profileUrl: string;
  slug: string;
};

export function DesktopShareButtons({ profileUrl, slug }: DesktopShareButtonsProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const { toast } = useToast();

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: profileUrl, title: "SUPERBOB" });
      } catch {
        // usuario cerró el share sheet sin elegir
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("No pudimos copiar el link");
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sb-border py-2.5 text-sm text-sb-muted transition-colors hover:border-sb-blue hover:text-sb-blue"
        >
          ↗ Compartir
        </button>
        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sb-border py-2.5 text-sm text-sb-muted transition-colors hover:border-sb-blue hover:text-sb-blue"
        >
          ⊞ Ver QR
        </button>
      </div>
      <p className="mt-2 text-center text-[12px] text-sb-muted">
        superbob.com.ar/p/{slug}
      </p>

      {isQrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setIsQrOpen(false)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeSVG value={profileUrl} size={220} />
            <p className="text-[14px] text-sb-muted">superbob.com.ar/p/{slug}</p>
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
    </>
  );
}
