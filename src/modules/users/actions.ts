"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserRole } from "./queries";
import {
  AuthActionState,
  LoginSchema,
  PhoneOtpActionState,
  RegisterSchema,
  SendPhoneOtpSchema,
  UpdateUserProfileActionState,
  UpdateUserProfileInput,
  UpdateUserProfileSchema,
  VerifyPhoneOtpSchema,
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

  return { success: true, redirectTo: "/dashboard" };
}

export async function sendPhoneOtpAction(
  _prevState: PhoneOtpActionState,
  formData: FormData,
): Promise<PhoneOtpActionState> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const parsed = SendPhoneOtpSchema.safeParse({
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await auth.api.sendPhoneNumberOTP({
      body: { phoneNumber: parsed.data.phoneNumber },
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message };
    }
    throw error;
  }

  return { success: true };
}

export async function verifyPhoneOtpAction(
  _prevState: PhoneOtpActionState,
  formData: FormData,
): Promise<PhoneOtpActionState> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const parsed = VerifyPhoneOtpSchema.safeParse({
    phoneNumber: formData.get("phoneNumber"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await auth.api.verifyPhoneNumber({
      body: {
        phoneNumber: parsed.data.phoneNumber,
        code: parsed.data.code,
        updatePhoneNumber: true,
      },
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: "Código inválido o expirado" };
    }
    throw error;
  }

  return { success: true };
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
