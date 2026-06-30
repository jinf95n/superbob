"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAccountDeletionBlockers, getUserRole } from "./queries";
import {
  AuthActionState,
  DeleteAccountResult,
  LoginSchema,
  PasswordResetActionState,
  RegisterSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  UpdatePhoneSchema,
  UpdateUserProfileActionState,
  UpdateUserProfileInput,
  UpdateUserProfileSchema,
} from "./types";

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = RegisterSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message };
    }
    throw error;
  }

  return { success: true, redirectTo: "/welcome" };
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let userId: string;
  try {
    const result = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    userId = result.user.id;
  } catch (error) {
    if (error instanceof APIError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw error;
  }

  const role = await getUserRole(userId);
  return { success: true, redirectTo: role === "admin" ? "/admin" : "/dashboard" };
}

export async function requestPasswordResetAction(
  _prevState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const parsed = RequestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email inválido" };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
      },
    });
  } catch {
    // Nunca revelar si el email existe o no
  }

  return { success: true };
}

export async function resetPasswordAction(data: {
  token: string;
  newPassword: string;
}): Promise<{ success: true } | { error: string }> {
  const parsed = ResetPasswordSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await auth.api.resetPassword({
      body: {
        token: parsed.data.token,
        newPassword: parsed.data.newPassword,
      },
    });
  } catch (error) {
    console.error("[resetPassword] error:", error);
    return { error: "El link expiró o ya fue usado. Solicitá uno nuevo." };
  }

  return { success: true };
}

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadAvatarActionState = {
  error?: string;
  avatarUrl?: string;
};

export async function uploadAvatarAction(
  formData: FormData,
): Promise<UploadAvatarActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleccioná una imagen" };
  }

  const extension = ALLOWED_AVATAR_TYPES[file.type];
  if (!extension) {
    return { error: "Formato no soportado. Usá JPG, PNG o WEBP" };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { error: "La imagen no puede superar 2MB" };
  }

  try {
    const path = `${session.user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { error: "No pudimos subir la imagen, intentá de nuevo" };
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: publicUrl },
    });

    return { avatarUrl: publicUrl };
  } catch {
    return { error: "No pudimos subir la imagen, intentá de nuevo" };
  }
}

export async function updateUserProfileAction(
  input: UpdateUserProfileInput,
): Promise<UpdateUserProfileActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const parsed = UpdateUserProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { fullName: parsed.data.fullName },
  });

  return { success: true };
}

export type UpdatePhoneActionState = {
  error?: string;
  success?: boolean;
};

export async function updatePhoneAction(
  phone: string,
): Promise<UpdatePhoneActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const parsed = UpdatePhoneSchema.safeParse({ phone });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Teléfono inválido" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: parsed.data.phone || null },
  });

  return { success: true };
}

async function performAccountDeletion(
  userId: string,
): Promise<DeleteAccountResult> {
  const blockers = await checkAccountDeletionBlockers(userId);
  if (blockers.length > 0) {
    return { blocked: true, blockers };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Publicar reseñas pendientes antes de anonimizar
    await tx.review.updateMany({
      where: {
        reviewerId: userId,
        submittedAt: { not: null },
        publishedAt: null,
        withdrawnAt: null,
        deletedAt: null,
      },
      data: { publishedAt: now },
    });

    const professionalProfile = await tx.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    // Cancelar work records activos del usuario (como cliente o profesional)
    const workRecordsToCancel = await tx.workRecord.findMany({
      where: {
        status: { in: ["active", "pending_pro_confirmation"] },
        OR: [
          { clientId: userId },
          ...(professionalProfile
            ? [{ professionalId: professionalProfile.id }]
            : []),
        ],
      },
      select: {
        id: true,
        clientId: true,
        professionalId: true,
      },
    });

    if (workRecordsToCancel.length > 0) {
      await tx.workRecord.updateMany({
        where: { id: { in: workRecordsToCancel.map((wr) => wr.id) } },
        data: { status: "cancelled" },
      });

      // Notificar a la otra parte de cada work record cancelado
      for (const wr of workRecordsToCancel) {
        if (wr.clientId === userId) {
          // El usuario era el cliente → notificar al profesional
          const prof = await tx.professionalProfile.findUnique({
            where: { id: wr.professionalId },
            select: { userId: true },
          });
          if (prof) {
            await tx.notification.create({
              data: {
                userId: prof.userId,
                type: "work_record_cancelled_account_deleted",
                payload: { workRecordId: wr.id },
              },
            });
          }
        } else if (professionalProfile && wr.professionalId === professionalProfile.id) {
          // El usuario era el profesional → notificar al cliente
          await tx.notification.create({
            data: {
              userId: wr.clientId,
              type: "work_record_cancelled_account_deleted",
              payload: { workRecordId: wr.id },
            },
          });
        }
      }
    }

    // Desvincular todos los providers OAuth y credentials para que el usuario
    // pueda registrarse de nuevo en el futuro sin heredar esta identidad eliminada.
    await tx.account.deleteMany({ where: { userId } });

    // Anonimizar usuario (tombstone email para no violar la constraint unique)
    await tx.user.update({
      where: { id: userId },
      data: {
        fullName: "Usuario eliminado",
        email: `deleted+${userId}@account.deleted`,
        phone: null,
        avatarUrl: null,
        isActive: false,
        deletedAt: now,
      },
    });

    // Desactivar perfil profesional si existe
    if (professionalProfile) {
      await tx.professionalProfile.update({
        where: { id: professionalProfile.id },
        data: { isActive: false, deletedAt: now },
      });
    }
  });

  return { success: true };
}

export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const result = await performAccountDeletion(session.user.id);
  if ("error" in result || "blocked" in result) return result;

  // Sign out the current session while it still exists in DB.
  // nextCookies() intercepta la respuesta y emite Set-Cookie para limpiar
  // session_token y session_data del browser del usuario.
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Si signOut falla (raro), el deleteMany de abajo limpia la DB y el
    // safety net del layout detecta el deletedAt y fuerza el cierre.
  }

  // Borrar sesiones de otros dispositivos (la actual ya fue eliminada por signOut).
  await prisma.session.deleteMany({ where: { userId: session.user.id } });

  return { success: true };
}

export async function adminDeleteAccountAction(
  targetUserId: string,
): Promise<DeleteAccountResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return { error: "No tenés permisos para realizar esta acción" };
  }

  if (!targetUserId || targetUserId.length < 1) {
    return { error: "ID de usuario inválido" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, deletedAt: true },
  });

  if (!targetUser) {
    return { error: "Usuario no encontrado" };
  }

  if (targetUser.deletedAt) {
    return { error: "Esta cuenta ya fue eliminada" };
  }

  const result = await performAccountDeletion(targetUserId);
  if ("error" in result || "blocked" in result) return result;

  // No llamamos signOut porque la sesión activa es del admin, no del target.
  // Borramos todas las sesiones del target directamente desde la DB.
  await prisma.session.deleteMany({ where: { userId: targetUserId } });

  return { success: true };
}
