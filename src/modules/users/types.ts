import { z } from "zod";

export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const LoginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const SendPhoneOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+\d{8,15}$/, "Usá formato internacional, ej: +5491122334455"),
});

export const VerifyPhoneOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+\d{8,15}$/, "Usá formato internacional, ej: +5491122334455"),
  code: z.string().length(6, "El código tiene 6 dígitos"),
});

export type AuthActionState = {
  error?: string;
};

export type PhoneOtpActionState = {
  error?: string;
  success?: boolean;
};
