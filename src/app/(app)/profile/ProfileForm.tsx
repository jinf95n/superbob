"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  sendPhoneOtpAction,
  updateUserProfileAction,
  uploadAvatarAction,
  verifyPhoneOtpAction,
} from "@/modules/users/actions";
import { PhoneOtpActionState, UserAccountProfile } from "@/modules/users/types";

type ProfileFormProps = {
  accountProfile: UserAccountProfile;
  professionalSlug: string | null;
};

const initialOtpState: PhoneOtpActionState = {};

export function ProfileForm({ accountProfile, professionalSlug }: ProfileFormProps) {
  const router = useRouter();

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(accountProfile.avatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, startAvatarUpload] = useTransition();

  // Nombre
  const [fullName, setFullName] = useState(accountProfile.fullName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [isSavingName, startSaveName] = useTransition();

  // Verificación de teléfono
  const isPhoneVerified = Boolean(accountProfile.phoneVerifiedAt);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(accountProfile.phone ?? "");
  const [sendOtpState, sendOtpFormAction, isSendingOtp] = useActionState(
    sendPhoneOtpAction,
    initialOtpState,
  );
  const [verifyOtpState, verifyOtpFormAction, isVerifyingOtp] = useActionState(
    verifyPhoneOtpAction,
    initialOtpState,
  );

  useEffect(() => {
    if (sendOtpState.success) {
      setOtpSent(true);
    }
  }, [sendOtpState.success]);

  useEffect(() => {
    if (verifyOtpState.success) {
      router.refresh();
    }
  }, [verifyOtpState.success, router]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const formData = new FormData();
    formData.set("avatar", file);

    startAvatarUpload(async () => {
      const result = await uploadAvatarAction(formData);
      if (result.error) {
        setAvatarError(result.error);
        return;
      }
      if (result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
      }
    });
  }

  function handleSaveName() {
    setNameError(null);
    setNameSaved(false);

    startSaveName(async () => {
      const result = await updateUserProfileAction({ fullName });
      if (result.error) {
        setNameError(result.error);
        return;
      }
      setNameSaved(true);
    });
  }

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="rounded-2xl bg-white p-5">
        <label className="block text-sm font-medium text-sb-text">
          Foto de perfil
        </label>
        <div className="mt-2 flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sb-card-blue text-xl font-semibold text-sb-blue">
              {accountProfile.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            disabled={isUploadingAvatar}
            className="text-sm"
          />
        </div>
        {isUploadingAvatar && (
          <p className="mt-1 text-sm text-sb-muted">Subiendo...</p>
        )}
        {avatarError && <p className="mt-1 text-sm text-sb-error">{avatarError}</p>}
      </div>

      <div className="rounded-2xl bg-white p-5">
        <label htmlFor="fullName" className="block text-sm font-medium text-sb-text">
          Nombre completo
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameSaved(false);
          }}
          className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none"
        />
        {nameError && <p className="mt-1 text-sm text-sb-error">{nameError}</p>}
        {nameSaved && (
          <p className="mt-1 text-sm text-sb-success">Guardado.</p>
        )}
        <button
          type="button"
          onClick={handleSaveName}
          disabled={isSavingName || fullName === accountProfile.fullName}
          className="mt-3 flex h-[52px] w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white disabled:opacity-50"
        >
          {isSavingName ? "Guardando..." : "Guardar nombre"}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5">
        <p className="text-sm font-medium text-sb-text">Email</p>
        <p className="mt-1 text-[15px] text-sb-muted">{accountProfile.email}</p>
      </div>

      <div className="rounded-2xl bg-white p-5">
        <p className="text-sm font-medium text-sb-text">Teléfono</p>
        <p className="mt-1 text-[15px] text-sb-muted">
          {accountProfile.phone ?? "Sin teléfono"}
        </p>

        {isPhoneVerified ? (
          <span className="mt-2 inline-flex items-center rounded-full bg-[#E8F8EE] px-3 py-1 text-sm font-medium text-sb-success">
            Verificado ✓
          </span>
        ) : isVerifyingPhone ? (
          <div className="mt-3 flex flex-col gap-3">
            {!otpSent ? (
              <form action={sendOtpFormAction} className="flex flex-col gap-2">
                <input
                  type="tel"
                  name="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+5491122334455"
                  className="w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
                />
                {sendOtpState.error && (
                  <p className="text-sm text-sb-error">{sendOtpState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="flex h-[52px] w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white disabled:opacity-50"
                >
                  {isSendingOtp ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            ) : (
              <form action={verifyOtpFormAction} className="flex flex-col gap-2">
                <input type="hidden" name="phoneNumber" value={phoneNumber} />
                <p className="text-sm text-sb-muted">
                  Te enviamos un código a {phoneNumber}.
                </p>
                <input
                  type="text"
                  name="code"
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                  className="w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
                />
                {verifyOtpState.error && (
                  <p className="text-sm text-sb-error">{verifyOtpState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex h-[52px] w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white disabled:opacity-50"
                >
                  {isVerifyingOtp ? "Verificando..." : "Verificar código"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsVerifyingPhone(true)}
            className="mt-2 text-sm font-medium text-sb-blue underline"
          >
            Verificar teléfono
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5">
        {professionalSlug ? (
          <Link
            href={`/p/${professionalSlug}`}
            className="text-[15px] font-medium text-sb-blue"
          >
            Ver mi perfil profesional →
          </Link>
        ) : (
          <Link
            href="/professional/onboarding"
            className="text-[15px] font-medium text-sb-blue"
          >
            Activar perfil profesional →
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex h-[52px] w-full items-center justify-center rounded-full border border-sb-border text-[15px] font-medium text-sb-text"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
