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

  const inlineWrapper =
    variant === "inline" ? "min-h-[92px]" : "";

  if (isSessionPending) {
    return (
      <div className={inlineWrapper}>
        <div
          className={`${baseClasses} ${
            variant === "inline"
              ? "border-[1.5px] border-sb-border text-sb-muted"
              : "bg-sb-card-blue text-sb-muted"
          }`}
        >
          Cargando...
        </div>
      </div>
    );
  }

  if (phone) {
    const waUrl = `https://wa.me/${formatArgentinePhoneForWhatsApp(phone)}?text=${WA_MESSAGE}`;
    // En mobile el bar revelado ocupa la misma posición fija inferior que el botón original.
    // En desktop (sm:) vuelve al flujo normal dentro de la hero card.
    const revealedWrapper =
      variant === "bar"
        ? "fixed bottom-16 left-0 right-0 z-20 border-t border-sb-border bg-white px-4 py-3 sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
        : inlineWrapper;
    return (
      <div className={revealedWrapper}>
        {variant === "inline" && (
          <p className="mb-2 text-center text-[13px] font-semibold text-sb-text sm:text-left">
            {phone}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${phone}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-full border-2 border-sb-blue text-[14px] font-semibold text-sb-blue transition-colors hover:bg-sb-blue/5"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6 6l1.27-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Llamar
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-1.5 rounded-full border-2 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25D366", borderColor: "#25D366" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        </div>
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
    <div className={inlineWrapper}>
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
    </div>
  );
}
