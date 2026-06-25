"use client";

import { useState, useTransition, type DragEvent } from "react";
import {
  deletePortfolioPhotoAction,
  uploadPortfolioPhotoAction,
} from "@/modules/photos/actions";
import { PortfolioPhotoItem } from "@/modules/photos/types";
import { Spinner } from "@/components/ui/Spinner";
import { useServerAction } from "@/lib/hooks/useServerAction";

const MAX_PORTFOLIO_PHOTOS = 10;
const UPLOAD_SUCCESS_DURATION_MS = 800;

type PortfolioPhotoManagerProps = {
  initialPhotos: PortfolioPhotoItem[];
};

export function PortfolioPhotoManager({
  initialPhotos,
}: PortfolioPhotoManagerProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );
  const [, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const atLimit = photos.length >= MAX_PORTFOLIO_PHOTOS;

  const {
    execute: runUpload,
    isPending: isUploading,
    isSuccess: isUploadSuccess,
    isError: isUploadError,
    error: uploadError,
  } = useServerAction(uploadPortfolioPhotoAction, {
    successDuration: UPLOAD_SUCCESS_DURATION_MS,
    onSuccess: (result) => {
      const typed = result as { photo?: PortfolioPhotoItem };
      // Mantenemos el preview con el check de éxito visible durante
      // UPLOAD_SUCCESS_DURATION_MS y recién después lo cambiamos por la
      // foto real en la grilla, para no mostrar ambas a la vez.
      setTimeout(() => {
        if (typed.photo) {
          setPhotos((prev) => [...prev, typed.photo!]);
        }
        setPendingPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return null;
        });
      }, UPLOAD_SUCCESS_DURATION_MS);
    },
    onError: () => {
      setPendingPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    },
  });

  function uploadFile(file: File) {
    setPendingPreviewUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.set("photo", file);
    runUpload(formData);
  }

  function handleFileInputChange(file: File | undefined) {
    if (!file) return;
    if (atLimit) return;
    uploadFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    handleFileInputChange(file);
  }

  function handleDelete(photoId: string) {
    setDeleteError(null);
    setDeletingId(photoId);
    startDelete(async () => {
      const result = await deletePortfolioPhotoAction({ photoId });
      setDeletingId(null);
      if (result.error) {
        setDeleteError(result.error);
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

      {(photos.length > 0 || pendingPreviewUrl) && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.caption ?? "Foto de trabajo"}
                className={`h-full w-full rounded-2xl object-cover ${
                  deletingId === photo.id ? "opacity-50" : ""
                }`}
              />
              {deletingId === photo.id ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
                  <Spinner className="h-5 w-5 text-white" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  aria-label="Eliminar foto"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-sb-text/70 text-sm text-white"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {pendingPreviewUrl && (
            <div className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreviewUrl}
                alt="Subiendo foto"
                className="h-full w-full rounded-2xl object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                {isUploadSuccess ? (
                  <span className="text-2xl text-white" aria-hidden="true">
                    ✓
                  </span>
                ) : (
                  <Spinner className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
          )}
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
          <p className="text-[15px] text-sb-muted">Arrastrá una foto acá o</p>
          <label className="mt-2 inline-block cursor-pointer text-[15px] font-medium text-sb-blue underline">
            elegí un archivo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={isUploading}
              onChange={(event) =>
                handleFileInputChange(event.target.files?.[0])
              }
            />
          </label>
        </div>
      )}

      {isUploading && (
        <p className="flex items-center gap-2 text-sm text-sb-muted">
          <Spinner className="h-4 w-4" />
          Subiendo foto...
        </p>
      )}
      {isUploadSuccess && (
        <p className="text-sm text-sb-success">Foto agregada</p>
      )}
      {isUploadError && uploadError && (
        <p className="text-sm text-sb-error">{uploadError}</p>
      )}
      {deleteError && <p className="text-sm text-sb-error">{deleteError}</p>}
    </div>
  );
}
