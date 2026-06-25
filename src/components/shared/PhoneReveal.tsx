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
};

const BAR_CLASSES =
  "fixed bottom-16 left-0 right-0 z-20 flex h-14 w-full items-center justify-center rounded-none text-[16px] font-medium transition-colors duration-150 ease-in-out sm:static sm:bottom-auto sm:left-auto sm:right-auto sm:h-11 sm:w-auto sm:rounded-full sm:px-6";

export function PhoneReveal({ professionalId, source }: PhoneRevealProps) {
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

  if (isSessionPending) {
    return (
      <div className={`${BAR_CLASSES} bg-sb-card-blue text-sb-muted`}>
        Cargando...
      </div>
    );
  }

  if (phone) {
    return (
      <a
        href={`tel:${phone}`}
        className={`${BAR_CLASSES} animate-phone-reveal gap-2 bg-sb-blue text-white`}
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

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`${BAR_CLASSES} gap-2 disabled:cursor-not-allowed ${
          isError
            ? "bg-sb-error text-white"
            : isPending
              ? "bg-sb-blue text-white opacity-85"
              : "bg-sb-blue text-white"
        }`}
      >
        {isPending && <Spinner className="h-4 w-4" />}
        {isPending ? "Obteniendo teléfono..." : "Ver teléfono"}
      </button>
      {isError && error && (
        <p className="fixed bottom-32 left-0 right-0 px-4 text-center text-sm text-sb-error sm:static sm:bottom-auto sm:mt-1">
          {error}
        </p>
      )}
    </>
  );
}
