"use client";

import { useState, useTransition, type DragEvent } from "react";
import {
  deletePortfolioPhotoAction,
  uploadPortfolioPhotoAction,
} from "@/modules/photos/actions";
import { PortfolioPhotoItem } from "@/modules/photos/types";
import { Spinner } from "@/components/ui/Spinner";

const MAX_PORTFOLIO_PHOTOS = 10;
const UPLOAD_SUCCESS_DURATION_MS = 800;

type PendingUpload = {
  id: string;
  previewUrl: string;
  status: "uploading" | "success" | "error";
  error: string | null;
};

type PortfolioPhotoManagerProps = {
  initialPhotos: PortfolioPhotoItem[];
};

export function PortfolioPhotoManager({
  initialPhotos,
}: PortfolioPhotoManagerProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [truncatedNotice, setTruncatedNotice] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const atLimit = photos.length + pendingUploads.length >= MAX_PORTFOLIO_PHOTOS;

  function uploadFile(file: File) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const previewUrl = URL.createObjectURL(file);
    setPendingUploads((prev) => [
      ...prev,
      { id, previewUrl, status: "uploading", error: null },
    ]);

    const formData = new FormData();
    formData.set("photo", file);

    uploadPortfolioPhotoAction(formData)
      .then((result) => {
        if (result.error || !result.photo) {
          setPendingUploads((prev) =>
            prev.map((upload) =>
              upload.id === id
                ? { ...upload, status: "error", error: result.error ?? null }
                : upload,
            ),
          );
          return;
        }

        const photo = result.photo;
        setPendingUploads((prev) =>
          prev.map((upload) =>
            upload.id === id ? { ...upload, status: "success" } : upload,
          ),
        );

        setTimeout(() => {
          setPhotos((prev) => [...prev, photo]);
          setPendingUploads((prev) => {
            const target = prev.find((upload) => upload.id === id);
            if (target) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((upload) => upload.id !== id);
          });
        }, UPLOAD_SUCCESS_DURATION_MS);
      })
      .catch(() => {
        setPendingUploads((prev) =>
          prev.map((upload) =>
            upload.id === id
              ? {
                  ...upload,
                  status: "error",
                  error: "No pudimos subir la imagen, intentá de nuevo",
                }
              : upload,
          ),
        );
      });
  }

  function handleFilesChange(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    const remaining = Math.max(
      MAX_PORTFOLIO_PHOTOS - photos.length - pendingUploads.length,
      0,
    );
    const filesToUpload = files.slice(0, remaining);

    setTruncatedNotice(
      files.length > filesToUpload.length
        ? `Solo se subieron ${filesToUpload.length} de ${files.length} fotos (límite de ${MAX_PORTFOLIO_PHOTOS})`
        : null,
    );

    filesToUpload.forEach(uploadFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    handleFilesChange(event.dataTransfer.files);
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

      {(photos.length > 0 || pendingUploads.length > 0) && (
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

          {pendingUploads.map((upload) => (
            <div key={upload.id} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={upload.previewUrl}
                alt="Subiendo foto"
                className="h-full w-full rounded-2xl object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                {upload.status === "success" ? (
                  <span className="text-2xl text-white" aria-hidden="true">
                    ✓
                  </span>
                ) : upload.status === "error" ? (
                  <span className="text-2xl text-white" aria-hidden="true">
                    ✕
                  </span>
                ) : (
                  <Spinner className="h-6 w-6 text-white" />
                )}
              </div>
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
          <p className="text-[15px] text-sb-muted">Arrastrá fotos acá o</p>
          <label className="mt-2 inline-block cursor-pointer text-[15px] font-medium text-sb-blue underline">
            elegí archivos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => handleFilesChange(event.target.files)}
            />
          </label>
        </div>
      )}

      {truncatedNotice && (
        <p className="text-sm text-sb-error">{truncatedNotice}</p>
      )}
      {pendingUploads.some((upload) => upload.status === "uploading") && (
        <p className="flex items-center gap-2 text-sm text-sb-muted">
          <Spinner className="h-4 w-4" />
          Subiendo fotos...
        </p>
      )}
      {pendingUploads
        .filter((upload) => upload.status === "error" && upload.error)
        .map((upload) => (
          <p key={upload.id} className="text-sm text-sb-error">
            {upload.error}
          </p>
        ))}
      {deleteError && <p className="text-sm text-sb-error">{deleteError}</p>}
    </div>
  );
}
