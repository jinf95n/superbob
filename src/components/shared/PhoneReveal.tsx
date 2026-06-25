"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { revealPhoneAction } from "@/modules/contacts/actions";
import { ContactEventSource } from "@prisma/client";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Spinner } from "@/components/ui/Spinner";

type PhoneRevealProps = {
  professionalId: string;
  source: ContactEventSource;
  /**
   * "bar": barra fija inferior usada en el perfil público (default, sin cambios).
   * "inline": botón secundario normal, pensado para vivir dentro de una card.
   */
  variant?: "bar" | "inline";
};

const BAR_CLASSES =
  "fixed bottom-16 left-0 right-0 z-20 flex h-14 w-full items-center justify-center rounded-none text-[16px] font-medium transition-colors duration-150 ease-in-out sm:static sm:bottom-auto sm:left-auto sm:right-auto sm:h-11 sm:w-auto sm:rounded-full sm:px-6";

const INLINE_CLASSES =
  "flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-medium transition-colors duration-150 ease-in-out";

export function PhoneReveal({
  professionalId,
  source,
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
    return (
      <a
        href={`tel:${phone}`}
        className={`${baseClasses} animate-phone-reveal gap-2 bg-sb-blue text-white`}
      >
        <span aria-hidden="true">📞</span> {phone}
      </a>
    );
  }

  function handleClick() {
    if (!session) {
      router.push("/login");
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
