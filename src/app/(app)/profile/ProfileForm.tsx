"use client";

import {
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  updatePhoneAction,
  updateUserProfileAction,
} from "@/modules/users/actions";
import {
  UserAccountProfile,
  UserProfileStats,
} from "@/modules/users/types";
import { AvatarUploader } from "@/components/shared/AvatarUploader";
import { DeleteAccountModal } from "@/components/shared/DeleteAccountModal";
import { Spinner } from "@/components/ui/Spinner";

type ProfileFormProps = {
  accountProfile: UserAccountProfile;
  professionalSlug: string | null;
  stats: UserProfileStats;
  isAdmin?: boolean;
};

function formatMemberSince(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

export function ProfileForm({
  accountProfile,
  professionalSlug,
  stats,
  isAdmin = false,
}: ProfileFormProps) {
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState(accountProfile.avatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState(accountProfile.fullName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, startSaveName] = useTransition();

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState(accountProfile.phone ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSavingPhone, startSavePhone] = useTransition();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  function handleSaveName() {
    setNameError(null);
    startSaveName(async () => {
      const result = await updateUserProfileAction({ fullName });
      if (result.error) {
        setNameError(result.error);
        return;
      }
      setIsEditingName(false);
    });
  }

  function handleCancelEditName() {
    setFullName(accountProfile.fullName);
    setNameError(null);
    setIsEditingName(false);
  }

  function handleSavePhone() {
    setPhoneError(null);
    startSavePhone(async () => {
      const result = await updatePhoneAction(phone);
      if (result.error) {
        setPhoneError(result.error);
        return;
      }
      setIsEditingPhone(false);
      router.refresh();
    });
  }

  function handleCancelEditPhone() {
    setPhone(accountProfile.phone ?? "");
    setPhoneError(null);
    setIsEditingPhone(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: banner + avatar + info */}
      <div className="overflow-hidden rounded-2xl border border-sb-border bg-white">
        <div className="h-20 bg-sb-blue" />
        <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
          <div className="ring-4 ring-white rounded-full">
            <AvatarUploader
              avatarUrl={avatarUrl}
              fullName={accountProfile.fullName}
              size="lg"
              onUpload={(url) => {
                setAvatarUrl(url);
                setAvatarError(null);
              }}
              onError={(err) => setAvatarError(err)}
            />
          </div>
          {avatarError && (
            <p className="mt-2 text-xs text-sb-error">{avatarError}</p>
          )}
          <h1 className="font-display mt-3 text-[20px] font-bold text-sb-text">
            {accountProfile.fullName}
          </h1>
          <p className="mt-0.5 text-[14px] text-sb-muted">
            {accountProfile.email}
          </p>
          {!accountProfile.emailVerified && (
            <p className="mt-1 text-[12px] text-sb-warning">
              Email sin verificar — revisá tu casilla de correo
            </p>
          )}
          <p className="mt-0.5 text-[13px] text-sb-muted/70">
            Miembro desde {formatMemberSince(accountProfile.createdAt)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-sb-border border-t border-sb-border">
          <div className="flex flex-col items-center px-3 py-4">
            <span className="font-display text-[22px] font-bold text-sb-blue">
              {stats.contactsCount}
            </span>
            <span className="mt-0.5 text-center text-[11px] leading-tight text-sb-muted">
              Contactos
            </span>
          </div>
          <div className="flex flex-col items-center px-3 py-4">
            <span className="font-display text-[22px] font-bold text-sb-text">
              {stats.reviewsGiven}
            </span>
            <span className="mt-0.5 text-center text-[11px] leading-tight text-sb-muted">
              Reseñas escritas
            </span>
          </div>
          <div className="flex flex-col items-center px-3 py-4">
            <span
              className={`font-display text-[22px] font-bold ${
                stats.reviewsPending > 0 ? "text-sb-orange" : "text-sb-text"
              }`}
            >
              {stats.reviewsPending}
            </span>
            <span className="mt-0.5 text-center text-[11px] leading-tight text-sb-muted">
              Pendientes
            </span>
          </div>
        </div>
      </div>

      {/* Nombre */}
      <div className="rounded-2xl border border-sb-border bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-sb-muted">
            Nombre completo
          </p>
          {!isEditingName && (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-[13px] font-medium text-sb-blue"
            >
              Editar
            </button>
          )}
        </div>

        {isEditingName ? (
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              className="w-full rounded-[10px] border-[1.5px] border-sb-border px-3.5 py-3 text-[15px] text-sb-text outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10"
            />
            {nameError && (
              <p className="text-[13px] text-sb-error">{nameError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelEditName}
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-sb-border text-[14px] font-medium text-sb-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveName}
                disabled={
                  isSavingName || fullName.trim() === accountProfile.fullName
                }
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-sb-blue text-[14px] font-medium text-white disabled:opacity-50"
              >
                {isSavingName && <Spinner className="h-4 w-4" />}
                {isSavingName ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[16px] font-medium text-sb-text">
            {accountProfile.fullName}
          </p>
        )}
      </div>

      {/* Teléfono */}
      <div className="rounded-2xl border border-sb-border bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-sb-muted">
            Teléfono de contacto
          </p>
          {!isEditingPhone && (
            <button
              type="button"
              onClick={() => setIsEditingPhone(true)}
              className="text-[13px] font-medium text-sb-blue"
            >
              {accountProfile.phone ? "Editar" : "Agregar"}
            </button>
          )}
        </div>

        {isEditingPhone ? (
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              placeholder="+5491122334455"
              className="w-full rounded-[10px] border-[1.5px] border-sb-border px-3.5 py-3 text-[15px] text-sb-text outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10"
            />
            {phoneError && (
              <p className="text-[13px] text-sb-error">{phoneError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelEditPhone}
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-sb-border text-[14px] font-medium text-sb-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={isSavingPhone}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-sb-blue text-[14px] font-medium text-white disabled:opacity-50"
              >
                {isSavingPhone && <Spinner className="h-4 w-4" />}
                {isSavingPhone ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[16px] font-medium text-sb-text">
            {accountProfile.phone ?? "Sin teléfono"}
          </p>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="rounded-2xl border border-sb-border bg-white">
        <div className="px-5 py-4">
          <p className="text-[13px] font-medium text-sb-muted">
            Accesos rápidos
          </p>
        </div>
        <div className="divide-y divide-sb-border border-t border-sb-border">
          {!isAdmin && (
            <>
              {professionalSlug ? (
                <>
                  <Link
                    href={`/p/${professionalSlug}`}
                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-sb-bg"
                  >
                    <span className="text-[15px] text-sb-text">
                      Ver mi perfil profesional
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-sb-muted"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                  <Link
                    href="/professional/edit"
                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-sb-bg"
                  >
                    <span className="text-[15px] text-sb-text">
                      Editar perfil profesional
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-sb-muted"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </>
              ) : (
                <Link
                  href="/professional/onboarding"
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-sb-bg"
                >
                  <span className="text-[15px] text-sb-text">
                    Activar perfil profesional
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-sb-muted"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              )}
            </>
          )}
          <Link
            href="/forgot-password"
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-sb-bg"
          >
            <span className="text-[15px] text-sb-text">Cambiar contraseña</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-sb-muted"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Cerrar sesión */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-sb-border bg-white text-[15px] font-medium text-sb-error transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
      >
        {isLoggingOut && <Spinner className="h-4 w-4" />}
        {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>

      {/* Zona de peligro */}
      <div className="rounded-2xl border border-sb-error/30 bg-white p-5">
        <p className="text-[13px] font-semibold text-sb-error">Zona de peligro</p>
        <p className="mt-1 text-[13px] text-sb-muted">
          Eliminar tu cuenta anonimiza tus datos personales y desactiva tu
          perfil profesional. Esta acción no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="mt-3 text-[13px] font-medium text-sb-error hover:underline"
        >
          Eliminar mi cuenta
        </button>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}
