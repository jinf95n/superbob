"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import {
  AuthActionState,
  LoginSchema,
  PhoneOtpActionState,
  RegisterSchema,
  SendPhoneOtpSchema,
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

  redirect("/dashboard");
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

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw error;
  }

  redirect("/dashboard");
}
