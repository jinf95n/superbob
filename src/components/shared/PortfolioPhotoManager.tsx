"use client";

import { useState, useTransition, type DragEvent } from "react";
import {
  deletePortfolioPhotoAction,
  uploadPortfolioPhotoAction,
} from "@/modules/photos/actions";
import { PortfolioPhotoItem } from "@/modules/photos/types";

const MAX_PORTFOLIO_PHOTOS = 10;

type PortfolioPhotoManagerProps = {
  initialPhotos: PortfolioPhotoItem[];
};

export function PortfolioPhotoManager({
  initialPhotos,
}: PortfolioPhotoManagerProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const atLimit = photos.length >= MAX_PORTFOLIO_PHOTOS;

  function uploadFile(file: File) {
    setError(null);
    const formData = new FormData();
    formData.set("photo", file);

    startUpload(async () => {
      const result = await uploadPortfolioPhotoAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.photo) {
        setPhotos((prev) => [...prev, result.photo!]);
      }
    });
  }

  function handleFileInputChange(file: File | undefined) {
    if (!file) return;
    if (atLimit) {
      setError(
        `Llegaste al límite de ${MAX_PORTFOLIO_PHOTOS} fotos. Borrá alguna para subir otra.`,
      );
      return;
    }
    uploadFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    handleFileInputChange(file);
  }

  function handleDelete(photoId: string) {
    setError(null);
    setDeletingId(photoId);
    startUpload(async () => {
      const result = await deletePortfolioPhotoAction({ photoId });
      setDeletingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-sb-muted">
        {photos.length} de {MAX_PORTFOLIO_PHOTOS} fotos
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.caption ?? "Foto de trabajo"}
                className="h-full w-full rounded-2xl object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                aria-label="Eliminar foto"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-sb-text/70 text-sm text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {!atLimit && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-6 text-center ${
            isDraggingOver ? "border-sb-blue bg-sb-card-blue" : "border-sb-border"
          }`}
        >
          <p className="text-[15px] text-sb-muted">
            Arrastrá una foto acá o
          </p>
          <label className="mt-2 inline-block cursor-pointer text-[15px] font-medium text-sb-blue underline">
            elegí un archivo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) =>
                handleFileInputChange(event.target.files?.[0])
              }
            />
          </label>
        </div>
      )}

      {isUploading && (
        <p className="text-sm text-sb-muted">Subiendo...</p>
      )}
      {error && <p className="text-sm text-sb-error">{error}</p>}
    </div>
  );
}
