"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProfessionalPortfolioPhoto } from "@/modules/professionals/types";

type PhotoGalleryProps = {
  photos: ProfessionalPortfolioPhoto[];
  professionalName: string;
};

const INITIAL_VISIBLE = 6;

export function PhotoGallery({ photos, professionalName }: PhotoGalleryProps) {
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOpen = activeIndex !== null;
  const visiblePhotos = showAll ? photos : photos.slice(0, INITIAL_VISIBLE);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowLeft")
        setActiveIndex((i) => (i === null || i === 0 ? i : i - 1));
      if (e.key === "ArrowRight")
        setActiveIndex((i) =>
          i === null || i === photos.length - 1 ? i : i + 1,
        );
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, photos.length]);

  const lightbox =
    mounted && isOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setActiveIndex(null)}
          >
            <div
              className="relative w-full max-w-4xl px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[activeIndex!].url}
                alt={photos[activeIndex!].caption ?? professionalName}
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
              {photos[activeIndex!].caption && (
                <p className="mt-3 text-center text-[14px] text-white/70">
                  {photos[activeIndex!].caption}
                </p>
              )}
              <p className="mt-1 text-center text-[12px] text-white/40">
                {activeIndex! + 1} / {photos.length}
              </p>
            </div>

            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setActiveIndex(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) =>
                      i === null ? 0 : i === 0 ? photos.length - 1 : i - 1,
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) =>
                      i === null ? 0 : i === photos.length - 1 ? 0 : i + 1,
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </>
            )}

            {photos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(i);
                    }}
                    className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      i === activeIndex
                        ? "border-white"
                        : "border-transparent opacity-50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbnailUrl ?? photo.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {visiblePhotos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="aspect-square overflow-hidden rounded-card transition-opacity hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.caption ?? professionalName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {!showAll && photos.length > INITIAL_VISIBLE && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="self-center text-[14px] font-medium text-sb-blue underline"
          >
            Ver todas ({photos.length})
          </button>
        )}

        <p className="text-center text-[13px] text-sb-muted">
          Fotos subidas por el profesional
        </p>
      </div>

      {lightbox}
    </>
  );
}
