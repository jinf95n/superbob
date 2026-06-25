"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  registerContactEventAction,
  revealPhoneAction,
} from "@/modules/contacts/actions";
import { ContactEventSource } from "@prisma/client";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Spinner } from "@/components/ui/Spinner";

type PhoneRevealProps = {
  professionalId: string;
  source: ContactEventSource;
  /**
   * Teléfono pre-cargado desde el servidor (solo para usuarios con sesión
   * activa). Si está presente, el número se muestra al instante y el
   * contact_event se registra en background.
   */
  preloadedPhone?: string | null;
  /**
   * "bar": barra fija inferior usada en el perfil público (default).
   * "inline": botón secundario normal, pensado para vivir dentro de una card.
   */
  variant?: "bar" | "inline";
};

const BAR_CLASSES =
  "fixed bottom-16 left-0 right-0 z-20 flex h-14 w-full items-center justify-center rounded-none text-[16px] font-medium transition-colors duration-150 ease-in-out sm:static sm:bottom-auto sm:left-auto sm:right-auto sm:h-11 sm:w-auto sm:rounded-full sm:px-6";

const INLINE_CLASSES =
  "flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-medium transition-colors duration-150 ease-in-out";

const WA_MESSAGE = encodeURIComponent(
  "Hola! Vi tu perfil en SUPERBOB y me gustaría consultarte sobre tus servicios.",
);

/**
 * Convierte un número argentino (en cualquier formato local) al formato
 * requerido por wa.me: 549 + código de área (sin 0) + número.
 * Ejemplos: "011-1234-5678" → "541112345678", "+54 9 11 1234-5678" → "541112345678"
 */
function formatArgentinePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Ya tiene código de país + prefijo móvil: 549XXXXXXXXXX
  if (digits.startsWith("549") && digits.length >= 11) return digits;
  // Tiene código de país sin prefijo móvil: 54XXXXXXXXXX
  if (digits.startsWith("54") && digits.length >= 10) return "549" + digits.slice(2);
  // Formato local con 0 inicial: 0XXXXXXXXXX
  if (digits.startsWith("0") && digits.length >= 10) return "549" + digits.slice(1);
  // Solo área + número (sin 0 inicial)
  return "549" + digits;
}

export function PhoneReveal({
  professionalId,
  source,
  preloadedPhone,
  variant = "bar",
}: PhoneRevealProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [phone, setPhone] = useState<string | null>(null);

  const { execute, isPending, isError, error } = useServerAction(
    revealPhoneAction,
    {
      onSuccess: (result) => {
        const typed = result as { phone?: string };
        if (typed.phone) {
          setPhone(typed.phone);
        }
      },
    },
  );

  const baseClasses = variant === "inline" ? INLINE_CLASSES : BAR_CLASSES;

  if (isSessionPending) {
    return (
      <div
        className={`${baseClasses} ${
          variant === "inline"
            ? "border-[1.5px] border-sb-border text-sb-muted"
            : "bg-sb-card-blue text-sb-muted"
        }`}
      >
        Cargando...
      </div>
    );
  }

  if (phone) {
    const waUrl = `https://wa.me/${formatArgentinePhoneForWhatsApp(phone)}?text=${WA_MESSAGE}`;
    return (
      <div className="flex flex-col gap-3">
        <a
          href={`tel:${phone}`}
          className={`${baseClasses} animate-phone-reveal gap-2 bg-sb-blue text-white`}
        >
          <span aria-hidden="true">📞</span> {phone}
        </a>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={
            variant === "inline"
              ? "flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-sb-blue text-[14px] font-medium text-sb-blue"
              : "text-center text-[14px] font-medium text-sb-blue underline sm:text-left"
          }
        >
          💬 Escribir por WhatsApp
        </a>
      </div>
    );
  }

  function handleClick() {
    if (!session) {
      router.push("/login");
      return;
    }
    if (preloadedPhone) {
      setPhone(preloadedPhone);
      registerContactEventAction({ professionalId, source }).catch(() => {});
      return;
    }
    execute({ professionalId, source });
  }

  const idleClasses =
    variant === "inline"
      ? "border-[1.5px] border-sb-blue bg-transparent text-sb-blue hover:bg-sb-blue/5"
      : "bg-sb-blue text-white";
  const errorClasses =
    variant === "inline"
      ? "border-[1.5px] border-sb-error text-sb-error"
      : "bg-sb-error text-white";
  const pendingClasses =
    variant === "inline"
      ? "border-[1.5px] border-sb-blue text-sb-blue opacity-70"
      : "bg-sb-blue text-white opacity-85";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`${baseClasses} gap-2 disabled:cursor-not-allowed ${
          isError ? errorClasses : isPending ? pendingClasses : idleClasses
        }`}
      >
        {isPending && <Spinner className="h-4 w-4" />}
        {isPending ? "Obteniendo teléfono..." : "Ver teléfono"}
      </button>
      {isError && error && (
        <p
          className={
            variant === "inline"
              ? "mt-1 text-center text-sm text-sb-error"
              : "fixed bottom-32 left-0 right-0 px-4 text-center text-sm text-sb-error sm:static sm:bottom-auto sm:mt-1"
          }
        >
          {error}
        </p>
      )}
    </>
  );
}
