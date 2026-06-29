import { z } from "zod";
import { Role } from "@prisma/client";

export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  email: z.email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un símbolo (!@#$...)"),
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
  success?: boolean;
  redirectTo?: string;
};

export type PhoneOtpActionState = {
  error?: string;
  success?: boolean;
};

export const UpdateUserProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresá tu nombre completo").max(100),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

export type UpdateUserProfileActionState = {
  error?: string;
  success?: boolean;
};

export const RequestPasswordResetSchema = z.object({
  email: z.email("Email inválido"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  newPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un símbolo (!@#$...)"),
});

export type PasswordResetActionState = {
  error?: string;
  success?: boolean;
};

export type UserAccountProfile = {
  fullName: string;
  email: string;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export type UserProfileStats = {
  contactsCount: number;
  reviewsGiven: number;
  reviewsPending: number;
};

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const AdminUserListParamsSchema = z.object({
  provinceId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  departmentId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  registeredFrom: z.preprocess(
    emptyToUndefined,
    z.coerce.date().optional(),
  ),
  registeredTo: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  page: z.coerce.number().int().min(1).catch(1),
});

export type AdminUserListParams = z.infer<typeof AdminUserListParamsSchema>;

export type AdminUserListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  provinceName: string | null;
  departmentName: string | null;
};

export type AdminUserListResult = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AccountDeletionBlocker =
  | { type: "disputed_work_records"; count: number }
  | { type: "pending_pro_confirmation_as_professional"; count: number };

export type DeleteAccountResult =
  | { success: true }
  | { error: string }
  | { blocked: true; blockers: AccountDeletionBlocker[] };
