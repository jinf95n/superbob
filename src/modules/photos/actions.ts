"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import {
  DeletePortfolioPhotoActionState,
  DeletePortfolioPhotoSchema,
  MAX_PORTFOLIO_PHOTOS,
  UploadPortfolioPhotoActionState,
} from "./types";

const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const PORTFOLIO_BUCKET = "portfolio";
const PORTFOLIO_PUBLIC_URL_MARKER = `/storage/v1/object/public/${PORTFOLIO_BUCKET}/`;

let portfolioBucketEnsured = false;

async function ensurePortfolioBucketExists(): Promise<void> {
  if (portfolioBucketEnsured) {
    return;
  }
  // createBucket falla si ya existe; lo ignoramos, solo nos interesa que exista.
  await supabaseAdmin.storage.createBucket(PORTFOLIO_BUCKET, { public: true });
  portfolioBucketEnsured = true;
}

function extractPortfolioStoragePath(url: string): string | null {
  const index = url.indexOf(PORTFOLIO_PUBLIC_URL_MARKER);
  if (index === -1) {
    return null;
  }
  return url.slice(index + PORTFOLIO_PUBLIC_URL_MARKER.length);
}

export async function uploadPortfolioPhotoAction(
  formData: FormData,
): Promise<UploadPortfolioPhotoActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) {
    return { error: "Necesitás activar tu perfil profesional" };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleccioná una imagen" };
  }

  const extension = ALLOWED_PHOTO_TYPES[file.type];
  if (!extension) {
    return { error: "Formato no soportado. Usá JPG, PNG o WEBP" };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return { error: "La imagen no puede superar los 8MB" };
  }

  const currentCount = await prisma.workPhoto.count({
    where: { professionalId },
  });
  if (currentCount >= MAX_PORTFOLIO_PHOTOS) {
    return {
      error: `Llegaste al límite de ${MAX_PORTFOLIO_PHOTOS} fotos. Borrá alguna para subir otra.`,
    };
  }

  await ensurePortfolioBucketExists();

  const path = `${professionalId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(PORTFOLIO_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: "No pudimos subir la imagen, intentá de nuevo" };
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path);

  const photo = await prisma.workPhoto.create({
    data: {
      professionalId,
      url: publicUrl,
      order: currentCount,
    },
  });

  return {
    photo: {
      id: photo.id,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      caption: photo.caption,
    },
  };
}

export async function deletePortfolioPhotoAction(
  input: { photoId: string },
): Promise<DeletePortfolioPhotoActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) {
    return { error: "Necesitás activar tu perfil profesional" };
  }

  const parsed = DeletePortfolioPhotoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Solicitud inválida" };
  }

  const photo = await prisma.workPhoto.findUnique({
    where: { id: parsed.data.photoId },
    select: { professionalId: true, url: true },
  });

  if (!photo || photo.professionalId !== professionalId) {
    return { error: "No encontramos esa foto" };
  }

  await prisma.workPhoto.delete({ where: { id: parsed.data.photoId } });

  const storagePath = extractPortfolioStoragePath(photo.url);
  if (storagePath) {
    await supabaseAdmin.storage.from(PORTFOLIO_BUCKET).remove([storagePath]);
  }

  return {};
}
