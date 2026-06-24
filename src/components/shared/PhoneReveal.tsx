"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { revealPhoneAction } from "@/modules/contacts/actions";
import { ContactEventSource } from "@prisma/client";
import { Spinner } from "@/components/ui/Spinner";

type PhoneRevealProps = {
  professionalId: string;
  source: ContactEventSource;
};

const BAR_CLASSES =
  "fixed bottom-16 left-0 right-0 z-20 flex h-14 w-full items-center justify-center rounded-none text-[16px] font-medium sm:static sm:bottom-auto sm:left-auto sm:right-auto sm:h-11 sm:w-auto sm:rounded-full sm:px-6";

export function PhoneReveal({ professionalId, source }: PhoneRevealProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRevealing, startReveal] = useTransition();

  if (isPending) {
    return (
      <div className={`${BAR_CLASSES} bg-sb-card-blue text-sb-muted`}>
        Cargando...
      </div>
    );
  }

  if (phone) {
    return (
      <a href={`tel:${phone}`} className={`${BAR_CLASSES} bg-sb-blue text-white`}>
        {phone}
      </a>
    );
  }

  const handleClick = () => {
    if (!session) {
      router.push("/login");
      return;
    }

    startReveal(async () => {
      const result = await revealPhoneAction({ professionalId, source });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.phone) {
        setPhone(result.phone);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isRevealing}
        className={`${BAR_CLASSES} gap-2 bg-sb-blue text-white disabled:opacity-50`}
      >
        {isRevealing && <Spinner className="h-4 w-4" />}
        {isRevealing ? "Cargando..." : "Ver teléfono"}
      </button>
      {error && (
        <p className="fixed bottom-32 left-0 right-0 px-4 text-center text-sm text-sb-error sm:static sm:bottom-auto sm:mt-1">
          {error}
        </p>
      )}
    </>
  );
}
