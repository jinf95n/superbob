"use client";

import { useState, type TouchEvent } from "react";
import { ProfessionalPortfolioPhoto } from "@/modules/professionals/types";

type PortfolioGridProps = {
  photos: ProfessionalPortfolioPhoto[];
  professionalName: string;
};

const INITIAL_VISIBLE = 6;
const SWIPE_CLOSE_THRESHOLD = 80;

export function PortfolioGrid({ photos, professionalName }: PortfolioGridProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const visiblePhotos = showAll ? photos : photos.slice(0, INITIAL_VISIBLE);
  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  function close() {
    setSelectedIndex(null);
    setTouchStartY(null);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartY(event.touches[0]?.clientY ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartY === null) return;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY;
    if (Math.abs(endY - touchStartY) > SWIPE_CLOSE_THRESHOLD) {
      close();
    } else {
      setTouchStartY(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {visiblePhotos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="aspect-square overflow-hidden rounded-card"
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

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white"
          >
            ✕
          </button>
          <div
            className="flex max-h-full w-full max-w-2xl flex-col items-center px-4"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption ?? professionalName}
              className="max-h-[80vh] w-full rounded-card object-contain"
            />
            {selectedPhoto.caption && (
              <p className="mt-3 text-center text-[14px] text-white/90">
                {selectedPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
